"use client"

import type React from "react"
import { Toaster } from "@/components/ui/toaster"
import { HotelProvider } from "@/components/hotel/HotelProvider"
import { ThemeProvider } from "@/components/theme-provider"

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <HotelProvider>
        {children}
        <Toaster />
      </HotelProvider>
    </ThemeProvider>
  )
}
