import axios, { AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (username: string, email: string, password: string) => {
    const response = await api.post('/auth/register', {
      username,
      email,
      password
    });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', {
      email,
      password
    });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

// Rooms API
export const roomsAPI = {
  // Créer un salon
  createRoom: async (gameType: 'perudo' | 'codenames' | 'quiz' | 'timebomb', maxPlayers: number, isPrivate: boolean) => {
    const response = await api.post('/rooms', {
      gameType,
      maxPlayers,
      isPrivate
    });
    return response.data;
  },

  // Obtenir la liste des salons publics
  getRooms: async () => {
    const response = await api.get('/rooms');
    return response.data;
  },

  // Obtenir un salon spécifique par code
  getRoomByCode: async (code: string) => {
    const response = await api.get(`/rooms/${code.toUpperCase()}`);
    return response.data;
  },

  // Supprimer un salon (host uniquement)
  deleteRoom: async (code: string) => {
    const response = await api.delete(`/rooms/${code.toUpperCase()}`);
    return response.data;
  }
};

// Health check
export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
