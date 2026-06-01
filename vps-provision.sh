#!/bin/bash

# Pastikan script berhenti jika ada error
set -e

echo "🚀 Memulai instalasi otomatis VPS LOCO 21..."

# 1. Update sistem dan install dependencies dasar
echo "📦 Menginstal dependensi sistem (Nginx, Git, Certbot)..."
sudo apt update && sudo apt upgrade -y
sudo apt install nginx git curl certbot python3-certbot-nginx -y

# 2. Install Node.js 20 & PM2
echo "🟢 Menginstal Node.js 20 & PM2..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

# 3. Install MariaDB
echo "🗄️ Menginstal MariaDB Server..."
sudo apt install mariadb-server -y

# 4. Setup Database
echo "🔑 Membuat Database Produksi..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS loco21_prod_db;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'loco21_prod_user'@'localhost' IDENTIFIED BY 'Loco21SecurePassword!';"
sudo mysql -e "GRANT ALL PRIVILEGES ON loco21_prod_db.* TO 'loco21_prod_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

echo "✅ Instalasi Tahap 1, 2, dan 3 Selesai!"
echo "Database yang dibuat: loco21_prod_db"
echo "User: loco21_prod_user"
echo "Password: Loco21SecurePassword!"
