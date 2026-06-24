# Panduan Deploy Perubahan Baru ke Server VPS (loco21pro)

Setiap kali Anda membuat perubahan kode di komputer lokal Anda, ikuti 2 langkah mudah ini untuk mengaktifkannya di server live (`loco21pro@103.93.134.61`).

## Langkah 1: Simpan & Push ke GitHub
Di komputer Anda (Terminal lokal), jalankan perintah ini untuk menyimpan pekerjaan Anda dan mengunggahnya ke GitHub:

```bash
git add .
git commit -m "Deskripsi perubahan Anda, misalnya: Update teks assignee"
git push origin main
```

## Langkah 2: Deploy Otomatis ke Server VPS
Setelah sukses di-push ke GitHub, Anda bisa langsung menjalankan 1 baris perintah sakti ini di terminal lokal Anda. Perintah ini akan otomatis mengeksekusi semua yang diperlukan di dalam server VPS Anda secara berurutan.

Silakan salin dan jalankan (bisa juga Anda simpan/alias-kan perintah ini):

```bash
ssh -i /Users/potah/Documents/ssh/loco21pro.pem -o StrictHostKeyChecking=no loco21pro@103.93.134.61 "cd /var/www/tasktrackerloco && git pull origin main && npm install && npx prisma generate && npx prisma db push --accept-data-loss && npm run build && npx pm2 reload loco21"
```

---

### Penjelasan Tahapan yang Terjadi di Server:
1. **`git pull origin main`**: Menarik kode terbaru Anda dari GitHub ke VPS.
2. **`npm install`**: Memastikan semua package/library yang mungkin baru Anda tambahkan (seperti `xlsx`) ikut terinstal di server.
3. **`npx prisma generate` & `db push`**: Memperbarui schema dan tabel database jika ada perubahan struktur.
4. **`npm run build`**: Membangun/meng-compile ulang aplikasi Next.js ke versi *Production* yang paling ringan dan cepat.
5. **`npx pm2 reload loco21`**: Me-*restart* layanan PM2 di server tanpa proses *downtime* (website tidak akan mati saat sedang di-restart) sehingga user tidak akan terganggu.
