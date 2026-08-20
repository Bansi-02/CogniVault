const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  workspaceId: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  action: { type: String, required: true }, // e.g., 'Logged In', 'Uploaded File', 'Threat Detected'
  details: { type: String }, // e.g., filename, or threat description
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
