import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'https://hopelink-api.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
});

// Attach Token to Outgoing Requests
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// 👉 THE FIX: Handle Expired Tokens globally and intercept massive UI-breaking errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Session expired or unauthorized. Logging out...");
      // Clear storage and redirect to login to prevent ghost sessions
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    // 👉 THE FIX: Prevent HTML dumps or massive stack traces from breaking `toast.error`
    if (error.response && error.response.data) {
      const data = error.response.data;
      if (typeof data === 'string' && data.length > 150) {
        error.response.data = { message: "Network anomaly detected. Please try again." };
      } else if (data.message && data.message.length > 150) {
        error.response.data.message = "System error. The engineering team has been notified.";
      }
    }

    return Promise.reject(error);
  }
);

export default api;