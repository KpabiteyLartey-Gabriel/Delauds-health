import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "./providers";
import { ThemeToggle } from "@/components/theme-toggle";
import { PolicyNotice } from "@/components/policy-notice";

const SITE_URL = "https://waterhouselodge.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Waterhouse Lodge – Hotel & Lodge in Adenta, Accra",
    template: "%s | Waterhouse Lodge Adenta",
  },
  description:
    "Looking for a hotel or lodge in Adenta, Accra? Waterhouse Lodge offers clean, comfortable rooms with transparent GHS pricing, online booking, and 24-hour service in Adenta, Greater Accra.",
  applicationName: "Waterhouse Lodge",
  keywords: [
    "lodge in Adenta",
    "lodge in Accra",
    "hotel in Adenta",
    "hotel in Accra",
    "Adenta lodge",
    "Adenta hotel",
    "Waterhouse Lodge",
    "Waterhouse Lodge Adenta",
    "Waterhouse Lodge Accra",
    "budget hotel Accra",
    "guest house Adenta",
    "accommodation Adenta Ghana",
    "book room in Accra",
    "Ghana lodge booking",
    "affordable lodge Accra",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_GH",
    url: SITE_URL,
    siteName: "Waterhouse Lodge",
    title: "Waterhouse Lodge – Hotel & Lodge in Adenta, Accra",
    description:
      "Hotel and lodge in Adenta, Accra. Book a clean, comfortable room at Waterhouse Lodge with clear GHS pricing and quick online booking.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Waterhouse Lodge – Hotel & Lodge in Adenta, Accra",
    description:
      "Hotel and lodge in Adenta, Accra. Book a clean, comfortable room at Waterhouse Lodge with clear GHS pricing and quick online booking.",
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

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": ["LodgingBusiness", "Hotel"],
  name: "Waterhouse Lodge",
  alternateName: ["Waterhouse Hotel Adenta", "Waterhouse Lodge Adenta"],
  description:
    "Waterhouse Lodge is a hotel and lodge in Adenta, Accra, Ghana, offering clean comfortable rooms with transparent GHS pricing and online booking.",
  url: "https://waterhouselodge.com",
  telephone: "+233000000000",
  email: "info.waterhouselodge@gmail.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Adenta",
    addressLocality: "Accra",
    addressRegion: "Greater Accra",
    addressCountry: "GH",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 5.7167,
    longitude: -0.1667,
  },
  areaServed: "Adenta, Accra, Ghana",
  priceRange: "GHS",
  currenciesAccepted: "GHS",
  paymentAccepted: "Cash, Online Payment",
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday",
      ],
      opens: "00:00",
      closes: "23:59",
    },
  ],
  sameAs: [],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
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
