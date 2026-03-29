"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import {
  Building2,
  ClipboardList,
  Download,
  LayoutDashboard,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react"
import { useHotel } from "@/components/hotel/HotelProvider"
import { useToast } from "@/hooks/use-toast"
import { formatGhs, todayISO } from "@/lib/hotel/dates"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

export function AdminDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const {
    state,
    session,
    ready,
    logout,
    addRoomAction,
    updateRoomAction,
    deleteRoomAction,
    checkInAction,
    checkOutAction,
    exportGuestRegisterCsv,
  } = useHotel()

  const [roomNum, setRoomNum] = useState("")
  const [roomPrice, setRoomPrice] = useState("")
  const [editRoomId, setEditRoomId] = useState<string | null>(null)
  const [editNum, setEditNum] = useState("")
  const [editPrice, setEditPrice] = useState("")

  const today = todayISO()

  const stats = useMemo(() => {
    const rooms = state.rooms
    const bookings = state.bookings
    return {
      total: rooms.length,
      available: rooms.filter((r) => r.status === "available").length,
      booked: rooms.filter((r) => r.status === "booked").length,
      occupied: rooms.filter((r) => r.status === "occupied").length,
      checkInsToday: bookings.filter(
        (b) => b.checkInDate === today && b.status !== "cancelled" && b.status !== "checked_out",
      ).length,
      checkOutsToday: bookings.filter(
        (b) => b.checkOutDate === today && b.status === "checked_in",
      ).length,
    }
  }, [state.rooms, state.bookings, today])

  if (!ready) return null

  if (!session || session.role !== "admin") {
    router.replace("/login")
    return null
  }

  const downloadRegister = async () => {
    try {
      const csv = await exportGuestRegisterCsv()
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `guest-register-${today}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast({ title: "Export ready", description: "Guest register CSV downloaded." })
    } catch {
      toast({ title: "Export failed", description: "Sign in as admin and try again.", variant: "destructive" })
    }
  }

  const handleAddRoom = async () => {
    const price = Number(roomPrice)
    if (!roomNum.trim() || Number.isNaN(price)) {
      toast({ title: "Invalid room", description: "Enter room number and price.", variant: "destructive" })
      return
    }
    const r = await addRoomAction(roomNum, price)
    if ("error" in r) {
      toast({ title: "Could not add room", description: r.error, variant: "destructive" })
      return
    }
    setRoomNum("")
    setRoomPrice("")
    toast({ title: "Room added", description: `Room ${roomNum} at ${formatGhs(price)}` })
  }

  const openEdit = (id: string) => {
    const r = state.rooms.find((x) => x.id === id)
    if (!r) return
    setEditRoomId(id)
    setEditNum(r.roomNumber)
    setEditPrice(String(r.priceGhs))
  }

  const saveEdit = async () => {
    if (!editRoomId) return
    const price = Number(editPrice)
    if (!editNum.trim() || Number.isNaN(price)) {
      toast({ title: "Invalid", description: "Check room number and price.", variant: "destructive" })
      return
    }
    const r = await updateRoomAction(editRoomId, { roomNumber: editNum, priceGhs: price })
    if ("error" in r) {
      toast({ title: "Update failed", description: r.error, variant: "destructive" })
      return
    }
    setEditRoomId(null)
    toast({ title: "Room updated" })
  }

  const handleDeleteRoom = async (id: string) => {
    const r = await deleteRoomAction(id)
    if ("error" in r) {
      toast({ title: "Cannot delete", description: r.error, variant: "destructive" })
      return
    }
    toast({ title: "Room removed" })
  }

  const clients = state.users.filter((u) => u.role === "client")

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-8 w-8 text-amber-700" />
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Admin</h1>
              <p className="text-sm text-slate-500">Ghana Hotel Manager — full access</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={downloadRegister}>
              <Download className="h-4 w-4 mr-1" />
              Guest register (CSV)
            </Button>
            <Button variant="ghost" size="sm" onClick={async () => { await logout(); router.push("/login") }}>
              <LogOut className="h-4 w-4 mr-1" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Stat label="Total rooms" value={stats.total} />
          <Stat label="Available" value={stats.available} />
          <Stat label="Booked" value={stats.booked} />
          <Stat label="Occupied" value={stats.occupied} />
          <Stat label="Check-ins today" value={stats.checkInsToday} />
          <Stat label="Check-outs today" value={stats.checkOutsToday} />
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="overview">
              <LayoutDashboard className="h-4 w-4 mr-1" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="rooms">
              <Building2 className="h-4 w-4 mr-1" />
              Rooms
            </TabsTrigger>
            <TabsTrigger value="bookings">
              <ClipboardList className="h-4 w-4 mr-1" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="clients">
              <Users className="h-4 w-4 mr-1" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="audit">Audit log</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Operations</CardTitle>
                <CardDescription>
                  Room statuses stay in sync with bookings (available → booked → occupied).
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={downloadRegister}>
                  Export guest register for authorities (CSV)
                </Button>
                <p className="text-sm text-slate-600">
                  Data lives in MongoDB. To clear the database, use your MongoDB tools or drop collections and run{" "}
                  <code className="text-xs bg-slate-100 px-1 rounded">npm run db:seed</code> again.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rooms">
            <Card>
              <CardHeader>
                <CardTitle>Rooms (all single, prices in GHS)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-3 items-end">
                  <div>
                    <Label>Room number</Label>
                    <Input value={roomNum} onChange={(e) => setRoomNum(e.target.value)} className="w-32" />
                  </div>
                  <div>
                    <Label>Price / night (GHS)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={roomPrice}
                      onChange={(e) => setRoomPrice(e.target.value)}
                      className="w-36"
                    />
                  </div>
                  <Button onClick={handleAddRoom}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add room
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room</TableHead>
                      <TableHead>Price / night</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {state.rooms.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.roomNumber}</TableCell>
                        <TableCell>{formatGhs(r.priceGhs)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{r.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="sm" onClick={() => openEdit(r.id)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteRoom(r.id)}>
                            <Trash2 className="h-3 w-3 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Dialog open={!!editRoomId} onOpenChange={(o) => !o && setEditRoomId(null)}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit room</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                      <div>
                        <Label>Number</Label>
                        <Input value={editNum} onChange={(e) => setEditNum(e.target.value)} />
                      </div>
                      <div>
                        <Label>Price (GHS)</Label>
                        <Input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={saveEdit}>Save</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>All bookings</CardTitle>
              </CardHeader>
              <CardContent>
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
                    {state.bookings
                      .slice()
                      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                      .map((b) => {
                        const room = state.rooms.find((r) => r.id === b.roomId)
                        return (
                          <TableRow key={b.id}>
                            <TableCell>{b.guestDetails.fullName}</TableCell>
                            <TableCell>{room?.roomNumber}</TableCell>
                            <TableCell className="whitespace-nowrap text-sm">
                              {b.checkInDate} → {b.checkOutDate}
                            </TableCell>
                            <TableCell>
                              <Badge>{b.status}</Badge>
                            </TableCell>
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
          </TabsContent>

          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <CardTitle>Registered clients (app users)</CardTitle>
                <CardDescription>Walk-in bookings use a shared lobby account; legal identity is on each booking.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Bookings</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients
                      .filter((u) => u.email !== "walkin@hotel.local")
                      .map((u) => {
                        const n = state.bookings.filter((b) => b.clientUserId === u.id).length
                        return (
                          <TableRow key={u.id}>
                            <TableCell>{u.fullName}</TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell>{u.phone ?? "—"}</TableCell>
                            <TableCell>{n}</TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>Audit log</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Who</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Detail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {state.auditLog.slice(0, 100).map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {format(parseISO(a.at), "yyyy-MM-dd HH:mm")}
                        </TableCell>
                        <TableCell className="text-sm">
                          {a.userEmail}
                          <Badge variant="outline" className="ml-2">{a.role}</Badge>
                        </TableCell>
                        <TableCell>{a.action}</TableCell>
                        <TableCell className="text-sm text-slate-600">{a.detail}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </CardContent>
    </Card>
  )
}
