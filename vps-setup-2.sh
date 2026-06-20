#!/bin/bash
set -e

echo "🚀 Memulai Tahap 2: Clone Repo, Setup Nginx, & SSL..."

# 1. Buat direktori dan atur permission
sudo mkdir -p /var/www/tasktrackerloco
sudo chown -R $USER:$USER /var/www/tasktrackerloco

# 2. Clone repository jika belum ada
if [ ! -d "/var/www/tasktrackerloco/.git" ]; then
  git clone https://github.com/Iznsraa03/tasktrackerloco.git /var/www/tasktrackerloco
else
  echo "Repo sudah ada, melakukan git pull..."
  cd /var/www/tasktrackerloco && git pull origin main
fi

cd /var/www/tasktrackerloco

# 3. Buat file .env production
cat <<EOF > .env
DATABASE_URL="mysql://loco21_prod_user:Loco21SecurePassword!@localhost:3306/loco21_prod_db"
MYSQL_HOST="localhost"
MYSQL_PORT=3306
MYSQL_USER="loco21_prod_user"
MYSQL_PASSWORD="Loco21SecurePassword!"
MYSQL_DATABASE="loco21_prod_db"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="Info.loco21pro@gmail.com"
SMTP_PASSWORD="ugja jtgc qsbc fscz"
SMTP_FROM="Locomotive 21 Production <no-reply@loco21event.com>"
NEXT_PUBLIC_APP_URL="https://loco21event.com"
EOF

echo "✅ File .env berhasil dibuat di VPS. (Harap perbarui password Gmail nanti di /var/www/tasktrackerloco/.env)"

# 4. Setup Nginx
NGINX_CONF="/etc/nginx/sites-available/loco21"
sudo bash -c "cat <<'EOF' > $NGINX_CONF
server {
    listen 80;
    server_name loco21event.com www.loco21event.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF"

sudo ln -sf /etc/nginx/sites-available/loco21 /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
echo "✅ Nginx berhasil dikonfigurasi!"

# 5. Pasang SSL dengan Certbot secara non-interaktif
echo "🔒 Memasang sertifikat SSL Let's Encrypt..."
sudo certbot --nginx -d loco21event.com -d www.loco21event.com --non-interactive --agree-tos -m waisalqarni1712@gmail.com || echo "⚠️ Pemasangan SSL gagal atau sudah terpasang. Abaikan jika ini hanya pengujian lokal."

echo "✅ Tahap 2 Selesai!"
