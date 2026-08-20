const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const Document = require('../models/Document');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Unique filename: timestamp + random math + original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// POST /api/documents/upload
router.post('/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const userId = req.body.userId;
    if (!userId) return res.status(400).json({ message: 'User ID is required' });

    const user = await User.findById(userId).populate('workspace');
    if (!user || !user.workspace) return res.status(400).json({ message: 'User workspace not found' });

    if (user.workspace.subscription_tier === 'free_trial' || user.tier === 'free_trial') {
      const docCount = await Document.countDocuments({ workspaceId: user.workspace._id });
      if (docCount >= 1) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(403).json({ message: 'Free trial is limited to 1 document upload.' });
      }
    }

    // Save metadata to MongoDB using workspaceId
    const newDoc = new Document({
      workspaceId: user.workspace._id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      status: 'uploaded'
    });

    await newDoc.save();

    try {
      // 1. Create form data with the physical file stream
      const formData = new FormData();
      formData.append('file', fs.createReadStream(req.file.path));

      // 2. Send to Python FastAPI Engine
      const aiResponse = await axios.post('http://localhost:8000/api/ai/classify', formData, {
        headers: {
          ...formData.getHeaders()
        }
      });

      // 3. Update MongoDB with the AI classification result
      newDoc.classification = aiResponse.data.classification;
      newDoc.status = 'classified';
      await newDoc.save();
      
    } catch (aiError) {
      console.error('Python AI Engine Error:', aiError.message);
      newDoc.status = 'error';
      await newDoc.save();
    }

    await ActivityLog.create({
      workspaceId: user.workspace._id.toString(),
      userId: user._id.toString(),
      userName: user.name,
      action: 'Uploaded File',
      details: req.file.originalname
    });

    res.status(200).json({
      message: 'File uploaded and analyzed securely.',
      document: newDoc
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'Server error during file upload', error: error.message });
  }
});

// GET /api/documents
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ message: 'User ID required' });
    
    const user = await User.findById(userId);
    if (!user || !user.workspace) return res.status(404).json({ message: 'Workspace not found' });

    // Fetch documents belonging to the workspace
    const documents = await Document.find({ workspaceId: user.workspace }).sort({ uploadedAt: -1 });
    res.status(200).json(documents);
  } catch (error) {
    console.error('Fetch Error:', error);
    res.status(500).json({ message: 'Server error while fetching documents' });
  }
});

// GET /api/documents/:id/redline
router.get('/:id/redline', async (req, res) => {
  try {
    const docId = req.params.id;
    const doc = await Document.findById(docId);
    
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const filePath = path.join(__dirname, '..', 'uploads', doc.filename);
    let documentText = '';

    try {
      if (doc.originalName.endsWith('.docx') || doc.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ path: filePath });
        documentText = result.value;
      } else {
        documentText = fs.readFileSync(filePath, 'utf8');
      }
    } catch (err) {
      console.error('Error reading file:', err);
      return res.status(500).json({ message: 'Error reading file content' });
    }

    // Prepare the Gemini Model
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              id: { type: SchemaType.STRING },
              originalText: { type: SchemaType.STRING, description: "The EXACT quote from the text that is risky. Must be an exact substring match." },
              severity: { type: SchemaType.STRING, description: "high, medium, or critical" },
              reasoning: { type: SchemaType.STRING, description: "Why this clause is risky" },
              suggestion: { type: SchemaType.STRING, description: "Proposed revised redline text" }
            },
            required: ["id", "originalText", "severity", "reasoning", "suggestion"]
          }
        }
      }
    });

    const prompt = `You are an expert corporate lawyer. Analyze the following contract.
Identify 3 to 5 critical or high legal risks (e.g., unlimited liability, unreasonable termination, indemnification).
For each risk, extract the exact original text phrase, determine the severity, explain the reasoning, and provide a safer suggestion.
The 'originalText' MUST be an exact substring of the document text.

DOCUMENT TEXT:
${documentText}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    let risks = [];
    try {
      risks = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse Gemini JSON:', e);
      risks = [];
    }

    res.status(200).json({
      text: documentText,
      risks: risks
    });

  } catch (error) {
    console.error('Redline Error:', error);
    res.status(500).json({ message: 'Server error generating redlines' });
  }
});

// Global memory map for tracking Insider Threat velocity
const userAccessLogs = new Map();

// GET /api/documents/:id/content
// Fetches text content and tracks access velocity for Insider Threat Detection
router.get('/:id/content', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Check if suspended
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'SECURITY LOCKDOWN: Account suspended due to abnormal activity.' });
    }

    // --- INSIDER THREAT DETECTION LOGIC ---
    const now = Date.now();
    const windowMs = 60000; // 60 seconds
    const maxRequests = 10; // Max 10 docs per 60s

    let logs = userAccessLogs.get(userId) || [];
    // Filter logs to only keep those within the last 60 seconds
    logs = logs.filter(timestamp => now - timestamp < windowMs);
    logs.push(now);
    userAccessLogs.set(userId, logs);

    let isAnomaly = false;
    try {
      // Calculate real signals for the ML model
      const tenureDays = user.createdAt
        ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      const currentHour = new Date().getHours();
      const offHoursFlag = (currentHour < 6 || currentHour >= 20) ? 1 : 0;

      // Ask Python ML model
      const aiRes = await axios.post('http://127.0.0.1:8000/api/ai/threat/anomaly', {
        download_count_last_60s: logs.length,
        user_tenure_days: tenureDays,
        off_hours_flag: offHoursFlag
      });
      isAnomaly = aiRes.data.is_anomaly;
    } catch (err) {
      console.error('Failed to reach Python ML threat detection, fallback to manual rule', err.message);
      if (logs.length > maxRequests) isAnomaly = true;
    }

    if (isAnomaly) {
      // THREAT DETECTED!
      user.status = 'suspended';
      await user.save();

      // Log the threat to the database
      const InsiderThreat = require('../models/InsiderThreat');
      const threat = new InsiderThreat({
        workspaceId: user.workspace.toString(),
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        action: 'Mass Document Exfiltration Attempt (ML Detected)',
        documentCount: logs.length,
        timeWindowSeconds: windowMs / 1000
      });
      await threat.save();

      await ActivityLog.create({
        workspaceId: user.workspace.toString(),
        userId: user._id.toString(),
        userName: user.name,
        action: 'Threat Detected',
        details: `Mass Document Exfiltration Attempt (${logs.length} docs in 60s)`
      });

      return res.status(403).json({ error: 'SECURITY LOCKDOWN: Abnormal data extraction velocity detected by ML. Account suspended.' });
    }
    // ----------------------------------------

    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    
    await ActivityLog.create({
      workspaceId: user.workspace.toString(),
      userId: user._id.toString(),
      userName: user.name,
      action: 'Downloaded File',
      details: doc.originalName
    });

    const filePath = path.join(__dirname, '..', 'uploads', doc.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on disk' });

    let documentText = "";
    if (doc.originalName.endsWith('.docx')) {
       const result = await mammoth.extractRawText({ path: filePath });
       documentText = result.value;
    } else if (doc.originalName.toLowerCase().endsWith('.pdf')) {
       // Real PDF text extraction using pdf-parse
       const dataBuffer = fs.readFileSync(filePath);
       try {
         const pdfData = await pdfParse(dataBuffer);
         documentText = pdfData.text;
         if (!documentText || !documentText.trim()) {
           documentText = '[This PDF appears to be scanned or image-based. No extractable text found. Please upload a text-based PDF.]';
         }
       } catch (pdfErr) {
         console.error('PDF parse error:', pdfErr.message);
         documentText = '[Failed to extract text from this PDF. It may be encrypted or corrupted.]';
       }
    } else if (doc.originalName.match(/\.(png|jpe?g)$/i)) {
       // Images: no OCR available, return honest message
       documentText = '[Image files are not supported for text extraction. Please upload a PDF, DOCX, TXT, or CSV file.]';
    } else {
       documentText = fs.readFileSync(filePath, 'utf8');
    }

    res.status(200).json({ text: documentText });

  } catch (error) {
    console.error('Content Fetch Error:', error);
    res.status(500).json({ error: 'Server error during content extraction' });
  }
});

// DELETE /api/documents/:id
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.body.userId || req.query.userId;
    if (!userId) return res.status(400).json({ message: 'User ID required' });
    
    const user = await User.findById(userId);
    if (!user || user.role !== 'manager') {
      return res.status(403).json({ message: 'Unauthorized. Only workspace managers can delete documents.' });
    }

    const doc = await Document.findOneAndDelete({ _id: req.params.id, workspaceId: user.workspace });
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    
    // Also delete physical file
    const filePath = path.join(__dirname, '..', 'uploads', doc.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await ActivityLog.create({
      workspaceId: user.workspace.toString(),
      userId: user._id.toString(),
      userName: user.name,
      action: 'Deleted File',
      details: doc.originalName
    });

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete Error:', error);
    res.status(500).json({ message: 'Server error deleting document' });
  }
});

module.exports = router;

