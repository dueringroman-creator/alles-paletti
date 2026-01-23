/**
 * JSON TO CSV CONVERTER
 * Converts generated test data JSON files to CSV for Google Sheets import
 */

const fs = require('fs');
const path = require('path');

function jsonToCSV(jsonArray, headers) {
    if (jsonArray.length === 0) return '';

    // Create CSV header
    const csvHeaders = headers.join('\t');

    // Create CSV rows
    const csvRows = jsonArray.map(obj => {
        return headers.map(header => {
            const keys = header.split('.');
            let value = obj;

            // Navigate nested properties
            for (const key of keys) {
                value = value?.[key];
            }

            // Handle special cases
            if (value === null || value === undefined) {
                return '';
            }
            if (typeof value === 'boolean') {
                return value ? 'TRUE' : 'FALSE';
            }
            if (typeof value === 'object') {
                return JSON.stringify(value);
            }

            // Escape quotes and wrap in quotes if contains comma/tab/newline
            const stringValue = String(value);
            if (stringValue.includes('\t') || stringValue.includes('\n') || stringValue.includes('"')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }

            return stringValue;
        }).join('\t');
    });

    return [csvHeaders, ...csvRows].join('\n');
}

function convertStops() {
    console.log('📋 Converting Stops...');
    const stops = JSON.parse(fs.readFileSync(path.join(__dirname, '../test-data/stops.json')));

    // Flatten stops (remove transactions sub-array for separate table)
    const flatStops = stops.map((stop, index) => ({
        id: index + 1,
        stopNumber: stop.stopNumber,
        bookingId: null, // Will be filled when linked to bookings
        bookingNumber: null,
        stopSequence: stop.stopSequence,
        stopType: stop.stopType,
        stopNature: stop.stopNature,
        locationName: stop.locationName,
        locationCity: stop.locationCity,
        locationLat: stop.locationLat,
        locationLng: stop.locationLng,
        companyName: stop.company,
        companyRole: stop.stopType === 'origin' ? 'shipper' :
                     stop.stopType === 'destination' ? 'receiver' :
                     stop.stopType === 'psp_service_point' ? 'psp' :
                     'carrier',
        scheduledArrival: stop.scheduledArrival || '',
        actualArrival: '',
        scheduledDeparture: stop.scheduledDeparture || '',
        actualDeparture: '',
        dwellTimeMinutes: '',
        status: 'pending',
        confirmationRequired: 'TRUE',
        photoRequired: stop.stopType === 'handoff_point' ? 'TRUE' : 'FALSE',
        signatureRequired: 'TRUE',
        qualityCheckRequired: stop.stopType === 'quality_checkpoint' ? 'TRUE' : 'FALSE',
        confirmed: 'FALSE',
        confirmedBy: '',
        confirmedAt: '',
        signatureCaptured: 'FALSE',
        photosUploaded: 0,
        custodyBeforeCompany: '',
        custodyAfterCompany: '',
        custodyTransfer: 'FALSE',
        contactPerson: '',
        contactPhone: '',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }));

    const headers = [
        'id', 'stopNumber', 'bookingId', 'bookingNumber', 'stopSequence', 'stopType', 'stopNature',
        'locationName', 'locationCity', 'locationLat', 'locationLng', 'companyName', 'companyRole',
        'scheduledArrival', 'actualArrival', 'scheduledDeparture', 'actualDeparture', 'dwellTimeMinutes',
        'status', 'confirmationRequired', 'photoRequired', 'signatureRequired', 'qualityCheckRequired',
        'confirmed', 'confirmedBy', 'confirmedAt', 'signatureCaptured', 'photosUploaded',
        'custodyBeforeCompany', 'custodyAfterCompany', 'custodyTransfer',
        'contactPerson', 'contactPhone', 'notes', 'createdAt', 'updatedAt'
    ];

    const csv = jsonToCSV(flatStops, headers);
    fs.writeFileSync(path.join(__dirname, '../test-data/stops.csv'), csv);
    console.log(`✅ Converted ${flatStops.length} stops to CSV`);

    return flatStops;
}

function convertTransactions() {
    console.log('📋 Converting Stop Transactions...');
    const stops = JSON.parse(fs.readFileSync(path.join(__dirname, '../test-data/stops.json')));

    // Extract all transactions from stops
    const allTransactions = [];
    let txId = 1;

    stops.forEach((stop, stopIndex) => {
        if (stop.transactions) {
            stop.transactions.forEach(tx => {
                if (tx.direction) { // Only process actual transactions (not PSP charges)
                    allTransactions.push({
                        id: txId++,
                        transactionNumber: tx.transactionNumber,
                        stopId: stopIndex + 1,
                        stopNumber: stop.stopNumber,
                        bookingId: null, // Will be filled when linked
                        bookingNumber: null,
                        direction: tx.direction,
                        equipmentType: tx.equipmentType,
                        quantity: tx.quantity,
                        qualityGrade: tx.qualityGrade,
                        fromCompany: '',
                        toCompany: '',
                        transactionNature: tx.transactionNature,
                        expectedQuantity: tx.expectedQuantity || tx.quantity,
                        variance: tx.variance || 0,
                        hasVariance: tx.hasVariance ? 'TRUE' : 'FALSE',
                        evidenceType: tx.evidenceType,
                        evidenceConfidence: tx.evidenceConfidence || 0.95,
                        documentUrl: '',
                        documentPageNumber: tx.documentPageNumber || '',
                        transactionValueEur: (tx.quantity * 15).toFixed(2), // Assuming €15 per unit
                        pspChargeId: '',
                        timestamp: new Date().toISOString(),
                        recordedBy: 'System',
                        notes: '',
                        reconciled: 'FALSE',
                        reconciliationId: '',
                        createdAt: new Date().toISOString()
                    });
                }
            });
        }
    });

    const headers = [
        'id', 'transactionNumber', 'stopId', 'stopNumber', 'bookingId', 'bookingNumber',
        'direction', 'equipmentType', 'quantity', 'qualityGrade', 'fromCompany', 'toCompany',
        'transactionNature', 'expectedQuantity', 'variance', 'hasVariance',
        'evidenceType', 'evidenceConfidence', 'documentUrl', 'documentPageNumber',
        'transactionValueEur', 'pspChargeId', 'timestamp', 'recordedBy', 'notes',
        'reconciled', 'reconciliationId', 'createdAt'
    ];

    const csv = jsonToCSV(allTransactions, headers);
    fs.writeFileSync(path.join(__dirname, '../test-data/transactions.csv'), csv);
    console.log(`✅ Converted ${allTransactions.length} transactions to CSV`);

    return allTransactions;
}

function convertPSPCharges() {
    console.log('📋 Converting PSP Charges...');
    const stops = JSON.parse(fs.readFileSync(path.join(__dirname, '../test-data/stops.json')));

    // Extract PSP charges from stops
    const allCharges = [];
    let chargeId = 1;

    stops.forEach((stop, stopIndex) => {
        if (stop.transactions) {
            stop.transactions.forEach(tx => {
                if (tx.type === 'psp_charge') {
                    const totalCharge = tx.totalCost || (tx.baseCost + (tx.quantity * tx.perUnitCost));
                    const vatAmount = totalCharge * 0.19;
                    const totalInclVat = totalCharge + vatAmount;

                    allCharges.push({
                        id: chargeId++,
                        chargeNumber: `PSP-2026-${String(chargeId).padStart(4, '0')}`,
                        stopId: stopIndex + 1,
                        stopNumber: stop.stopNumber,
                        bookingId: null,
                        bookingNumber: null,
                        pspCompany: 'PalletPool GmbH',
                        chargedToCompany: stop.company,
                        chargeType: tx.chargeType,
                        equipmentType: 'EUR',
                        quantity: tx.quantity,
                        baseChargeEur: tx.baseCost.toFixed(2),
                        perUnitChargeEur: tx.perUnitCost.toFixed(2),
                        totalChargeEur: totalCharge.toFixed(2),
                        vatRate: '19.00',
                        vatAmountEur: vatAmount.toFixed(2),
                        totalInclVatEur: totalInclVat.toFixed(2),
                        currency: 'EUR',
                        pspVoucherNumber: tx.voucherNumber,
                        documentUrl: '',
                        status: 'pending',
                        approvedBy: '',
                        approvedAt: '',
                        disputeReason: '',
                        disputedAt: '',
                        paidAt: '',
                        notes: `${tx.chargeType} - ${tx.quantity} units`,
                        createdAt: new Date().toISOString()
                    });
                }
            });
        }
    });

    const headers = [
        'id', 'chargeNumber', 'stopId', 'stopNumber', 'bookingId', 'bookingNumber',
        'pspCompany', 'chargedToCompany', 'chargeType', 'equipmentType', 'quantity',
        'baseChargeEur', 'perUnitChargeEur', 'totalChargeEur', 'vatRate', 'vatAmountEur', 'totalInclVatEur',
        'currency', 'pspVoucherNumber', 'documentUrl', 'status',
        'approvedBy', 'approvedAt', 'disputeReason', 'disputedAt', 'paidAt', 'notes', 'createdAt'
    ];

    const csv = jsonToCSV(allCharges, headers);
    fs.writeFileSync(path.join(__dirname, '../test-data/psp_charges.csv'), csv);
    console.log(`✅ Converted ${allCharges.length} PSP charges to CSV`);

    return allCharges;
}

function convertBookings() {
    console.log('📋 Converting Bookings (with stop associations)...');
    const bookings = JSON.parse(fs.readFileSync(path.join(__dirname, '../test-data/bookings.json')));

    // Create CSV with stop count information
    const bookingsWithStops = bookings.map((booking, index) => ({
        id: index + 1,
        bookingNumber: booking.bookingNumber,
        equipmentType: booking.equipmentType,
        quantity: booking.quantity,
        quality: booking.quality,
        originName: booking.originName,
        originCity: booking.originCity,
        originLat: booking.originLat,
        originLng: booking.originLng,
        destinationName: booking.destinationName,
        destinationCity: booking.destinationCity,
        destinationLat: booking.destinationLat,
        destinationLng: booking.destinationLng,
        shipperName: booking.shipperName,
        consigneeName: booking.consigneeName,
        carrierName: booking.carrierName,
        scheduledPickup: booking.scheduledPickup,
        scheduledDelivery: booking.scheduledDelivery,
        status: booking.status,
        totalStops: booking.stops.length,
        distance: booking.distance,
        hasVariance: booking.hasVariance ? 'TRUE' : 'FALSE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }));

    const headers = [
        'id', 'bookingNumber', 'equipmentType', 'quantity', 'quality',
        'originName', 'originCity', 'originLat', 'originLng',
        'destinationName', 'destinationCity', 'destinationLat', 'destinationLng',
        'shipperName', 'consigneeName', 'carrierName',
        'scheduledPickup', 'scheduledDelivery', 'status',
        'totalStops', 'distance', 'hasVariance', 'createdAt', 'updatedAt'
    ];

    const csv = jsonToCSV(bookingsWithStops, headers);
    fs.writeFileSync(path.join(__dirname, '../test-data/bookings-enhanced.csv'), csv);
    console.log(`✅ Converted ${bookingsWithStops.length} bookings to CSV`);

    return bookingsWithStops;
}

// Main conversion
console.log('🚀 Converting JSON to CSV for Google Sheets import...\n');

try {
    convertStops();
    convertTransactions();
    convertPSPCharges();
    convertBookings();

    console.log('\n✨ Conversion complete!');
    console.log('\n📁 Files created:');
    console.log('  - test-data/stops.csv');
    console.log('  - test-data/transactions.csv');
    console.log('  - test-data/psp_charges.csv');
    console.log('  - test-data/bookings-enhanced.csv');
    console.log('\n📋 Import Instructions:');
    console.log('  1. Open your Google Sheet');
    console.log('  2. Create sheets: Stops, StopTransactions, PSPCharges');
    console.log('  3. File → Import → Upload → Select CSV file');
    console.log('  4. Choose "Replace current sheet" or "Append to current sheet"');
    console.log('  5. Separator type: Tab');
    console.log('  6. Click "Import data"');

} catch (error) {
    console.error('❌ Error during conversion:', error);
    process.exit(1);
}
