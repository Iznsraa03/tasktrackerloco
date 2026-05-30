import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "LOCO 21 PRO — Sistem Manajemen Tugas",
  description: "Platform manajemen tugas, project, dan KPI karyawan internal. Lacak produktivitas, kualitas, dan kedisiplinan tim secara real-time.",
  keywords: ["task tracker", "manajemen tugas", "KPI", "karyawan", "project management"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="h-full overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
        {children}
      </body>
    </html>
  );
}
