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
    const { taskId, userId = 'Demo User', notes = '' } = req.body;

    if (!taskId) {
      return res.status(400).json({ success: false, error: 'taskId required' });
    }

    // Read tasks sheet
    const tasksData = await readSheet('Tasks');
    const tasks = parseSheetToJSON(tasksData);

    // Find task
    const taskIndex = tasks.findIndex(t => parseInt(t.id) === parseInt(taskId));
    if (taskIndex === -1) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const task = tasks[taskIndex];
    const rowNumber = taskIndex + 2; // +2 because of header row and 0-index

    // Update task status to completed
    const now = new Date().toISOString();
    const updatedRow = [
      task.id,
      task.type,
      task.category,
      task.priority,
      task.urgencyScore,
      'completed', // status
      task.title,
      task.description,
      task.dueDate,
      task.hoursUntilDue,
      task.isOverdue,
      task.assignedToName,
      task.assignedToRole,
      task.bookingId,
      task.bookingNumber,
      task.companyName,
      '100', // progress
      task.createdAt,
      now, // updatedAt
    ];

    await updateRow('Tasks', rowNumber, updatedRow);

    // Log event
    const eventsData = await readSheet('Events');
    const nextEventId = eventsData.length; // New ID

    const eventRow = [
      nextEventId,
      now,
      'task_completed',
      task.bookingId || '',
      task.bookingNumber || '',
      task.id,
      userId,
      userId,
      `Task completed: ${task.title}`,
      JSON.stringify({ notes }),
    ];

    await appendToSheet('Events', [eventRow]);

    res.status(200).json({
      success: true,
      message: 'Task completed successfully',
      taskId: parseInt(taskId),
      eventId: nextEventId,
    });
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
