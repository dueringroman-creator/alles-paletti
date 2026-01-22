const { readSheet, parseSheetToJSON } = require('./_lib/sheets');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Read bookings from Google Sheets
    const data = await readSheet('Bookings');
    const bookings = parseSheetToJSON(data);

    // Transform to match frontend format
    const formatted = bookings.map(booking => ({
      id: parseInt(booking.id),
      bookingNumber: booking.bookingNumber,
      status: booking.status,
      origin: {
        name: booking.originName,
        city: booking.originCity,
        coordinates: [parseFloat(booking.originLat) || 0, parseFloat(booking.originLng) || 0],
      },
      destination: {
        name: booking.destinationName,
        city: booking.destinationCity,
        coordinates: [parseFloat(booking.destinationLat) || 0, parseFloat(booking.destinationLng) || 0],
      },
      shipper: { name: booking.shipperName },
      consignee: { name: booking.consigneeName },
      carrier: { name: booking.carrierName },
      loadCarriers: {
        type: booking.carrierType,
        quantity: parseInt(booking.quantity) || 0,
        qualityGrade: booking.qualityGrade,
      },
      scheduledPickup: booking.scheduledPickup,
      scheduledDelivery: booking.scheduledDelivery,
      actualPickup: booking.actualPickup || null,
      actualDelivery: booking.actualDelivery || null,
      currentNode: parseInt(booking.currentNode) || 1,
      progress: parseInt(booking.progress) || 0,
      lastUpdated: booking.lastUpdated,
    }));

    res.status(200).json({
      success: true,
      data: formatted,
      count: formatted.length,
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
