import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
});

// Automatically attach the JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('collabx_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const roomAPI = {
  create: (data) => api.post('/api/rooms/create', data),
  join: (invite_code) => api.post('/api/rooms/join', { invite_code }),
  getMyRooms: () => api.get('/api/rooms/my-rooms'),
  getRoom: (id) => api.get(`/api/rooms/${id}`),
  closeRoom: (id) => api.patch(`/api/rooms/${id}/close`),
  getMessages: (id) => api.get(`/api/rooms/${id}/messages`),
};

export const executionAPI = {
  run: (data) => api.post('/api/execute', data),
};

export const aiAPI = {
  getQuestion: (data) => api.post('/api/ai/question', data),
};

export default api;


//An axios interceptor is a function that runs before every request. Instead of manually adding Authorization: Bearer ... in every component, the interceptor does it automatically. Think of it as a security guard that stamps every outgoing letter before it leaves.