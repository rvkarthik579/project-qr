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
  metadataBase: new URL('https://project-qr-xi.vercel.app'),
  title: "Retriqo — Industrial QR Document Management",
  description: "Retriqo helps industrial teams securely store inspection reports, generate QR codes, and instantly retrieve machine history with a single scan.",
  keywords: "industrial asset management, QR routing, secure archives, Retriqo",
  openGraph: {
    title: "Retriqo — Industrial QR Document Management",
    description: "Retriqo helps industrial teams securely store inspection reports, generate QR codes, and instantly retrieve machine history with a single scan.",
    url: "https://project-qr-xi.vercel.app",
    siteName: "Retriqo",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Retriqo — Industrial QR Document Management",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Retriqo — Industrial QR Document Management",
    description: "Retriqo helps industrial teams securely store inspection reports, generate QR codes, and instantly retrieve machine history with a single scan.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://project-qr-xi.vercel.app",
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
