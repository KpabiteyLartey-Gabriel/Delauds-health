"use client"

import { Suspense } from "react"
import { ClientPortal } from "@/components/hotel/client-portal"

export default function ClientPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-stone-950 text-stone-300 text-sm">
          Loading your portal...
        </div>
      }
    >
      <ClientPortal />
    </Suspense>
  )
}
