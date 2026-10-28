import axios from 'axios';

const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export const api = axios.create({ baseURL: `${base}/api`, withCredentials: true, timeout: 30000 });

// Backend envelope: { success, data } | { success:false, error:{ message, details } }
api.interceptors.response.use(
  (res) => res.data.data,
  (err) => {
    const body = err.response?.data?.error;
    const e = new Error(
      body?.message ||
        (err.code === 'ECONNABORTED' ? 'The request timed out. Try again.' :
          err.response ? 'Something went wrong. Try again.' : 'Cannot reach the server. Check your connection and that the API is running.'),
    );
    e.status = err.response?.status;
    e.network = !err.response;
    e.details = body?.details;
    e.code = body?.details && !Array.isArray(body.details) ? body.details.code : undefined;
    const url = err.config?.url || '';
    if (e.status === 401 && !url.includes('/auth/')) window.dispatchEvent(new Event('auth:expired'));
    return Promise.reject(e);
  },
);

// Submissions run every test case through Judge0 one by one, so allow a long timeout.
export const SUBMIT_TIMEOUT = 150000;
