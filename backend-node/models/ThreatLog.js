const mongoose = require('mongoose');

const threatLogSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  vendor: { type: String, required: true },
  location: { type: String, required: true },
  risk: { type: String, enum: ['High', 'Medium', 'Low'], required: true },
  type: { type: String, required: true },
  amount: { type: String },
  date: { type: String, required: true },
  action: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('ThreatLog', threatLogSchema);
