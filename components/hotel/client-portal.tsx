"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BedDouble,
  Building2,
  CalendarCheck,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  Clock,
  LogOut,
  MapPin,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { useHotel } from "@/components/hotel/HotelProvider";
import { useToast } from "@/hooks/use-toast";
import { formatGhs, todayISO, tomorrowISO } from "@/lib/hotel/dates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  GhanaGuestForm,
  emptyGuestDetails,
  validateGuestDetails,
} from "@/components/hotel/ghana-guest-form";

const STATUS_CONFIG = {
  booked: {
    label: "Confirmed",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  checked_in: {
    label: "Checked In",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  checked_out: {
    label: "Checked Out",
    color: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-500 border-red-200",
    dot: "bg-red-400",
    icon: <X className="h-3.5 w-3.5" />,
  },
};

export function ClientPortal() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    state,
    session,
    ready,
    logout,
    createBooking,
    cancelBookingAction,
    roomFree,
  } = useHotel();

  const [bookOpen, setBookOpen] = useState(false);
  const [cin, setCin] = useState(todayISO());
  const [cout, setCout] = useState(tomorrowISO());
  const [pickedRoomIds, setPickedRoomIds] = useState<string[]>([]);
  const [booking, setBooking] = useState(false);
  const [guest, setGuest] = useState(() =>
    emptyGuestDetails(todayISO(), tomorrowISO()),
  );

  const userId = session?.userId ?? "";
  const me = state.profile;
  const isWalkin = me?.email === "walkin@waterhouselodge.local";

  const mine = useMemo(
    () =>
      state.bookings
        .filter((b) => b.clientUserId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state.bookings, userId],
  );

  const available = useMemo(() => {
    if (!cin || !cout || cin >= cout) return [];
    return state.rooms
      .filter((r) => roomFree(r.id, cin, cout))
      .sort((a, b) => a.priceGhs - b.priceGhs);
  }, [state.rooms, cin, cout, roomFree]);

  const activeBooking = mine.find(
    (b) => b.status === "checked_in" || b.status === "booked",
  );

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950">
        <div className="flex flex-col items-center gap-3">
          <Building2 className="h-10 w-10 text-amber-400 animate-pulse" />
          <p className="text-stone-400 text-sm">Loading your portal…</p>
        </div>
      </div>
    );
  }

  if (!session || session.role !== "client") {
    router.replace("/login");
    return null;
  }

  const toggleRoom = (id: string) => {
    setPickedRoomIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const openBook = () => {
    if (pickedRoomIds.length === 0) return;
    setGuest(
      emptyGuestDetails(cin, cout, {
        fullName: me?.fullName,
        phone: me?.phone,
        email: me?.email,
      }),
    );
    setBookOpen(true);
  };

  const confirmBook = async () => {
    if (isWalkin) {
      toast({
        title: "Walk-in account",
        description: "Please book at reception.",
        variant: "destructive",
      });
      return;
    }
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
        title: "Incomplete details",
        description: err,
        variant: "destructive",
      });
      return;
    }
    if (pickedRoomIds.length === 0) {
      toast({
        title: "Please choose at least one room",
        variant: "destructive",
      });
      return;
    }

    setBooking(true);
    let successCount = 0;
    for (const roomId of pickedRoomIds) {
      const r = await createBooking(roomId, session.userId, cin, cout, guest);
      if ("error" in r) {
        toast({
          title: `Room ${available.find((x) => x.id === roomId)?.roomNumber ?? roomId} failed`,
          description: r.error,
          variant: "destructive",
        });
      } else {
        successCount++;
      }
    }
    setBooking(false);

    if (successCount > 0) {
      toast({
        title: `🎉 ${successCount} room${successCount > 1 ? "s" : ""} booked!`,
        description: "Present your ID at reception on arrival.",
      });
      setPickedRoomIds([]);
      setBookOpen(false);
    }
  };

  const nights = (a: string, b: string) => {
    const diff = new Date(b).getTime() - new Date(a).getTime();
    return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
  };

  const pickedRooms = available.filter((r) => pickedRoomIds.includes(r.id));
  const totalPrice = pickedRooms.reduce(
    (sum, r) => sum + r.priceGhs * nights(cin, cout),
    0,
  );

  return (
    <div className="min-h-screen bg-stone-50">
      {/* ── Header ───────────────────────────────────────────── */}
      <header className="bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 shadow-2xl">
        <div className="max-w-4xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-2.5">
              <Building2 className="h-7 w-7 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Waterhouse Lodge
              </h1>
              <p className="text-xs text-stone-400 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-amber-400" />
                Accra, Ghana
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-stone-300">{me?.fullName}</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                await logout();
                router.push("/login");
              }}
              className="text-stone-300 hover:text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* ── Welcome banner ───────────────────────────────────── */}
        <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-2xl px-6 py-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-4 top-4 opacity-10">
            <Star className="h-32 w-32" />
          </div>
          <p className="text-amber-200 text-sm font-medium flex items-center gap-1 mb-1">
            <Sparkles className="h-3.5 w-3.5" /> Welcome back
          </p>
          <h2 className="text-2xl font-bold tracking-tight">
            {me?.fullName ?? "Guest"}
          </h2>
          {activeBooking ? (
            <div className="mt-3 flex items-center gap-2 bg-white/15 rounded-xl px-4 py-2.5 w-fit">
              <CalendarCheck className="h-4 w-4 text-amber-200 shrink-0" />
              <span className="text-sm text-amber-100">
                {activeBooking.status === "checked_in"
                  ? `Currently in Room ${state.rooms.find((r) => r.id === activeBooking.roomId)?.roomNumber ?? "—"} · Checkout ${activeBooking.checkOutDate}`
                  : `Upcoming stay · Room ${state.rooms.find((r) => r.id === activeBooking.roomId)?.roomNumber ?? "—"} · ${activeBooking.checkInDate}`}
              </span>
            </div>
          ) : (
            <p className="text-amber-200 text-sm mt-1">
              Ready to book your next stay?
            </p>
          )}
        </div>

        {/* ── Walk-in notice ────────────────────────────────────── */}
        {isWalkin && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-sm text-amber-800">
            <strong>Walk-in account</strong> — This account is for lobby
            walk-ins only. Please register your own email or ask reception to
            create a booking for you.
          </div>
        )}

        {/* ── Book a room ───────────────────────────────────────── */}
        {!isWalkin && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-stone-800 flex items-center gap-2">
                  <BedDouble className="h-4 w-4 text-amber-500" />
                  Book a room
                </h3>
                <p className="text-sm text-stone-400 mt-0.5">
                  Choose your dates to see available rooms
                </p>
              </div>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Date pickers */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2 block">
                    Check-in
                  </Label>
                  <Input
                    type="date"
                    value={cin}
                    min={todayISO()}
                    onChange={(e) => setCin(e.target.value)}
                    className="border-stone-200 focus:border-amber-400 focus:ring-amber-400/20 bg-stone-50"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2 block">
                    Check-out
                  </Label>
                  <Input
                    type="date"
                    value={cout}
                    min={cin || todayISO()}
                    onChange={(e) => setCout(e.target.value)}
                    className="border-stone-200 focus:border-amber-400 focus:ring-amber-400/20 bg-stone-50"
                  />
                </div>
              </div>

              {/* Room cards */}
              {cin && cout && cin < cout ? (
                available.length === 0 ? (
                  <div className="text-center py-10 text-stone-400">
                    <BedDouble className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">
                      No rooms available for these dates.
                    </p>
                    <p className="text-xs mt-1">Try different dates.</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
                      {available.length} room{available.length !== 1 ? "s" : ""}{" "}
                      available
                    </p>
                    <p className="text-xs text-stone-400 mb-2">
                      Tap to select · You can pick multiple rooms
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {available.map((r) => {
                        const n = nights(cin, cout);
                        const total = r.priceGhs * n;
                        const selected = pickedRoomIds.includes(r.id);
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => toggleRoom(r.id)}
                            className={`text-left border rounded-xl p-4 transition-all ${
                              selected
                                ? "border-amber-500 bg-amber-50 ring-2 ring-amber-400/30"
                                : "border-stone-200 hover:border-amber-300 hover:bg-amber-50/50 bg-white"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-xs text-stone-400 font-medium uppercase tracking-wider">
                                  Room
                                </p>
                                <p className="text-2xl font-bold text-stone-800">
                                  {r.roomNumber}
                                </p>
                                {r.kind === "conference" ? (
                                  <span className="mt-1 inline-block rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-800">
                                    Conference
                                  </span>
                                ) : null}
                              </div>
                              <div
                                className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                  selected
                                    ? "bg-amber-500 border-amber-500"
                                    : "border-stone-300"
                                }`}
                              >
                                {selected && (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                                )}
                              </div>
                            </div>
                            <div className="mt-3 flex items-end justify-between">
                              <div>
                                <p className="text-lg font-bold text-amber-600">
                                  {formatGhs(r.priceGhs)}
                                  <span className="text-xs font-normal text-stone-400 ml-1">
                                    / night
                                  </span>
                                </p>
                                <p className="text-xs text-stone-400 mt-0.5">
                                  {n} night{n !== 1 ? "s" : ""} · Total{" "}
                                  <span className="font-semibold text-stone-600">
                                    {formatGhs(total)}
                                  </span>
                                </p>
                              </div>
                              <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full font-medium">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                                Available
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {pickedRoomIds.length > 0 && (
                      <div className="mt-4 space-y-3">
                        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {pickedRooms.map((r) => (
                              <span
                                key={r.id}
                                className="inline-flex items-center gap-1 bg-amber-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full"
                              >
                                Room {r.roomNumber}
                                <button
                                  type="button"
                                  onClick={() => toggleRoom(r.id)}
                                  className="hover:opacity-70 ml-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                          <p className="text-sm font-bold text-amber-700">
                            {formatGhs(totalPrice)} total
                          </p>
                        </div>
                        <Button
                          onClick={openBook}
                          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold h-11"
                        >
                          <CalendarRange className="h-4 w-4 mr-2" />
                          Book {pickedRoomIds.length} room
                          {pickedRoomIds.length > 1 ? "s" : ""} ·{" "}
                          {nights(cin, cout)} night
                          {nights(cin, cout) !== 1 ? "s" : ""}
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div className="text-center py-8 text-stone-400">
                  <CalendarRange className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">
                    Select check-in and check-out dates above.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── My bookings ───────────────────────────────────────── */}
        <div>
          <h3 className="text-base font-semibold text-stone-700 mb-4 flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-amber-500" />
            My bookings
            {mine.length > 0 && (
              <span className="ml-1 bg-stone-200 text-stone-600 text-xs font-semibold rounded-full px-2 py-0.5">
                {mine.length}
              </span>
            )}
          </h3>

          {mine.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 py-16 flex flex-col items-center text-stone-400">
              <BedDouble className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No bookings yet</p>
              <p className="text-xs mt-1">
                Your confirmed stays will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {mine.map((b) => {
                const room = state.rooms.find((r) => r.id === b.roomId);
                const cfg = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.booked;
                const n = nights(b.checkInDate, b.checkOutDate);
                const today = todayISO();
                const isUpcoming =
                  b.checkInDate > today && b.status === "booked";
                const isActive = b.status === "checked_in";

                return (
                  <div
                    key={b.id}
                    className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                      isActive
                        ? "border-emerald-300 ring-1 ring-emerald-200"
                        : isUpcoming
                          ? "border-amber-200"
                          : "border-stone-200"
                    }`}
                  >
                    {/* Top color bar */}
                    <div
                      className={`h-1 w-full ${
                        isActive
                          ? "bg-emerald-400"
                          : isUpcoming
                            ? "bg-amber-400"
                            : "bg-stone-200"
                      }`}
                    />

                    <div className="px-5 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        {/* Room info */}
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-12 w-12 rounded-xl flex flex-col items-center justify-center shrink-0 ${
                              isActive
                                ? "bg-emerald-100"
                                : isUpcoming
                                  ? "bg-amber-100"
                                  : "bg-stone-100"
                            }`}
                          >
                            <p className="text-xs text-stone-400 leading-none">
                              Rm
                            </p>
                            <p
                              className={`text-lg font-bold leading-none mt-0.5 ${
                                isActive
                                  ? "text-emerald-700"
                                  : isUpcoming
                                    ? "text-amber-700"
                                    : "text-stone-600"
                              }`}
                            >
                              {room?.roomNumber ?? "—"}
                            </p>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}
                              >
                                {cfg.icon}
                                {cfg.label}
                              </span>
                              {isActive && (
                                <span className="text-xs text-emerald-600 font-medium">
                                  Currently staying
                                </span>
                              )}
                              {isUpcoming && (
                                <span className="text-xs text-amber-600 font-medium">
                                  Upcoming
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-stone-400 mt-1">
                              {n} night{n !== 1 ? "s" : ""} ·{" "}
                              {room ? formatGhs(room.priceGhs * n) : "—"} total
                            </p>
                          </div>
                        </div>

                        {/* Dates */}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-center">
                            <p className="text-xs text-stone-400 font-medium uppercase tracking-wider">
                              Check-in
                            </p>
                            <p className="font-semibold text-stone-700 mt-0.5">
                              {b.checkInDate}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-stone-300" />
                          <div className="text-center">
                            <p className="text-xs text-stone-400 font-medium uppercase tracking-wider">
                              Check-out
                            </p>
                            <p className="font-semibold text-stone-700 mt-0.5">
                              {b.checkOutDate}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Guest name */}
                      <p className="text-xs text-stone-400 mt-3 border-t border-stone-100 pt-3">
                        Guest:{" "}
                        <span className="text-stone-600 font-medium">
                          {b.guestDetails.fullName}
                        </span>{" "}
                        · {b.guestDetails.phone}
                      </p>

                      {/* Cancel button */}
                      {b.status === "booked" && !isWalkin && (
                        <div className="mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300"
                            onClick={async () => {
                              const r = await cancelBookingAction(b.id);
                              if ("error" in r) {
                                toast({
                                  title: "Cancel failed",
                                  description: r.error,
                                  variant: "destructive",
                                });
                              } else {
                                toast({ title: "Booking cancelled" });
                              }
                            }}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel booking
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ───────────────────────────────────────────── */}
        <div className="text-center py-4 text-xs text-stone-400 border-t border-stone-200">
          <p className="flex items-center justify-center gap-1">
            <Building2 className="h-3 w-3" />
            Waterhouse Lodge · Accra, Ghana
          </p>
          <p className="mt-1">Present a valid ID at reception on arrival.</p>
        </div>
      </main>

      {/* ── Booking dialog ───────────────────────────────────── */}
      <Dialog open={bookOpen} onOpenChange={setBookOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-stone-800">
              <BedDouble className="h-5 w-5 text-amber-500" />
              Complete your booking
            </DialogTitle>
          </DialogHeader>

          {/* Booking summary strip */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-3">
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <p className="text-xs text-amber-600 font-medium">Check-in</p>
                <p className="font-semibold text-stone-700">{cin}</p>
              </div>
              <div>
                <p className="text-xs text-amber-600 font-medium">Check-out</p>
                <p className="font-semibold text-stone-700">{cout}</p>
              </div>
              <div>
                <p className="text-xs text-amber-600 font-medium">Nights</p>
                <p className="font-semibold text-stone-700">
                  {nights(cin, cout)}
                </p>
              </div>
              <div>
                <p className="text-xs text-amber-600 font-medium">
                  Grand total
                </p>
                <p className="font-bold text-amber-700">
                  {formatGhs(totalPrice)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-amber-200 pt-2">
              <p className="text-xs text-amber-600 font-medium w-full">
                Rooms selected
              </p>
              {pickedRooms.map((r) => (
                <span
                  key={r.id}
                  className="inline-flex items-center gap-1.5 bg-white border border-amber-300 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full"
                >
                  <BedDouble className="h-3 w-3" />
                  Room {r.roomNumber} · {formatGhs(r.priceGhs)}/night
                </span>
              ))}
            </div>
          </div>

          <div className="border-t border-stone-100 pt-4">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
              Guest details (Ghana registration)
            </p>
            <GhanaGuestForm value={guest} onChange={setGuest} idPrefix="c" />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBookOpen(false)}
              className="border-stone-200"
            >
              Back
            </Button>
            <Button
              onClick={confirmBook}
              disabled={booking}
              className="bg-amber-500 hover:bg-amber-600 text-white font-semibold"
            >
              <CalendarCheck className="h-4 w-4 mr-1.5" />
              {booking
                ? "Booking…"
                : `Confirm ${pickedRoomIds.length} room${pickedRoomIds.length > 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
