// ============================================================
// LOCO 21 PRO — Axios Instance
// Skill: axios (SKILL.md — Custom Instance + Interceptors pattern)
// ============================================================

import axios from 'axios';

/**
 * Axios instance terpusat untuk semua request ke Route Handlers Next.js.
 * baseURL '/api' mengarah ke folder `app/api/*` di Next.js App Router.
 */
export const axiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor ──────────────────────────────────────
// Menyisipkan identitas user (email) ke header untuk keperluan authorisasi backend
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      try {
        const rawEmail = localStorage.getItem('loco21_auth_v1_email');
        if (rawEmail) {
          const email = JSON.parse(rawEmail);
          if (email) {
            config.headers['x-user-email'] = email;
          }
        }
      } catch (err) {
        console.error('[Axios] Error parsing email dari localStorage', err);
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor ─────────────────────────────────────
// Menangani error global secara konsisten di satu tempat
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      console.error(`[API Error] ${status}:`, data?.message ?? data);

      // Auto-redirect ke halaman login jika session expired
      if (status === 401 && typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } else if (error.request) {
      console.error('[Network Error] No response received:', error.request);
    } else {
      console.error('[Request Setup Error]:', error.message);
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
