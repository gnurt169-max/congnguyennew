#!/bin/bash
set -e

echo "🚀 [Deploy Fresh] Bắt đầu quy trình triển khai mới trên VPS..."

echo "📦 1. Cài đặt dependencies (npm install)..."
npm install

echo "🗄️ 2. Sinh Prisma Client & Đồng bộ Database..."
npx prisma generate
npx prisma db push
npx prisma db seed

echo "🏗️ 3. Build Next.js & NestJS..."
npm run build

echo "♻️ 4. Khởi chạy với PM2..."
pm2 restart all || pm2 start ecosystem.config.js
pm2 save

echo "✅ [Deploy Fresh] Triển khai thành công! Website Công Nguyên đã sẵn sàng hoạt động."

