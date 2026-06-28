import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach access token to every outgoing request, if we have one
api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('access_token');
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// If a request fails because the access token expired (401),
// try to refresh it once, then retry the original request.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/accounts/login/refresh/`, {
            refresh: refreshToken,
          });
          localStorage.setItem('access_token', res.data.access);
          originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
          return api(originalRequest); // retry the original failed request
        } catch (refreshError) {
          // refresh token itself is invalid/expired -> force logout
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);


// --- User Management API calls ---

export const fetchUsers = (role = 'citizen', status = '', page = 1) => {
  const params = new URLSearchParams({ role, page });
  if (status) params.append('status', status);
  return api.get(`/accounts/users/?${params.toString()}`);
};

export const createEmployee = (data) => {
  return api.post('/accounts/users/create-employee/', data);
};

export const toggleUserActive = (userId) => {
  return api.patch(`/accounts/users/${userId}/toggle-active/`);
};

export const fetchOfficials = () => {
  return api.get('/accounts/officials/');
};

export const updateUser = (userId, data) => {
  return api.patch(`/accounts/users/${userId}/update/`, data);
};


export default api;