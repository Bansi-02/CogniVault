const express = require('express');
const router = express.Router();
const Partnership = require('../models/Partnership');

// GET /api/advertisements/active
router.get('/active', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalized to start of day
    
    // Find ads that are currently scheduled for today
    const activeAds = await Partnership.find({
      status: 'scheduled',
      startDate: { $lte: new Date() }, // Started today or earlier
      endDate: { $gte: today } // Ends today or later
    }).limit(2); // strictly max 2

    res.json(activeAds);
  } catch (error) {
    console.error('Error fetching active advertisements:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
