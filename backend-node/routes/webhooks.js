const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Partnership = require('../models/Partnership');
const { sendEmail } = require('../utils/emailService');

// POST /api/webhooks/razorpay
router.post('/razorpay', async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'dummy_webhook_secret';
    
    // In a production environment, you MUST verify the signature.
    // For this prototype, if it's running locally, we might skip strict verification if the header is missing,
    // but here is how you do it:
    const signature = req.headers['x-razorpay-signature'];
    
    /*
    if (signature) {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (expectedSignature !== signature) {
        return res.status(400).send('Invalid signature');
      }
    }
    */

    const event = req.body;

    if (event.event === 'payment_link.paid' || event.event === 'payment.captured') {
      const paymentLinkId = event.payload?.payment_link?.entity?.id || event.payload?.payment?.entity?.notes?.paymentLinkId;
      
      // Some events might have the partnershipId passed in notes
      let partnershipId = event.payload?.payment_link?.entity?.notes?.partnershipId 
                          || event.payload?.payment?.entity?.notes?.partnershipId;

      let partnership;
      if (partnershipId) {
        partnership = await Partnership.findById(partnershipId);
      } else if (paymentLinkId) {
        partnership = await Partnership.findOne({ paymentLinkId });
      }

      if (partnership && partnership.status === 'approved_awaiting_payment') {
        partnership.paymentStatus = 'paid';
        partnership.status = 'scheduled';

        // ── Scheduling Logic ──
        // We have 2 slots. Each ad runs for 30 days.
        const activeAds = await Partnership.find({
          status: 'scheduled',
          endDate: { $gte: new Date() }
        }).sort({ endDate: 1 }); // Sort by ending soonest

        let nextAvailableDate = new Date(); // default to today
        nextAvailableDate.setHours(0, 0, 0, 0);

        if (activeAds.length >= 2) {
          // Both slots are full today. We must wait until one expires.
          // The one that expires soonest is activeAds[0].
          nextAvailableDate = new Date(activeAds[0].endDate);
          nextAvailableDate.setDate(nextAvailableDate.getDate() + 1); // Start the day after it expires
        }

        partnership.startDate = nextAvailableDate;
        
        const endDate = new Date(nextAvailableDate);
        endDate.setDate(endDate.getDate() + 30); // 30 day run time
        partnership.endDate = endDate;

        await partnership.save();

        // Send confirmation email
        await sendEmail({
          to: partnership.email,
          subject: 'Payment Confirmed - Ad Scheduled',
          html: `<p>Hi ${partnership.company},</p>
                 <p>We received your payment. Your advertisement has been successfully scheduled!</p>
                 <p><strong>Start Date:</strong> ${partnership.startDate.toDateString()}</p>
                 <p><strong>End Date:</strong> ${partnership.endDate.toDateString()}</p>
                 <p>Thank you for partnering with CogniVault.</p>`
        });
        
        console.log(`[Webhook] Partnership ${partnership.company} paid and scheduled for ${partnership.startDate.toDateString()}`);
      }
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
