import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LOCO 21 PRO',
    short_name: 'LOCO 21',
    description: 'Sistem Manajemen Tugas Internal',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#D2001A',
    icons: [
      {
        src: '/logo/logo-red-bg.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo/logo-red-bg.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
