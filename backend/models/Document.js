const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  originalHash: {
    type: String,
    required: true
  },
  signedHash: {
    type: String,
    default: null
  },
  isSigned: {
    type: Boolean,
    default: false
  },
  signedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp before saving (modern async approach)
documentSchema.pre('save', async function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('Document', documentSchema);