// ============================================================
// LOCO 21 PRO — API: /api/upload
// POST → Upload file (brief tugas atau bukti hasil kerja)
//        ke direktori /public/uploads/
//
// Validasi:
//   - Ukuran max: 15MB
//   - Format yang diizinkan: pdf, docx, xlsx, pptx, zip, jpg, jpeg, png, gif, webp
// ============================================================

import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
const ALLOWED_EXTENSIONS = new Set([
  'pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt',
  'zip', 'rar', '7z',
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
]);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'Tidak ada file yang diunggah.' }, { status: 400 });
    }

    // Validasi ukuran file
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { message: `Ukuran file melebihi batas maksimum 15MB. Ukuran file Anda: ${(file.size / 1024 / 1024).toFixed(1)}MB.` },
        { status: 413 }
      );
    }

    // Validasi ekstensi file
    const originalName = file.name;
    const ext = originalName.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { message: `Format file .${ext} tidak diizinkan. Format yang didukung: PDF, Word, Excel, PowerPoint, ZIP, JPG, PNG, WebP.` },
        { status: 415 }
      );
    }

    // Generate nama file yang unik untuk mencegah tabrakan
    const timestamp = Date.now();
    const uuid = randomUUID().split('-')[0]; // Ambil segmen pertama UUID (8 karakter)
    // Sanitasi nama file: hapus karakter spesial, ganti spasi dengan dash
    const safeName = originalName
      .replace(/\.[^/.]+$/, '')            // Hapus ekstensi
      .replace(/[^a-zA-Z0-9\-_]/g, '-')   // Ganti karakter non-alfanumerik
      .replace(/-+/g, '-')                 // Hindari multiple dash
      .toLowerCase()
      .slice(0, 50);                       // Batasi panjang nama
    const uniqueFileName = `${timestamp}-${uuid}-${safeName}.${ext}`;

    // Pastikan direktori upload tersedia (di root direktori, bukan di public)
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Tulis file ke disk
    const filePath = path.join(uploadDir, uniqueFileName);
    const arrayBuffer = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(arrayBuffer));

    // Path yang bisa diakses dari browser
    const publicPath = `/uploads/${uniqueFileName}`;

    console.log(`[POST /api/upload] File berhasil diunggah: ${publicPath} (${(file.size / 1024).toFixed(1)}KB)`);

    return NextResponse.json({
      filePath: publicPath,
      fileName: originalName,
      uniqueFileName,
      size: file.size,
    }, { status: 201 });

  } catch (err) {
    console.error('[POST /api/upload]', err);
    return NextResponse.json({ message: 'Terjadi kesalahan saat mengunggah file.' }, { status: 500 });
  }
}
