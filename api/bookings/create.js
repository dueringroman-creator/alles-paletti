const { appendToSheet, readSheet, parseSheetToJSON } = require('../_lib/sheets');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
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
      origin,
      destination,
      carrier,
      pickupDate,
      deliveryDate,
      exchangeType,
      notes,
      createdBy = 'Web User'
    } = req.body;

    // Validate required fields
    if (!equipmentType || !quantity || !origin || !destination || !carrier) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: equipmentType, quantity, origin, destination, carrier'
      });
    }

    // Get existing bookings to generate new ID and booking number
    const existingData = await readSheet('Bookings');
    const existingBookings = parseSheetToJSON(existingData);

    const newId = existingBookings.length > 0
      ? Math.max(...existingBookings.map(b => parseInt(b.id) || 0)) + 1
      : 1;

    const bookingNumber = `BK-${new Date().getFullYear()}-${String(newId).padStart(4, '0')}`;

    // Dummy coordinates for demo (in production, would lookup from locations DB)
    const locationCoords = {
      'Warehouse Munich': { lat: 481.351, lng: 115.802 },
      'Amazon FRA1': { lat: 501.110, lng: 86.820 },
      'EDEKA Hub Nord': { lat: 537.551, lng: 100.015 },
      'Distribution Berlin': { lat: 525.200, lng: 134.050 },
      'REWE DC Hamburg': { lat: 536.500, lng: 99.990 },
      'Warehouse Stuttgart': { lat: 487.830, lng: 91.770 }
    };

    const originCoords = locationCoords[origin] || { lat: 500, lng: 100 };
    const destCoords = locationCoords[destination] || { lat: 500, lng: 100 };

    const now = new Date().toISOString();

    // Prepare row data matching Bookings sheet structure
    const newBookingRow = [
      newId,                              // id
      bookingNumber,                      // bookingNumber
      'pending',                          // status
      origin,                             // originName
      origin.split(' ')[0],              // originCity (simplified)
      originCoords.lat,                   // originLat
      originCoords.lng,                   // originLng
      destination,                        // destinationName
      destination.split(' ')[0],         // destinationCity (simplified)
      destCoords.lat,                     // destinationLat
      destCoords.lng,                     // destinationLng
      origin,                             // shipperName (same as origin for now)
      destination,                        // consigneeName (same as destination)
      carrier,                            // carrierName
      equipmentType,                      // carrierType (equipment type)
      quantity,                           // quantity
      quality,                            // qualityGrade
      pickupDate || '',                   // scheduledPickup
      deliveryDate || '',                 // scheduledDelivery
      '',                                 // actualPickup
      '',                                 // actualDelivery
      1,                                  // currentNode
      0,                                  // progress
      now,                                // lastUpdated
      notes || ''                         // notes (add if column exists)
    ];

    // Append to Bookings sheet
    await appendToSheet('Bookings', [newBookingRow]);

    // Create event for booking creation
    const eventRow = [
      existingBookings.length + 1,        // event id (approximate)
      now,                                // timestamp
      'BookingCreated',                   // eventType
      bookingNumber,                      // bookingNumber
      null,                               // transportId
      `Booking created: ${quantity}x ${equipmentType} from ${origin} to ${destination}`, // details
      createdBy,                          // userName
      'pending',                          // status
      exchangeType,                       // metadata (exchange type)
      1.0                                 // confidence (manual entry = 1.0)
    ];

    await appendToSheet('Events', [eventRow]);

    res.status(201).json({
      success: true,
      data: {
        id: newId,
        bookingNumber,
        status: 'pending',
        message: 'Booking created successfully'
      },
      event: {
        type: 'BookingCreated',
        timestamp: now
      }
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
