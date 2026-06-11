import type { Metadata } from "next";
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: "FIFA WC 2026 Pro Predictor — Join Now",
  description: "Predict match scores, earn points, and dominate your league. The ultimate FIFA World Cup 2026 prediction game. Free to play!",
  openGraph: {
    title: "FIFA WC 2026 Pro Predictor",
    description: "Predict match scores, earn points, and dominate your league. Join now — it's free!",
    url: "https://worldcup-predictor-tawny.vercel.app/login",
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
};

export default function LoginPage() {
  return <LoginClient />;
}
