module.exports = {
  apps: [
    {
      name: 'congnguyen-backend',
      cwd: './apps/backend',
      script: 'dist/src/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
    },
    {
      name: 'congnguyen-frontend',
      cwd: './apps/frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_PUBLIC_API_URL: '/api/v1',
        INTERNAL_API_URL: 'http://127.0.0.1:4000/api/v1',
        BACKEND_API_URL: 'http://127.0.0.1:4000/api/v1',
      },
    },
  ],
};

