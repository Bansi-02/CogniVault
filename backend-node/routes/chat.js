const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const Document = require('../models/Document');
const Message = require('../models/Message');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// GET /api/chat/:documentId
router.get('/:documentId', async (req, res) => {
  try {
    const messages = await Message.find({ documentId: req.params.documentId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Failed to fetch chat history' });
  }
});

// POST /api/chat
router.post('/', async (req, res) => {
  try {
    const { documentId, question } = req.body;

    if (!documentId || !question) {
      return res.status(400).json({ message: 'documentId and question are required.' });
    }

    // 1. Find the document in MongoDB
    const doc = await Document.findById(documentId);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found in vault.' });
    }

    // 2. Read the file from disk
    const filePath = path.join(__dirname, '..', 'uploads', doc.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Physical file not found on server.' });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const base64File = fileBuffer.toString('base64');
    const mimeType = doc.mimeType || 'application/pdf';

    // 3. Prepare payload for Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    let extractedText = '';
    let geminiPayload = [];
    
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || doc.originalName.endsWith('.docx')) {
       // Parse DOCX to plain text
       const result = await mammoth.extractRawText({ path: filePath });
       extractedText = result.value;
       
       const prompt = `You are a professional legal document analyst AI assistant for CogniVault, an enterprise AI platform.
       
A user has uploaded the following document and is asking a specific question about it.

DOCUMENT CONTENT:
${extractedText}

USER QUESTION: "${question}"

Please analyze the document carefully and provide a precise, professional answer based strictly on what is in the document. If the information is not present in the document, clearly state that. Format your response with clear headings if needed.`;

       geminiPayload = [{ text: prompt }];
    } else {
       // Send PDF/CSV natively via inlineData
       const prompt = `You are a professional legal document analyst AI assistant for CogniVault, an enterprise AI platform.
       
A user has uploaded the following document and is asking a specific question about it.

USER QUESTION: "${question}"

Please analyze the document carefully and provide a precise, professional answer based strictly on what is in the document. If the information is not present in the document, clearly state that. Format your response with clear headings if needed.`;

       geminiPayload = [
         { text: prompt },
         {
           inlineData: {
             mimeType: mimeType,
             data: base64File,
           },
         },
       ];
    }

    // Save user message
    const userMessage = new Message({
      documentId: doc._id,
      role: 'user',
      text: question
    });
    await userMessage.save();

    const result = await model.generateContent(geminiPayload);

    const response = result.response;
    const aiAnswer = response.text();

    // Save AI message
    const aiMessage = new Message({
      documentId: doc._id,
      role: 'ai',
      text: aiAnswer
    });
    await aiMessage.save();

    res.json({
      answer: aiAnswer,
      documentName: doc.originalName,
    });

  } catch (error) {
    console.error('Gemini Chat Error:', error.message);
    res.status(500).json({ message: 'AI processing failed.', error: error.message });
  }
});

module.exports = router;
