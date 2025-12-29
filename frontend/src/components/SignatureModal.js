import React, { useRef, useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';

const SignatureModal = ({ open, onClose, onSave, field }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState(null);
  const [typedSignature, setTypedSignature] = useState('');
  const [tabValue, setTabValue] = useState(0);

  // Initialize canvas
  useEffect(() => {
    if (open && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [open]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    const signatureImage = canvas.toDataURL('image/png');
    setSignatureData(signatureImage);
    onSave(field.id, signatureImage);
    onClose();
  };

  const handleTypedSave = () => {
    if (typedSignature.trim()) {
      // Create a text-based signature
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Clear canvas and set up text
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = '36px "Brush Script MT", "Lucida Handwriting", cursive';
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedSignature, canvas.width / 2, canvas.height / 2);

      const signatureImage = canvas.toDataURL('image/png');
      setSignatureData(signatureImage);
      onSave(field.id, signatureImage);
      clearCanvas();
      setTypedSignature('');
      onClose();
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    clearCanvas();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          m: { xs: 2, sm: 3 },
          maxWidth: { xs: 'calc(100% - 32px)', sm: '900px' },
          maxHeight: { xs: 'calc(100% - 32px)', sm: '90vh' }
        }
      }}
    >
      <DialogTitle>
        <Typography variant="h6" component="div" sx={{ fontSize: { xs: '1.125rem', md: '1.25rem' } }}>
          {field?.type === 'signature' ? 'Add Your Signature' : 'Add Content'}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="signature tabs"
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                minHeight: { xs: '40px', md: '48px' }
              }
            }}
          >
            <Tab label="Draw Signature" />
            <Tab label="Type Signature" />
          </Tabs>
        </Box>

        {tabValue === 0 && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
              Draw your signature in the box below using your mouse or touchpad
            </Typography>
            <Box sx={{ 
              border: '2px solid',
              borderColor: 'primary.main',
              borderRadius: 1,
              backgroundColor: '#fafafa',
              display: 'inline-block',
              boxShadow: 1,
              width: '100%',
              maxWidth: '500px',
            }}>
              <canvas
                ref={canvasRef}
                width={500}
                height={200}
                style={{
                  cursor: 'crosshair',
                  display: 'block',
                  width: '100%',
                  height: 'auto',
                  maxWidth: '500px'
                }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            </Box>
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button variant="outlined" onClick={clearCanvas} size="small" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                Clear Canvas
              </Button>
            </Box>
          </Box>
        )}

        {tabValue === 1 && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
              Type your full name to generate a signature
            </Typography>
            <TextField
              fullWidth
              placeholder="Enter your full name"
              value={typedSignature}
              onChange={(e) => setTypedSignature(e.target.value)}
              variant="outlined"
              sx={{ 
                mb: 2,
                '& .MuiInputBase-root': {
                  fontSize: { xs: '0.875rem', md: '1rem' }
                }
              }}
            />
            {typedSignature && (
              <Box sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: { xs: 2, md: 3 },
                backgroundColor: '#fafafa',
                textAlign: 'center',
              }}>
                <Typography
                  sx={{
                    fontFamily: '"Brush Script MT", "Lucida Handwriting", cursive',
                    fontSize: { xs: '1.5rem', md: '2rem' },
                    color: 'text.primary',
                  }}
                >
                  {typedSignature}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: { xs: 2, md: 3 }, pb: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
          Cancel
        </Button>
        {tabValue === 0 ? (
          <Button onClick={handleSave} variant="contained" color="primary" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
            Save Drawn Signature
          </Button>
        ) : (
          <Button 
            onClick={handleTypedSave} 
            variant="contained" 
            color="primary"
            disabled={!typedSignature.trim()}
            sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
          >
            Save Typed Signature
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default SignatureModal;
