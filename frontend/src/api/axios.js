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


// --- Document API calls ---

export const fetchDocuments = (statusFilter = '', page = 1, view = '', office = '') => {
  const params = new URLSearchParams({ page });
  if (statusFilter) params.append('status', statusFilter);
  if (view) params.append('view', view);
  if (office) params.append('office', office);
  return api.get(`/documents/?${params.toString()}`);
};

export const fetchDocumentDetail = (id) => {
  return api.get(`/documents/${id}/`);
};

export const createDocument = (data) => {
  return api.post('/documents/', data);
};

export const transitionDocument = (id, data) => {
  return api.patch(`/documents/${id}/scan/`, data); 
};

export const lookupDocumentByTracking = (trackingNumber) => {
  return api.get(`/documents/track/${trackingNumber}/`);
};


export const fetchDashboardStats = () => api.get('/documents/dashboard-stats/');
export const fetchHeatmapData = () => api.get('/documents/heatmap/');

export const fetchDocumentTypes = () => {
  return api.get('/documents/types/');
};


export const exportDocumentExcel = async (documentId, trackingNumber) => {
  const res = await api.get(`/documents/${documentId}/export/`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${trackingNumber}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};


export const fetchMyDocuments = () => api.get('/documents/my-requests/');

export default api;