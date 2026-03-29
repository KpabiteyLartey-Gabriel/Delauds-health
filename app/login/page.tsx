"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Building2 } from "lucide-react"
import { useHotel } from "@/components/hotel/HotelProvider"
import { useToast } from "@/hooks/use-toast"
import type { UserRole } from "@/lib/hotel/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function routeForRole(r: UserRole): string {
  if (r === "admin") return "/admin"
  if (r === "receptionist") return "/reception"
  return "/client"
}

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { login, ready } = useHotel()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ready) return
    setLoading(true)
    try {
      const res = await login(email, password)
      if ("error" in res) {
        toast({ title: "Login failed", description: res.error, variant: "destructive" })
        return
      }
      toast({ title: "Welcome back" })
      router.replace(routeForRole(res.role))
    } finally {
      setLoading(false)
    }
  }

  if (!ready) return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <Building2 className="h-10 w-10 text-amber-700" />
          </div>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Staff and guests use the same page. You are sent to the right dashboard for your account role.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="pw">Password</Label>
              <Input
                id="pw"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-4">
            <Link href="/register" className="text-amber-700 hover:underline">
              New guest registration
            </Link>
            {" · "}
            <Link href="/" className="text-slate-600 hover:underline">
              Home
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
