// ============================================================
// LOCO 21 PRO — Email Utility (Nodemailer)
// Dua mode operasi:
//   1. SMTP Real: Jika SMTP_USER & SMTP_PASSWORD tersedia di .env
//   2. Simulasi Lokal: Jika kosong → tulis file HTML ke /emails/ & log terminal
// ============================================================

import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

interface SendVerificationEmailOptions {
  toEmail: string;
  toName: string;
  verificationLink: string;
}

const isSmtpConfigured =
  !!process.env.SMTP_USER &&
  !!process.env.SMTP_PASSWORD &&
  process.env.SMTP_USER !== '' &&
  process.env.SMTP_PASSWORD !== '';

/**
 * Membuat konten HTML email verifikasi premium.
 */
function buildEmailHtml(name: string, link: string): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verifikasi Akun LOCO 21 PRO</title>
  <style>
    body { margin: 0; padding: 0; background: #EFEFEF; font-family: 'Inter', Arial, sans-serif; }
    .container { max-width: 560px; margin: 40px auto; }
    .header { background: linear-gradient(135deg, #D2001A 0%, #a30015 100%); border-radius: 16px 16px 0 0; padding: 36px 40px; text-align: center; }
    .header-logo { display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: rgba(255,255,255,0.15); border-radius: 14px; margin-bottom: 16px; }
    .header-logo span { font-size: 28px; font-weight: 900; color: #fff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 900; color: #fff; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0; font-size: 13px; color: rgba(255,255,255,0.75); }
    .body { background: #fff; padding: 40px; }
    .greeting { font-size: 18px; font-weight: 700; color: #0F172A; margin-bottom: 12px; }
    .text { font-size: 14px; color: #475569; line-height: 1.7; margin-bottom: 20px; }
    .card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px 24px; margin-bottom: 28px; }
    .card-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94A3B8; margin-bottom: 6px; }
    .card-value { font-size: 14px; font-weight: 600; color: #0F172A; }
    .btn-container { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #D2001A 0%, #a30015 100%); color: #fff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 36px; border-radius: 10px; letter-spacing: -0.2px; box-shadow: 0 4px 24px rgba(210,0,26,0.35); }
    .divider { border: none; border-top: 1px solid #E2E8F0; margin: 28px 0; }
    .link-fallback { font-size: 12px; color: #94A3B8; word-break: break-all; }
    .link-fallback a { color: #D2001A; }
    .expire-note { font-size: 12px; color: #F59E0B; background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; padding: 10px 14px; margin-top: 16px; }
    .footer { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 0 0 16px 16px; padding: 20px 40px; text-align: center; }
    .footer p { font-size: 11px; color: #94A3B8; margin: 0; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-logo"><span>L</span></div>
      <h1>LOCO 21 PRO</h1>
      <p>Sistem Manajemen Tugas Internal</p>
    </div>

    <div class="body">
      <p class="greeting">Halo, ${name}! 👋</p>
      <p class="text">
        Selamat datang di <strong>LOCO 21 PRO</strong>! Admin telah mendaftarkan Anda sebagai karyawan baru. Silakan klik tombol di bawah untuk <strong>memverifikasi data</strong> Anda dan <strong>membuat password akun</strong> Anda sendiri.
      </p>

      <div class="card">
        <div class="card-label">Email Terdaftar</div>
        <div class="card-value">${'• '.repeat(1)}Klik tombol di bawah untuk melihat detail data Anda</div>
      </div>

      <div class="btn-container">
        <a href="${link}" class="btn">✅ Verifikasi Akun & Buat Password</a>
      </div>

      <div class="expire-note">
        ⏳ <strong>Perhatian:</strong> Tautan ini hanya berlaku selama <strong>24 jam</strong> sejak email ini dikirim. Segera lakukan verifikasi sebelum kedaluwarsa.
      </div>

      <hr class="divider" />

      <p class="link-fallback">
        Jika tombol tidak berfungsi, salin dan tempelkan tautan berikut ke browser Anda:<br/>
        <a href="${link}">${link}</a>
      </p>
    </div>

    <div class="footer">
      <p>Email ini dikirim secara otomatis oleh sistem LOCO 21 PRO.<br/>Jika Anda tidak merasa mendaftar, abaikan email ini.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Mode Simulasi Lokal: Tulis file HTML ke folder /emails/ & log ke konsol.
 */
async function sendLocalSimulation(options: SendVerificationEmailOptions): Promise<void> {
  const { toEmail, toName, verificationLink } = options;
  const html = buildEmailHtml(toName, verificationLink);

  // Pastikan folder /emails/ ada
  const emailsDir = path.join(process.cwd(), 'emails');
  if (!fs.existsSync(emailsDir)) {
    fs.mkdirSync(emailsDir, { recursive: true });
  }

  // Tulis file HTML email
  const filePath = path.join(emailsDir, 'last-sent-email.html');
  fs.writeFileSync(filePath, html, 'utf-8');

  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║         📧  SIMULASI EMAIL VERIFIKASI (Mode Lokal)           ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  Kepada : ${toName} <${toEmail}>`);
  console.log('║  Subjek : [LOCO 21 PRO] Verifikasi Akun & Buat Password');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║  🔗 LINK VERIFIKASI:');
  console.log(`║  ${verificationLink}`);
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║  📁 Preview email HTML tersimpan di:');
  console.log(`║  ${filePath}`);
  console.log('║  → Buka file tersebut di browser untuk melihat tampilan email');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('\n');
}

/**
 * Mode SMTP Real: Kirim email menggunakan Nodemailer.
 */
async function sendSmtpEmail(options: SendVerificationEmailOptions): Promise<void> {
  const { toEmail, toName, verificationLink } = options;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? 'LOCO 21 PRO <no-reply@loco21.com>',
    to: `${toName} <${toEmail}>`,
    subject: '[LOCO 21 PRO] Verifikasi Akun & Buat Password',
    html: buildEmailHtml(toName, verificationLink),
  });

  console.log(`[Email] Berhasil dikirim ke ${toEmail}`);
}

/**
 * Fungsi utama yang dipanggil dari API routes.
 * Otomatis memilih mode SMTP atau Simulasi Lokal.
 */
export async function sendVerificationEmail(options: SendVerificationEmailOptions): Promise<void> {
  if (isSmtpConfigured) {
    await sendSmtpEmail(options);
  } else {
    await sendLocalSimulation(options);
  }
}
