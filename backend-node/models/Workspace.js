const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  subscription_tier: {
    type: String,
    enum: ['free_trial', 'basic', 'moderate', 'advanced', 'custom'],
    default: 'basic'
  },
  billing_cycle: {
    type: String,
    enum: ['monthly', 'halfYearly', 'yearly'],
    default: 'yearly'
  },
  documentsUploaded: {
    type: Number,
    default: 0,
  },
  feature_flags: {
    has_vendor_risk: { type: Boolean, default: false },
    has_fraud_analytics: { type: Boolean, default: false },
    has_global_graph: { type: Boolean, default: false }
  },
  subscriptionEndDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Workspace', workspaceSchema);
