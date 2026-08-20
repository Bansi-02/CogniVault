const express = require('express');
const router = express.Router();
const InsiderThreat = require('../models/InsiderThreat');

// GET /api/insider-threats/:workspaceId
// Get all recorded insider threats for a workspace
router.get('/:workspaceId', async (req, res) => {
  try {
    const threats = await InsiderThreat.find({ workspaceId: req.params.workspaceId }).sort({ timestamp: -1 });
    res.status(200).json(threats);
  } catch (error) {
    console.error('Error fetching insider threats:', error);
    res.status(500).json({ message: 'Server error while fetching insider threats' });
  }
});

module.exports = router;
