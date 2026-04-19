import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "./providers";
import { ThemeToggle } from "@/components/theme-toggle";
import { PolicyNotice } from "@/components/policy-notice";

const SITE_URL = "https://waterhouselodge.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Waterhouse Lodge | Adenta, Accra",
    template: "%s | Waterhouse Lodge",
  },
  description:
    "Waterhouse Lodge in Adenta, Accra offers comfortable rooms with clear GHS rates, online availability, and compliant guest registration.",
  applicationName: "Waterhouse Lodge",
  keywords: [
    "Waterhouse Lodge",
    "Waterhouse Lodge Adenta",
    "Waterhouse Lodge Accra",
    "hotel in Adenta",
    "lodge in Accra",
    "book room in Accra",
    "Ghana lodge booking",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_GH",
    url: SITE_URL,
    siteName: "Waterhouse Lodge",
    title: "Waterhouse Lodge | Adenta, Accra",
    description:
      "Book your stay at Waterhouse Lodge in Adenta, Accra with clear pricing and quick online booking.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Waterhouse Lodge | Adenta, Accra",
    description:
      "Book your stay at Waterhouse Lodge in Adenta, Accra with clear pricing and quick online booking.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/favicon.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/favicon.png" />
      </head>
      <body className="min-h-screen antialiased">
        <AppProviders>
          <div className="fixed right-4 top-4 z-[100]">
            <ThemeToggle />
          </div>
          {children}
          <div className="border-t border-amber-200 bg-amber-50/70">
            <div className="mx-auto max-w-6xl px-4 py-3">
              <PolicyNotice className="border-none bg-transparent px-0 py-0 text-xs text-amber-900" />
            </div>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
