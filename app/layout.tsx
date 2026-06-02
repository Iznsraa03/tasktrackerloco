import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://loco21event.com"),
  title: "LOCO 21 PRO — Sistem Manajemen Tugas",
  description: "Platform manajemen tugas, project, dan KPI karyawan internal. Lacak produktivitas, kualitas, dan kedisiplinan tim secara real-time.",
  keywords: ["task tracker", "manajemen tugas", "KPI", "karyawan", "project management"],
  icons: {
    icon: "/logo/LOGO%20LOCO%20BLACK%20RED.png",
    apple: "/logo/logo-red-bg.png",
  },
  openGraph: {
    title: "LOCO 21 PRO — Sistem Manajemen Tugas",
    description: "Platform manajemen tugas, project, dan KPI karyawan internal.",
    url: "https://loco21event.com",
    siteName: "LOCO 21 PRO",
    images: [
      {
        url: "/logo/logo-red-bg.png",
        width: 512,
        height: 512,
        alt: "LOCO 21 PRO Logo",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('ServiceWorker registration successful');
                    },
                    function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
