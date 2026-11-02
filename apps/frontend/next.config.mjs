/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'congnguyen.com.vn',
      },
      {
        protocol: 'https',
        hostname: 'www.congnguyen.com.vn',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
    ],
  },
  async rewrites() {
    const rawBackendUrl =
      process.env.INTERNAL_API_URL ||
      process.env.BACKEND_API_URL ||
      'http://127.0.0.1:4000';
    const backendInternalUrl = rawBackendUrl.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');

    return [
      {
        source: '/thu-mua-may-cu',
        destination: '/thanh-ly',
      },
      {
        source: '/tra-cuu-tien-do',
        destination: '/tracking',
      },
      {
        source: '/api/settings/menu',
        destination: `${backendInternalUrl}/api/v1/settings/navigation`,
      },
      {
        source: '/api/settings/:path*',
        destination: `${backendInternalUrl}/api/v1/settings/:path*`,
      },
      {
        source: '/api/v1/:path*',
        destination: `${backendInternalUrl}/api/v1/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backendInternalUrl}/uploads/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https: http:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http:",
              "connect-src 'self' https://congnguyen.com.vn https://*.congnguyen.com.vn http://localhost:4000 http://127.0.0.1:4000 https://generativelanguage.googleapis.com https://*.momo.vn https://*.vietqr.io",
              "frame-src 'self' https://*.momo.vn",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
