import React, { useState, useCallback, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Box, Paper, Typography, Button, CircularProgress, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
// CSS imports for react-pdf - these might not be required in newer versions
// import 'react-pdf/dist/Page/AnnotationLayer.css';
// import 'react-pdf/dist/Page/TextLayer.css';
import SignatureModal from './SignatureModal';
import NotificationSnackbar from './NotificationSnackbar';
import { pixelsToNormalized, getPDFDimensions, validateCoordinates, clampCoordinates } from '../utils/coordinateUtils';
import apiService from '../services/api';

// Set up PDF.js worker - use the version bundled with react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Field types that can be dragged onto the PDF
const FIELD_TYPES = {
  TEXT: 'text',
  SIGNATURE: 'signature',
  IMAGE: 'image',
  DATE: 'date',
  RADIO: 'radio'
};

// PDF Drop Zone Component
const PDFDropZone = ({
  pdfFile,
  numPages,
  pageNumber,
  loading,
  droppedFields,
  pdfContainerRef,
  onFieldMove,
  onFieldResize,
  onFieldRemove,
  onFieldClick,
  onLoadSample,
  onDocumentLoadSuccess,
  onDocumentLoadError,
  onFieldDrop
}) => {
  // Handle dropping fields onto PDF - moved here to be within DndProvider context
  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: 'field',
      drop: (item, monitor) => {
        if (!pdfContainerRef.current) return;

        const offset = monitor.getClientOffset();
        const containerRect = pdfContainerRef.current.getBoundingClientRect();

        if (!offset || !containerRect) return;

        // Calculate position relative to PDF container
        const x = offset.x - containerRect.left;
        const y = offset.y - containerRect.top;

        const newField = {
          id: Date.now(),
          type: item.type,
          x: Math.max(0, x),
          y: Math.max(0, y),
          width: 150,
          height: 40,
        };

        // Call the parent's field drop handler
        onFieldDrop(newField);
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
      }),
    }),
    [pdfContainerRef, onFieldDrop]
  );
  return (
    <Box
      ref={(el) => {
        drop(el);
        pdfContainerRef.current = el;
      }}
      sx={{
        flex: 1,
        border: isOver ? '3px dashed #2563eb' : '2px dashed #e2e8f0',
        borderRadius: 2,
        backgroundColor: 'background.paper',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        position: 'relative',
        overflow: 'auto',
        transition: 'all 0.3s ease-in-out',
        boxShadow: isOver ? 'inset 0 0 0 2px rgba(37, 99, 235, 0.1)' : 'none',
        p: { xs: 1, md: 2 },
      }}
    >
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress />
        </Box>
      )}

      {pdfFile && (
        <Box sx={{ 
          position: 'relative',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
        }}>
          <Document
            file={pdfFile}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={<CircularProgress />}
          >
            <Page
              pageNumber={pageNumber}
              scale={1.2}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              width={window.innerWidth > 768 ? undefined : window.innerWidth - 80}
            />
          </Document>

          {/* Render dropped fields */}
          {droppedFields.map((field) => (
            <DroppedField
              key={field.id}
              field={field}
              onMove={onFieldMove}
              onResize={onFieldResize}
              onRemove={onFieldRemove}
              onClick={onFieldClick}
            />
          ))}
        </Box>
      )}

      {!pdfFile && !loading && (
        <Box sx={{
          textAlign: 'center',
          p: { xs: 3, md: 6 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: { xs: 'auto', md: '60vh' },
          minHeight: { xs: '400px', md: '60vh' }
        }}>
          <Box sx={{
            width: { xs: 60, md: 80 },
            height: { xs: 60, md: 80 },
            borderRadius: '50%',
            backgroundColor: 'primary.light',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: { xs: 2, md: 3 },
            opacity: 0.7
          }}>
            <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>📄</Typography>
          </Box>
          <Typography variant="h5" color="text.primary" sx={{ mb: 2, fontWeight: 600, fontSize: { xs: '1.25rem', md: '1.5rem' }, px: 2 }}>
            Ready to Sign Documents
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: { xs: 3, md: 4 }, maxWidth: 400, fontSize: { xs: '0.875rem', md: '1rem' }, px: 2 }}>
            Upload a PDF document and drag signature fields onto it to create a professional signing experience
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', px: 2 }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => document.getElementById('pdf-upload').click()}
              startIcon={<Typography>📎</Typography>}
              sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
            >
              Upload PDF
            </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={onLoadSample}
                    startIcon={<Typography>🎯</Typography>}
                    sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                  >
                    Try Sample
                  </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

// Draggable field component
const DraggableField = ({ type }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'field',
    item: { type },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const getFieldIcon = (type) => {
    switch (type) {
      case FIELD_TYPES.TEXT: return '📝';
      case FIELD_TYPES.SIGNATURE: return '✍️';
      case FIELD_TYPES.IMAGE: return '🖼️';
      case FIELD_TYPES.DATE: return '📅';
      case FIELD_TYPES.RADIO: return '⭕';
      default: return '📄';
    }
  };

  const getFieldLabel = (type) => {
    switch (type) {
      case FIELD_TYPES.TEXT: return 'Text Box';
      case FIELD_TYPES.SIGNATURE: return 'Signature';
      case FIELD_TYPES.IMAGE: return 'Image';
      case FIELD_TYPES.DATE: return 'Date';
      case FIELD_TYPES.RADIO: return 'Radio Button';
      default: return 'Field';
    }
  };

  return (
    <Paper
      ref={drag}
      elevation={1}
      sx={{
        p: { xs: 1.5, md: 2 },
        mb: { xs: 1.5, md: 2 },
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        transition: 'all 0.2s ease-in-out',
        border: '1px solid',
        borderColor: 'divider',
        position: 'relative',
        minHeight: { xs: '60px', md: 'auto' },
        '&:hover': {
          backgroundColor: 'primary.light',
          color: 'white',
          transform: 'translateY(-2px)',
          boxShadow: 3,
        },
        '&:active': {
          cursor: 'grabbing',
        },
      }}
      title="Drag this field onto the PDF"
    >
      <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
        {getFieldIcon(type)} {getFieldLabel(type)}
      </Typography>
      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontSize: { xs: '0.6rem', md: '0.65rem' }, opacity: 0.8 }}>
        Drag to PDF →
      </Typography>
    </Paper>
  );
};

// Dropped field component that appears on the PDF
const DroppedField = ({ field, onMove, onResize, onRemove, onClick }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const fieldRef = useRef(null);

  const handleMouseDown = (e) => {
    if (e.target.className.includes('resize-handle')) {
      setIsResizing(true);
    } else if (!e.target.className.includes('remove-button')) {
      setIsDragging(true);
      const rect = fieldRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
    e.preventDefault();
  };

  const handleMouseMove = useCallback((e) => {
    if (isResizing && fieldRef.current) {
      const containerRect = fieldRef.current.parentElement.getBoundingClientRect();
      const relativeX = e.clientX - containerRect.left;
      const relativeY = e.clientY - containerRect.top;

      const currentRect = fieldRef.current.getBoundingClientRect();
      const newWidth = Math.max(50, relativeX - (currentRect.left - containerRect.left));
      const newHeight = Math.max(30, relativeY - (currentRect.top - containerRect.top));

      onResize(field.id, { width: newWidth, height: newHeight });
    } else if (isDragging) {
      const containerRect = fieldRef.current.parentElement.getBoundingClientRect();
      const newX = e.clientX - containerRect.left - dragOffset.x;
      const newY = e.clientY - containerRect.top - dragOffset.y;

      // Keep field within container bounds
      const maxX = containerRect.width - field.width;
      const maxY = containerRect.height - field.height;

      onMove(field.id, {
        x: Math.max(0, Math.min(maxX, newX)),
        y: Math.max(0, Math.min(maxY, newY))
      });
    }
  }, [isResizing, isDragging, dragOffset, field, onResize, onMove]);

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  React.useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove]);

  const getFieldContent = () => {
    if (field.hasContent && field.content) {
      switch (field.type) {
        case FIELD_TYPES.TEXT:
          return <Typography variant="body2" sx={{ p: 1, fontSize: '0.75rem' }}>{field.content}</Typography>;
        case FIELD_TYPES.SIGNATURE:
          return <img src={field.content} alt="Signature" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />;
        case FIELD_TYPES.IMAGE:
          return <img src={field.content} alt="Uploaded" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />;
        case FIELD_TYPES.DATE:
          return <Typography variant="body2" sx={{ p: 1, fontSize: '0.75rem' }}>{field.content}</Typography>;
        case FIELD_TYPES.RADIO:
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography variant="h5" sx={{ color: field.content === 'selected' ? '#2563eb' : '#9ca3af' }}>
                {field.content === 'selected' ? '⦿' : '○'}
              </Typography>
            </Box>
          );
        default:
          return <Typography variant="body2" sx={{ p: 1 }}>Field</Typography>;
      }
    }

    switch (field.type) {
      case FIELD_TYPES.TEXT:
        return <Typography variant="caption" sx={{ p: 1, color: 'text.secondary' }}>Click to edit text</Typography>;
      case FIELD_TYPES.SIGNATURE:
        return <Typography variant="caption" sx={{ p: 1, color: 'text.secondary' }}>Click to sign</Typography>;
      case FIELD_TYPES.IMAGE:
        return <Typography variant="body2" sx={{ p: 1 }}>📷 Click to add image</Typography>;
      case FIELD_TYPES.DATE:
        return <Typography variant="caption" sx={{ p: 1, color: 'text.secondary' }}>📅 Click to select date</Typography>;
      case FIELD_TYPES.RADIO:
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography variant="h5" sx={{ color: '#9ca3af' }}>○</Typography>
          </Box>
        );
      default:
        return <Typography variant="body2" sx={{ p: 1 }}>Field</Typography>;
    }
  };

  const handleClick = (e) => {
    e.stopPropagation();
    onClick(field);
  };

  return (
    <Paper
      ref={fieldRef}
      elevation={4}
      sx={{ position: 'absolute', left: field.x, top: field.y, width: field.width, height: field.height, backgroundColor: field.hasContent ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.9)', border: field.hasContent ? '2px solid #4caf50' : '2px solid #1976d2', cursor: 'move', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 50, minHeight: 30, zIndex: 10,
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
        },
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {getFieldContent()}

      {/* Resize handle */}
      <Box
        className="resize-handle"
        sx={{ position: 'absolute', bottom: -5, right: -5, width: 10, height: 10, backgroundColor: '#1976d2', cursor: 'nw-resize', borderRadius: '50%',
        }}
      />

      {/* Remove button */}
      <Button
        size="small"
        onClick={() => onRemove(field.id)}
        sx={{ position: 'absolute', top: -10, right: -10, minWidth: 20, width: 20, height: 20, borderRadius: '50%', backgroundColor: '#f44336', color: 'white',
          '&:hover': { backgroundColor: '#d32f2f', },
        }}>
        ×
      </Button>
    </Paper>
  );
};

const PDFViewer = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [droppedFields, setDroppedFields] = useState([]);
  const pdfContainerRef = useRef(null);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [textModalOpen, setTextModalOpen] = useState(false);
  const [selectedField, setSelectedField] = useState(null);
  const [fieldText, setFieldText] = useState('');
  const [uploadedDocumentId, setUploadedDocumentId] = useState(null);
  const [isSigning, setIsSigning] = useState(false);
  const [signedPdfUrl, setSignedPdfUrl] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  const showNotification = (message, severity = 'info') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // Handle PDF load success
  const onDocumentLoadSuccess = ({ numPages }) => {
    console.log('PDF loaded successfully with', numPages, 'pages');
    setNumPages(numPages);
    setLoading(false);
  };

  // Handle PDF load error
  const onDocumentLoadError = (error) => {
    console.error('PDF load error:', error);
    setLoading(false);
    showNotification('Failed to load PDF. Please try uploading a different file.', 'error');
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setLoading(true);
      setPdfFile(null); // Clear existing PDF first
      setDroppedFields([]); // Clear fields
      setSignedPdfUrl(null); // Clear signed PDF
      setNumPages(null); // Reset page count
      setPageNumber(1); // Reset to first page
      
      try {
        const response = await apiService.uploadDocument(file);
        setUploadedDocumentId(response.id);
        setPdfFile(file);
        showNotification('PDF uploaded successfully!', 'success');
      } catch (error) {
        console.error('Upload failed:', error);
        showNotification('Failed to upload document. Please try again.', 'error');
      } finally {
        setLoading(false);
        // Reset the file input to allow re-uploading the same file
        event.target.value = '';
      }
    } else {
      showNotification('Please select a valid PDF file.', 'warning');
      event.target.value = '';
    }
  };

  // Load sample PDF
  const loadSamplePDF = async () => {
    setLoading(true);
    setPdfFile(null); // Clear existing PDF first
    setDroppedFields([]); // Clear fields
    setSignedPdfUrl(null); // Clear signed PDF
    setUploadedDocumentId(null); // Clear document ID
    setNumPages(null); // Reset page count
    setPageNumber(1); // Reset to first page
    
    try {
      // Try to load local sample PDF first
      const response = await fetch('/sample.pdf');
      if (response.ok) {
        const blob = await response.blob();
        const file = new File([blob], 'sample.pdf', { type: 'application/pdf' });
        
        // Just set the PDF file for viewing (don't upload yet)
        setPdfFile(file);
        showNotification('Sample PDF loaded successfully!', 'success');
      } else {
        // Fallback to external PDF
        setPdfFile('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
        showNotification('Loading external sample PDF...', 'info');
      }
    } catch (error) {
      console.error('Failed to load sample PDF:', error);
      // Fallback to external PDF
      setPdfFile('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
      showNotification('Loaded external sample PDF', 'info');
    } finally {
      setLoading(false);
    }
  };

  // Handle field drop from PDFDropZone
  const handleFieldDrop = (newField) => {
    setDroppedFields(prev => [...prev, newField]);
  };

  // Move field
  const handleMoveField = (fieldId, newPosition) => {
    setDroppedFields(prev =>
      prev.map(field =>
        field.id === fieldId
          ? { ...field, ...newPosition }
          : field
      )
    );
  };

  // Resize field
  const handleResizeField = (fieldId, newSize) => {
    setDroppedFields(prev =>
      prev.map(field =>
        field.id === fieldId
          ? { ...field, ...newSize }
          : field
      )
    );
  };

  // Remove field
  const handleRemoveField = (fieldId) => {
    setDroppedFields(prev => prev.filter(field => field.id !== fieldId));
  };

  // Handle field click
  const handleFieldClick = (field) => {
    setSelectedField(field);

    if (field.type === FIELD_TYPES.SIGNATURE) {
      setSignatureModalOpen(true);
    } else if (field.type === FIELD_TYPES.TEXT) {
      setFieldText(field.content || '');
      setTextModalOpen(true);
    } else if (field.type === FIELD_TYPES.DATE) {
      // Set current date as default
      const today = new Date().toISOString().split('T')[0];
      setFieldText(field.content || today);
      setTextModalOpen(true);
    } else if (field.type === FIELD_TYPES.IMAGE) {
      // Trigger file input for image upload
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const imageDataUrl = event.target.result;
            setDroppedFields(prev =>
              prev.map(f =>
                f.id === field.id
                  ? { ...f, content: imageDataUrl, hasContent: true }
                  : f
              )
            );
            showNotification('Image added successfully!', 'success');
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else if (field.type === FIELD_TYPES.RADIO) {
      // Toggle radio button state
      setDroppedFields(prev =>
        prev.map(f =>
          f.id === field.id
            ? { ...f, content: f.content === 'selected' ? 'unselected' : 'selected', hasContent: true }
            : f
        )
      );
    }
  };

  // Save signature
  const handleSaveSignature = (fieldId, signatureImage) => {
    setDroppedFields(prev =>
      prev.map(field =>
        field.id === fieldId
          ? { ...field, content: signatureImage, hasContent: true }
          : field
      )
    );
  };

  // Save text
  const handleSaveText = () => {
    if (selectedField) {
      setDroppedFields(prev =>
        prev.map(field =>
          field.id === selectedField.id
            ? { ...field, content: fieldText, hasContent: true }
            : field
        )
      );
    }
    setTextModalOpen(false);
    setSelectedField(null);
    setFieldText('');
  };

  // Sign document
  const handleSignDocument = async () => {
    // Check if we have a PDF file
    if (!pdfFile) {
      showNotification('Please load or upload a PDF first', 'warning');
      return;
    }

    // Get all fields that have content
    const filledFields = droppedFields.filter(field => field.hasContent);

    if (filledFields.length === 0) {
      showNotification('Please add and fill at least one field', 'warning');
      return;
    }

    // Check if at least one signature field is filled
    const signatureFields = filledFields.filter(field => field.type === FIELD_TYPES.SIGNATURE);
    if (signatureFields.length === 0) {
      showNotification('Please add and fill at least one signature field', 'warning');
      return;
    }

    setIsSigning(true);
    try {
      // If document not uploaded yet, upload it first
      let docId = uploadedDocumentId;
      if (!docId && pdfFile instanceof File) {
        showNotification('Uploading document...', 'info');
        const uploadResponse = await apiService.uploadDocument(pdfFile);
        docId = uploadResponse.id;
        setUploadedDocumentId(docId);
      }

      if (!docId) {
        throw new Error('Please upload a PDF file first (sample PDFs from URLs cannot be signed)');
      }

      // Prepare all fields with their coordinates
      const fieldsData = filledFields.map(field => {
        const coordinates = calculateNormalizedCoordinates(field);
        if (!coordinates) {
          console.warn('Failed to calculate coordinates for field:', field);
          return null;
        }
        
        // Validate and clamp coordinates
        if (!validateCoordinates(coordinates)) {
          const clampedCoordinates = clampCoordinates(coordinates);
          console.warn('Coordinates were out of bounds, clamped to:', clampedCoordinates);
        }

        return {
          type: field.type,
          content: field.content,
          coordinates: clampCoordinates(coordinates),
        };
      }).filter(field => field !== null);

      if (fieldsData.length === 0) {
        throw new Error('Failed to calculate coordinates for fields');
      }

      const response = await apiService.signDocument(docId, {
        fields: fieldsData,
      });

      setSignedPdfUrl(response.signedPdfUrl);
      showNotification('Document signed successfully!', 'success');
    } catch (error) {
      console.error('Signing failed:', error);
      
      // Check for specific error messages
      let errorMessage = 'Failed to sign document. Please try again.';
      
      if (error.response?.data?.error) {
        const backendError = error.response.data.error.toLowerCase();
        if (backendError.includes('already signed')) {
          errorMessage = 'Cannot sign already signed document';
        } else {
          errorMessage = error.response.data.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showNotification(errorMessage, 'error');
    } finally {
      setIsSigning(false);
    }
  };

  // Calculate normalized coordinates for backend
  const calculateNormalizedCoordinates = (field) => {
    if (!pdfContainerRef.current) return null;

    const dimensions = getPDFDimensions(pdfContainerRef.current);
    if (!dimensions?.pdfRect) return null;

    return pixelsToNormalized(
      {
        x: field.x,
        y: field.y,
        width: field.width,
        height: field.height,
      },
      dimensions.pdfRect,
      dimensions.containerRect
    );
  };

  return (
    <DndProvider backend={HTML5Backend} options={{ enableMouseEvents: true }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: '100vh', backgroundColor: 'background.default', backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.15) 1px, transparent 0)', backgroundSize: '20px 20px'}}>
        {/* Sidebar with field types */}
        <Box sx={{ width: { xs: '100%', md: 280 }, maxWidth: '100%', p: { xs: 2, md: 3 }, backgroundColor: 'background.paper', borderRight: { xs: 'none', md: '1px solid' }, borderBottom: { xs: '1px solid', md: 'none' }, borderColor: 'divider', boxShadow: { xs: '0 2px 4px rgba(0,0,0,0.05)', md: '2px 0 4px rgba(0,0,0,0.05)' }, overflowY: 'auto', maxHeight: { xs: '40vh', md: '100vh' }}}>
          <Typography variant="h6" sx={{ mb: 1, fontSize: { xs: '1rem', md: '1.25rem' } }}>
            Form Fields
          </Typography>
          
          {/* Instruction Banner */}
          <Paper sx={{  p: { xs: 1, md: 1.5 }, mb: 2, backgroundColor: '#e3f2fd', border: '1px solid #2196f3'}}>
            <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: '#1565c0', fontSize: { xs: '0.65rem', md: '0.75rem' } }}>
              💡 How to use:
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#1976d2', fontSize: { xs: '0.6rem', md: '0.75rem' } }}>
              1. Load or upload a PDF below
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', color: '#1976d2', fontSize: { xs: '0.6rem', md: '0.75rem' } }}>
              2. <strong>Drag</strong> fields onto the PDF
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', color: '#1976d2', fontSize: { xs: '0.6rem', md: '0.75rem' } }}>
              3. Click fields to fill them
            </Typography>
          </Paper>

          {Object.values(FIELD_TYPES).map((type) => (
            <DraggableField key={type} type={type} />
          ))}

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontSize: { xs: '1rem', md: '1.25rem' } }}>
              PDF Upload
            </Typography>
            <Button variant="outlined" fullWidth onClick={loadSamplePDF} sx={{ mb: 1, fontSize: { xs: '0.75rem', md: '0.875rem' } }} size="small">
              Load Sample PDF
            </Button>
            <input accept="application/pdf" style={{ display: 'none' }} id="pdf-upload" type="file" onChange={handleFileUpload}/>
            <label htmlFor="pdf-upload">
              <Button  variant="outlined"  component="span"  fullWidth size="small" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                Upload PDF
              </Button>
            </label>
          </Box>

          {droppedFields.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                Actions
              </Typography>
              <Button variant="contained" color="primary" fullWidth onClick={handleSignDocument} disabled={isSigning} sx={{ mb: 1, fontSize: { xs: '0.75rem', md: '0.875rem' } }} size="small">
                {isSigning ? 'Signing...' : 'Sign Document'}
              </Button>
              {signedPdfUrl && (
                <Button variant="outlined" color="success" fullWidth component="a" href={`http://localhost:5000${signedPdfUrl}`} target="_blank" rel="noopener noreferrer" size="small" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                  Download Signed PDF
                </Button>
              )}
            </Box>
          )}
        </Box>

        {/* Main PDF viewer area */}
        <Box sx={{ flex: 1, p: { xs: 2, md: 3 }, display: 'flex', flexDirection: 'column', minHeight: { xs: '60vh', md: 'auto' } }}>
          {/* Header */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: { xs: 2, md: 3 }, pb: 2, borderBottom: '1px solid', borderColor: 'divider', gap: { xs: 1, sm: 0 }}}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 0.5, fontSize: { xs: '1.5rem', md: '2rem' } }}>
                BoloSign
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                Professional PDF Signature Engine
              </Typography>
            </Box>
            {numPages && (
              <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                <Typography variant="body1" sx={{ fontWeight: 500, fontSize: { xs: '0.875rem', md: '1rem' } }}>
                  Page {pageNumber} of {numPages}
                </Typography>
                {uploadedDocumentId && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }}>
                    Document ID: {uploadedDocumentId.slice(-8)}
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          <PDFDropZone pdfFile={pdfFile} numPages={numPages} pageNumber={pageNumber} loading={loading} droppedFields={droppedFields} pdfContainerRef={pdfContainerRef} onFieldMove={handleMoveField} onFieldResize={handleResizeField} onFieldRemove={handleRemoveField} onFieldClick={handleFieldClick} onLoadSample={loadSamplePDF} onDocumentLoadSuccess={onDocumentLoadSuccess} onDocumentLoadError={onDocumentLoadError} onFieldDrop={handleFieldDrop}/>

          {numPages && numPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 1 }}>
              <Button variant="outlined" disabled={pageNumber <= 1} onClick={() => setPageNumber(prev => prev - 1)} size="small" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' }, minWidth: { xs: '80px', md: '100px' } }}>
                Previous
              </Button>
              <Button variant="outlined" disabled={pageNumber >= numPages} onClick={() => setPageNumber(prev => prev + 1)} size="small" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' }, minWidth: { xs: '80px', md: '100px' } }}>
                Next
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* Signature Modal */}
      <SignatureModal open={signatureModalOpen} onClose={() => setSignatureModalOpen(false)} onSave={handleSaveSignature} field={selectedField}/>

      {/* Text Input Modal */}
      <Dialog open={textModalOpen} onClose={() => setTextModalOpen(false)} maxWidth="sm" fullWidth fullScreen={false}
        PaperProps={{
          sx: {
            m: { xs: 2, sm: 3 },
            maxWidth: { xs: 'calc(100% - 32px)', sm: '600px' }
          }
        }}
      >
        <DialogTitle sx={{ fontSize: { xs: '1.125rem', md: '1.25rem' } }}>
          {selectedField?.type === FIELD_TYPES.DATE ? 'Select Date' : 'Edit Text Field'}
        </DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label={selectedField?.type === FIELD_TYPES.DATE ? 'Date' : 'Text Content'} fullWidth variant="outlined" value={fieldText} onChange={(e) => setFieldText(e.target.value)} type={selectedField?.type === FIELD_TYPES.DATE ? 'date' : 'text'} multiline={selectedField?.type !== FIELD_TYPES.DATE} rows={selectedField?.type === FIELD_TYPES.DATE ? 1 : 3} InputLabelProps={selectedField?.type === FIELD_TYPES.DATE ? { shrink: true } : {}}
            sx={{
              '& .MuiInputBase-root': {
                fontSize: { xs: '0.875rem', md: '1rem' }
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, md: 3 }, gap: 1 }}>
          <Button onClick={() => setTextModalOpen(false)} sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>Cancel</Button>
          <Button onClick={handleSaveText} variant="contained" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <NotificationSnackbar open={notification.open} message={notification.message} severity={notification.severity} onClose={handleCloseNotification}/>
    </DndProvider>
  );
};

export default PDFViewer;