import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BrandBook Client OS',
  description: 'Enterprise-grade multi-tenant client workspace management platform.',
  keywords: ['BrandBook', 'Client OS', 'Workspace Management', 'Enterprise OS'],
  authors: [{ name: 'BrandBook Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#0c0c0e',
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: 'BrandBook Client OS',
    description: 'The OS for your brand operations.',
    url: 'https://brandbook.com',
    siteName: 'BrandBook Client OS',
    images: [
      {
        url: 'https://brandbook.com/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BrandBook Client OS',
    description: 'The OS for your brand operations.',
    images: ['https://brandbook.com/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
