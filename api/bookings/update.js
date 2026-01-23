const { readSheet, updateRow, appendToSheet, parseSheetToJSON } = require('../_lib/sheets');

module.exports = async (req, res) => {
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
      bookingId,
      nodeSequence,
      actualQuantity,
      actualQuality,
      actualTime,
      userId = 'Demo User',
    } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, error: 'bookingId required' });
    }

    // Read bookings
    const bookingsData = await readSheet('Bookings');
    const bookings = parseSheetToJSON(bookingsData);

    const bookingIndex = bookings.findIndex(b => parseInt(b.id) === parseInt(bookingId));
    if (bookingIndex === -1) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const booking = bookings[bookingIndex];
    const rowNumber = bookingIndex + 2;

    // Calculate new progress
    const totalNodes = 4; // Assuming 4 nodes for demo
    const currentNode = parseInt(booking.currentNode) || 1;
    const newCurrentNode = Math.min(currentNode + 1, totalNodes);
    const newProgress = Math.round((newCurrentNode / totalNodes) * 100);

    const now = new Date().toISOString();
    const updatedRow = [
      booking.id,
      booking.bookingNumber,
      booking.status,
      booking.originName,
      booking.originCity,
      booking.originLat,
      booking.originLng,
      booking.destinationName,
      booking.destinationCity,
      booking.destinationLat,
      booking.destinationLng,
      booking.shipperName,
      booking.consigneeName,
      booking.carrierName,
      booking.carrierType,
      booking.quantity,
      booking.qualityGrade,
      booking.scheduledPickup,
      booking.scheduledDelivery,
      booking.actualPickup || actualTime || now,
      booking.actualDelivery,
      newCurrentNode,
      newProgress,
      now,
    ];

    await updateRow('Bookings', rowNumber, updatedRow);

    // Log event
    const eventsData = await readSheet('Events');
    const nextEventId = eventsData.length;

    const eventRow = [
      nextEventId,
      actualTime || now,
      'node_confirmed',
      booking.id,
      booking.bookingNumber,
      '',
      userId,
      userId,
      `Node ${nodeSequence} confirmed`,
      JSON.stringify({
        nodeSequence,
        actualQuantity,
        actualQuality,
        actualTime: actualTime || now,
      }),
    ];

    await appendToSheet('Events', [eventRow]);

    res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      bookingId: parseInt(bookingId),
      newCurrentNode,
      newProgress,
      eventId: nextEventId,
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
