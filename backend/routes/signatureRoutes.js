const express = require('express');
const router = express.Router();

// @route   POST /api/signatures/verify
// @desc    Verify document integrity using hashes
// @access  Public
router.post('/verify', async (req, res) => {
  try {
    const { documentId, expectedHash } = req.body;

    if (!documentId || !expectedHash) {
      return res.status(400).json({ error: 'Document ID and expected hash are required' });
    }

    const Document = require('../models/Document');
    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const isValid = document.originalHash === expectedHash;

    res.json({
      documentId: document._id,
      isValid: isValid,
      originalHash: document.originalHash,
      providedHash: expectedHash,
      isSigned: document.isSigned,
      signedHash: document.signedHash
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Failed to verify document' });
  }
});

module.exports = router;
