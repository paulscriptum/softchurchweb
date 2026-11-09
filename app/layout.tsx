import type { Metadata, Viewport } from 'next';
import { CURATOR_NAME, CURATOR_URL, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/config/site';
import { SiteAnalytics } from '@/components/SiteAnalytics';
import { ViaMemory } from '@/components/ViaMemory';
import { SoundProvider } from '@/components/Sound';
import { ThemeScript } from '@/components/ThemeScript';
import { brandFont } from './fonts';
import './globals.css';

const DEFAULT_TITLE = `${SITE_NAME} · a quiet house for given things`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: DEFAULT_TITLE, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: CURATOR_NAME, url: CURATOR_URL }],
  creator: CURATOR_NAME,
  alternates: { canonical: '/' },
  formatDetection: { telephone: false, email: false, address: false },
  icons: {
    icon: [
      { url: '/icon-light.svg', type: 'image/svg+xml', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark.svg', type: 'image/svg+xml', media: '(prefers-color-scheme: dark)' },
    ],
    apple: [{ url: '/apple-icon', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafaf8' },
    { media: '(prefers-color-scheme: dark)', color: '#0e0c0c' },
  ],
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" data-theme="light" className={brandFont.variable} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="antialiased">
        <SoundProvider>{children}</SoundProvider>
        <ViaMemory />
        <SiteAnalytics />
      </body>
    </html>
  );
}
