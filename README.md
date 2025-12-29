# BoloSign - Signature Injection Engine

A professional MERN stack application for injecting signatures into PDF documents with pixel-perfect positioning, responsive coordinate conversion, and comprehensive audit trails.

## 🚀 Features

### Frontend (React.js)
- **PDF Viewer**: High-quality PDF rendering using react-pdf with PDF.js
- **Drag & Drop Interface**: Intuitive field placement with visual feedback
- **Interactive Fields**: 
  - Text boxes with inline editing
  - Signature fields (draw or type)
  - Image placeholders
  - Date selector with calendar input
  - Radio buttons with toggle functionality
- **Coordinate Conversion**: Seamless conversion between browser pixels and PDF points (72 DPI)
- **Responsive Design**: Field positioning maintains accuracy across different screen sizes
- **Signature Capture**: Draw signatures with mouse/touch or type for auto-generation
- **Real-time Notifications**: User-friendly toast notifications for all actions

### Backend (Node.js/Express)
- **PDF Manipulation**: Server-side signature overlay using pdf-lib
- **Aspect Ratio Preservation**: Signatures are contained within fields without distortion
- **Document Storage**: MongoDB integration for document management
- **Audit Trail**: SHA-256 hash calculation for document integrity
- **RESTful API**: Clean endpoints for document operations
- **File Upload**: Secure PDF upload with validation and error handling

### Security & Compliance
- **Document Integrity**: SHA-256 hashing before and after signing
- **Audit Trail**: Complete document history tracking
- **Secure Storage**: Proper file handling and validation
- **Hash Verification**: Compare original and signed document hashes

## 🛠 Technology Stack

### Frontend
- React.js 19+
- Material-UI (MUI) v7 for components
- React PDF for document viewing
- React DnD for drag-and-drop functionality
- Axios for API communication
- PDF.js for PDF rendering

### Backend
- Node.js with Express.js v5
- MongoDB with Mongoose ODM
- pdf-lib for PDF manipulation
- Multer for file uploads
- Crypto for hash calculations

## 📱 Usage Guide

### 1. Upload or Load a PDF
- Click **"Upload PDF"** to upload your own PDF document
- Or click **"Try Sample"** to load a pre-generated sample PDF

### 2. Add Fields to the PDF
- Drag field types from the left sidebar onto the PDF:
  - **Text Box**: For names, addresses, or other text input
  - **Signature**: For drawing or typing signatures
  - **Image**: For photo placeholders
  - **Date**: For date selection
  - **Radio Button**: For yes/no or option selection

### 3. Position and Resize Fields
- **Move**: Click and drag fields to reposition
- **Resize**: Drag the blue circle at the bottom-right corner
- **Remove**: Click the red × button to delete a field

### 4. Fill in Fields
- **Text/Date Fields**: Click to open an input dialog
- **Signature Fields**: Click to open signature modal
  - Tab 1: Draw your signature with mouse/touchpad
  - Tab 2: Type your name for auto-generated signature
- **Radio Buttons**: Click to toggle selected/unselected state

### 5. Sign the Document
- Once all required fields are filled, click **"Sign Document"**
- The signed PDF will be generated with your signature embedded
- Click **"Download Signed PDF"** to download the final document

### 6. Verify Document Integrity
- Original and signed document hashes are stored in MongoDB
- Use the verification endpoint to check document authenticity

## 🎯 Key Technical Features

### 1. Coordinate Conversion System
The application handles the complex conversion between browser pixels and PDF points:
- **Browser**: Uses CSS pixels relative to top-left corner
- **PDF**: Uses points (72 DPI) relative to bottom-left corner
- **Solution**: Normalized coordinates (0-1) that work across any screen size

### 2. Aspect Ratio Preservation
When embedding signatures into PDFs:
- Signatures are contained within the target box
- Original aspect ratio is preserved (no stretching/distortion)
- Centered within the field boundary

### 3. Responsive Field Positioning
Fields maintain their position relative to PDF content across:
- Different screen sizes (mobile, tablet, desktop)
- Browser zoom levels
- PDF rendering scales

### 4. Document Integrity & Audit Trail
- SHA-256 hashing of original PDF before any modifications
- SHA-256 hashing of final signed PDF
- MongoDB storage of both hashes for verification
- Timestamp tracking for all document operations

## 🔒 Security Considerations

- File upload validation (PDF only, 10MB limit)
- SHA-256 cryptographic hashing for document integrity
- Secure file storage with unique filenames
- CORS configuration for API protection
- Input validation on all endpoints

## 📝 Assignment Requirements Checklist

### ✅ Functional Requirements

#### Frontend
- [x] PDF Viewer with react-pdf
- [x] Drag & drop functionality
- [x] Text box field
- [x] Signature field (draw & type)
- [x] Image box field
- [x] Date selector field
- [x] Radio button field
- [x] Resize functionality
- [x] Responsive coordinate system
- [x] Visual field anchoring across screen sizes
- [x] Document signing interface

#### Backend
- [x] Node.js + Express server
- [x] POST /sign-pdf endpoint
- [x] PDF ID, Signature Image, Coordinates handling
- [x] pdf-lib integration for overlay
- [x] Aspect ratio preservation (contain within box)
- [x] Signed PDF URL generation
- [x] MongoDB integration

#### Security
- [x] SHA-256 hash of original PDF
- [x] SHA-256 hash of signed PDF
- [x] Hash storage in MongoDB
- [x] Audit trail functionality

*Demonstrating pixel-perfect PDF signature injection with MERN stack*

### Signature Verification
- `POST /api/signatures/verify` - Verify document integrity

## Key Technical Challenges Solved

### Coordinate System Conversion
- **Problem**: Browsers use CSS pixels (top-left origin), PDFs use points (bottom-left origin, 72 DPI)
- **Solution**: Robust coordinate conversion system with normalization and responsive scaling

### PDF Manipulation
- **Problem**: Maintaining signature position accuracy across different PDF layouts
- **Solution**: Server-side PDF processing with pdf-lib, coordinate transformation, and aspect ratio preservation

### Audit Trail
- **Problem**: Ensuring document integrity and preventing tampering
- **Solution**: SHA-256 hash calculation before/after signing, stored in MongoDB

### Responsive Design
- **Problem**: Field positions changing on different screen sizes
- **Solution**: Normalized coordinate system with viewport-aware positioning

## 🔒 Security Features

- Document hash verification
- Secure file upload validation
- Audit trail logging
- Input sanitization
- CORS configuration

## Future Enhancements

- Multi-page PDF support
- Batch document processing
- Advanced signature verification
- User authentication
- Document templates
- Cloud storage integration
- Advanced PDF annotations

## 📝 License

This project is developed for BoloForms as a demonstration of "signature injection technology".

**Built with ❤️ by Deepesh**#
