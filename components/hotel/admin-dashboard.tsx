"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  BedDouble,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  LayoutDashboard,
  LogOut,
  ExternalLink,
  Package,
  Pencil,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  TrendingDown,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import { useHotel } from "@/components/hotel/HotelProvider";
import { useToast } from "@/hooks/use-toast";
import { formatGhs, todayISO } from "@/lib/hotel/dates";
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RoomKind, StoreCategory } from "@/lib/hotel/types";

const STORE_CATEGORIES: { value: StoreCategory; label: string }[] = [
  { value: "toiletries", label: "🧴 Toiletries (soap, shampoo…)" },
  { value: "towels", label: "🛁 Towels" },
  { value: "bedding", label: "🛏 Bedding (sheets, pillowcases…)" },
  { value: "amenities", label: "🧻 Amenities (toilet roll, tissue…)" },
  { value: "other", label: "📦 Other" },
];

const CATEGORY_COLORS: Record<StoreCategory, string> = {
  toiletries: "bg-purple-100 text-purple-700 border-purple-200",
  towels: "bg-blue-100 text-blue-700 border-blue-200",
  bedding: "bg-amber-100 text-amber-700 border-amber-200",
  amenities: "bg-green-100 text-green-700 border-green-200",
  other: "bg-slate-100 text-slate-700 border-slate-200",
};

const STATUS_STYLES = {
  pending_payment: "bg-sky-100 text-sky-700 border-sky-200",
  available: "bg-emerald-100 text-emerald-700 border-emerald-200",
  booked: "bg-amber-100 text-amber-700 border-amber-200",
  occupied: "bg-red-100 text-red-700 border-red-200",
  booked_booking: "bg-sky-100 text-sky-700 border-sky-200",
  checked_in: "bg-emerald-100 text-emerald-700 border-emerald-200",
  checked_out: "bg-slate-100 text-slate-600 border-slate-200",
  cancelled: "bg-red-100 text-red-500 border-red-200",
};

function rateUnit(kind: RoomKind) {
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

export function AdminDashboard() {
  const router = useRouter();
  const { toast } = useToast();
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
    addStoreItemAction,
    updateStoreItemAction,
    deleteStoreItemAction,
    restockStoreItemAction,
    fulfillSupplyRequestAction,
    confirmPaymentAction,
    resendCashEmailAction,
  } = useHotel();

  const [roomNum, setRoomNum] = useState("");
  const [roomPrice, setRoomPrice] = useState("");
  const [newRoomKind, setNewRoomKind] = useState<RoomKind>("guest");
  const [roomDesc, setRoomDesc] = useState("");
  const [editRoomId, setEditRoomId] = useState<string | null>(null);
  const [editNum, setEditNum] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editKind, setEditKind] = useState<RoomKind>("guest");
  const [editDesc, setEditDesc] = useState("");

  const [storeDialogOpen, setStoreDialogOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState<StoreCategory>("toiletries");
  const [itemQty, setItemQty] = useState("0");
  const [itemUnit, setItemUnit] = useState("pieces");
  const [itemPrice, setItemPrice] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemThreshold, setItemThreshold] = useState("5");
  const [restockDialogItemId, setRestockDialogItemId] = useState<string | null>(
    null,
  );
  const [restockDelta, setRestockDelta] = useState("");
  const [fulfillLoading, setFulfillLoading] = useState<string | null>(null);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [cashReceivedByBooking, setCashReceivedByBooking] = useState<Record<string, string>>({});
  const [confirmingCashBookingId, setConfirmingCashBookingId] = useState<string | null>(null);
  const [resendingCashEmailBookingId, setResendingCashEmailBookingId] = useState<string | null>(null);

  const today = todayISO();

  const stats = useMemo(() => {
    const rooms = state.rooms;
    const bookings = state.bookings;
    return {
      total: rooms.length,
      available: rooms.filter((r) => r.status === "available").length,
      booked: rooms.filter((r) => r.status === "booked").length,
      occupied: rooms.filter((r) => r.status === "occupied").length,
      checkInsToday: bookings.filter(
        (b) =>
          b.checkInDate === today &&
          b.status !== "cancelled" &&
          b.status !== "checked_out",
      ).length,
      checkOutsToday: bookings.filter(
        (b) => b.checkOutDate === today && b.status === "checked_in",
      ).length,
    };
  }, [state.rooms, state.bookings, today]);

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
          nights,
          amountGhs,
          reference,
          paidAtIso,
        };
      });
  }, [state.bookings, state.rooms]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <Building2 className="h-10 w-10 text-amber-400 animate-pulse" />
          <p className="text-slate-400 text-sm">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (!session || session.role !== "admin") {
    router.replace("/login");
    return null;
  }

  const downloadRegister = async () => {
    try {
      const csv = await exportGuestRegisterCsv();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `guest-register-${today}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: "✅ Export ready",
        description: "Guest register CSV downloaded.",
      });
    } catch {
      toast({
        title: "Export failed",
        description: "Try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddRoom = async () => {
    const price = Number(roomPrice);
    if (!roomNum.trim() || Number.isNaN(price)) {
      toast({
        title: "Invalid room",
        description: "Enter room number and price.",
        variant: "destructive",
      });
      return;
    }
    const r = await addRoomAction(
      roomNum,
      price,
      newRoomKind,
      roomDesc,
    );
    if ("error" in r) {
      toast({
        title: "Could not add room",
        description: r.error,
        variant: "destructive",
      });
      return;
    }
    setRoomNum("");
    setRoomPrice("");
    setRoomDesc("");
    toast({
      title: "✅ Room added",
      description: `Room ${roomNum} at ${formatGhs(price)}`,
    });
  };

  const openEdit = (id: string) => {
    const r = state.rooms.find((x) => x.id === id);
    if (!r) return;
    setEditRoomId(id);
    setEditNum(r.roomNumber);
    setEditPrice(String(r.priceGhs));
    setEditKind(r.kind === "conference" ? "conference" : "guest");
    setEditDesc(r.description ?? "");
  };

  const saveEdit = async () => {
    if (!editRoomId) return;
    const price = Number(editPrice);
    if (!editNum.trim() || Number.isNaN(price)) {
      toast({
        title: "Invalid",
        description: "Check room number and price.",
        variant: "destructive",
      });
      return;
    }
    const r = await updateRoomAction(editRoomId, {
      roomNumber: editNum,
      priceGhs: price,
      kind: editKind,
      description: editDesc,
    });
    if ("error" in r) {
      toast({
        title: "Update failed",
        description: r.error,
        variant: "destructive",
      });
      return;
    }
    setEditRoomId(null);
    toast({ title: "✅ Room updated" });
  };

  const handleDeleteRoom = async (id: string) => {
    const r = await deleteRoomAction(id);
    if ("error" in r) {
      toast({
        title: "Cannot delete",
        description: r.error,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Room removed" });
  };

  const allUsers = state.users;

  const openAddStore = () => {
    setEditingItemId(null);
    setItemName("");
    setItemCategory("toiletries");
    setItemQty("0");
    setItemUnit("pieces");
    setItemPrice("");
    setItemDesc("");
    setItemThreshold("5");
    setStoreDialogOpen(true);
  };

  const openEditStore = (id: string) => {
    const item = state.storeItems.find((i) => i.id === id);
    if (!item) return;
    setEditingItemId(id);
    setItemName(item.name);
    setItemCategory(item.category);
    setItemQty(String(item.quantity));
    setItemUnit(item.unit);
    setItemPrice(item.priceGhs !== undefined ? String(item.priceGhs) : "");
    setItemDesc(item.description ?? "");
    setItemThreshold(String(item.lowStockThreshold));
    setStoreDialogOpen(true);
  };

  const handleSaveStoreItem = async () => {
    const qty = Number(itemQty);
    const threshold = Number(itemThreshold);
    if (!itemName.trim()) {
      toast({ title: "Name is required.", variant: "destructive" });
      return;
    }
    if (isNaN(qty) || qty < 0) {
      toast({ title: "Quantity must be 0 or more.", variant: "destructive" });
      return;
    }
    if (!itemUnit.trim()) {
      toast({ title: "Unit is required.", variant: "destructive" });
      return;
    }
    const payload = {
      name: itemName,
      category: itemCategory,
      quantity: qty,
      unit: itemUnit,
      priceGhs: itemPrice !== "" ? Number(itemPrice) : undefined,
      description: itemDesc || undefined,
      lowStockThreshold: isNaN(threshold) ? 5 : threshold,
    };
    const result = editingItemId
      ? await updateStoreItemAction(editingItemId, payload)
      : await addStoreItemAction(payload);
    if ("error" in result) {
      toast({
        title: "Failed to save item",
        description: result.error,
        variant: "destructive",
      });
      return;
    }
    toast({ title: editingItemId ? "✅ Item updated" : "✅ Item added" });
    setStoreDialogOpen(false);
  };

  const handleDeleteStoreItem = async (id: string) => {
    const item = state.storeItems.find((i) => i.id === id);
    const result = await deleteStoreItemAction(id);
    if ("error" in result) {
      toast({
        title: "Cannot delete",
        description: result.error,
        variant: "destructive",
      });
      return;
    }
    toast({ title: `"${item?.name}" removed from store` });
  };

  const handleRestock = async () => {
    if (!restockDialogItemId) return;
    const delta = Number(restockDelta);
    if (isNaN(delta) || delta === 0) {
      toast({ title: "Enter a non-zero amount.", variant: "destructive" });
      return;
    }
    const result = await restockStoreItemAction(restockDialogItemId, delta);
    if ("error" in result) {
      toast({
        title: "Failed",
        description: result.error,
        variant: "destructive",
      });
      return;
    }
    toast({
      title:
        delta > 0
          ? `✅ +${delta} added to stock`
          : `✅ ${delta} deducted from stock`,
    });
    setRestockDialogItemId(null);
    setRestockDelta("");
  };

  const lowStockItems = state.storeItems.filter(
    (i) => i.quantity <= i.lowStockThreshold,
  );

  const pendingSupplyCount = state.supplyRequests.filter(
    (r) => r.status === "pending",
  ).length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-2.5">
              <Building2 className="h-7 w-7 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Waterhouse Lodge
              </h1>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-amber-400" />
                Admin Dashboard
              </p>
            </div>
          </div>

            <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
                  <div>
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-300">{session.email}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={downloadRegister}
              className="bg-amber-400/10 border-amber-400/30 text-amber-300 hover:bg-amber-400/20 hover:text-amber-200"
            >
              <Download className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Export CSV</span>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* ── Low-stock banner ───────────────────────────────────── */}
        {lowStockItems.length > 0 && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-700">
                {lowStockItems.length} store item
                {lowStockItems.length > 1 ? "s are" : " is"} running low
              </p>
              <p className="text-xs text-red-500 mt-0.5">
                {lowStockItems
                  .map((i) => `${i.name} (${i.quantity} ${i.unit})`)
                  .join(" · ")}
              </p>
            </div>
          </div>
        )}

        {/* ── Stat cards ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            label="Total rooms"
            value={stats.total}
            icon={<Building2 className="h-5 w-5" />}
            gradient="from-slate-700 to-slate-600"
          />
          <StatCard
            label="Available"
            value={stats.available}
            icon={<BedDouble className="h-5 w-5" />}
            gradient="from-emerald-600 to-emerald-500"
          />
          <StatCard
            label="Booked"
            value={stats.booked}
            icon={<ClipboardList className="h-5 w-5" />}
            gradient="from-amber-600 to-amber-500"
          />
          <StatCard
            label="Occupied"
            value={stats.occupied}
            icon={<Users className="h-5 w-5" />}
            gradient="from-red-600 to-red-500"
          />
          <StatCard
            label="Check-ins today"
            value={stats.checkInsToday}
            icon={<TrendingUp className="h-5 w-5" />}
            gradient="from-sky-600 to-sky-500"
          />
          <StatCard
            label="Check-outs today"
            value={stats.checkOutsToday}
            icon={<TrendingDown className="h-5 w-5" />}
            gradient="from-violet-600 to-violet-500"
          />
        </div>

        {/* ── Tabs ────────────────────────────────────────────────── */}
        <Tabs defaultValue="overview" className="space-y-6">
          <div className="w-full overflow-x-auto">
            <div className="bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm inline-flex min-w-max">
              <TabsList className="bg-transparent p-0 h-auto flex gap-1 min-w-max">
                {[
                  {
                    value: "overview",
                    icon: <LayoutDashboard className="h-4 w-4" />,
                    label: "Overview",
                  },
                  {
                    value: "rooms",
                    icon: <Building2 className="h-4 w-4" />,
                    label: "Rooms",
                  },
                  {
                    value: "bookings",
                    icon: <ClipboardList className="h-4 w-4" />,
                    label: "Bookings",
                  },
                  {
                    value: "payments",
                    icon: <WalletCards className="h-4 w-4" />,
                    label: "Payments",
                    badge: paidBookings.length,
                  },
                  {
                    value: "store",
                    icon: <ShoppingBag className="h-4 w-4" />,
                    label: "Store",
                    badge: lowStockItems.length + pendingSupplyCount,
                  },
                  {
                    value: "clients",
                    icon: <Users className="h-4 w-4" />,
                    label: "Accounts",
                  },
                  {
                    value: "audit",
                    icon: <ShieldCheck className="h-4 w-4" />,
                    label: "Audit log",
                  },
                ].map((t) => (
                  <TabsTrigger
                    key={t.value}
                    value={t.value}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-slate-600
                    data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm
                    hover:bg-slate-100 transition-all"
                  >
                    {t.icon}
                    {t.label}
                    {t.badge ? (
                      <span className="ml-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center leading-none">
                        {t.badge}
                      </span>
                    ) : null}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>

          {/* ── Overview ── */}
          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-slate-800">
                    Quick actions
                  </CardTitle>
                  <CardDescription>Common admin operations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={downloadRegister}
                    className="w-full justify-start gap-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200"
                    variant="outline"
                  >
                    <Download className="h-4 w-4" /> Export guest register (CSV)
                  </Button>
                  <Button
                    onClick={openAddStore}
                    className="w-full justify-start gap-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200"
                    variant="outline"
                  >
                    <ShoppingBag className="h-4 w-4" /> Add store item
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-slate-800">
                    Room overview
                  </CardTitle>
                  <CardDescription>
                    Current occupancy at a glance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(["available", "booked", "occupied"] as const).map(
                      (status) => {
                        const count = state.rooms.filter(
                          (r) => r.status === status,
                        ).length;
                        const pct =
                          stats.total > 0
                            ? Math.round((count / stats.total) * 100)
                            : 0;
                        const colors = {
                          available: "bg-emerald-500",
                          booked: "bg-amber-500",
                          occupied: "bg-red-500",
                        };
                        return (
                          <div key={status}>
                            <div className="flex justify-between text-xs mb-1 text-slate-600">
                              <span className="capitalize font-medium">
                                {status}
                              </span>
                              <span>
                                {count} room{count !== 1 ? "s" : ""} ({pct}%)
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-2 rounded-full ${colors[status]} transition-all`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Rooms ── */}
          <TabsContent value="rooms" className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-800">
                  Add new room
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px] md:items-end">
                    <div>
                      <Label className="text-xs font-medium text-slate-600 mb-1 block">
                        Room number
                      </Label>
                      <Input
                        placeholder="e.g. 201"
                        value={roomNum}
                        onChange={(e) => setRoomNum(e.target.value)}
                        className="border-slate-200 focus:border-amber-400 focus:ring-amber-400/20"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-600 mb-1 block">
                        Price / {rateUnit(newRoomKind)} (GHS)
                      </Label>
                      <Input
                        type="number"
                        placeholder="e.g. 450"
                        value={roomPrice}
                        onChange={(e) => setRoomPrice(e.target.value)}
                        className="border-slate-200 focus:border-amber-400 focus:ring-amber-400/20"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-600 mb-1 block">
                        Type
                      </Label>
                      <Select
                        value={newRoomKind}
                        onValueChange={(v) => setNewRoomKind(v as RoomKind)}
                      >
                        <SelectTrigger className="border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="guest">Guest room</SelectItem>
                          <SelectItem value="conference">Conference</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-600 mb-1 block">
                      Brief description
                    </Label>
                    <Textarea
                      placeholder="Short overview for guests, e.g. quiet deluxe room with workspace or conference room with projector and boardroom seating."
                      value={roomDesc}
                      onChange={(e) => setRoomDesc(e.target.value)}
                      className="min-h-24 border-slate-200 focus:border-amber-400 focus:ring-amber-400/20"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={handleAddRoom}
                      className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white"
                    >
                      <Plus className="h-4 w-4 mr-1.5" /> Add room
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {state.rooms.map((r) => {
                const statusStyle = {
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
                const roomDescription =
                  r.description?.trim() ||
                  "No description yet. Click Edit room to add one.";

                return (
                  <div
                    key={r.id}
                    className={`border rounded-xl overflow-hidden ${statusStyle.bg} transition-all hover:shadow-md`}
                  >
                    <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                          Room
                        </p>
                        <p className="text-3xl font-bold text-slate-800 mt-0.5">
                          {r.roomNumber}
                        </p>
                        {r.kind === "conference" ? (
                          <Badge
                            variant="outline"
                            className="mt-1.5 border-violet-300 bg-violet-50 text-violet-800 text-[10px]"
                          >
                            Conference
                          </Badge>
                        ) : null}
                      </div>
                      <div
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
                      >
                        <div
                          className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`}
                        />
                        {r.status}
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-slate-700 mt-3">
                      {formatGhs(r.priceGhs)}{" "}
                      <span className="text-xs font-normal text-slate-400">
                        / {rateUnit(r.kind)}
                      </span>
                    </p>
                    <p className="mt-2 text-sm font-medium leading-relaxed text-slate-700">
                      {roomDescription}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(r.id)}
                        className="flex-1 h-8 text-xs border-slate-300 hover:bg-white"
                      >
                        <Pencil className="h-3 w-3 mr-1" /> Edit room
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRoom(r.id)}
                        className="h-8 text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    </div>{/* end p-4 */}
                  </div>
                );
              })}
              {state.rooms.length === 0 && (
                <div className="col-span-full flex flex-col items-center py-16 text-slate-400">
                  <Building2 className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-sm">No rooms yet. Add one above.</p>
                </div>
              )}
            </div>

            <Dialog
              open={!!editRoomId}
              onOpenChange={(o) => !o && setEditRoomId(null)}
            >
              <DialogContent className="w-full max-w-[95vw] sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-slate-800">
                    <Pencil className="h-4 w-4 text-amber-500" /> Edit room
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <Label className="text-xs font-medium text-slate-600">
                      Room number
                    </Label>
                    <Input
                      value={editNum}
                      onChange={(e) => setEditNum(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-600">
                      Price per {rateUnit(editKind)} (GHS)
                    </Label>
                    <Input
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-600">
                      Brief description (shown on client cards)
                    </Label>
                    <Textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="mt-1 min-h-24"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-600">
                      Type
                    </Label>
                    <Select
                      value={editKind}
                      onValueChange={(v) => setEditKind(v as RoomKind)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="guest">Guest room</SelectItem>
                        <SelectItem value="conference">Conference</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditRoomId(null)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={saveEdit}
                    className="bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    Save changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ── Bookings ── */}
          <TabsContent value="bookings">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-800">
                  All bookings
                </CardTitle>
                <CardDescription>
                  Manage guest stays and check-in / check-out
                </CardDescription>
              </CardHeader>
              <CardContent>
                {state.bookings.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-slate-400">
                    <ClipboardList className="h-10 w-10 mb-3 opacity-30" />
                    <p className="text-sm">No bookings yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-1 px-1">
                    <div className="rounded-xl overflow-hidden border border-slate-100">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              Guest
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              Contact
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              Room
                            </TableHead>
                            <TableHead className="hidden md:table-cell text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              Check-in
                            </TableHead>
                            <TableHead className="hidden md:table-cell text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
                          {state.bookings
                            .slice()
                            .sort((a, b) =>
                              b.createdAt.localeCompare(a.createdAt),
                            )
                            .map((b, idx) => {
                              const room = state.rooms.find(
                                (r) => r.id === b.roomId,
                              );
                              const statusKey =
                                b.status as keyof typeof STATUS_STYLES;
                              return (
                                <Fragment key={b.id}>
                                <TableRow
                                  className={
                                    idx % 2 === 0
                                      ? "bg-white hover:bg-slate-50/80"
                                      : "bg-slate-50/50 hover:bg-slate-50"
                                  }
                                >
                                  <TableCell className="font-medium text-slate-800">
                                    {b.guestDetails.fullName}
                                  </TableCell>
                                  <TableCell>
                                    <span className="inline-flex items-center justify-center bg-slate-900 text-white text-xs font-bold rounded-lg px-2.5 py-1">
                                      {room?.roomNumber ?? "—"}
                                    </span>
                                  </TableCell>
                                  <TableCell className="hidden md:table-cell text-sm text-slate-600">
                                    {b.checkInDate}
                                  </TableCell>
                                  <TableCell className="hidden md:table-cell text-sm text-slate-600">
                                    {b.checkOutDate}
                                  </TableCell>
                                  <TableCell>
                                    <span
                                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[statusKey] ?? ""}`}
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
                                          if ("error" in r)
                                            toast({
                                              title: "Check-in failed",
                                              description: r.error,
                                              variant: "destructive",
                                            });
                                          else
                                            toast({ title: "✅ Checked in" });
                                        }}
                                      >
                                        <ArrowDownCircle className="h-3 w-3 mr-1" />{" "}
                                        Check-in
                                      </Button>
                                    )}
                                    {b.status === "checked_in" && (
                                      <Button
                                        size="sm"
                                        className="h-7 text-xs bg-slate-700 hover:bg-slate-800 text-white"
                                        onClick={async () => {
                                          const r = await checkOutAction(b.id);
                                          if ("error" in r)
                                            toast({
                                              title: "Check-out failed",
                                              description: r.error,
                                              variant: "destructive",
                                            });
                                          else
                                            toast({ title: "✅ Checked out" });
                                        }}
                                      >
                                        <ArrowUpCircle className="h-3 w-3 mr-1" />{" "}
                                        Check-out
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                                {expandedBookingId === b.id ? (
                                  <TableRow className="bg-slate-50/80">
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
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Payments ── */}
          <TabsContent value="payments">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-800">
                  Received payments
                </CardTitle>
                <CardDescription>
                  All successful payments from online and cash confirmations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paidBookings.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-slate-400">
                    <WalletCards className="h-10 w-10 mb-3 opacity-30" />
                    <p className="text-sm">No received payments yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-1 px-1">
                    <div className="rounded-xl overflow-hidden border border-slate-100">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              Paid at
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              Booking ID
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
                              <TableCell className="text-xs font-mono text-slate-700">
                                {p.booking.id}
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
                              <TableCell className="text-xs text-slate-600 font-mono">
                                {p.reference}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Store ── */}
          <TabsContent value="store" className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-800">
                    Store inventory
                  </CardTitle>
                  <CardDescription>
                    Room supplies: soaps, towels, toilet rolls, bed sheets and
                    more
                  </CardDescription>
                </div>
                <Button
                  onClick={openAddStore}
                  className="bg-slate-900 hover:bg-slate-800 text-white"
                >
                  <Plus className="h-4 w-4 mr-1.5" /> Add item
                </Button>
              </CardHeader>
              <CardContent>
                {state.storeItems.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-slate-400">
                    <Package className="h-10 w-10 mb-3 opacity-30" />
                    <p className="text-sm">
                      No store items yet. Click "Add item" to get started.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {state.storeItems.map((item) => {
                      const isLow = item.quantity <= item.lowStockThreshold;
                      const pct =
                        item.lowStockThreshold > 0
                          ? Math.min(
                              100,
                              Math.round(
                                (item.quantity / (item.lowStockThreshold * 3)) *
                                  100,
                              ),
                            )
                          : item.quantity > 0
                            ? 100
                            : 0;
                      const barColor = isLow
                        ? "bg-red-500"
                        : item.quantity <= item.lowStockThreshold * 2
                          ? "bg-amber-500"
                          : "bg-emerald-500";
                      return (
                        <div
                          key={item.id}
                          className={`border rounded-xl p-4 bg-white hover:shadow-md transition-all ${isLow ? "border-red-200" : "border-slate-200"}`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-800 text-sm truncate">
                                {item.name}
                              </p>
                              {item.description && (
                                <p className="text-xs text-slate-400 mt-0.5 truncate">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            {isLow && (
                              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${CATEGORY_COLORS[item.category]}`}
                            >
                              {item.category}
                            </span>
                            {item.priceGhs !== undefined && (
                              <span className="text-xs text-slate-500">
                                {formatGhs(item.priceGhs)}/unit
                              </span>
                            )}
                          </div>
                          <div className="mb-3">
                            <div className="flex justify-between text-xs mb-1">
                              <span
                                className={`font-semibold ${isLow ? "text-red-600" : "text-slate-700"}`}
                              >
                                {item.quantity} {item.unit}
                              </span>
                              <span className="text-slate-400">
                                threshold: {item.lowStockThreshold}
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full transition-all ${barColor}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-8 text-xs border-slate-200 hover:bg-slate-50"
                              onClick={() => {
                                setRestockDialogItemId(item.id);
                                setRestockDelta("");
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" /> Adjust stock
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 border-slate-200 hover:bg-slate-50"
                              onClick={() => openEditStore(item.id)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteStoreItem(item.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Supply Requests subsection ── */}
            <Card className="border-0 shadow-sm mt-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                    <Package className="h-4 w-4 text-amber-500" />
                    Supply Requests
                  </CardTitle>
                  {pendingSupplyCount > 0 && (
                    <span className="ml-1 bg-amber-500 text-white text-xs rounded-full h-5 px-1.5 flex items-center justify-center leading-none font-semibold">
                      {pendingSupplyCount} pending
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {state.supplyRequests.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-slate-400">
                    <Package className="h-8 w-8 mb-2 opacity-30" />
                    <p className="text-sm">No supply requests yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-1 px-1">
                    <div className="rounded-xl overflow-hidden border border-slate-100">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              Room
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              Items
                            </TableHead>
                            <TableHead className="hidden sm:table-cell text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              Requested by
                            </TableHead>
                            <TableHead className="hidden sm:table-cell text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              Time
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              Status
                            </TableHead>
                            <TableHead className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              Actions
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
                                    <span
                                      key={i}
                                      className="text-xs text-slate-600"
                                    >
                                      {it.quantity}× {it.itemName}
                                    </span>
                                  ))}
                                  {req.notes && (
                                    <span className="text-xs text-slate-400 italic mt-0.5">
                                      Note: {req.notes}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell text-xs text-slate-500">
                                {req.requestedByEmail}
                              </TableCell>
                              <TableCell className="hidden sm:table-cell text-xs text-slate-400 whitespace-nowrap">
                                {format(
                                  parseISO(req.createdAt),
                                  "MMM d, HH:mm",
                                )}
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
                              <TableCell className="text-right">
                                {req.status === "pending" ? (
                                  <Button
                                    size="sm"
                                    disabled={fulfillLoading === req.id}
                                    onClick={async () => {
                                      setFulfillLoading(req.id);
                                      const r =
                                        await fulfillSupplyRequestAction(
                                          req.id,
                                        );
                                      setFulfillLoading(null);
                                      if ("error" in r) {
                                        toast({
                                          title: "Fulfill failed",
                                          description: r.error,
                                          variant: "destructive",
                                        });
                                      } else {
                                        toast({
                                          title: "✅ Supply request fulfilled",
                                          description: `Room ${req.roomNumber} supplies dispatched.`,
                                        });
                                      }
                                    }}
                                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                  >
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    {fulfillLoading === req.id
                                      ? "Fulfilling…"
                                      : "Fulfill"}
                                  </Button>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Done
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Add / Edit dialog */}
            <Dialog open={storeDialogOpen} onOpenChange={setStoreDialogOpen}>
              <DialogContent className="w-full max-w-[95vw] sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-slate-800">
                    <ShoppingBag className="h-4 w-4 text-amber-500" />
                    {editingItemId ? "Edit store item" : "Add store item"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <Label className="text-xs font-medium text-slate-600">
                      Item name *
                    </Label>
                    <Input
                      placeholder="e.g. Bath soap"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-600">
                      Category *
                    </Label>
                    <Select
                      value={itemCategory}
                      onValueChange={(v) => setItemCategory(v as StoreCategory)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STORE_CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium text-slate-600">
                        Quantity *
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        value={itemQty}
                        onChange={(e) => setItemQty(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-600">
                        Unit *
                      </Label>
                      <Input
                        placeholder="pieces / rolls / sets"
                        value={itemUnit}
                        onChange={(e) => setItemUnit(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium text-slate-600">
                        Price / unit (GHS)
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        placeholder="Optional"
                        value={itemPrice}
                        onChange={(e) => setItemPrice(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-600">
                        Low stock alert at
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        value={itemThreshold}
                        onChange={(e) => setItemThreshold(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-600">
                      Description
                    </Label>
                    <Input
                      placeholder="Optional notes"
                      value={itemDesc}
                      onChange={(e) => setItemDesc(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setStoreDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveStoreItem}
                    className="bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    {editingItemId ? "Save changes" : "Add item"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Restock / deduct dialog */}
            <Dialog
              open={!!restockDialogItemId}
              onOpenChange={(o) => {
                if (!o) {
                  setRestockDialogItemId(null);
                  setRestockDelta("");
                }
              }}
            >
              <DialogContent className="w-full max-w-[95vw] sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-slate-800">
                    Adjust stock —{" "}
                    {
                      state.storeItems.find((i) => i.id === restockDialogItemId)
                        ?.name
                    }
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="flex gap-3">
                    <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5 text-center">
                      <p className="text-xs text-emerald-600 font-medium">
                        Add stock
                      </p>
                      <p className="text-xs text-emerald-500 mt-0.5">
                        Enter positive number
                      </p>
                    </div>
                    <div className="flex-1 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-center">
                      <p className="text-xs text-red-600 font-medium">
                        Deduct stock
                      </p>
                      <p className="text-xs text-red-500 mt-0.5">
                        Enter negative number
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-600">
                      Amount (e.g. 10 or -3)
                    </Label>
                    <Input
                      type="number"
                      placeholder="e.g. 10 or -3"
                      value={restockDelta}
                      onChange={(e) => setRestockDelta(e.target.value)}
                      className="mt-1 text-center text-lg font-semibold"
                    />
                  </div>
                  <p className="text-xs text-slate-400 text-center">
                    Current:{" "}
                    {(() => {
                      const it = state.storeItems.find(
                        (i) => i.id === restockDialogItemId,
                      );
                      return it ? `${it.quantity} ${it.unit}` : "—";
                    })()}
                  </p>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setRestockDialogItemId(null);
                      setRestockDelta("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRestock}
                    className="bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    Apply
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ── Accounts ── */}
          <TabsContent value="clients">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-800">
                  All user accounts
                </CardTitle>
                <CardDescription>
                  Admins, receptionists and registered clients
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allUsers.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-slate-400">
                    <Users className="h-10 w-10 mb-3 opacity-30" />
                    <p className="text-sm">No user accounts found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-1 px-1">
                    <div className="overflow-x-auto -mx-1 px-1">
                      <div className="rounded-xl overflow-hidden border border-slate-100">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50 hover:bg-slate-50">
                              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Name
                              </TableHead>
                              <TableHead className="hidden sm:table-cell text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Email
                              </TableHead>
                              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Role
                              </TableHead>
                              <TableHead className="hidden md:table-cell text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Phone
                              </TableHead>
                              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Bookings
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {allUsers.map((u, idx) => {
                              const n = state.bookings.filter(
                                (b) => b.clientUserId === u.id,
                              ).length;
                              const roleStyles = {
                                admin:
                                  "bg-slate-900 text-white border-slate-800",
                                receptionist:
                                  "bg-sky-100 text-sky-700 border-sky-200",
                                client:
                                  "bg-emerald-100 text-emerald-700 border-emerald-200",
                              };
                              return (
                                <TableRow
                                  key={u.id}
                                  className={
                                    idx % 2 === 0
                                      ? "bg-white hover:bg-slate-50/80"
                                      : "bg-slate-50/50 hover:bg-slate-50"
                                  }
                                >
                                  <TableCell>
                                    <div className="flex items-center gap-2.5">
                                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                        {u.fullName.charAt(0).toUpperCase()}
                                      </div>
                                      <span className="font-medium text-slate-800 text-sm">
                                        {u.fullName}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="hidden sm:table-cell text-sm text-slate-500">
                                    {u.email}
                                  </TableCell>
                                  <TableCell>
                                    <span
                                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${roleStyles[u.role]}`}
                                    >
                                      {u.role}
                                    </span>
                                  </TableCell>
                                  <TableCell className="hidden sm:table-cell text-sm text-slate-500">
                                    {u.phone ?? "—"}
                                  </TableCell>
                                  <TableCell>
                                    {u.role === "client" ? (
                                      <span className="inline-flex items-center justify-center bg-slate-100 text-slate-600 text-xs font-semibold rounded-full h-6 w-6">
                                        {n}
                                      </span>
                                    ) : (
                                      "—"
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Audit log ── */}
          <TabsContent value="audit">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-800">
                  Audit log
                </CardTitle>
                <CardDescription>
                  Recent admin and staff activity (last 100 entries)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {state.auditLog.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-slate-400">
                    <ShieldCheck className="h-10 w-10 mb-3 opacity-30" />
                    <p className="text-sm">No audit entries yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {state.auditLog.slice(0, 100).map((a) => (
                      <div
                        key={a.id}
                        className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
                      >
                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                          <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-0.5">
                            <span className="text-sm font-medium text-slate-800">
                              {a.userEmail}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                                a.role === "admin"
                                  ? "bg-slate-900 text-white border-slate-800"
                                  : a.role === "receptionist"
                                    ? "bg-sky-100 text-sky-700 border-sky-200"
                                    : "bg-emerald-100 text-emerald-700 border-emerald-200"
                              }`}
                            >
                              {a.role}
                            </span>
                            <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                              {a.action.replace(/_/g, " ")}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 truncate">
                            {a.detail}
                          </p>
                        </div>
                        <p className="text-xs text-slate-400 shrink-0 whitespace-nowrap">
                          {format(parseISO(a.at), "MMM d, HH:mm")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
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
      <p className="text-2xl sm:text-3xl font-bold tracking-tight">{value}</p>
      <p className="text-xs mt-1 opacity-75 font-medium">{label}</p>
    </div>
  );
}
