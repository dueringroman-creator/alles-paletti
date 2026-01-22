const { readSheet, parseSheetToJSON } = require('./_lib/sheets');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const data = await readSheet('Tasks');
    const tasks = parseSheetToJSON(data);

    const formatted = tasks.map(task => ({
      id: parseInt(task.id),
      type: task.type,
      category: task.category,
      priority: task.priority,
      urgencyScore: parseInt(task.urgencyScore) || 0,
      status: task.status,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate || null,
      hoursUntilDue: task.hoursUntilDue ? parseFloat(task.hoursUntilDue) : null,
      isOverdue: task.isOverdue === 'TRUE',
      assignedTo: {
        name: task.assignedToName,
        role: task.assignedToRole,
      },
      context: {
        bookingId: task.bookingId ? parseInt(task.bookingId) : null,
        bookingNumber: task.bookingNumber || null,
        companyName: task.companyName || null,
      },
      progress: parseInt(task.progress) || 0,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }));

    res.status(200).json({
      success: true,
      data: formatted,
      count: formatted.length,
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
