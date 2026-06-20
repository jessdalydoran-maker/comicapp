import type { Metadata } from "next";
import { Bangers, Comic_Neue } from "next/font/google";

import { SiteNav } from "@/components/SiteNav";
import { PRODUCTION_SITE_URL } from "@/lib/site";
import "./globals.css";

const bangers = Bangers({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bangers",
});

const comicNeue = Comic_Neue({
  weight: ["300", "400", "700"],
  subsets: ["latin"],
  variable: "--font-comic-neue",
});

export const metadata: Metadata = {
  metadataBase: new URL(PRODUCTION_SITE_URL),
  title: "Comic Forge",
  description: "Create, preview, and sell AI-powered comics",
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bangers.variable} ${comicNeue.variable}`}>
      <body className="min-h-screen bg-background font-comic-neue antialiased">
        <SiteNav />
        <main>{children}</main>
      </body>
    </html>
  );
}
