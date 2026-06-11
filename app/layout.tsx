import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans'
import { Inter, JetBrains_Mono } from 'next/font/google'
import "./globals.css";

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
  title: "Project QR — Industrial Asset Management",
  description: "Replace paper-based inspection reports with QR-linked digital reports. Secure, instant, and always accessible.",
  keywords: "industrial asset management, QR codes, inspection reports, factory management, digital reports",
  openGraph: {
    title: "Project QR — Industrial Asset Management",
    description: "Replace paper-based inspection reports with QR-linked digital reports.",
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
