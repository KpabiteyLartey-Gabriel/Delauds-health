"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, LogOut } from "lucide-react"
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

export function ClientPortal() {
  const router = useRouter()
  const { toast } = useToast()
  const {
    state,
    session,
    ready,
    logout,
    createBooking,
    cancelBookingAction,
    roomFree,
  } = useHotel()

  const [bookOpen, setBookOpen] = useState(false)
  const [cin, setCin] = useState(todayISO())
  const [cout, setCout] = useState(tomorrowISO())
  const [pickRoomId, setPickRoomId] = useState("")
  const [guest, setGuest] = useState(() => emptyGuestDetails(todayISO(), tomorrowISO()))

  const userId = session?.userId ?? ""
  const me = state.profile
  const isWalkin = me?.email === "walkin@hotel.local"

  const mine = useMemo(
    () =>
      state.bookings
        .filter((b) => b.clientUserId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state.bookings, userId],
  )

  const available = useMemo(() => {
    if (!cin || !cout || cin >= cout) return []
    return state.rooms
      .filter((r) => roomFree(r.id, cin, cout))
      .sort((a, b) => a.priceGhs - b.priceGhs)
  }, [state.rooms, cin, cout, roomFree])

  if (!ready) return null
  if (!session || session.role !== "client") {
    router.replace("/login")
    return null
  }

  const openBook = () => {
    setPickRoomId("")
    setGuest(
      emptyGuestDetails(cin, cout, {
        fullName: me?.fullName,
        phone: me?.phone,
        email: me?.email,
      }),
    )
    setBookOpen(true)
  }

  const confirmBook = async () => {
    if (isWalkin) {
      toast({ title: "Walk-in account", description: "Please book at reception.", variant: "destructive" })
      return
    }
    if (!cin || !cout || cin >= cout) {
      toast({ title: "Invalid dates", description: "Check-out must be after check-in.", variant: "destructive" })
      return
    }
    const err = validateGuestDetails(guest)
    if (err) {
      toast({ title: "Guest register incomplete", description: err, variant: "destructive" })
      return
    }
    if (!pickRoomId) {
      toast({ title: "Choose a room", variant: "destructive" })
      return
    }
    const r = await createBooking(pickRoomId, session.userId, cin, cout, guest)
    if ("error" in r) {
      toast({ title: "Booking failed", description: r.error, variant: "destructive" })
      return
    }
    toast({ title: "Booking created", description: "See reception with ID on arrival." })
    setBookOpen(false)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-7 w-7 text-amber-700" />
            <div>
              <h1 className="text-lg font-semibold">Guest portal</h1>
              <p className="text-sm text-slate-500">
                {me?.fullName} · Prices in GHS
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={async () => { await logout(); router.push("/login") }}>
            <LogOut className="h-4 w-4 mr-1" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Book a room</CardTitle>
              <CardDescription>Pick dates, then choose from available single rooms.</CardDescription>
            </div>
            {!isWalkin && (
              <Button onClick={openBook}>New booking</Button>
            )}
          </CardHeader>
          <CardContent>
            {isWalkin && (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-3">
                This account is for lobby walk-ins only. Guests can register their own email or staff can create a booking at Reception.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mine.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-500 py-8">
                      No bookings yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  mine.map((b) => {
                    const room = state.rooms.find((r) => r.id === b.roomId)
                    return (
                      <TableRow key={b.id}>
                        <TableCell>{room?.roomNumber}</TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {b.checkInDate} → {b.checkOutDate}
                        </TableCell>
                        <TableCell><Badge>{b.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          {b.status === "booked" && !isWalkin && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                const r = await cancelBookingAction(b.id)
                                if ("error" in r) {
                                  toast({ title: "Cancel failed", description: r.error, variant: "destructive" })
                                } else {
                                  toast({ title: "Booking cancelled" })
                                }
                              }}
                            >
                              Cancel
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      <Dialog open={bookOpen} onOpenChange={setBookOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New booking (Ghana guest register)</DialogTitle>
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
              <Label>Available rooms (sorted by price)</Label>
              <Select value={pickRoomId} onValueChange={setPickRoomId}>
                <SelectTrigger>
                  <SelectValue placeholder={available.length ? "Select room" : "No rooms for these dates"} />
                </SelectTrigger>
                <SelectContent>
                  {available.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      Room {r.roomNumber} — {formatGhs(r.priceGhs)}/night
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <GhanaGuestForm value={guest} onChange={setGuest} idPrefix="c" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookOpen(false)}>Close</Button>
            <Button onClick={confirmBook}>Confirm booking</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
