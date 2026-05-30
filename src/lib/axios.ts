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
// Menyisipkan session token ke header Authorization secara otomatis
// (Uncomment setelah NextAuth selesai dikonfigurasi)
axiosInstance.interceptors.request.use(
  (config) => {
    // const token = ...getSession...
    // if (token) config.headers.Authorization = `Bearer ${token}`;
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
