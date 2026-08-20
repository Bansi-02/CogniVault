const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  isTemporaryPassword: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: ['manager', 'member'],
    default: 'manager',
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: false,
  },
  countryCode: {
    type: String,
    default: '+1',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);
