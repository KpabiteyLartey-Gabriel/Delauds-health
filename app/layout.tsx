import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "./providers";
import { ThemeToggle } from "@/components/theme-toggle";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
      </head>
      <body className="min-h-screen antialiased">
        <AppProviders>
          <div className="fixed right-4 top-4 z-[100]">
            <ThemeToggle />
          </div>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
