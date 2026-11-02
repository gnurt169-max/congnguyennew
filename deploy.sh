#!/bin/bash
set -e

echo "=================================================="
echo "🚀 BẮT ĐẦU CẬP NHẬT HỆ THỐNG CÔNG NGUYÊN (DEPLOY)"
echo "=================================================="

# Đảm bảo nạp Node/NPM vào PATH cho VPS / aaPanel / NVM
export PATH=$PATH:/usr/local/bin:/usr/bin:~/.nvm/versions/node/$(ls ~/.nvm/versions/node 2>/dev/null | tail -n 1)/bin

cd "$(dirname "$0")"

echo "🚀 Pulling latest code..."
git pull origin main

echo "📦 Installing packages & generating Prisma..."
npm install
npx prisma generate
npx prisma db push --accept-data-loss

echo "🔄 Syncing database data..."
npm run db:import || npx ts-node apps/backend/scripts/sync-import.ts || npx ts-node prisma/seed.ts || true

echo "🔒 Setting permissions for uploads (755)..."
mkdir -p apps/frontend/public/uploads/products apps/frontend/public/uploads/payment
chmod -R 755 apps/frontend/public/uploads 2>/dev/null || true

echo "🧹 Cleaning previous build cache..."
rm -rf apps/frontend/.next

echo "🏗️ Building Next.js & NestJS..."
npm run build

echo "♻️ Reloading PM2 processes..."
if command -v pm2 &> /dev/null; then
  pm2 reload all || pm2 restart all || pm2 startOrReload ecosystem.config.js
  pm2 save
else
  npx pm2 reload all || npx pm2 restart all || npx pm2 startOrReload ecosystem.config.js
  npx pm2 save
fi

echo "=================================================="
echo "✅ Deployment completed successfully!"
echo "=================================================="
