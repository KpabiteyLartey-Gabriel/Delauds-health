import type { Metadata } from "next"
import "./globals.css"
import { AppProviders } from "./providers"

export const metadata: Metadata = {
  title: "Delauds Lodge | Book your stay in Accra",
  description:
    "Reserve a comfortable single room in Accra, Ghana. Clear GHS rates, online availability, and compliant guest registration.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
      </head>
      <body className="min-h-screen antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
