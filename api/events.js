const { readSheet, parseSheetToJSON } = require('./_lib/sheets');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { bookingId, limit = '50' } = req.query;

    const data = await readSheet('Events');
    let events = parseSheetToJSON(data);

    // Filter by bookingId if provided
    if (bookingId) {
      events = events.filter(e => e.bookingId === bookingId);
    }

    // Sort by timestamp descending (most recent first)
    events.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return dateB - dateA;
    });

    // Limit results
    events = events.slice(0, parseInt(limit));

    const formatted = events.map(event => ({
      id: parseInt(event.id),
      timestamp: event.timestamp,
      eventType: event.eventType,
      bookingId: event.bookingId ? parseInt(event.bookingId) : null,
      bookingNumber: event.bookingNumber || null,
      taskId: event.taskId ? parseInt(event.taskId) : null,
      userId: event.userId || null,
      userName: event.userName,
      details: event.details,
      metadata: event.metadata ? JSON.parse(event.metadata) : {},
    }));

    res.status(200).json({
      success: true,
      data: formatted,
      count: formatted.length,
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
