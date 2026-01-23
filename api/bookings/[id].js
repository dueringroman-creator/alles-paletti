/**
 * UPDATE BOOKING
 * PUT /api/bookings/{id}
 *
 * Updates booking details and logs BookingModified event
 */

const { google } = require('googleapis');

// Initialize Google Sheets API
const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

// Helper: Find booking row
async function findBookingRow(bookingId) {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Bookings!A:A',
        });

        const rows = response.data.values || [];
        // Skip header row (index 0)
        for (let i = 1; i < rows.length; i++) {
            if (parseInt(rows[i][0]) === parseInt(bookingId)) {
                return i + 1; // Row numbers are 1-indexed
            }
        }
        return null;
    } catch (error) {
        console.error('Error finding booking row:', error);
        return null;
    }
}

// Helper: Update sheet cell
async function updateSheet(range, values) {
    try {
        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [values]
            }
        });
        return true;
    } catch (error) {
        console.error(`Error updating ${range}:`, error);
        throw error;
    }
}

// Helper: Append event
async function appendEvent(eventRow) {
    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Events!A:J',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [eventRow]
            }
        });
        return true;
    } catch (error) {
        console.error('Error appending event:', error);
        throw error;
    }
}

// Helper: Get next event ID
async function getNextEventId() {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Events!A:A',
        });

        const rows = response.data.values || [];
        if (rows.length <= 1) return 1;

        const lastId = parseInt(rows[rows.length - 1][0]) || 0;
        return lastId + 1;
    } catch (error) {
        console.error('Error getting next event ID:', error);
        return 1;
    }
}

// Main handler
module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'PUT') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { id } = req.query;
        const {
            equipmentType,
            quantity,
            quality,
            origin,
            destination,
            carrier,
            pickupDate,
            deliveryDate,
            notes
        } = req.body;

        // Validate
        if (!id) {
            return res.status(400).json({ success: false, error: 'Booking ID required' });
        }

        if (!equipmentType || !quantity || !origin || !destination || !carrier) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        // Find booking row
        const rowNumber = await findBookingRow(id);
        if (!rowNumber) {
            return res.status(404).json({
                success: false,
                error: 'Booking not found'
            });
        }

        // Get current booking data to retrieve booking number
        const currentDataResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `Bookings!${rowNumber}:${rowNumber}`,
        });

        const currentRow = currentDataResponse.data.values?.[0] || [];
        const bookingNumber = currentRow[1] || `BK-${new Date().getFullYear()}-${String(id).padStart(4, '0')}`;

        // Update timestamp
        const now = new Date().toISOString();

        // Update only the fields that can be edited
        // Column P = quantity (index 15)
        // Column Q = quality (index 16)
        // Column R = scheduledPickup (index 17)
        // Column S = scheduledDelivery (index 18)
        // Column X = lastUpdated (index 23)

        // Update quantity
        await updateSheet(`Bookings!P${rowNumber}`, [quantity]);

        // Update quality grade
        await updateSheet(`Bookings!Q${rowNumber}`, [quality || 'A']);

        // Update pickup date if provided
        if (pickupDate) {
            await updateSheet(`Bookings!R${rowNumber}`, [pickupDate]);
        }

        // Update delivery date if provided
        if (deliveryDate) {
            await updateSheet(`Bookings!S${rowNumber}`, [deliveryDate]);
        }

        // Update last updated timestamp
        await updateSheet(`Bookings!X${rowNumber}`, [now]);

        // Log BookingModified event
        const eventId = await getNextEventId();
        const eventRow = [
            eventId,
            now,
            'BookingModified',
            id,
            bookingNumber,
            origin || '',
            'System',
            'web_ui',
            `Booking ${bookingNumber} modified: ${quantity}x ${equipmentType} ${quality}`,
            1.00
        ];

        await appendEvent(eventRow);

        // Success response
        return res.status(200).json({
            success: true,
            data: {
                id: parseInt(id),
                bookingNumber,
                equipmentType,
                quantity: parseInt(quantity),
                quality,
                origin,
                destination,
                carrier,
                pickupDate,
                deliveryDate,
                notes,
                updatedAt: now
            }
        });

    } catch (error) {
        console.error('Error updating booking:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to update booking',
            details: error.message
        });
    }
};
