import React from 'react';
import { Snackbar, Alert } from '@mui/material';

const NotificationSnackbar = ({ open, message, severity = 'info', onClose }) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert onClose={onClose} severity={severity} sx={{ width: '100%' }} variant="filled">
        {message}
      </Alert>
    </Snackbar>
  );
};

export default NotificationSnackbar;
