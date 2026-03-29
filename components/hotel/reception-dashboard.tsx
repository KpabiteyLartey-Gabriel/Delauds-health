"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, LogOut, Search } from "lucide-react"
import { useHotel } from "@/components/hotel/HotelProvider"
import { useToast } from "@/hooks/use-toast"
import { formatGhs, todayISO, tomorrowISO } from "@/lib/hotel/dates"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { GhanaGuestForm, emptyGuestDetails, validateGuestDetails } from "@/components/hotel/ghana-guest-form"
import type { GuestDetailsGhana } from "@/lib/hotel/types"

export function ReceptionDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const {
    state,
    session,
    ready,
    logout,
    createBooking,
    checkInAction,
    checkOutAction,
    roomFree,
  } = useHotel()

  const [search, setSearch] = useState("")
  const [walkOpen, setWalkOpen] = useState(false)
  const [cin, setCin] = useState(todayISO())
  const [cout, setCout] = useState(tomorrowISO())
  const [roomId, setRoomId] = useState<string>("")
  const [guest, setGuest] = useState<GuestDetailsGhana>(() =>
    emptyGuestDetails(todayISO(), tomorrowISO()),
  )

  const today = todayISO()

  const todays = useMemo(() => {
    return state.bookings.filter(
      (b) =>
        (b.checkInDate === today || b.checkOutDate === today) &&
        b.status !== "cancelled",
    )
  }, [state.bookings, today])

  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return state.bookings.filter((b) => b.status !== "cancelled")
    return state.bookings.filter((b) => {
      if (b.status === "cancelled") return false
      const g = b.guestDetails
      return (
        g.fullName.toLowerCase().includes(q) ||
        g.phone.includes(q) ||
        g.email.toLowerCase().includes(q)
      )
    })
  }, [state.bookings, search])

  const availableForWalkin = useMemo(() => {
    if (!cin || !cout || cin >= cout) return []
    return state.rooms.filter((r) => roomFree(r.id, cin, cout))
  }, [state.rooms, cin, cout, roomFree])

  if (!ready) return null
  if (!session || session.role !== "receptionist") {
    router.replace("/login")
    return null
  }

  const submitWalkIn = async () => {
    if (!cin || !cout || cin >= cout) {
      toast({ title: "Invalid dates", description: "Check-out must be after check-in.", variant: "destructive" })
      return
    }
    const err = validateGuestDetails(guest)
    if (err) {
      toast({ title: "Guest register incomplete", description: err, variant: "destructive" })
      return
    }
    if (!roomId) {
      toast({ title: "Select a room", variant: "destructive" })
      return
    }
    const walkId = state.walkInClientId
    if (!walkId) {
      toast({
        title: "Walk-in account missing",
        description: "Run db seed (npm run db:seed) so walkin@hotel.local exists, then refresh.",
        variant: "destructive",
      })
      return
    }
    if (!roomFree(roomId, cin, cout)) {
      toast({ title: "Room no longer available", variant: "destructive" })
      return
    }
    const r = await createBooking(roomId, walkId, cin, cout, guest)
    if ("error" in r) {
      toast({ title: "Booking failed", description: r.error, variant: "destructive" })
      return
    }
    toast({ title: "Walk-in booking created" })
    setWalkOpen(false)
    setRoomId("")
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-7 w-7 text-amber-700" />
            <div>
              <h1 className="text-lg font-semibold">Reception</h1>
              <p className="text-sm text-slate-500">Check-in / check-out — no room delete</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={async () => { await logout(); router.push("/login") }}>
            <LogOut className="h-4 w-4 mr-1" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Today</CardTitle>
              <CardDescription>Arrivals, departures, and in-house</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todays.length}</div>
              <p className="text-sm text-slate-500">bookings touching today&apos;s date</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Walk-in booking</CardTitle>
              <CardDescription>Creates a stay tied to the lobby walk-in account; legal guest is on the form.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => {
                  setGuest(emptyGuestDetails(cin, cout))
                  setRoomId("")
                  setWalkOpen(true)
                }}
              >
                New walk-in reservation
              </Button>
              <Dialog open={walkOpen} onOpenChange={setWalkOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Walk-in — Ghana guest register</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Check-in</Label>
                        <Input
                          type="date"
                          value={cin}
                          onChange={(e) => {
                            const v = e.target.value
                            setCin(v)
                            setGuest((g) => ({ ...g, checkInDateTime: `${v}T14:00` }))
                          }}
                        />
                      </div>
                      <div>
                        <Label>Check-out</Label>
                        <Input
                          type="date"
                          value={cout}
                          onChange={(e) => {
                            const v = e.target.value
                            setCout(v)
                            setGuest((g) => ({ ...g, checkOutDateTime: `${v}T11:00` }))
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Room</Label>
                      <Select value={roomId} onValueChange={setRoomId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Available for dates" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableForWalkin.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              Room {r.roomNumber} — {formatGhs(r.priceGhs)}/night
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <GhanaGuestForm value={guest} onChange={setGuest} idPrefix="w" />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setWalkOpen(false)}>Cancel</Button>
                    <Button onClick={submitWalkIn}>Create booking</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search guest</CardTitle>
            <CardDescription>By name, phone, or email</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input className="pl-9" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((b) => {
                  const room = state.rooms.find((r) => r.id === b.roomId)
                  return (
                    <TableRow key={b.id}>
                      <TableCell>{b.guestDetails.fullName}</TableCell>
                      <TableCell>{room?.roomNumber}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{b.checkInDate} → {b.checkOutDate}</TableCell>
                      <TableCell><Badge>{b.status}</Badge></TableCell>
                      <TableCell className="text-right space-x-2">
                        {b.status === "booked" && (
                          <Button
                            size="sm"
                            onClick={async () => {
                              const r = await checkInAction(b.id)
                              if ("error" in r) {
                                toast({ title: "Check-in failed", description: r.error, variant: "destructive" })
                              } else {
                                toast({ title: "Checked in" })
                              }
                            }}
                          >
                            Check-in
                          </Button>
                        )}
                        {b.status === "checked_in" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={async () => {
                              const r = await checkOutAction(b.id)
                              if ("error" in r) {
                                toast({ title: "Check-out failed", description: r.error, variant: "destructive" })
                              } else {
                                toast({ title: "Checked out" })
                              }
                            }}
                          >
                            Check-out
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
