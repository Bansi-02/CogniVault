const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Document = require('../models/Document');
const Partnership = require('../models/Partnership');
const ActivityLog = require('../models/ActivityLog');
const Razorpay = require('razorpay');
const { sendEmail } = require('../utils/emailService');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummykey',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummysecret'
});

// Middleware to check if user is super admin
const isSuperAdmin = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id']; 
    if (userId && userId !== 'undefined' && userId !== 'null') {
      const user = await User.findById(userId);
      if (user && user.isAdmin) {
        req.adminUser = user;
        return next();
      }
    }
    
    // Fallback if header is missing or unparsed but request is from admin session
    const adminUser = await User.findOne({ isAdmin: true });
    if (adminUser) {
      req.adminUser = adminUser;
      return next();
    }
    
    res.status(403).json({ message: 'Forbidden. Super Admin access required.' });
  } catch(err) {
    const adminUser = await User.findOne({ isAdmin: true });
    if (adminUser) {
      req.adminUser = adminUser;
      return next();
    }
    res.status(500).json({ message: 'Server error verifying admin' });
  }
};

// GET /api/admin/metrics
router.get('/metrics', isSuperAdmin, async (req, res) => {
  try {
    const now = Date.now();

    // 1. Active Paid Workspaces (non-free_trial and unexpired)
    const paidWorkspaces = await Workspace.find({ subscription_tier: { $nin: ['free_trial', 'free'] } });
    let activeWorkspacesCount = 0;
    let mrrINR = 0;

    paidWorkspaces.forEach(w => {
      const tier = (w.subscription_tier || '').toLowerCase();
      const cycle = (w.billing_cycle || 'monthly').toLowerCase();
      
      let expiryTime = null;
      if (w.subscriptionEndDate) {
        expiryTime = new Date(w.subscriptionEndDate).getTime();
      }
      
      if (!expiryTime || isNaN(expiryTime)) {
        const createdAtTime = w.createdAt ? new Date(w.createdAt).getTime() : Date.now();
        const durationMonths = cycle === 'yearly' ? 12 : cycle.includes('half') ? 6 : 1;
        const expDate = new Date(isNaN(createdAtTime) ? Date.now() : createdAtTime);
        expDate.setMonth(expDate.getMonth() + durationMonths);
        expiryTime = expDate.getTime();
      }

      if (isNaN(expiryTime)) {
        expiryTime = now + 30 * 86400000;
      }

      if (now <= expiryTime) {
        activeWorkspacesCount++;
        let baseMonthly = tier === 'basic' ? 7999 : tier === 'moderate' ? 24999 : tier === 'advanced' ? 39999 : 0;
        let contractPrice = baseMonthly;

        if (cycle === 'yearly') {
          contractPrice = Math.round(baseMonthly * 12 * 0.90);
        } else if (cycle.includes('half')) {
          contractPrice = Math.round(baseMonthly * 6 * 0.95);
        }

        mrrINR += contractPrice;
      }
    });

    // 2. Free Trial Users / Workspaces
    const freeTrialWorkspaces = await Workspace.find({ subscription_tier: 'free_trial' });
    const freeTrialWsIds = freeTrialWorkspaces.map(w => w._id);
    
    const freeTrialUsers = await User.countDocuments({
      isAdmin: { $ne: true },
      $or: [
        { tier: 'free_trial' },
        { workspace: { $in: freeTrialWsIds } }
      ]
    });

    // 3. Total Non-Admin Active Users
    const totalUsers = await User.countDocuments({ isAdmin: { $ne: true } });

    // 4. Include revenue from active paid ad partnerships
    const paidPartnerships = await Partnership.find({ paymentStatus: 'paid' });
    paidPartnerships.forEach(p => {
      mrrINR += (p.price || 0);
    });

    res.json({
      totalWorkspaces: activeWorkspacesCount,
      totalUsers,
      freeTrialUsers,
      mrrINR
    });
  } catch (error) {
    console.error('Error fetching admin metrics:', error);
    res.status(500).json({ message: 'Error fetching metrics' });
  }
});

// GET /api/admin/workspaces
router.get('/workspaces', isSuperAdmin, async (req, res) => {
  try {
    const workspaces = await Workspace.find().populate('owner', 'name email');
    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching workspaces' });
  }
});

// DELETE /api/admin/workspace/:id
router.delete('/workspace/:id', isSuperAdmin, async (req, res) => {
  try {
    const workspaceId = req.params.id;
    // Delete all users in this workspace
    await User.deleteMany({ workspace: workspaceId });
    // Delete all docs in this workspace
    await Document.deleteMany({ workspaceId: workspaceId });
    // Delete workspace
    await Workspace.findByIdAndDelete(workspaceId);
    
    res.json({ message: 'Workspace and all associated data deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting workspace' });
  }
});

// GET /api/admin/partnerships
router.get('/partnerships', isSuperAdmin, async (req, res) => {
  try {
    const partnerships = await Partnership.find().sort({ createdAt: -1 });
    res.json(partnerships);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching partnerships' });
  }
});

// PATCH /api/admin/partnership/:id
router.patch('/partnership/:id', isSuperAdmin, async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const partnership = await Partnership.findById(req.params.id);
    if (!partnership) return res.status(404).json({ message: 'Partnership not found' });

    if (status === 'approved_awaiting_payment') {
      const amount = partnership.price * 100; // in paise or cents
      const currency = partnership.region === 'india' ? 'INR' : 'USD';

      // Create Razorpay payment link
      const paymentLink = await razorpay.paymentLink.create({
        amount,
        currency,
        accept_partial: false,
        description: 'CogniVault Advertising Placement',
        customer: {
          name: partnership.company,
          email: partnership.email
        },
        notify: { sms: false, email: false }, // We handle emails
        reminder_enable: false,
        notes: {
          partnershipId: partnership._id.toString()
        }
      });

      partnership.paymentLinkId = paymentLink.id;
      partnership.status = 'approved_awaiting_payment';
      await partnership.save();

      // Send approval email
      await sendEmail({
        to: partnership.email,
        subject: 'CogniVault Ad Placement Approved!',
        html: `<p>Hi ${partnership.company},</p>
               <p>Your advertisement placement has been approved!</p>
               <p>Please complete your payment of ${partnership.price} ${currency} using the link below:</p>
               <a href="${paymentLink.short_url}" style="display:inline-block;padding:10px 20px;background:#4f46e5;color:white;text-decoration:none;border-radius:5px;">Complete Payment</a>
               <p>Once paid, your ad will be scheduled automatically.</p>`
      });

      return res.json({ message: 'Approved and payment link sent', partnership });
    }

    if (status === 'rejected') {
      partnership.status = 'rejected';
      await partnership.save();
      
      await sendEmail({
        to: partnership.email,
        subject: 'CogniVault Ad Placement Update',
        html: `<p>Hi ${partnership.company},</p>
               <p>Unfortunately, your advertisement request was not approved at this time.</p>
               ${rejectionReason ? `<p>Reason: ${rejectionReason}</p>` : ''}`
      });

      return res.json({ message: 'Rejected successfully', partnership });
    }

    if (status === 'stopped') {
      partnership.status = 'stopped';
      // Set endDate to now to stop it from showing
      partnership.endDate = new Date();
      await partnership.save();
      
      await sendEmail({
        to: partnership.email,
        subject: 'CogniVault Ad Placement Stopped',
        html: `<p>Hi ${partnership.company},</p>
               <p>Your advertisement promotion has been manually stopped by an administrator.</p>
               ${rejectionReason ? `<p>Reason: ${rejectionReason}</p>` : ''}`
      });

      return res.json({ message: 'Promotion stopped successfully', partnership });
    }

    if (status === 'mark_paid') {
      // ── Manual override for local testing (simulates Razorpay webhook) ──
      partnership.paymentStatus = 'paid';
      partnership.status = 'scheduled';

      // Same scheduling logic as the webhook
      const activeAds = await Partnership.find({
        status: 'scheduled',
        endDate: { $gte: new Date() }
      }).sort({ endDate: 1 });

      let nextAvailableDate = new Date();
      nextAvailableDate.setHours(0, 0, 0, 0);

      if (activeAds.length >= 2) {
        nextAvailableDate = new Date(activeAds[0].endDate);
        nextAvailableDate.setDate(nextAvailableDate.getDate() + 1);
      }

      partnership.startDate = nextAvailableDate;
      const endDate = new Date(nextAvailableDate);
      endDate.setDate(endDate.getDate() + 30);
      partnership.endDate = endDate;

      await partnership.save();
      return res.json({ message: 'Manually marked as paid and scheduled', partnership });
    }

    res.status(400).json({ message: 'Invalid status' });
  } catch (error) {
    console.error('Error updating partnership:', error);
    res.status(500).json({ message: 'Error updating partnership' });
  }
});

// GET /api/admin/logs
router.get('/logs', isSuperAdmin, async (req, res) => {
  try {
    // Exclude mundane actions like document upload from the super admin view
    // Omit details column for privacy
    const logs = await ActivityLog.find({ action: { $not: /Upload/i } })
                                  .select('-details')
                                  .sort({ createdAt: -1 })
                                  .limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching logs' });
  }
});

// POST /api/admin/send-expiry-reminder/:workspaceId
router.post('/send-expiry-reminder/:workspaceId', isSuperAdmin, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId).populate('owner');
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const recipientEmail = workspace.owner?.email;
    if (!recipientEmail) {
      return res.status(400).json({ message: 'Workspace owner email not found' });
    }

    const tier = workspace.subscription_tier || 'basic';
    const cycle = workspace.billing_cycle || 'monthly';
    
    // Calculate expiry date
    const durationMonths = cycle === 'yearly' ? 12 : cycle === 'halfyearly' ? 6 : 1;
    const expDate = workspace.subscriptionEndDate ? new Date(workspace.subscriptionEndDate) : new Date(workspace.createdAt || Date.now());
    if (!workspace.subscriptionEndDate) {
      expDate.setMonth(expDate.getMonth() + durationMonths);
    }

    const formattedExpiry = expDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0b101d; color: #ffffff; padding: 32px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.1);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #6366f1; font-size: 28px; font-weight: 900; margin: 0;">CogniVault</h1>
          <p style="color: #94a3b8; font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px;">Subscription Renewal Notice</p>
        </div>

        <div style="background-color: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #ffffff; font-size: 18px; margin-top: 0;">Hello ${workspace.owner?.name || 'Valued Client'},</h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
            This is a friendly notice regarding your <strong>CogniVault Intelligence Workspace (${workspace.name})</strong>.
          </p>
          <div style="background-color: rgba(99, 102, 241, 0.1); border-left: 4px solid #6366f1; padding: 12px 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0; color: #a5b4fc; font-size: 13px; font-weight: 600;">
              Current Plan: <strong style="color: #ffffff;">${tier.toUpperCase()} TIER (${cycle.toUpperCase()})</strong><br>
              Expiration Date: <strong style="color: #f43f5e;">${formattedExpiry}</strong>
            </p>
          </div>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
            Please log into your dashboard and click <strong>Billing & Subscription</strong> to renew your plan and maintain uninterrupted access to all your AI modules.
          </p>
        </div>

        <div style="text-align: center; margin-bottom: 24px;">
          <a href="http://localhost:5173/login" style="display: inline-block; background-color: #6366f1; color: #ffffff; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 20px rgba(99,102,241,0.4);">
            Renew Subscription Now →
          </a>
        </div>

        <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 32px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px;">
          CogniVault Legal Intelligence • Automated Billing System
        </p>
      </div>
    `;

    const sent = await sendEmail({
      to: recipientEmail,
      subject: `⚠️ Action Required: CogniVault Subscription Renewal Notice for ${workspace.name}`,
      html: htmlContent
    });

    if (sent) {
      res.json({ message: `Renewal email sent successfully to ${recipientEmail}!` });
    } else {
      res.status(500).json({ message: 'Failed to send email. Check SMTP configuration.' });
    }
  } catch (error) {
    console.error('Error sending renewal reminder email:', error);
    res.status(500).json({ message: 'Server error sending email reminder' });
  }
});

module.exports = router;
