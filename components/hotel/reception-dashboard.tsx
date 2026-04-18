"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BedDouble,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock,
  ExternalLink,
  LogOut,
  Package,
  Plus,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
  WalletCards,
} from "lucide-react";
import { useHotel } from "@/components/hotel/HotelProvider";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { formatGhs, todayISO, tomorrowISO } from "@/lib/hotel/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GhanaGuestForm,
  emptyGuestDetails,
  validateGuestDetails,
} from "@/components/hotel/ghana-guest-form";
import type { GuestDetailsGhana } from "@/lib/hotel/types";

const STATUS_STYLES: Record<string, string> = {
  pending_payment: "bg-sky-100 text-sky-700 border-sky-200",
  booked: "bg-amber-100 text-amber-700 border-amber-200",
  checked_in: "bg-emerald-100 text-emerald-700 border-emerald-200",
  checked_out: "bg-slate-100 text-slate-600 border-slate-200",
  cancelled: "bg-red-100 text-red-500 border-red-200",
};

function rateUnit(kind: "guest" | "conference") {
  return kind === "conference" ? "day" : "night";
}

function paymentMethodLabel(method: string) {
  const map: Record<string, string> = {
    momo: "MTN Mobile Money",
    telecel_cash: "Telecel Cash",
    card: "Card",
    cash: "Cash",
  };
  return map[method] ?? method;
}

export function ReceptionDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    state,
    session,
    ready,
    logout,
    createBooking,
    checkInAction,
    checkOutAction,
    confirmPaymentAction,
    resendCashEmailAction,
    roomFree,
    createSupplyRequestAction,
  } = useHotel();

  const [search, setSearch] = useState("");
  const [walkOpen, setWalkOpen] = useState(false);
  const [cin, setCin] = useState(todayISO());
  const [cout, setCout] = useState(tomorrowISO());
  const [roomId, setRoomId] = useState<string>("");
  const [guest, setGuest] = useState<GuestDetailsGhana>(() =>
    emptyGuestDetails(todayISO(), tomorrowISO()),
  );

  const [supplyOpen, setSupplyOpen] = useState(false);
  const [supplyRoomId, setSupplyRoomId] = useState("");
  const [supplyItems, setSupplyItems] = useState<Record<string, number>>({});
  const [supplyNotes, setSupplyNotes] = useState("");
  const [supplyLoading, setSupplyLoading] = useState(false);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [cashReceivedByBooking, setCashReceivedByBooking] = useState<Record<string, string>>({});
  const [confirmingCashBookingId, setConfirmingCashBookingId] = useState<string | null>(null);
  const [resendingCashEmailBookingId, setResendingCashEmailBookingId] = useState<string | null>(null);

  const today = todayISO();

  const checkInsToday = useMemo(
    () =>
      state.bookings.filter(
        (b) => b.checkInDate === today && b.status === "booked",
      ).length,
    [state.bookings, today],
  );

  const checkOutsToday = useMemo(
    () =>
      state.bookings.filter(
        (b) => b.checkOutDate === today && b.status === "checked_in",
      ).length,
    [state.bookings, today],
  );

  const occupiedRooms = useMemo(
    () => state.rooms.filter((r) => r.status === "occupied").length,
    [state.rooms],
  );

  const availableRooms = useMemo(
    () => state.rooms.filter((r) => r.status === "available").length,
    [state.rooms],
  );

  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase();
    const active = state.bookings.filter((b) => b.status !== "cancelled");
    if (!q)
      return active
        .slice()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return active
      .filter((b) => {
        const g = b.guestDetails;
        return (
          g.fullName.toLowerCase().includes(q) ||
          g.phone.includes(q) ||
          g.email.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [state.bookings, search]);

  const availableForWalkin = useMemo(() => {
    if (!cin || !cout || cin >= cout) return [];
    return state.rooms.filter((r) => roomFree(r.id, cin, cout));
  }, [state.rooms, cin, cout, roomFree]);

  const pendingSupplyCount = useMemo(
    () => state.supplyRequests.filter((r) => r.status === "pending").length,
    [state.supplyRequests],
  );

  const paidBookings = useMemo(() => {
    return state.bookings
      .filter((b) => b.guestDetails.paymentStatus === "paid")
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((b) => {
        const room = state.rooms.find((r) => r.id === b.roomId);
        const start = new Date(`${b.checkInDate}T00:00:00Z`).getTime();
        const end = new Date(`${b.checkOutDate}T00:00:00Z`).getTime();
        const nights = Math.max(
          1,
          Math.round((end - start) / (1000 * 60 * 60 * 24)),
        );
        const note = b.guestDetails.paymentNote ?? "";
        const paystackRef = note.match(/paystack_ref:([^|\s]+)/)?.[1];
        const cashRef = note.match(/cash_ref:([^|\s]+)/)?.[1];
        const cashReceived = note.match(/cash_received_ghs:([0-9]+(?:\.[0-9]+)?)/)?.[1];
        const amountGhs =
          cashReceived !== undefined
            ? Number(cashReceived)
            : (room?.priceGhs ?? 0) * nights;
        const reference = paystackRef ?? cashRef ?? "—";
        const paidAtIso = note.match(/paid_at:([^|\s]+)/)?.[1] ?? null;
        return {
          booking: b,
          room,
          amountGhs,
          reference,
          paidAtIso,
        };
      });
  }, [state.bookings, state.rooms]);

  const occupiedOrBookedRooms = useMemo(
    () =>
      state.rooms.filter(
        (r) => r.status === "occupied" || r.status === "booked",
      ),
    [state.rooms],
  );

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <Building2 className="h-10 w-10 text-amber-400 animate-pulse" />
          <p className="text-slate-400 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!session || session.role !== "receptionist") {
    router.replace("/login");
    return null;
  }

  const submitWalkIn = async () => {
    if (!cin || !cout || cin >= cout) {
      toast({
        title: "Invalid dates",
        description: "Check-out must be after check-in.",
        variant: "destructive",
      });
      return;
    }
    const err = validateGuestDetails(guest);
    if (err) {
      toast({
        title: "Guest register incomplete",
        description: err,
        variant: "destructive",
      });
      return;
    }
    if (!roomId) {
      toast({ title: "Select a room", variant: "destructive" });
      return;
    }
    const walkId = state.walkInClientId;
    if (!walkId) {
      toast({
        title: "Walk-in account missing",
        description:
          "Run npm run db:seed so the walk-in account exists, then refresh.",
        variant: "destructive",
      });
      return;
    }
    if (!roomFree(roomId, cin, cout)) {
      toast({ title: "Room no longer available", variant: "destructive" });
      return;
    }
    if (guest.paymentMethod !== "cash") {
      toast({
        title: "Walk-in payment method",
        description:
          "For walk-ins, use cash and confirm payment from the bookings table.",
        variant: "destructive",
      });
      return;
    }
    const r = await createBooking(roomId, walkId, cin, cout, guest);
    if ("error" in r) {
      toast({
        title: "Booking failed",
        description: r.error,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "✅ Walk-in booking created (pending payment)" });
    setWalkOpen(false);
    setRoomId("");
  };

  const submitSupply = async () => {
    const selectedItems = Object.entries(supplyItems)
      .filter(([, qty]) => qty > 0)
      .map(([storeItemId, quantity]) => {
        const item = state.storeItems.find((i) => i.id === storeItemId);
        return {
          storeItemId,
          itemName: item?.name ?? storeItemId,
          quantity,
        };
      });

    if (!supplyRoomId) {
      toast({ title: "Select a room", variant: "destructive" });
      return;
    }
    if (selectedItems.length === 0) {
      toast({ title: "Select at least one item", variant: "destructive" });
      return;
    }

    setSupplyLoading(true);
    const r = await createSupplyRequestAction(
      supplyRoomId,
      selectedItems,
      supplyNotes.trim() || undefined,
    );
    setSupplyLoading(false);
    if ("error" in r) {
      toast({
        title: "Request failed",
        description: r.error,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "✅ Supply request created" });
    setSupplyOpen(false);
    setSupplyRoomId("");
    setSupplyItems({});
    setSupplyNotes("");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ───────────────────────────────────────────── */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-xl">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-sky-400/10 border border-sky-400/30 rounded-xl p-2.5">
              <Building2 className="h-7 w-7 text-sky-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Waterhouse Lodge
              </h1>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-sky-400" />
                Front Desk
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-300">{session.email}</span>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setGuest(emptyGuestDetails(cin, cout));
                setRoomId("");
                setWalkOpen(true);
              }}
              className="bg-sky-500 hover:bg-sky-600 text-white border-0"
            >
              <UserPlus className="h-4 w-4 mr-1.5" />
              Walk-in
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                await logout();
                router.push("/login");
              }}
              className="text-slate-300 hover:text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* ── Stat cards ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Check-ins today"
            value={checkInsToday}
            icon={<ArrowDownCircle className="h-5 w-5" />}
            gradient="from-emerald-600 to-emerald-500"
          />
          <StatCard
            label="Check-outs today"
            value={checkOutsToday}
            icon={<ArrowUpCircle className="h-5 w-5" />}
            gradient="from-slate-700 to-slate-600"
          />
          <StatCard
            label="Occupied rooms"
            value={occupiedRooms}
            icon={<Users className="h-5 w-5" />}
            gradient="from-red-600 to-red-500"
          />
          <StatCard
            label="Available rooms"
            value={availableRooms}
            icon={<BedDouble className="h-5 w-5" />}
            gradient="from-sky-600 to-sky-500"
          />
        </div>

        {/* ── Today's activity ───────────────────────────────── */}
        {(checkInsToday > 0 || checkOutsToday > 0) && (
          <div className="grid sm:grid-cols-2 gap-4">
            {checkInsToday > 0 && (
              <Card className="border-0 shadow-sm border-l-4 border-l-emerald-500">
                <CardContent className="pt-5 pb-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <ArrowDownCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">
                      {checkInsToday}
                    </p>
                    <p className="text-sm text-slate-500">
                      guest{checkInsToday !== 1 ? "s" : ""} arriving today
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            {checkOutsToday > 0 && (
              <Card className="border-0 shadow-sm border-l-4 border-l-slate-500">
                <CardContent className="pt-5 pb-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <ArrowUpCircle className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">
                      {checkOutsToday}
                    </p>
                    <p className="text-sm text-slate-500">
                      guest{checkOutsToday !== 1 ? "s" : ""} checking out today
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── Room status strip ──────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {state.rooms.map((r) => {
            const styles = {
              available: {
                bg: "bg-emerald-50 border-emerald-200",
                dot: "bg-emerald-500",
                text: "text-emerald-700",
              },
              booked: {
                bg: "bg-amber-50 border-amber-200",
                dot: "bg-amber-500",
                text: "text-amber-700",
              },
              occupied: {
                bg: "bg-red-50 border-red-200",
                dot: "bg-red-500",
                text: "text-red-700",
              },
            }[r.status];
            return (
              <div
                key={r.id}
                className={`border rounded-xl px-4 py-3 ${styles.bg} flex items-start justify-between gap-3`}
              >
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                    Room
                  </p>
                  <p className="text-xl font-bold text-slate-800">
                    {r.roomNumber}
                  </p>
                  {r.kind === "conference" ? (
                    <Badge
                      variant="outline"
                      className="mt-1 border-violet-200 bg-violet-50 text-violet-800 text-[10px] px-1.5 py-0"
                    >
                      Conference
                    </Badge>
                  ) : null}
                  {r.description ? (
                    <p className="mt-1 text-[11px] leading-snug text-slate-500">
                      {r.description}
                    </p>
                  ) : null}
                </div>
                <div
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${styles.bg} ${styles.text}`}
                >
                  <div className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
                  {r.status}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Room Supplies ──────────────────────────────────── */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <Package className="h-4 w-4 text-sky-500" />
                  Room Supplies
                </CardTitle>
                {pendingSupplyCount > 0 && (
                  <Badge className="bg-amber-100 text-amber-700 border border-amber-200 text-xs hover:bg-amber-100">
                    {pendingSupplyCount} pending
                  </Badge>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setSupplyRoomId("");
                  setSupplyItems({});
                  setSupplyNotes("");
                  setSupplyOpen(true);
                }}
                className="bg-sky-500 hover:bg-sky-600 text-white border-0"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Request supplies
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {state.supplyRequests.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-slate-400">
                <Package className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">No supply requests yet.</p>
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden border border-slate-100">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Room
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Items needed
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Requested by
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Time
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {state.supplyRequests.map((req, idx) => (
                      <TableRow
                        key={req.id}
                        className={
                          idx % 2 === 0
                            ? "bg-white hover:bg-slate-50/80"
                            : "bg-slate-50/50 hover:bg-slate-50"
                        }
                      >
                        <TableCell>
                          <span className="inline-flex items-center justify-center bg-slate-900 text-white text-xs font-bold rounded-lg px-2.5 py-1">
                            {req.roomNumber}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            {req.items.map((it, i) => (
                              <span key={i} className="text-xs text-slate-600">
                                {it.quantity}× {it.itemName}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {req.requestedByEmail}
                        </TableCell>
                        <TableCell className="text-xs text-slate-400 whitespace-nowrap">
                          {format(parseISO(req.createdAt), "MMM d, HH:mm")}
                        </TableCell>
                        <TableCell>
                          {req.status === "pending" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border bg-amber-100 text-amber-700 border-amber-200">
                              <Clock className="h-3 w-3" />
                              pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border bg-emerald-100 text-emerald-700 border-emerald-200">
                              <CheckCircle2 className="h-3 w-3" />
                              fulfilled
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Bookings + Payments tabs ───────────────────────── */}
        <Tabs defaultValue="bookings" className="space-y-4">
          <TabsList className="bg-white border border-slate-200 rounded-xl p-1 h-auto inline-flex">
            <TabsTrigger
              value="bookings"
              className="data-[state=active]:bg-sky-600 data-[state=active]:text-white"
            >
              <ClipboardList className="h-4 w-4 mr-1.5" />
              Bookings
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
            >
              <WalletCards className="h-4 w-4 mr-1.5" />
              Payments ({paidBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-sky-500" />
                      All bookings
                    </CardTitle>
                    <CardDescription>
                      Search by guest name, phone or email
                    </CardDescription>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      className="pl-9 border-slate-200 focus:border-sky-400 focus:ring-sky-400/20"
                      placeholder="Search guest…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredBookings.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-slate-400">
                    <CalendarClock className="h-10 w-10 mb-3 opacity-30" />
                    <p className="text-sm">
                      {search
                        ? "No bookings match your search."
                        : "No bookings yet."}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl overflow-hidden border border-slate-100">
                    <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Guest
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Room
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Check-in
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Check-out
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Status
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Booking details
                      </TableHead>
                      <TableHead className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((b, idx) => {
                      const room = state.rooms.find((r) => r.id === b.roomId);
                      const isToday =
                        b.checkInDate === today || b.checkOutDate === today;
                      return (
                        <Fragment key={b.id}>
                        <TableRow
                          className={
                            isToday
                              ? "bg-sky-50/60 hover:bg-sky-50"
                              : idx % 2 === 0
                                ? "bg-white hover:bg-slate-50/80"
                                : "bg-slate-50/50 hover:bg-slate-50"
                          }
                        >
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-600 to-slate-800 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {b.guestDetails.fullName
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-slate-800 text-sm">
                                  {b.guestDetails.fullName}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {b.guestDetails.phone}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center justify-center bg-slate-900 text-white text-xs font-bold rounded-lg px-2.5 py-1">
                              {room?.roomNumber ?? "—"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`text-sm ${b.checkInDate === today ? "font-semibold text-emerald-700" : "text-slate-600"}`}
                            >
                              {b.checkInDate}
                              {b.checkInDate === today && (
                                <span className="ml-1 text-xs bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full">
                                  today
                                </span>
                              )}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`text-sm ${b.checkOutDate === today ? "font-semibold text-amber-700" : "text-slate-600"}`}
                            >
                              {b.checkOutDate}
                              {b.checkOutDate === today && (
                                <span className="ml-1 text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full">
                                  today
                                </span>
                              )}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[b.status] ?? ""}`}
                            >
                              {b.status.replace("_", " ")}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() =>
                                setExpandedBookingId((prev) =>
                                  prev === b.id ? null : b.id,
                                )
                              }
                            >
                              {expandedBookingId === b.id
                                ? "Hide details"
                                : "View details"}
                            </Button>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            {b.status === "pending_payment" &&
                              b.guestDetails.paymentMethod === "cash" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs"
                                  onClick={() => setExpandedBookingId(b.id)}
                                >
                                  Cash details
                                </Button>
                              )}
                            {b.status === "booked" && (
                              <Button
                                size="sm"
                                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={async () => {
                                  const r = await checkInAction(b.id);
                                  if ("error" in r) {
                                    toast({
                                      title: "Check-in failed",
                                      description: r.error,
                                      variant: "destructive",
                                    });
                                  } else {
                                    toast({ title: "✅ Checked in" });
                                  }
                                }}
                              >
                                <ArrowDownCircle className="h-3 w-3 mr-1" />
                                Check-in
                              </Button>
                            )}
                            {b.status === "checked_in" && (
                              <Button
                                size="sm"
                                className="h-7 text-xs bg-slate-700 hover:bg-slate-800 text-white"
                                onClick={async () => {
                                  const r = await checkOutAction(b.id);
                                  if ("error" in r) {
                                    toast({
                                      title: "Check-out failed",
                                      description: r.error,
                                      variant: "destructive",
                                    });
                                  } else {
                                    toast({ title: "✅ Checked out" });
                                  }
                                }}
                              >
                                <ArrowUpCircle className="h-3 w-3 mr-1" />
                                Check-out
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                        {expandedBookingId === b.id ? (
                          <TableRow className="bg-sky-50/40">
                            <TableCell colSpan={7}>
                              <div className="rounded-lg border border-slate-200 bg-white p-4">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                  Guest details used for booking
                                </p>
                                <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                                  <p>
                                    <span className="font-medium">Full name:</span>{" "}
                                    {b.guestDetails.fullName}
                                  </p>
                                  <p>
                                    <span className="font-medium">Nationality:</span>{" "}
                                    {b.guestDetails.nationality}
                                  </p>
                                  <p>
                                    <span className="font-medium">Phone:</span>{" "}
                                    {b.guestDetails.phone}
                                  </p>
                                  <p>
                                    <span className="font-medium">Email:</span>{" "}
                                    {b.guestDetails.email}
                                  </p>
                                  <p>
                                    <span className="font-medium">Date of birth:</span>{" "}
                                    {b.guestDetails.dateOfBirth || "—"}
                                  </p>
                                  <p>
                                    <span className="font-medium">Occupation:</span>{" "}
                                    {b.guestDetails.occupation || "—"}
                                  </p>
                                  <p>
                                    <span className="font-medium">Marital status:</span>{" "}
                                    {b.guestDetails.maritalStatus || "—"}
                                  </p>
                                  <p>
                                    <span className="font-medium">Permanent address:</span>{" "}
                                    {b.guestDetails.permanentAddress || "—"}
                                  </p>
                                  <p>
                                    <span className="font-medium">ID type:</span>{" "}
                                    {b.guestDetails.idType.replace("_", " ")}
                                  </p>
                                  <p>
                                    <span className="font-medium">ID number:</span>{" "}
                                    {b.guestDetails.idNumber || "—"}
                                  </p>
                                  <p>
                                    <span className="font-medium">Passport number:</span>{" "}
                                    {b.guestDetails.passportNumber || "—"}
                                  </p>
                                  <p>
                                    <span className="font-medium">ETA:</span>{" "}
                                    {b.guestDetails.eta || "—"}
                                  </p>
                                  <p>
                                    <span className="font-medium">Payment:</span>{" "}
                                    {b.guestDetails.paymentMethod} /{" "}
                                    {b.guestDetails.paymentStatus}
                                  </p>
                                  <p>
                                    <span className="font-medium">Payment note:</span>{" "}
                                    {b.guestDetails.paymentNote || "—"}
                                  </p>
                                </div>
                                <div className="mt-4">
                                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Uploaded ID for check-in
                                  </p>
                                  {b.guestDetails.idPhotoUrl ? (
                                    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
                                      <img
                                        src={b.guestDetails.idPhotoUrl}
                                        alt={`ID uploaded for ${b.guestDetails.fullName}`}
                                        className="h-32 w-32 rounded-md border border-slate-200 object-cover"
                                      />
                                      <a
                                        href={b.guestDetails.idPhotoUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-sm font-medium text-sky-700 hover:underline"
                                      >
                                        Open full ID image
                                        <ExternalLink className="h-3.5 w-3.5" />
                                      </a>
                                    </div>
                                  ) : (
                                    <p className="mt-2 text-sm text-red-600">
                                      No uploaded ID image found for this booking.
                                    </p>
                                  )}
                                </div>

                                {b.status === "pending_payment" &&
                                b.guestDetails.paymentMethod === "cash" ? (
                                  <div className="mt-4 border-t border-slate-200 pt-4">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                                      Confirm cash payment
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                                      <div className="w-full sm:max-w-[220px]">
                                        <Label className="text-xs font-medium text-slate-600">
                                          Amount received (GHS)
                                        </Label>
                                        <Input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={cashReceivedByBooking[b.id] ?? ""}
                                          onChange={(e) =>
                                            setCashReceivedByBooking((prev) => ({
                                              ...prev,
                                              [b.id]: e.target.value,
                                            }))
                                          }
                                          placeholder="e.g. 230"
                                        />
                                      </div>
                                      <Button
                                        className="bg-sky-600 hover:bg-sky-700 text-white"
                                        disabled={confirmingCashBookingId === b.id}
                                        onClick={async () => {
                                          const amount = Number(
                                            cashReceivedByBooking[b.id] ?? "",
                                          );
                                          if (!Number.isFinite(amount) || amount <= 0) {
                                            toast({
                                              title: "Enter valid amount",
                                              description:
                                                "Input the cash amount received before generating cash ref.",
                                              variant: "destructive",
                                            });
                                            return;
                                          }
                                          setConfirmingCashBookingId(b.id);
                                          const r = await confirmPaymentAction(b.id, amount);
                                          setConfirmingCashBookingId(null);
                                          if ("error" in r) {
                                            toast({
                                              title: "Cash confirmation failed",
                                              description: r.error,
                                              variant: "destructive",
                                            });
                                            return;
                                          }
                                          setCashReceivedByBooking((prev) => ({
                                            ...prev,
                                            [b.id]: "",
                                          }));
                                          toast({
                                            title: "✅ Cash payment confirmed",
                                            description:
                                              "Cash ref generated, emails sent, and booking updated to booked.",
                                          });
                                        }}
                                      >
                                        {confirmingCashBookingId === b.id
                                          ? "Generating..."
                                          : "Generate cash ref & confirm"}
                                      </Button>
                                    </div>
                                  </div>
                                ) : null}

                                        {b.guestDetails.paymentMethod === "cash" &&
                                        b.guestDetails.paymentStatus === "paid" ? (
                                          <div className="mt-4 border-t border-slate-200 pt-4">
                                            <div className="flex flex-wrap items-center gap-2">
                                              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                Cash email status
                                              </p>
                                              <span
                                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                                                  (b.guestDetails.paymentNote ?? "").includes("cash_email_status:sent")
                                                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                                    : (b.guestDetails.paymentNote ?? "").includes("cash_email_status:failed")
                                                      ? "bg-red-100 text-red-700 border-red-200"
                                                      : "bg-amber-100 text-amber-700 border-amber-200"
                                                }`}
                                              >
                                                {(b.guestDetails.paymentNote ?? "").includes("cash_email_status:sent")
                                                  ? "sent"
                                                  : (b.guestDetails.paymentNote ?? "").includes("cash_email_status:failed")
                                                    ? "failed"
                                                    : "pending"}
                                              </span>
                                            </div>
                                            <div className="mt-2">
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={resendingCashEmailBookingId === b.id}
                                                onClick={async () => {
                                                  setResendingCashEmailBookingId(b.id);
                                                  const r = await resendCashEmailAction(b.id);
                                                  setResendingCashEmailBookingId(null);
                                                  if ("error" in r) {
                                                    toast({
                                                      title: "Resend failed",
                                                      description: r.error,
                                                      variant: "destructive",
                                                    });
                                                    return;
                                                  }
                                                  toast({
                                                    title: "✅ Cash emails resent",
                                                    description: "Guest and admin confirmation emails were resent.",
                                                  });
                                                }}
                                              >
                                                {resendingCashEmailBookingId === b.id
                                                  ? "Resending..."
                                                  : "Resend cash emails"}
                                              </Button>
                                            </div>
                                          </div>
                                        ) : null}
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : null}
                        </Fragment>
                      );
                    })}
                  </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <WalletCards className="h-4 w-4 text-emerald-600" />
                  Received payments
                </CardTitle>
                <CardDescription>
                  Payment ledger for all successful bookings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paidBookings.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-slate-400">
                    <WalletCards className="h-10 w-10 mb-3 opacity-30" />
                    <p className="text-sm">No received payments yet.</p>
                  </div>
                ) : (
                  <div className="rounded-xl overflow-hidden border border-slate-100">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Paid at
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Guest
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Contact
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Room
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Method
                          </TableHead>
                          <TableHead className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Amount
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Reference
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paidBookings.map((p, idx) => (
                          <TableRow
                            key={p.booking.id}
                            className={
                              idx % 2 === 0
                                ? "bg-white hover:bg-slate-50/80"
                                : "bg-slate-50/50 hover:bg-slate-50"
                            }
                          >
                            <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                              {p.paidAtIso
                                ? format(parseISO(p.paidAtIso), "MMM d, yyyy HH:mm")
                                : format(parseISO(p.booking.createdAt), "MMM d, yyyy HH:mm")}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-slate-800 text-sm">
                                  {p.booking.guestDetails.fullName}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {p.booking.guestDetails.email}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-slate-700">
                              {p.booking.guestDetails.phone}
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center justify-center bg-slate-900 text-white text-xs font-bold rounded-lg px-2.5 py-1">
                                {p.room?.roomNumber ?? "—"}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-slate-700">
                              {paymentMethodLabel(p.booking.guestDetails.paymentMethod)}
                            </TableCell>
                            <TableCell className="text-right text-sm font-semibold text-emerald-700">
                              {formatGhs(p.amountGhs)}
                            </TableCell>
                            <TableCell className="text-xs font-mono text-slate-600">
                              {p.reference}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* ── Walk-in dialog ─────────────────────────────────── */}
      <Dialog open={walkOpen} onOpenChange={setWalkOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <UserPlus className="h-4 w-4 text-sky-500" />
              Walk-in reservation
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-slate-600">
                  Check-in *
                </Label>
                <Input
                  type="date"
                  value={cin}
                  onChange={(e) => {
                    const v = e.target.value;
                    setCin(v);
                    setGuest((g) => ({ ...g, checkInDateTime: `${v}T14:00` }));
                  }}
                  className="mt-1 border-slate-200 focus:border-sky-400"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600">
                  Check-out *
                </Label>
                <Input
                  type="date"
                  value={cout}
                  onChange={(e) => {
                    const v = e.target.value;
                    setCout(v);
                    setGuest((g) => ({
                      ...g,
                      checkOutDateTime: `${v}T11:00`,
                    }));
                  }}
                  className="mt-1 border-slate-200 focus:border-sky-400"
                />
              </div>
            </div>

            {/* Room picker */}
            <div>
              <Label className="text-xs font-medium text-slate-600">
                Room *
              </Label>
              <Select value={roomId} onValueChange={setRoomId}>
                <SelectTrigger className="mt-1 border-slate-200 focus:border-sky-400">
                  <SelectValue
                    placeholder={
                      availableForWalkin.length
                        ? "Select available room"
                        : "No rooms available for these dates"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableForWalkin.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      Room {r.roomNumber} — {formatGhs(r.priceGhs)}/{rateUnit(r.kind)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Room availability strip */}
            {availableForWalkin.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {availableForWalkin.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRoomId(r.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      roomId === r.id
                        ? "bg-sky-600 text-white border-sky-600"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                    }`}
                  >
                    Room {r.roomNumber}
                  </button>
                ))}
              </div>
            )}

            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Guest details
              </p>
              <GhanaGuestForm value={guest} onChange={setGuest} idPrefix="w" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setWalkOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitWalkIn}
              className="bg-sky-600 hover:bg-sky-700 text-white"
            >
              <UserPlus className="h-4 w-4 mr-1.5" />
              Create booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Supply request dialog ──────────────────────────── */}
      <Dialog open={supplyOpen} onOpenChange={setSupplyOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <Package className="h-4 w-4 text-sky-500" />
              Request room supplies
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Room selector */}
            <div>
              <Label className="text-xs font-medium text-slate-600">
                Room *
              </Label>
              <Select value={supplyRoomId} onValueChange={setSupplyRoomId}>
                <SelectTrigger className="mt-1 border-slate-200 focus:border-sky-400">
                  <SelectValue
                    placeholder={
                      occupiedOrBookedRooms.length
                        ? "Select occupied or booked room"
                        : "No occupied/booked rooms"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {occupiedOrBookedRooms.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      Room {r.roomNumber} ({r.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Items checklist */}
            <div>
              <Label className="text-xs font-medium text-slate-600 mb-2 block">
                Items *
              </Label>
              {state.storeItems.length === 0 ? (
                <p className="text-xs text-slate-400">
                  No store items available.
                </p>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto">
                  {state.storeItems.map((item) => {
                    const qty = supplyItems[item.id] ?? 0;
                    const checked = qty > 0;
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                          checked ? "bg-sky-50" : "bg-white hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          id={`supply-item-${item.id}`}
                          checked={checked}
                          onChange={(e) => {
                            setSupplyItems((prev) => {
                              const next = { ...prev };
                              if (e.target.checked) {
                                next[item.id] = 1;
                              } else {
                                delete next[item.id];
                              }
                              return next;
                            });
                          }}
                          className="h-4 w-4 rounded border-slate-300 accent-sky-600"
                        />
                        <label
                          htmlFor={`supply-item-${item.id}`}
                          className="flex-1 text-sm text-slate-700 cursor-pointer"
                        >
                          {item.name}
                          <span className="ml-1 text-xs text-slate-400">
                            ({item.quantity} {item.unit} in stock)
                          </span>
                        </label>
                        {checked && (
                          <Input
                            type="number"
                            min={1}
                            value={qty}
                            onChange={(e) => {
                              const v = Math.max(1, Number(e.target.value));
                              setSupplyItems((prev) => ({
                                ...prev,
                                [item.id]: v,
                              }));
                            }}
                            className="w-20 h-8 text-sm border-slate-200"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <Label className="text-xs font-medium text-slate-600">
                Notes (optional)
              </Label>
              <textarea
                value={supplyNotes}
                onChange={(e) => setSupplyNotes(e.target.value)}
                placeholder="Any special instructions…"
                rows={2}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/20 resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSupplyOpen(false)}
              disabled={supplyLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={submitSupply}
              disabled={supplyLoading}
              className="bg-sky-600 hover:bg-sky-700 text-white"
            >
              <Package className="h-4 w-4 mr-1.5" />
              {supplyLoading ? "Sending…" : "Send request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  gradient,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
}) {
  return (
    <div
      className={`bg-gradient-to-br ${gradient} rounded-xl p-4 text-white shadow-sm`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="opacity-80">{icon}</div>
      </div>
      <p className="text-3xl font-bold tracking-tight">{value}</p>
      <p className="text-xs mt-1 opacity-75 font-medium">{label}</p>
    </div>
  );
}
