const mongoose = require('mongoose');

const insiderThreatSchema = new mongoose.Schema({
  workspaceId: { type: String, required: true },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: String,
  userEmail: String,
  action: { type: String, required: true },
  documentCount: { type: Number, required: true },
  timeWindowSeconds: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, default: 'Account Suspended' }
});

module.exports = mongoose.model('InsiderThreat', insiderThreatSchema);
