const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Partnership = require('../models/Partnership');

// Ensure banners upload directory exists
const bannersDir = path.join(__dirname, '..', 'uploads', 'banners');
if (!fs.existsSync(bannersDir)) {
  fs.mkdirSync(bannersDir, { recursive: true });
}

// Configure Multer for SVG banners
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, bannersDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'banner-' + uniqueSuffix + '.svg');
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/svg+xml' || file.originalname.toLowerCase().endsWith('.svg')) {
    cb(null, true);
  } else {
    cb(new Error('Only SVG files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// ── POST /api/partnerships ──────────────────────────────────────────────────
router.post('/', upload.single('banner'), async (req, res) => {
  try {
    const { company, email, placement, region } = req.body;
    const bannerFile = req.file;

    if (!company || !email || !placement || !region || !bannerFile) {
      return res.status(400).json({ message: 'Missing required fields or banner file.' });
    }

    const price = region === 'india' ? 6000 : 120;
    const relativePath = 'uploads/banners/' + bannerFile.filename;

    const newPartnership = new Partnership({
      company,
      email,
      placement,
      region,
      price,
      bannerPath: relativePath,
      status: 'pending'
    });
    await newPartnership.save();

    console.log(`[Partnership] Saved application from ${company} (${email}) for region: ${region} at price ${price}`);

    res.status(201).json({ 
      message: 'Partnership application received successfully.',
      bannerPath: bannerFile.path
    });

  } catch (err) {
    console.error('Partnership upload error:', err.message);
    res.status(500).json({ message: 'Server error during partnership application.' });
  }
});

module.exports = router;
