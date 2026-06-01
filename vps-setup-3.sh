#!/bin/bash
set -e

echo "🚀 Memulai Tahap 3: Build & Start PM2..."
cd /var/www/tasktrackerloco

echo "📦 Menginstal dependensi NPM..."
npm install

echo "🛠️ Menyiapkan Prisma & Database..."
npx prisma generate
npx prisma db push

echo "🏗️ Membangun Aplikasi Next.js..."
npm run build

echo "🟢 Menjalankan aplikasi dengan PM2..."
pm2 reload loco21 || pm2 start npm --name "loco21" -- start
pm2 save

echo "✅ Aplikasi berhasil dijalankan!"
echo "Sekarang Anda dapat membuka https://loco21event.com di browser."
