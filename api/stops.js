/**
 * GET STOPS
 * GET /api/stops?bookingId=123
 *
 * Retrieves stops with transactions for a booking
 */

const { google } = require('googleapis');

// Initialize Google Sheets API
const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

// Helper: Parse sheet data to objects
function parseSheetData(rows, headers) {
    if (!rows || rows.length === 0) return [];

    return rows.map(row => {
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = row[index] || '';
        });
        return obj;
    });
}

// Helper: Get stops from sheet
async function getStops(bookingId = null) {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Stops!A:AJ',
        });

        const rows = response.data.values || [];
        if (rows.length === 0) return [];

        const headers = [
            'id', 'stopNumber', 'bookingId', 'bookingNumber', 'stopSequence', 'stopType', 'stopNature',
            'locationName', 'locationCity', 'locationLat', 'locationLng', 'companyName', 'companyRole',
            'scheduledArrival', 'actualArrival', 'scheduledDeparture', 'actualDeparture', 'dwellTimeMinutes',
            'status', 'confirmationRequired', 'photoRequired', 'signatureRequired', 'qualityCheckRequired',
            'confirmed', 'confirmedBy', 'confirmedAt', 'signatureCaptured', 'photosUploaded',
            'custodyBeforeCompany', 'custodyAfterCompany', 'custodyTransfer',
            'contactPerson', 'contactPhone', 'notes', 'createdAt', 'updatedAt'
        ];

        let stops = parseSheetData(rows.slice(1), headers);

        // Filter by bookingId if provided
        if (bookingId) {
            stops = stops.filter(stop => parseInt(stop.bookingId) === parseInt(bookingId));
        }

        // Sort by stop sequence
        stops.sort((a, b) => parseInt(a.stopSequence) - parseInt(b.stopSequence));

        return stops;
    } catch (error) {
        console.error('Error getting stops:', error);
        return [];
    }
}

// Helper: Get transactions for stops
async function getTransactionsForStops(stopIds) {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'StopTransactions!A:AB',
        });

        const rows = response.data.values || [];
        if (rows.length === 0) return [];

        const headers = [
            'id', 'transactionNumber', 'stopId', 'stopNumber', 'bookingId', 'bookingNumber',
            'direction', 'equipmentType', 'quantity', 'qualityGrade', 'fromCompany', 'toCompany',
            'transactionNature', 'expectedQuantity', 'variance', 'hasVariance',
            'evidenceType', 'evidenceConfidence', 'documentUrl', 'documentPageNumber',
            'transactionValueEur', 'pspChargeId', 'timestamp', 'recordedBy', 'notes',
            'reconciled', 'reconciliationId', 'createdAt'
        ];

        let transactions = parseSheetData(rows.slice(1), headers);

        // Filter by stopIds
        transactions = transactions.filter(tx => stopIds.includes(parseInt(tx.stopId)));

        return transactions;
    } catch (error) {
        console.error('Error getting transactions:', error);
        return [];
    }
}

// Helper: Get PSP charges for stops
async function getPSPChargesForStops(stopIds) {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'PSPCharges!A:AB',
        });

        const rows = response.data.values || [];
        if (rows.length === 0) return [];

        const headers = [
            'id', 'chargeNumber', 'stopId', 'stopNumber', 'bookingId', 'bookingNumber',
            'pspCompany', 'chargedToCompany', 'chargeType', 'equipmentType', 'quantity',
            'baseChargeEur', 'perUnitChargeEur', 'totalChargeEur', 'vatRate', 'vatAmountEur', 'totalInclVatEur',
            'currency', 'pspVoucherNumber', 'documentUrl', 'status',
            'approvedBy', 'approvedAt', 'disputeReason', 'disputedAt', 'paidAt', 'notes', 'createdAt'
        ];

        let charges = parseSheetData(rows.slice(1), headers);

        // Filter by stopIds
        charges = charges.filter(charge => stopIds.includes(parseInt(charge.stopId)));

        return charges;
    } catch (error) {
        console.error('Error getting PSP charges:', error);
        return [];
    }
}

// Main handler
module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { bookingId, bookingNumber, stopId } = req.query;

        // Get stops
        let stops = await getStops(bookingId);

        // Filter by bookingNumber if provided (additional filter)
        if (bookingNumber) {
            stops = stops.filter(stop => stop.bookingNumber === bookingNumber);
        }

        // Filter by specific stopId if provided
        if (stopId) {
            stops = stops.filter(stop => parseInt(stop.id) === parseInt(stopId));
        }

        if (stops.length === 0) {
            return res.status(200).json({
                success: true,
                data: [],
                count: 0
            });
        }

        // Get stop IDs
        const stopIds = stops.map(stop => parseInt(stop.id));

        // Get transactions and PSP charges for these stops
        const [transactions, pspCharges] = await Promise.all([
            getTransactionsForStops(stopIds),
            getPSPChargesForStops(stopIds)
        ]);

        // Enrich stops with their transactions and PSP charges
        const enrichedStops = stops.map(stop => {
            const stopId = parseInt(stop.id);

            const stopTransactions = transactions
                .filter(tx => parseInt(tx.stopId) === stopId)
                .map(tx => ({
                    id: parseInt(tx.id),
                    transactionNumber: tx.transactionNumber,
                    direction: tx.direction,
                    equipmentType: tx.equipmentType,
                    quantity: parseInt(tx.quantity),
                    qualityGrade: tx.qualityGrade,
                    fromCompany: tx.fromCompany,
                    toCompany: tx.toCompany,
                    transactionNature: tx.transactionNature,
                    expectedQuantity: parseInt(tx.expectedQuantity) || parseInt(tx.quantity),
                    variance: parseInt(tx.variance) || 0,
                    hasVariance: tx.hasVariance === 'TRUE' || tx.hasVariance === true,
                    evidenceType: tx.evidenceType,
                    evidenceConfidence: parseFloat(tx.evidenceConfidence),
                    documentUrl: tx.documentUrl,
                    documentPageNumber: tx.documentPageNumber ? parseInt(tx.documentPageNumber) : null,
                    transactionValueEur: parseFloat(tx.transactionValueEur) || 0,
                    timestamp: tx.timestamp,
                    recordedBy: tx.recordedBy,
                    notes: tx.notes
                }));

            const stopPSPCharges = pspCharges
                .filter(charge => parseInt(charge.stopId) === stopId)
                .map(charge => ({
                    id: parseInt(charge.id),
                    chargeNumber: charge.chargeNumber,
                    pspCompany: charge.pspCompany,
                    chargedToCompany: charge.chargedToCompany,
                    chargeType: charge.chargeType,
                    equipmentType: charge.equipmentType,
                    quantity: parseInt(charge.quantity),
                    totalChargeEur: parseFloat(charge.totalChargeEur),
                    totalInclVatEur: parseFloat(charge.totalInclVatEur),
                    currency: charge.currency,
                    pspVoucherNumber: charge.pspVoucherNumber,
                    status: charge.status,
                    notes: charge.notes
                }));

            return {
                id: parseInt(stop.id),
                stopNumber: stop.stopNumber,
                bookingId: parseInt(stop.bookingId),
                bookingNumber: stop.bookingNumber,
                stopSequence: parseInt(stop.stopSequence),
                stopType: stop.stopType,
                stopNature: stop.stopNature,
                location: {
                    name: stop.locationName,
                    city: stop.locationCity,
                    lat: parseFloat(stop.locationLat) || null,
                    lng: parseFloat(stop.locationLng) || null
                },
                company: {
                    name: stop.companyName,
                    role: stop.companyRole
                },
                schedule: {
                    scheduledArrival: stop.scheduledArrival,
                    actualArrival: stop.actualArrival,
                    scheduledDeparture: stop.scheduledDeparture,
                    actualDeparture: stop.actualDeparture,
                    dwellTimeMinutes: stop.dwellTimeMinutes ? parseInt(stop.dwellTimeMinutes) : null
                },
                status: stop.status,
                requirements: {
                    confirmationRequired: stop.confirmationRequired === 'TRUE' || stop.confirmationRequired === true,
                    photoRequired: stop.photoRequired === 'TRUE' || stop.photoRequired === true,
                    signatureRequired: stop.signatureRequired === 'TRUE' || stop.signatureRequired === true,
                    qualityCheckRequired: stop.qualityCheckRequired === 'TRUE' || stop.qualityCheckRequired === true
                },
                evidence: {
                    confirmed: stop.confirmed === 'TRUE' || stop.confirmed === true,
                    confirmedBy: stop.confirmedBy,
                    confirmedAt: stop.confirmedAt,
                    signatureCaptured: stop.signatureCaptured === 'TRUE' || stop.signatureCaptured === true,
                    photosUploaded: parseInt(stop.photosUploaded) || 0
                },
                custody: {
                    before: stop.custodyBeforeCompany,
                    after: stop.custodyAfterCompany,
                    transfer: stop.custodyTransfer === 'TRUE' || stop.custodyTransfer === true
                },
                contact: {
                    person: stop.contactPerson,
                    phone: stop.contactPhone
                },
                transactions: stopTransactions,
                pspCharges: stopPSPCharges,
                transactionsSummary: {
                    totalIn: stopTransactions
                        .filter(tx => tx.direction === 'in')
                        .reduce((sum, tx) => sum + tx.quantity, 0),
                    totalOut: stopTransactions
                        .filter(tx => tx.direction === 'out')
                        .reduce((sum, tx) => sum + tx.quantity, 0),
                    variancesCount: stopTransactions.filter(tx => tx.hasVariance).length,
                    pspChargesTotal: stopPSPCharges.reduce((sum, c) => sum + c.totalInclVatEur, 0)
                },
                notes: stop.notes,
                createdAt: stop.createdAt,
                updatedAt: stop.updatedAt
            };
        });

        // Calculate journey summary if multiple stops
        let journeySummary = null;
        if (enrichedStops.length > 1) {
            const originStop = enrichedStops.find(s => s.stopType === 'origin');
            const destinationStop = enrichedStops.find(s => s.stopType === 'destination');

            journeySummary = {
                totalStops: enrichedStops.length,
                completedStops: enrichedStops.filter(s => s.status === 'completed').length,
                stopsWithVariances: enrichedStops.filter(s => s.transactionsSummary.variancesCount > 0).length,
                totalPSPCharges: enrichedStops.reduce((sum, s) => sum + s.transactionsSummary.pspChargesTotal, 0),
                origin: originStop ? {
                    stopId: originStop.id,
                    location: originStop.location.name,
                    company: originStop.company.name,
                    scheduledDeparture: originStop.schedule.scheduledDeparture
                } : null,
                destination: destinationStop ? {
                    stopId: destinationStop.id,
                    location: destinationStop.location.name,
                    company: destinationStop.company.name,
                    scheduledArrival: destinationStop.schedule.scheduledArrival
                } : null
            };
        }

        return res.status(200).json({
            success: true,
            data: enrichedStops,
            count: enrichedStops.length,
            journeySummary
        });

    } catch (error) {
        console.error('Error fetching stops:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch stops',
            details: error.message
        });
    }
};
