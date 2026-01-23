/**
 * CREATE BOOKING WITH STOPS
 * POST /api/bookings/create-with-stops
 *
 * Creates a booking with multi-stop itinerary
 */

const { google } = require('googleapis');

// Initialize Google Sheets API
const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

// Helper: Get next ID from sheet
async function getNextId(sheetName) {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${sheetName}!A:A`,
        });

        const rows = response.data.values || [];
        if (rows.length <= 1) return 1; // First row is header

        const lastId = parseInt(rows[rows.length - 1][0]) || 0;
        return lastId + 1;
    } catch (error) {
        console.error(`Error getting next ID for ${sheetName}:`, error);
        return 1;
    }
}

// Helper: Append to sheet
async function appendToSheet(sheetName, values) {
    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `${sheetName}!A:A`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [values]
            }
        });
        return true;
    } catch (error) {
        console.error(`Error appending to ${sheetName}:`, error);
        throw error;
    }
}

// Main handler
module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const {
            equipmentType,
            quantity,
            quality,
            originName,
            originCity,
            originLat,
            originLng,
            destinationName,
            destinationCity,
            destinationLat,
            destinationLng,
            shipperName,
            consigneeName,
            carrierName,
            carrierType = 'dedicated',
            scheduledPickup,
            scheduledDelivery,
            stops = [],
            notes = ''
        } = req.body;

        // Validation
        if (!equipmentType || !quantity || !scheduledPickup) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: equipmentType, quantity, scheduledPickup'
            });
        }

        if (!stops || stops.length < 2) {
            return res.status(400).json({
                success: false,
                error: 'At least 2 stops required (origin and destination)'
            });
        }

        // Validate stop sequence
        const hasOrigin = stops.some(s => s.stopType === 'origin');
        const hasDestination = stops.some(s => s.stopType === 'destination');
        if (!hasOrigin || !hasDestination) {
            return res.status(400).json({
                success: false,
                error: 'Stops must include both origin and destination'
            });
        }

        // Get next IDs
        const bookingId = await getNextId('Bookings');
        const bookingNumber = `BK-${new Date().getFullYear()}-${String(bookingId).padStart(4, '0')}`;

        // Create booking row
        const now = new Date().toISOString();
        const bookingRow = [
            bookingId,                          // id
            bookingNumber,                      // bookingNumber
            'pending',                          // status
            originName || '',                   // originName
            originCity || '',                   // originCity
            originLat || '',                    // originLat
            originLng || '',                    // originLng
            destinationName || '',              // destinationName
            destinationCity || '',              // destinationCity
            destinationLat || '',               // destinationLat
            destinationLng || '',               // destinationLng
            shipperName || '',                  // shipperName
            consigneeName || '',                // consigneeName
            carrierName || '',                  // carrierName
            carrierType,                        // carrierType
            quantity,                           // quantity
            quality || 'A',                     // qualityGrade
            scheduledPickup,                    // scheduledPickup
            scheduledDelivery || '',            // scheduledDelivery
            '',                                 // actualPickup
            '',                                 // actualDelivery
            1,                                  // currentNode
            0,                                  // progress
            now                                 // lastUpdated
        ];

        // Append booking
        await appendToSheet('Bookings', bookingRow);

        // Create stops
        const createdStops = [];
        let stopIdCounter = await getNextId('Stops');

        for (const stopData of stops) {
            const stopId = stopIdCounter++;
            const stopNumber = `STP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(stopId).padStart(4, '0')}`;

            const stopRow = [
                stopId,                                     // id
                stopNumber,                                 // stopNumber
                bookingId,                                  // bookingId
                bookingNumber,                              // bookingNumber
                stopData.stopSequence,                      // stopSequence
                stopData.stopType,                          // stopType
                stopData.stopNature || '',                  // stopNature
                stopData.locationName || '',                // locationName
                stopData.locationCity || '',                // locationCity
                stopData.locationLat || '',                 // locationLat
                stopData.locationLng || '',                 // locationLng
                stopData.companyName || '',                 // companyName
                stopData.companyRole || '',                 // companyRole
                stopData.scheduledArrival || '',            // scheduledArrival
                '',                                         // actualArrival
                stopData.scheduledDeparture || '',          // scheduledDeparture
                '',                                         // actualDeparture
                '',                                         // dwellTimeMinutes
                'pending',                                  // status
                stopData.confirmationRequired !== false,    // confirmationRequired
                stopData.photoRequired || false,            // photoRequired
                stopData.signatureRequired !== false,       // signatureRequired
                stopData.qualityCheckRequired || false,     // qualityCheckRequired
                false,                                      // confirmed
                '',                                         // confirmedBy
                '',                                         // confirmedAt
                false,                                      // signatureCaptured
                0,                                          // photosUploaded
                stopData.custodyBeforeCompany || '',        // custodyBeforeCompany
                stopData.custodyAfterCompany || '',         // custodyAfterCompany
                stopData.custodyTransfer || false,          // custodyTransfer
                stopData.contactPerson || '',               // contactPerson
                stopData.contactPhone || '',                // contactPhone
                stopData.notes || '',                       // notes
                now,                                        // createdAt
                now                                         // updatedAt
            ];

            await appendToSheet('Stops', stopRow);

            // Create expected transactions for this stop
            if (stopData.expectedTransactions && stopData.expectedTransactions.length > 0) {
                let txIdCounter = await getNextId('StopTransactions');

                for (const txData of stopData.expectedTransactions) {
                    const txId = txIdCounter++;
                    const txNumber = `STX-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(txId).padStart(5, '0')}`;

                    const txRow = [
                        txId,                                   // id
                        txNumber,                               // transactionNumber
                        stopId,                                 // stopId
                        stopNumber,                             // stopNumber
                        bookingId,                              // bookingId
                        bookingNumber,                          // bookingNumber
                        txData.direction,                       // direction
                        txData.equipmentType || equipmentType,  // equipmentType
                        txData.quantity || quantity,            // quantity
                        txData.qualityGrade || quality,         // qualityGrade
                        txData.fromCompany || '',               // fromCompany
                        txData.toCompany || '',                 // toCompany
                        txData.transactionNature,               // transactionNature
                        txData.quantity || quantity,            // expectedQuantity
                        0,                                      // variance
                        false,                                  // hasVariance
                        txData.evidenceType || 'manual',        // evidenceType
                        txData.evidenceConfidence || 1.0,       // evidenceConfidence
                        '',                                     // documentUrl
                        '',                                     // documentPageNumber
                        '',                                     // transactionValueEur
                        '',                                     // pspChargeId
                        now,                                    // timestamp
                        'System',                               // recordedBy
                        '',                                     // notes
                        false,                                  // reconciled
                        '',                                     // reconciliationId
                        now                                     // createdAt
                    ];

                    await appendToSheet('StopTransactions', txRow);
                }
            }

            createdStops.push({
                id: stopId,
                stopNumber,
                stopSequence: stopData.stopSequence,
                stopType: stopData.stopType,
                locationName: stopData.locationName,
                companyName: stopData.companyName,
                status: 'pending'
            });
        }

        // Log BookingCreated event
        const eventId = await getNextId('Events');
        const eventRow = [
            eventId,
            now,
            'BookingCreated',
            bookingId,
            bookingNumber,
            originCity || '',
            'System',
            'web_ui',
            `Booking ${bookingNumber} created with ${stops.length} stops: ${quantity} ${equipmentType} pallets`,
            1.00
        ];

        await appendToSheet('Events', eventRow);

        // Success response
        return res.status(201).json({
            success: true,
            data: {
                id: bookingId,
                bookingNumber,
                equipmentType,
                quantity,
                quality,
                origin: {
                    name: originName,
                    city: originCity,
                    lat: originLat,
                    lng: originLng
                },
                destination: {
                    name: destinationName,
                    city: destinationCity,
                    lat: destinationLat,
                    lng: destinationLng
                },
                shipper: shipperName,
                consignee: consigneeName,
                carrier: carrierName,
                scheduledPickup,
                scheduledDelivery,
                stops: createdStops,
                totalStops: createdStops.length,
                status: 'pending',
                createdAt: now
            }
        });

    } catch (error) {
        console.error('Error creating booking with stops:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to create booking',
            details: error.message
        });
    }
};
