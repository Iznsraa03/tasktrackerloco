import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const MIME_TYPES: Record<string, string> = {
  'pdf': 'application/pdf',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'doc': 'application/msword',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'xls': 'application/vnd.ms-excel',
  'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'ppt': 'application/vnd.ms-powerpoint',
  'zip': 'application/zip',
  'rar': 'application/vnd.rar',
  '7z': 'application/x-7z-compressed',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'webp': 'image/webp',
  'svg': 'image/svg+xml',
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // 1. Cari di folder uploads (root)
    let filePath = path.join(process.cwd(), 'uploads', filename);

    // 2. Jika tidak ada, coba cari di public/uploads (fallback untuk berkas lama)
    if (!existsSync(filePath)) {
      filePath = path.join(process.cwd(), 'public', 'uploads', filename);
    }

    // 3. Jika berkas tidak ditemukan di kedua lokasi
    if (!existsSync(filePath)) {
      return NextResponse.json({ message: 'Berkas tidak ditemukan.' }, { status: 404 });
    }

    // 4. Baca berkas dari disk
    const fileBuffer = await readFile(filePath);

    // 5. Dapatkan ekstensi dan Content-Type
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // 6. Tentukan Content-Disposition
    // Untuk file PDF dan Gambar, gunakan 'inline' agar bisa dipratinjau di browser tab baru.
    // Untuk dokumen office dan arsip, gunakan 'attachment' agar langsung terunduh.
    const isViewable = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
    const contentDisposition = isViewable
      ? `inline; filename="${filename}"`
      : `attachment; filename="${filename}"`;

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (err) {
    console.error('[GET /uploads/[filename]] Error serving file:', err);
    return NextResponse.json({ message: 'Terjadi kesalahan saat mengunduh berkas.' }, { status: 500 });
  }
}
