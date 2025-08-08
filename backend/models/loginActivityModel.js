const mongoose = require('mongoose');

const loginActivitySchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    deviceName: {
      type: String,
      required: true,
    },
    browser: {
      type: String,
      required: true,
    },
    os: {
      type: String,
      required: true,
    },
    ip: {
      type: String,
    },
    location: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const LoginActivity = mongoose.model('LoginActivity', loginActivitySchema);

module.exports = LoginActivity;
