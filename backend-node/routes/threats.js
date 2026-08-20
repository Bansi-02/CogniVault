const express = require('express');
const router = express.Router();
const ThreatLog = require('../models/ThreatLog');

// POST /api/threats
// Save a new threat
router.post('/', async (req, res) => {
  try {
    const { workspaceId, vendor, location, risk, type, amount, date, action, lat, lng } = req.body;
    
    if (!workspaceId) {
      return res.status(400).json({ message: 'workspaceId is required' });
    }

    const newThreat = new ThreatLog({
      workspaceId,
      vendor,
      location,
      risk,
      type,
      amount,
      date,
      action,
      lat,
      lng
    });

    const savedThreat = await newThreat.save();
    res.status(201).json(savedThreat);
  } catch (error) {
    console.error('Error saving threat:', error);
    res.status(500).json({ message: 'Server error while saving threat' });
  }
});

// GET /api/threats/:workspaceId
// Get all threats for a workspace
router.get('/:workspaceId', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    
    // Fetch threats sorted by newest first
    const threats = await ThreatLog.find({ workspaceId }).sort({ createdAt: -1 });
    res.status(200).json(threats);
  } catch (error) {
    console.error('Error fetching threats:', error);
    res.status(500).json({ message: 'Server error while fetching threats' });
  }
});

module.exports = router;
