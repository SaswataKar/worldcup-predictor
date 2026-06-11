import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import PushNotificationPrompt from "@/components/PushNotificationPrompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FIFA WC 2026 Pro Predictor",
  description: "Predict match scores, earn points, and dominate your league. The ultimate FIFA World Cup 2026 prediction game.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WC Predictor",
  },
  openGraph: {
    title: "FIFA WC 2026 Pro Predictor",
    description: "Predict match scores, earn points, and dominate your league. Join now — it's free!",
    url: "https://worldcup-predictor-tawny.vercel.app",
    siteName: "WC 2026 Predictor",
    images: [
      {
        url: "https://worldcup-predictor-tawny.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "FIFA WC 2026 Pro Predictor",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FIFA WC 2026 Pro Predictor",
    description: "Predict match scores, earn points, and dominate your league.",
    images: ["https://worldcup-predictor-tawny.vercel.app/og-image.png"],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#09090b" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* Register SW immediately — must happen before Chrome checks PWA installability */}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js', { scope: '/' })
                .catch(function(e) { console.error('SW registration failed:', e); });
            });
          }
        `}} />
      </head>
      <body className="min-h-full flex flex-col">
            <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: "#18181b",
          color: "#fff",
          border:
            "1px solid #27272a",
        },
      }}
    />
    {children}
    <PushNotificationPrompt />
    </body>
    </html>
  );
}
