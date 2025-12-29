import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

class ApiService {
  async uploadDocument(file) {
    const formData = new FormData();
    formData.append('pdf', file);

    const response = await api.post('/api/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  async signDocument(documentId, signatureData) {
    const response = await api.post(`/api/documents/${documentId}/sign`, signatureData);
    return response.data;
  }

  async getDocument(documentId) {
    const response = await api.get(`/api/documents/${documentId}`);
    return response.data;
  }

  async getAllDocuments() {
    const response = await api.get('/api/documents');
    return response.data;
  }

  async verifyDocument(documentId, expectedHash) {
    const response = await api.post('/api/signatures/verify', {
      documentId,
      expectedHash,
    });
    return response.data;
  }
}

export default new ApiService();
