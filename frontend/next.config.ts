import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
    ],
  },
  async redirects() {
    // 004-fe-english-routes: permanent VI → EN route rename (static rules first).
    return [
      { source: '/bai-viet/tao-moi', destination: '/articles/new', permanent: true },
      { source: '/bai-viet/:id/chinh-sua', destination: '/articles/:id/edit', permanent: true },
      { source: '/ke-hoach-bua-an/da-luu', destination: '/meal-plans/saved', permanent: true },
      { source: '/video/upload', destination: '/videos/new', permanent: true },
      { source: '/cong-thuc', destination: '/recipes', permanent: true },
      { source: '/cong-thuc/:id', destination: '/recipes/:id', permanent: true },
      { source: '/dang-cong-thuc', destination: '/recipes/new', permanent: true },
      { source: '/bai-viet', destination: '/articles', permanent: true },
      { source: '/bai-viet/:id', destination: '/articles/:id', permanent: true },
      { source: '/video', destination: '/videos', permanent: true },
      { source: '/video/:id', destination: '/videos/:id', permanent: true },
      { source: '/dang-video', destination: '/videos/new', permanent: true },
      { source: '/danh-muc', destination: '/categories', permanent: true },
      { source: '/ban-do', destination: '/restaurants', permanent: true },
      { source: '/ban-do/:id', destination: '/restaurants/:id', permanent: true },
      { source: '/tim-kiem', destination: '/search', permanent: true },
      { source: '/ho-so', destination: '/profile', permanent: true },
      { source: '/ke-hoach-bua-an', destination: '/meal-plans', permanent: true },
      { source: '/tro-ly-ai', destination: '/assistant', permanent: true },
      { source: '/xac-thuc-otp', destination: '/verify-otp', permanent: true },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api/v1'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
