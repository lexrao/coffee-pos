import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Owner Dashboard — Brew & Co.",
  description: "Sales monitoring and analytics for Brew & Co.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Brew & Co. Owner",
  },
};

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Brew & Co. Owner" />
        <link rel="apple-touch-icon" href="/icon-152.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
