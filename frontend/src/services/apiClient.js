import axios from 'axios';

// Backend base URL. To work from phone on LAN set VITE_API_BASE=http://<PC_LAN_IP>:8000
// Fallback: if a public base URL (for frontend) was provided and no API base, try swapping its port to 8000.
let baseURL = import.meta.env.VITE_API_BASE;
if (!baseURL) {
  const fb = import.meta.env.VITE_PUBLIC_BASE_URL;
  if (fb) {
    try {
      const u = new URL(fb);
      u.port = u.port === '3000' ? '8000' : (u.port || '8000');
      baseURL = u.origin + '/';
    } catch { /* ignore */ }
  }
}
if (!baseURL) baseURL = 'http://192.168.1.7:8000/';

export const apiClient = axios.create({
  baseURL,
  // Using JWT Authorization header; credentials/cookies not required and cause CORS complaints if server lacks header
  withCredentials: false
});

apiClient.interceptors.request.use(cfg => {
  // Try multiple common keys so existing auth flow works without refactor
  const token =
    localStorage.getItem('authToken') ||
    localStorage.getItem('access') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Add response interceptor for better error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
