import type { Metadata, Viewport } from 'next';
import {
  DM_Sans,
  Geist,
  IBM_Plex_Mono,
  Inter,
  Noto_Sans_Devanagari,
  Plus_Jakarta_Sans,
} from 'next/font/google';
import './globals.css';
import { PWABootstrap } from '@/components/PWABootstrap';
import { AuthProvider } from '@/components/AuthProvider';

const geist = Geist({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-geist',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-devanagari',
  display: 'swap',
});

const ibmMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SAHAAY — Live AI Medical Assistant & Emergency Navigation',
  description:
    'Bilingual (English & Hindi) live AI medical assistant, lab report analyzer, prescription reader, medicine safety checker, verified clinical sources, and live Google Maps hospital & blood bank navigation.',
  applicationName: 'SAHAAY',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SAHAAY',
  },
  openGraph: {
    title: 'SAHAAY — Live AI Medical Assistant & Emergency Navigation',
    description:
      'Bilingual live AI medical assistant, lab report analyzer, prescription reader, medicine safety checker, and live Google Maps emergency navigation.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SAHAAY — Live AI Medical Assistant & Emergency Navigation',
    description:
      'Bilingual live AI medical assistant, verified clinical sources, 112 SOS, and live Google Maps hospital & blood bank navigation.',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f131d',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geist.variable} ${inter.variable} ${plusJakarta.variable} ${dmSans.variable} ${notoDevanagari.variable} ${ibmMono.variable}`}
    >
      <body
        suppressHydrationWarning
        className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 antialiased"
      >
        <PWABootstrap>
          <AuthProvider>{children}</AuthProvider>
        </PWABootstrap>
      </body>
    </html>
  );
}
