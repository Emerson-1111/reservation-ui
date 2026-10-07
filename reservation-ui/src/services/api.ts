import axios from 'axios';
import type { Appointment } from '../components/AppointmentsList';

const normalizeUrl = (url: string): string => url.replace(/\/+$/, '');

const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5170/api/appointments';
const API_URL = normalizeUrl(RAW_API_URL);
const API_KEY = import.meta.env.VITE_API_KEY?.trim() || undefined;

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    ...(API_KEY ? { 'X-Api-Key': API_KEY } : {}),
  },
});

apiClient.interceptors.request.use((config) => {
  const currentKey = import.meta.env.VITE_API_KEY?.trim();
  if (currentKey && config.headers) {
    config.headers['X-Api-Key'] = currentKey;
  }
  return config;
});

export const getApiUrl = (): string => API_URL;

export const getHubUrl = (): string => {
  return API_URL.replace(/\/api\/appointments\/?$/, '/reservationHub');
};

export const getApiKey = (): string | undefined => API_KEY;

export const appointmentsApi = {
  getAll: () => apiClient.get<Appointment[]>(''),
  create: (data: Omit<Appointment, 'id'>) => apiClient.post<Appointment>('', data),
  delete: (id: number) => apiClient.delete(`/${id}`),
};

export default apiClient;
