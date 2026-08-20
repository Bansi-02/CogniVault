const mongoose = require('mongoose');

const partnershipSchema = new mongoose.Schema({
  company: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  budget: {
    type: String,
    required: false
  },
  placement: {
    type: String,
    required: false
  },
  bannerPath: {
    type: String,
    required: false
  },
  region: {
    type: String,
    enum: ['india', 'international'],
    required: false
  },
  price: {
    type: Number,
    required: false
  },
  paymentLinkId: {
    type: String,
    required: false
  },
  paymentStatus: {
    type: String,
    enum: ['waiting', 'paid'],
    default: 'waiting'
  },
  startDate: {
    type: Date,
    required: false
  },
  endDate: {
    type: Date,
    required: false
  },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'approved_awaiting_payment', 'scheduled', 'rejected', 'expired']
  }
}, { timestamps: true });

module.exports = mongoose.model('Partnership', partnershipSchema);
