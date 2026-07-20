import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Noto_Sans_Thai } from 'next/font/google';
import type { ReactNode } from 'react';

import './styles.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const notoSansThai = Noto_Sans_Thai({
  weight: ['400', '500', '600', '700'],
  subsets: ['thai'],
  variable: '--font-thai',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'GoldIQ · Gold investment intelligence',
  description: 'Gold prices, portfolio, buy plans, analysis, and rule-based recommendations.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="th" className={`${inter.variable} ${jetbrainsMono.variable} ${notoSansThai.variable}`}>
      <body>{children}</body>
    </html>
  );
}
