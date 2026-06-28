import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans'
import { Inter, JetBrains_Mono } from 'next/font/google'
import "./globals.css";
import "./production-landing.css";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Retriqo — Every Machine. Every Report. One Scan Away.",
  description: "Securely store inspection reports, generate a unique QR code, and attach it to your equipment. Instantly retrieve the machine's entire history with a single scan.",
  keywords: "industrial asset management, QR routing, secure archives, Retriqo",
  openGraph: {
    title: "Retriqo — Every Machine. Every Report. One Scan Away.",
    description: "Securely store inspection reports, generate a unique QR code, and attach it to your equipment.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations().then(registrations => {
                registrations.forEach(r => r.unregister())
              })
              caches.keys().then(keys => {
                keys.forEach(key => caches.delete(key))
              })
            }
          `
        }} />
      </head>
      <body className={`${GeistSans.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
