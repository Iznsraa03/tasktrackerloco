# 📊 LOCO 21 PRO — Analisis Arsitektur & Dokumentasi Proyek

Dokumen ini berisi analisis mendalam tentang **LOCO 21 PRO**, sebuah sistem manajemen tugas (*task tracking*) internal yang dirancang dengan sistem penilaian performa karyawan (KPI) berbasis gamifikasi. Dokumen ini mencakup analisis fitur, panduan setup, arsitektur teknis, serta cara melakukan migrasi database dan pengisian data awal (*seeding*).

---

## 📂 Daftar Isi
1. [Ringkasan Proyek & Fitur Utama](#1-ringkasan-proyek--fitur-utama)
   - [Akses Kontrol Berbasis Peran (RBAC)](#akses-kontrol-berbasis-peran-rbac)
   - [Fitur Utama & Penjelasan](#fitur-utama--penjelasan)
   - [Algoritma Perhitungan Skor KPI](#algoritma-perhitungan-skor-kpi)
2. [Panduan Setup & Konfigurasi](#2-panduan-setup--konfigurasi)
   - [Prasyarat Sistem](#prasyarat-sistem)
   - [Konfigurasi Environment Variables (`.env`)](#konfigurasi-environment-variables-env)
   - [Langkah Pemasangan (Installation Steps)](#langkah-pemasangan-installation-steps)
3. [Migrasi Database & Seeding](#3-migrasi-database--seeding)
   - [Migrasi Database (Prisma Migrate)](#migrasi-database-prisma-migrate)
   - [Proses Pengisian Data Awal (Seeding)](#proses-pengisian-data-awal-seeding)
   - [Daftar Akun Hasil Seeding untuk Pengujian](#daftar-akun-hasil-seeding-untuk-pengujian)
4. [Arsitektur Teknis & Struktur Folder](#4-arsitektur-teknis--struktur-folder)
   - [Penerapan Atomic Design](#penerapan-atomic-design)
   - [Struktur Direktori Proyek](#struktur-direktori-proyek)

---

## 1. Ringkasan Proyek & Fitur Utama

**LOCO 21 PRO** adalah aplikasi web berbasis *Single Page Application* (SPA) yang dibangun menggunakan **Next.js 16** (App Router), **Tailwind CSS v4**, dan **Prisma ORM** dengan database **MariaDB/MySQL**. Proyek ini dirancang secara khusus untuk memantau produktivitas tim, koordinasi proyek antar-divisi, serta memberikan metrik penilaian objektif (KPI Score) bagi setiap karyawan.

### Akses Kontrol Berbasis Peran (RBAC)

Aplikasi ini membagi hak akses ke dalam 3 tingkat peran utama:

| Peran | Deskripsi Hak Akses / Otorisasi |
| :--- | :--- |
| **Admin** | Memiliki kontrol penuh atas seluruh sistem. Dapat mengelola data karyawan (tambah/edit/hapus/aktifkan), proyek, dan membuat tugas (*tasks*) untuk seluruh divisi. |
| **Manager** | Memiliki akses kontrol yang difilter khusus untuk divisinya sendiri. Dapat menyetujui (*approve*) atau meminta revisi (*revise*) tugas yang diselesaikan oleh staf di dalam divisinya. |
| **Karyawan** | Dapat melihat daftar tugas pribadi (sebagai pelaksana utama maupun partner), memperbarui status tugas menjadi *In Progress*, mengirimkan hasil kerja (*result link/file*), dan memantau skor KPI pribadi secara real-time. |

---

### Fitur Utama & Penjelasan

#### 1. Manajemen Tugas Interaktif (*Advanced Task Flow*)
Tugas mengalir melalui status siklus hidup yang terstruktur:
$$\text{To Do} \longrightarrow \text{In Progress} \longrightarrow \text{Done} \longrightarrow \text{Approved / Revisi}$$
Setiap perubahan status memiliki ketentuan:
- Mengubah tugas ke status **Done** mewajibkan karyawan mengunggah bukti hasil kerja (berupa tautan dokumen/desain atau nama berkas eksternal).
- Jika hasil kerja dinilai kurang maksimal oleh Manager/Admin, tugas dapat dialihkan ke status **Revisi** dengan menyertakan catatan revisi khusus. Sistem akan otomatis melacak riwayat revisi tersebut ke tabel database `task_revisions` dan menambah jumlah *revisionCount*.

#### 2. Sistem Approval Kolaboratif (*Smart Approval Routing*)
Aplikasi ini memiliki logika canggih untuk menyetujui tugas berdasarkan **Task Type**:
- **Support Task**: Memerlukan persetujuan dari Manager Divisi tempat partner yang ditunjuk bernaung.
- **Collaboration Task**: Memerlukan persetujuan ganda (*dual-approval*) dari Manager divisi pelaksana utama dan divisi partner sebelum status tugas resmi menjadi *Approved*.
- **Core & Improvement Task**: Dapat langsung disetujui oleh Manager divisi pelaksana atau Admin.

#### 3. Dasbor KPI & Gamifikasi Performa (*KPI Dashboard*)
Menyajikan visualisasi skor kontribusi masing-masing karyawan secara dinamis berdasarkan data performa kerja nyata. Dasbor menampilkan daftar kontributor terbaik (*Top Contributors*) untuk memotivasi anggota tim lainnya.

#### 4. Kalender Tenggat Waktu (*Interactive Calendar Views*)
Menyediakan visualisasi kalender bulanan yang responsif dalam dua mode:
- **Task Calendar**: Memetakan batas waktu penyelesaian tugas masing-masing karyawan.
- **Project Calendar**: Menampilkan rentang durasi proyek klien dari tanggal mulai hingga selesai.

#### 5. Manajemen Proyek & Status Achiever (*Project Progress Tracking*)
Memungkinkan pelacakan kemajuan proyek klien. Setiap halaman detail proyek dilengkapi diagram persentase penyelesaian tugas, daftar tugas aktif, serta identifikasi otomatis peraih kontribusi tertinggi dan terendah (*Top & Bottom Achiever*) dalam proyek tersebut.

#### 6. Notifikasi Kontekstual Real-time (*In-App Notifications*)
Menyediakan sistem notifikasi pintar di sudut kanan atas header aplikasi:
- Karyawan menerima notifikasi instan jika ada tugas mereka yang dipindahkan ke status **Revisi** lengkap dengan catatan perbaikan.
- Manager menerima notifikasi jika ada anggota staf divisinya yang menyelesaikan tugas dan membutuhkan persetujuan (*need approval*).
- Mengeklik notifikasi akan mengarahkan pengguna secara otomatis ke tugas target terkait.

---

### Algoritma Perhitungan Skor KPI

Skor KPI dihitung secara otomatis menggunakan fungsi murni pada modul `src/lib/kpi.ts`. Penilaian didasarkan pada 5 parameter utama dengan bobot masing-masing sebagai berikut:

1. **Productivity (Bobot 40%)**
   $$Productivity = \min\left(10, \frac{\text{Tugas Disetujui}}{\text{Total Tugas}} \times 10\right)$$
2. **Quality (Bobot 20%)**
   $$Quality = \max\left(1, 10 - \frac{\text{Total Revisi}}{\text{Tugas Disetujui}}\right)$$
   *(Setiap revisi mengurangi nilai kualitas, dengan nilai minimum batas bawah sebesar 1).*
3. **Discipline (Bobot 30%)**
   $$Discipline = \frac{\text{Tugas Tepat Waktu}}{\text{Tugas Disetujui}} \times 10$$
   *(Tepat waktu dinilai jika tanggal penyelesaian `completedAt` kurang dari atau sama dengan deadline `date`).*
4. **Teamwork (Bobot 5%)**
   $$Teamwork = \frac{\text{Tugas Support/Kolaborasi yang Disetujui}}{\text{Total Tugas Support/Kolaborasi}} \times 10$$
5. **Initiative (Bobot 5%)**
   $$Initiative = \frac{\text{Tugas Improvement yang Disetujui}}{\text{Total Tugas Improvement}} \times 10$$

#### Rumus Akhir Skor KPI & Persentase Capaian:
$$\text{KPI Score} = (\text{Productivity} \times 0.4) + (\text{Quality} \times 0.2) + (\text{Discipline} \times 0.3) + (\text{Teamwork} \times 0.05) + (\text{Initiative} \times 0.05)$$
$$\text{Capaian (\%)} = \text{KPI Score} \times 10$$

> [!NOTE]
> **Aturan Roll-Over Periode Kerja:**
> Proyek ini menerapkan kebijakan operasional khusus. Tugas yang diselesaikan antara **tanggal 1 hingga tanggal 4** di awal bulan akan otomatis dimasukkan ke dalam periode perhitungan KPI **bulan sebelumnya** untuk mengakomodasi tenggat waktu pelaporan bulanan.

---

## 2. Panduan Setup & Konfigurasi

### Prasyarat Sistem
Sebelum memulai instalasi, pastikan lingkungan lokal Anda telah memenuhi persyaratan berikut:
- **Node.js**: Versi 18.0.0 atau yang lebih baru.
- **Package Manager**: NPM (bawaan Node.js) atau Yarn/PNPM.
- **Database**: MariaDB Server atau MySQL Server (Versi 10.4+ untuk MariaDB atau 8.0+ untuk MySQL) yang sedang berjalan aktif di lokal atau cloud.

---

### Konfigurasi Environment Variables (`.env`)

Buat sebuah file baru bernama `.env` pada direktori akar (*root*) proyek Anda:

```env
# 1. Koneksi Database untuk Kebutuhan Prisma CLI (Migrasi & Skema)
DATABASE_URL="mysql://root:password@localhost:3306/loco21_db"

# 2. Detail Akses Kredensial untuk Prisma Client Adapter (src/lib/prisma.ts)
MYSQL_HOST="localhost"
MYSQL_PORT=3306
MYSQL_USER="root"
MYSQL_PASSWORD="password"
MYSQL_DATABASE="loco21_db"
```

> [!IMPORTANT]
> Sesuaikan nilai `root` dan `password` di atas dengan akun pengguna database MariaDB/MySQL lokal Anda. Pastikan database dengan nama `loco21_db` sudah dibuat secara manual di server database Anda (atau biarkan proses migrasi Prisma yang akan membuatnya secara otomatis jika didukung oleh hak akses user Anda).

---

### Langkah Pemasangan (Installation Steps)

Ikuti langkah-langkah di bawah ini untuk menjalankan proyek di komputer lokal Anda:

#### Langkah 1: Pasang Dependensi Node Modules
Jalankan perintah berikut di terminal pada direktori proyek untuk menginstal semua pustaka yang terdaftar pada `package.json`:
```bash
npm install
```

#### Langkah 2: Lakukan Sinkronisasi Database dan Hasilkan Prisma Client
Jalankan perintah migrasi database agar skema tabel terpasang ke dalam database MariaDB/MySQL Anda dan secara otomatis membuat berkas Prisma Client di lokasi generator (`src/generated/prisma`):
```bash
npx prisma migrate dev
```
*(Prisma akan membaca `prisma.config.ts` dan menerapkan berkas migrasi awal yang berada di folder `prisma/migrations`)*.

#### Langkah 3: Jalankan Server Development Lokal
Aktifkan server Next.js dalam mode pengembangan:
```bash
npm run dev
```
Aplikasi kini berjalan aktif dan dapat diakses melalui peramban pada alamat [http://localhost:3000](http://localhost:3000).

---

## 3. Migrasi Database & Seeding

### Migrasi Database (Prisma Migrate)

Proyek ini telah dilengkapi dengan struktur skema database terintegrasi di file [schema.prisma](file:///Users/potah/Documents/webdev/tasktrackerloco/prisma/schema.prisma) dan riwayat migrasi awal. 

Jika Anda melakukan perubahan struktur pada berkas skema `prisma/schema.prisma` di kemudian hari, Anda dapat membuat dan menerapkan migrasi baru dengan menjalankan:
```bash
npx prisma migrate dev --name <deskripsi_perubahan>
```

Untuk menyinkronkan database secara langsung tanpa menyimpan riwayat berkas migrasi baru (misal pada masa uji coba lokal), gunakan perintah:
```bash
npx prisma db push
```

---

### Proses Pengisian Data Awal (Seeding)

Berbeda dengan proyek Next.js konvensional yang menggunakan berkas skrip `prisma/seed.ts`, proyek **LOCO 21 PRO** menerapkan pola **Route-Based Seeder** untuk menjamin keamanan pengisian data pada database MySQL/MariaDB. Pengisian data dilakukan dengan menembak Endpoint API internal.

#### Cara Melakukan Seeding:
1. Pastikan server development sudah aktif (`npm run dev`).
2. Jalankan perintah `curl` dari terminal untuk mengirimkan request `POST` ke endpoint seeder:
   ```bash
   curl -X POST http://localhost:3000/api/seed
   ```
3. Alternatif lain, Anda dapat menggunakan aplikasi seperti **Postman**, **Thunder Client**, atau sejenisnya untuk mengirimkan request **POST** ke alamat `http://localhost:3000/api/seed`.

#### Logika Keamanan Seeder:
Proses pengisian data ini bersifat aman (*safe to re-run*). Handler di [route.ts](file:///Users/potah/Documents/webdev/tasktrackerloco/app/api/seed/route.ts) akan mendeteksi jumlah baris pada tabel karyawan dan proyek terlebih dahulu. Proses penyisipan data seed baru hanya akan dieksekusi jika tabel tersebut dalam kondisi kosong.

Data yang dimasukkan meliputi:
- **Master Divisi**: *Operation*, *Admin & Finance*, *Marketing*, dan *Creative & Program*.
- **Master Peran**: *Admin*, *Manager*, dan *Karyawan*.
- **15 Akun Karyawan Awal** yang tersebar di berbagai divisi dan tingkat peran.
- **4 Proyek Kerja Utama** lengkap dengan penetapan Project Officer (PO) masing-masing.

---

### Daftar Akun Hasil Seeding untuk Pengujian

Berikut adalah daftar kredensial akun bawaan hasil seeding yang dapat Anda gunakan langsung untuk masuk dan menguji fungsionalitas berdasarkan masing-masing peran:

| Nama | Email Akun | Peran (Role) | Divisi | Kata Sandi |
| :--- | :--- | :--- | :--- | :--- |
| **Muhammad Ridwan Zain** | `m.ridwan@pt-anda.com` | **Admin** | Operation | `password123` |
| **Resky Yani Fadillah** | `resky@pt-anda.com` | **Manager** | Admin & Finance | `password123` |
| **Isti Trisnawati** | `isti@pt-anda.com` | **Manager** | Marketing | `password123` |
| **Rideks** | `rideks@pt-anda.com` | **Manager** | Creative & Program | `password123` |
| **Nur Rahmi** | `nur.rahmi@pt-anda.com` | **Karyawan** | Operation | `password123` |
| **Nurfitrianti Setyowanda** | `nurfitrianti@pt-anda.com` | **Karyawan** | Admin & Finance | `password123` |
| **Wahyuningsih Astry** | `wahyuningsih@pt-anda.com` | **Karyawan** | Marketing | `password123` |
| **Ihram Naufal** | `ihram@pt-anda.com` | **Karyawan** | Creative & Program | `password123` |

---

## 4. Arsitektur Teknis & Struktur Folder

### Penerapan Atomic Design

Proyek ini merancang arsitektur antarmuka dengan sangat rapi mengikuti metodologi **Atomic Design**. Komponen UI dikelompokkan secara bertingkat berdasarkan tingkat kompleksitasnya:

```mermaid
graph TD
    Quarks[Design Tokens / Quarks] -->|Mengatur Nilai Dasar| Atoms[Atoms]
    Atoms -->|Komposisi Sederhana| Molecules[Molecules]
    Molecules -->|Kumpulan Fungsional| Organisms[Organisms]
    Organisms -->|Layout Halaman Utama| Templates[Templates]
    Templates -->|State & Kontrol Data| Pages[Next.js App Pages]
```

1. **Quarks** (`src/quarks`): Nilai sub-atomik primitif murni seperti palet warna dasar, ukuran font, bayangan (*shadows*), radius sudut (*borderRadius*), jarak margin (*spacing*), dan transisi animasi.
2. **Atoms** (`src/components/atoms`): Komponen terkecil yang tidak dapat dipecah lagi. Contoh: `Button`, `Input`, `Badge`, `Avatar`.
3. **Molecules** (`src/components/molecules`): Gabungan beberapa atoms untuk membentuk satu kesatuan fungsi sederhana. Contoh: `FormField`, `NavItem`, `StatCard`, `ProjectCard`.
4. **Organisms** (`src/components/organisms`): Struktur antarmuka yang lebih kompleks dan sudah memiliki interaksi data spesifik. Contoh: `Sidebar`, `AppHeader`, `TasksPage`, `KPIPage`, `AppModals`.
5. **Templates** (`src/components/templates`): Kerangka tata letak halaman yang bersifat modular. Contoh: `AppLayout` (Menggabungkan Sidebar, Header, dan Slot Konten).

---

### Struktur Direktori Proyek

```
tasktrackerloco/
├── app/                        # Direktori Next.js App Router (Halaman Utama & API)
│   ├── api/                    # Route Handlers (API Backend)
│   │   ├── bootstrap/          # Endpoint optimasi loading data awal
│   │   ├── employees/          # CRUD & kontrol status data karyawan
│   │   ├── projects/           # CRUD data proyek dan PO
│   │   ├── seed/               # Endpoint Seeder Database
│   │   └── tasks/              # CRUD tugas, alur revisi, & approvals
│   ├── favicon.ico             # Ikon peramban
│   ├── globals.css             # Konfigurasi CSS global & variabel desain Light-Red
│   ├── layout.tsx              # Tata letak root aplikasi
│   └── page.tsx                # Aplikasi SPA Shell (Pusat State & Routing)
├── prisma/                     # Konfigurasi Prisma ORM
│   ├── migrations/             # Direktori riwayat migrasi skema tabel
│   ├── schema.prisma           # Skema pemodelan database MariaDB/MySQL
│   └── migration_lock.toml     
├── public/                     # Berkas statis publik (gambar, dokumen)
├── src/                        # Kode sumber aplikasi frontend & utilitas
│   ├── components/             # Komponen UI terstruktur (Atomic Design)
│   │   ├── atoms/              # Komponen primitif (Button, Input, Badge)
│   │   ├── molecules/          # Komponen gabungan sederhana (StatCard, FormField)
│   │   ├── organisms/          # Blok antarmuka fungsional halaman (TasksPage, KPIPage)
│   │   └── templates/          # Tata letak modular halaman (AppLayout)
│   ├── lib/                    # Logika bisnis terpusat & konfigurasi client
│   │   ├── api.ts              # Lapisan integrasi API (mengemas endpoint)
│   │   ├── axios.ts            # Kustomisasi instans Axios & interceptors global
│   │   ├── kpi.ts              # Modul murni algoritma penghitung skor KPI
│   │   └── prisma.ts           # Koneksi singleton client dengan adapter MariaDB
│   ├── quarks/                 # Token desain dasar / nilai primitif UI
│   ├── types/                  # Definisi tipe & interface TypeScript global
│   └── generated/              # Direktori output otomatis untuk Prisma Client
├── next.config.ts              # Konfigurasi opsional framework Next.js
├── prisma.config.ts            # Konfigurasi parameter Prisma CLI
├── postcss.config.mjs          
├── eslint.config.mjs           
├── tsconfig.json               # Konfigurasi kompilasi TypeScript
└── package.json                # Daftar paket dependensi proyek & skrip
```

Dengan struktur yang tersusun rapi serta pemisahan logika bisnis yang jelas, **LOCO 21 PRO** siap digunakan untuk kebutuhan kolaborasi tim berskala internal secara andal, cepat, dan memiliki performa tinggi.
