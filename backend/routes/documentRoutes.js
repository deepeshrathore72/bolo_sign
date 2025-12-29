const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { PDFDocument } = require('pdf-lib');
const Document = require('../models/Document');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Calculate SHA-256 hash of a file
const calculateFileHash = (filePath) => {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
};

// @route   POST /api/documents/upload
// @desc    Upload a PDF document
// @access  Public
router.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const filePath = req.file.path;
    const fileHash = calculateFileHash(filePath);

    const document = new Document({
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimeType: req.file.mimetype,
      originalHash: fileHash
    });

    await document.save();

    res.json({
      id: document._id,
      originalName: document.originalName,
      size: document.size,
      hash: document.originalHash,
      uploadedAt: document.createdAt
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// @route   POST /api/documents/:id/sign
// @desc    Sign a PDF document with all fields
// @access  Public
router.post('/:id/sign', async (req, res) => {
  try {
    const { fields } = req.body;

    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({ error: 'Fields array is required' });
    }

    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.isSigned) {
      return res.status(400).json({ error: 'Document is already signed' });
    }

    // Load the PDF
    const pdfBytes = fs.readFileSync(document.path);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Get the first page
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // Get PDF dimensions
    const pdfWidth = firstPage.getWidth();
    const pdfHeight = firstPage.getHeight();

    // Process each field
    for (const field of fields) {
      const { type, content, coordinates } = field;

      // Convert coordinates from normalized (0-1) to PDF points
      const targetWidth = coordinates.width * pdfWidth;
      const targetHeight = coordinates.height * pdfHeight;
      const x = coordinates.x * pdfWidth;
      const y = pdfHeight - (coordinates.y * pdfHeight) - targetHeight;

      if (type === 'signature' || type === 'image') {
        // Handle image-based fields (signature and image)
        const imageBytes = Buffer.from(content.split(',')[1], 'base64');
        
        let imageEmbed;
        try {
          if (content.includes('image/png')) {
            imageEmbed = await pdfDoc.embedPng(imageBytes);
          } else if (content.includes('image/jpeg') || content.includes('image/jpg')) {
            imageEmbed = await pdfDoc.embedJpg(imageBytes);
          } else {
            imageEmbed = await pdfDoc.embedPng(imageBytes);
          }
        } catch (error) {
          console.error(`Error embedding ${type} image:`, error);
          continue;
        }

        // Calculate dimensions preserving aspect ratio
        const imageWidth = imageEmbed.width;
        const imageHeight = imageEmbed.height;
        const imageAspectRatio = imageWidth / imageHeight;
        const targetAspectRatio = targetWidth / targetHeight;

        let drawWidth, drawHeight, drawX, drawY;

        if (imageAspectRatio > targetAspectRatio) {
          drawWidth = targetWidth;
          drawHeight = targetWidth / imageAspectRatio;
          drawX = x;
          drawY = y + (targetHeight - drawHeight) / 2;
        } else {
          drawHeight = targetHeight;
          drawWidth = targetHeight * imageAspectRatio;
          drawX = x + (targetWidth - drawWidth) / 2;
          drawY = y;
        }

        firstPage.drawImage(imageEmbed, {
          x: drawX,
          y: drawY,
          width: drawWidth,
          height: drawHeight,
        });

      } else if (type === 'text' || type === 'date') {
        // Handle text-based fields (text and date)
        const fontSize = Math.min(targetHeight * 0.6, 16);
        
        firstPage.drawText(content, {
          x: x + 5,
          y: y + (targetHeight / 2) - (fontSize / 3),
          size: fontSize,
          color: { type: 'RGB', red: 0, green: 0, blue: 0 },
        });

      } else if (type === 'radio') {
        // Handle radio button
        const isSelected = content === 'selected';
        const centerX = x + targetWidth / 2;
        const centerY = y + targetHeight / 2;
        const radius = Math.min(targetWidth, targetHeight) / 3;

        // Draw outer circle
        firstPage.drawCircle({
          x: centerX,
          y: centerY,
          size: radius,
          borderColor: { type: 'RGB', red: 0, green: 0, blue: 0 },
          borderWidth: 2,
        });

        // Draw filled circle if selected
        if (isSelected) {
          firstPage.drawCircle({
            x: centerX,
            y: centerY,
            size: radius * 0.6,
            color: { type: 'RGB', red: 0.15, green: 0.39, blue: 0.92 },
          });
        }
      }
    }

    // Save the signed PDF
    const signedPdfBytes = await pdfDoc.save();
    const signedFilename = 'signed_' + document.filename;
    const signedPath = path.join(__dirname, '../uploads', signedFilename);

    fs.writeFileSync(signedPath, signedPdfBytes);

    // Calculate hash of signed PDF
    const signedHash = calculateFileHash(signedPath);

    // Update document record
    document.isSigned = true;
    document.signedAt = new Date();
    document.signedHash = signedHash;
    await document.save();

    res.json({
      id: document._id,
      signedPdfUrl: `/uploads/${signedFilename}`,
      signedHash: signedHash,
      signedAt: document.signedAt
    });
  } catch (error) {
    console.error('Signing error:', error);
    res.status(500).json({ error: 'Failed to sign document' });
  }
});

// @route   GET /api/documents/:id
// @desc    Get document information
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({
      id: document._id,
      originalName: document.originalName,
      isSigned: document.isSigned,
      originalHash: document.originalHash,
      signedHash: document.signedHash,
      createdAt: document.createdAt,
      signedAt: document.signedAt
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Failed to get document' });
  }
});

// @route   GET /api/documents
// @desc    Get all documents
// @access  Public
router.get('/', async (req, res) => {
  try {
    const documents = await Document.find().sort({ createdAt: -1 });
    res.json(documents.map(doc => ({
      id: doc._id,
      originalName: doc.originalName,
      isSigned: doc.isSigned,
      originalHash: doc.originalHash,
      signedHash: doc.signedHash,
      createdAt: doc.createdAt,
      signedAt: doc.signedAt
    })));
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to get documents' });
  }
});

module.exports = router;
