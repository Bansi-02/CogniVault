const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const SupportTicket = require('../models/SupportTicket');

// Nodemailer Transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// POST /api/support - Submit a new ticket
router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // 1. Save ticket to DB
    const ticket = new SupportTicket({ name, email, message });
    await ticket.save();

    // 2. Send Auto-Reply to user
    const mailOptions = {
      from: `"CogniVault Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'We have received your query - CogniVault',
      text: `Hello ${name},\n\nThank you for contacting CogniVault Enterprise Support.\n\nWe have received your message:\n"${message}"\n\nOur team is reviewing your query and will respond as soon as possible.\n\nBest regards,\nCogniVault Team`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Request Received</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>Thank you for contacting CogniVault Enterprise Support. We have safely received your message:</p>
          <blockquote style="border-left: 4px solid #e5e7eb; padding-left: 1rem; margin-left: 0; color: #6b7280; font-style: italic;">
            ${message}
          </blockquote>
          <p>Our team is reviewing your query and will respond as soon as possible.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0;" />
          <p style="font-size: 0.875rem; color: #9ca3af;">Best regards,<br/><strong>CogniVault Team</strong></p>
        </div>
      `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending auto-reply:', error);
        // We don't fail the request if the email fails, we just log it
      }
    });

    res.status(201).json({ message: 'Ticket submitted successfully', ticket });
  } catch (error) {
    console.error('Error submitting support ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/support - Fetch all tickets (Admin only)
router.get('/', async (req, res) => {
  try {
    const tickets = await SupportTicket.find().sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/support/:id/reply - Admin replies to a ticket
router.post('/:id/reply', async (req, res) => {
  try {
    const { replyMessage } = req.body;
    const ticketId = req.params.id;

    if (!replyMessage) {
      return res.status(400).json({ error: 'Reply message is required' });
    }

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Update ticket in DB
    ticket.status = 'Closed';
    ticket.adminReply = replyMessage;
    ticket.repliedAt = Date.now();
    await ticket.save();

    // Send reply email to user
    const mailOptions = {
      from: `"CogniVault Support" <${process.env.EMAIL_USER}>`,
      to: ticket.email,
      subject: 'Re: Your Support Query - CogniVault',
      text: `Hello ${ticket.name},\n\nRegarding your recent query:\n"${ticket.message}"\n\n${replyMessage}\n\nBest regards,\nCogniVault Team`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Support Response</h2>
          <p>Hello <strong>${ticket.name}</strong>,</p>
          <p>Regarding your recent query:</p>
          <blockquote style="border-left: 4px solid #e5e7eb; padding-left: 1rem; margin-left: 0; color: #6b7280; font-style: italic;">
            ${ticket.message}
          </blockquote>
          <p style="margin-top: 1.5rem; font-size: 1.1rem;">${replyMessage.replace(/\n/g, '<br/>')}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0;" />
          <p style="font-size: 0.875rem; color: #9ca3af;">Best regards,<br/><strong>CogniVault Support Team</strong></p>
        </div>
      `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending admin reply email:', error);
      }
    });

    res.json({ message: 'Reply sent and ticket closed successfully', ticket });
  } catch (error) {
    console.error('Error replying to ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
