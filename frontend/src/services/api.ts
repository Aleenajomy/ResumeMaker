import axios from 'axios';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setTokens,
} from '../utils/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_PREFIX = `${API_BASE_URL}/api`;

const api = axios.create({
  baseURL: API_PREFIX,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined;

    // Handle 401 errors (token expired)
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          throw new Error('Missing refresh token');
        }

        const response = await axios.post(`${API_PREFIX}/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        setAccessToken(access);

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authService = {
  register: async (username: string, email: string, password: string, password_confirm: string) => {
    const response = await api.post('/auth/register/', { 
      username, 
      email, 
      password, 
      password_confirm 
    });
    return response.data;
  },

  login: async (username: string, password: string) => {
    const response = await axios.post(`${API_PREFIX}/token/`, { username, password });
    setTokens(response.data.access, response.data.refresh);
    return response.data;
  },
  
  logout: () => {
    clearTokens();
  },
};

export const resumeService = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('original_file', file);
    return api.post('/resumes/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  list: () => api.get('/resumes/'),
  get: (id: number) => api.get(`/resumes/${id}/`),
};

export const jobDescriptionService = {
  create: async (title: string, content: string, file?: File) => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    if (file) formData.append('file', file);
    return api.post('/job-descriptions/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  list: () => api.get('/job-descriptions/'),
  get: (id: number) => api.get(`/job-descriptions/${id}/`),
};

export const optimizedResumeService = {
  create: (resumeId: number, jobDescriptionId: number) => 
    api.post('/optimized-resumes/', {
      resume_id: resumeId,
      job_description_id: jobDescriptionId,
    }),
  
  list: () => api.get('/optimized-resumes/'),
  get: (id: number) => api.get(`/optimized-resumes/${id}/`),
};

export const coverLetterService = {
  create: (optimizedResumeId: number) =>
    api.post('/cover-letters/', {
      optimized_resume_id: optimizedResumeId,
    }),
  
  list: () => api.get('/cover-letters/'),
  get: (id: number) => api.get(`/cover-letters/${id}/`),
};

export default api;
