const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');

// POST /api/activity
// Allows frontend to log specific events (e.g. Logged Out)
router.post('/', async (req, res) => {
  try {
    const { workspaceId, userId, userName, action, details } = req.body;
    
    if (!workspaceId || !userId || !action) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const log = new ActivityLog({
      workspaceId,
      userId,
      userName,
      action,
      details
    });

    await log.save();
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('Error saving activity log:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/activity/:workspaceId
// Get logs for the manager notification bell
router.get('/:workspaceId', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const limit = parseInt(req.query.limit) || 20;

    const logs = await ActivityLog.find({ workspaceId })
                                  .sort({ createdAt: -1 })
                                  .limit(limit);
                                  
    res.status(200).json(logs);
  } catch (err) {
    console.error('Error fetching activity logs:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
