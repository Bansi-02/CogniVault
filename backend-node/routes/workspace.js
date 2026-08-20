const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

function generateRandomPassword() {
  return crypto.randomBytes(6).toString('hex') + "A1!";
}

router.post('/invite', async (req, res) => {
  try {
    const { adminUserId, email } = req.body;
    if (!adminUserId || !email) return res.status(400).json({ message: 'Missing fields' });

    const manager = await User.findById(adminUserId).populate('workspace');
    if (!manager || manager.role !== 'manager' || !manager.workspace) {
      return res.status(403).json({ message: 'Unauthorized. Only managers can invite users.' });
    }

    // Check Seat Limits based on tier
    // Count only active (non-suspended) users — suspended users should not permanently block seats
    const currentMembers = await User.countDocuments({ 
      workspace: manager.workspace._id,
      status: { $ne: 'suspended' }
    });
    let maxSeats = 1; // free_trial: manager only
    if (manager.workspace.subscription_tier === 'basic') maxSeats = 1;
    if (manager.workspace.subscription_tier === 'moderate') maxSeats = 2; // manager + 1 member
    if (manager.workspace.subscription_tier === 'advanced') maxSeats = 3; // manager + 2 members

    if (currentMembers >= maxSeats) {
      return res.status(400).json({ message: `Seat limit reached for ${manager.workspace.subscription_tier} tier (${maxSeats} total seats allowed).` });
    }

    // Check if user already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ message: 'User with this email already exists.' });

    // Generate credentials
    const plainPassword = generateRandomPassword();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    // Create user
    const newUser = new User({
      name: 'Invited Member',
      email: email.toLowerCase(),
      password: hashedPassword,
      isTemporaryPassword: true,
      role: 'member',
      workspace: manager.workspace._id,
    });
    await newUser.save();
    
    // Add to workspace members array
    manager.workspace.members.push(newUser._id);
    await manager.workspace.save();

    // Send Invite Email
    await transporter.sendMail({
      from: `"CogniVault Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `You have been invited to ${manager.workspace.name} on CogniVault`,
      html: `
<div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); padding: 32px 24px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">CogniVault Invite</h1>
  </div>
  <div style="padding: 32px 24px; color: #374151;">
    <h2 style="margin-top: 0; font-size: 20px;">You've been invited!</h2>
    <p>Your team admin has invited you to access their CogniVault workspace.</p>
    <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 20px; border-radius: 8px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${email}</p>
      <p style="margin: 0;"><strong>Temporary Password:</strong> <span style="font-family: monospace; background: #e0e7ff; color: #4338ca; padding: 2px 6px; border-radius: 4px;">${plainPassword}</span></p>
    </div>
    <p>You will be prompted to change this password when you log in.</p>
  </div>
</div>
      `
    });

    res.json({ message: 'User invited successfully' });
  } catch (err) {
    console.error('Invite error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/members/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user || !user.workspace) return res.status(404).json({ message: 'Not found' });
    const members = await User.find({ workspace: user.workspace }).select('-password');
    res.json(members);
  } catch(err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/members/:memberId', async (req, res) => {
  try {
    const { adminUserId } = req.body;
    if (!adminUserId) return res.status(400).json({ message: 'Missing admin ID' });

    const manager = await User.findById(adminUserId).populate('workspace');
    if (!manager || manager.role !== 'manager' || !manager.workspace) {
      return res.status(403).json({ message: 'Unauthorized. Only managers can remove users.' });
    }

    const memberId = req.params.memberId;
    if (memberId === adminUserId) {
      return res.status(400).json({ message: 'Managers cannot remove themselves.' });
    }

    const memberToRemove = await User.findById(memberId);
    if (!memberToRemove || memberToRemove.workspace.toString() !== manager.workspace._id.toString()) {
      return res.status(404).json({ message: 'Member not found in your workspace.' });
    }

    // Delete user
    await User.findByIdAndDelete(memberId);

    // Remove from workspace array
    manager.workspace.members = manager.workspace.members.filter(id => id.toString() !== memberId);
    await manager.workspace.save();

    res.json({ message: 'Member removed successfully.' });
  } catch(err) {
    console.error('Remove member error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
    res.json(workspace);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
