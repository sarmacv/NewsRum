import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Signalist — Financial news & portfolio intelligence',
  description: 'A transparent workspace for trusted market news, explainable stock rankings, and long-term portfolio scenarios.',
  metadataBase: new URL('https://signalist.sites.openai.com'),
  openGraph: {
    title: 'Signalist — See the signal. Skip the noise.',
    description: 'Trusted news, explainable stock rankings, and portfolio scenarios in one focused workspace.',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Signalist — See the signal. Skip the noise.',
    description: 'Trusted news, explainable stock rankings, and portfolio scenarios in one focused workspace.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
