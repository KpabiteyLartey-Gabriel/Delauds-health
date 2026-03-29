"use client"

import type React from "react"
import { Toaster } from "@/components/ui/toaster"
import { HotelProvider } from "@/components/hotel/HotelProvider"

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <HotelProvider>
      {children}
      <Toaster />
    </HotelProvider>
  )
}
