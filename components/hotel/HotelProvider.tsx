"use client";

import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  GuestDetailsGhana,
  HotelState,
  Room,
  RoomKind,
  Session,
  StoreCategory,
} from "@/lib/hotel/types";
import type { UserRole } from "@/lib/hotel/types";
import { isRoomFreeForOccupancy } from "@/lib/hotel/availability";

function emptyState(): HotelState {
  return {
    users: [],
    rooms: [],
    bookings: [],
    auditLog: [],
    occupancy: [],
    profile: undefined,
    storeItems: [],
    supplyRequests: [],
  };
}

type HotelContextValue = {
  state: HotelState;
  session: Session | null;
  ready: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ ok: true; role: UserRole } | { error: string }>;
  logout: () => Promise<void>;
  register: (
    email: string,
    password: string,
    fullName: string,
    phone: string,
  ) => Promise<{ ok: true } | { error: string }>;
  refresh: () => Promise<void>;
  createBooking: (
    roomIdOrIds: string | string[],
    clientUserId: string,
    checkInDate: string,
    checkOutDate: string,
    guest: GuestDetailsGhana,
  ) => Promise<
    | {
        ok: true;
        bookingId: string;
        bookingIds?: string[];
        status: "pending_payment";
        paystackAuthorizationUrl?: string;
      }
    | { error: string }
  >;
  confirmPaymentAction: (
    bookingId: string,
    cashAmountGhs: number,
  ) => Promise<{ ok: true } | { error: string }>;
  resendCashEmailAction: (
    bookingId: string,
  ) => Promise<{ ok: true } | { error: string }>;
  cancelBookingAction: (
    bookingId: string,
  ) => Promise<{ ok: true } | { error: string }>;
  checkInAction: (
    bookingId: string,
  ) => Promise<{ ok: true } | { error: string }>;
  checkOutAction: (
    bookingId: string,
  ) => Promise<{ ok: true } | { error: string }>;
  addRoomAction: (
    roomNumber: string,
    priceGhs: number,
    kind?: RoomKind,
    description?: string,
    imageUrls?: string[],
  ) => Promise<{ ok: true } | { error: string }>;
  updateRoomAction: (
    roomId: string,
    patch: Partial<Pick<Room, "roomNumber" | "priceGhs" | "kind" | "description" | "imageUrls">>,
  ) => Promise<{ ok: true } | { error: string }>;
  deleteRoomAction: (
    roomId: string,
  ) => Promise<{ ok: true } | { error: string }>;
  exportGuestRegisterCsv: () => Promise<string>;
  roomFree: (
    roomId: string,
    inD: string,
    outD: string,
    excludeId?: string,
  ) => boolean;
  addStoreItemAction: (input: {
    name: string;
    category: StoreCategory;
    quantity: number;
    unit: string;
    priceGhs?: number;
    description?: string;
    lowStockThreshold?: number;
  }) => Promise<{ ok: true } | { error: string }>;
  updateStoreItemAction: (
    itemId: string,
    patch: {
      name?: string;
      category?: StoreCategory;
      quantity?: number;
      unit?: string;
      priceGhs?: number;
      description?: string;
      lowStockThreshold?: number;
    },
  ) => Promise<{ ok: true } | { error: string }>;
  deleteStoreItemAction: (
    itemId: string,
  ) => Promise<{ ok: true } | { error: string }>;
  restockStoreItemAction: (
    itemId: string,
    delta: number,
  ) => Promise<{ ok: true } | { error: string }>;
  createSupplyRequestAction: (
    roomId: string,
    items: Array<{ storeItemId: string; itemName: string; quantity: number }>,
    notes?: string,
  ) => Promise<{ ok: true } | { error: string }>;
  fulfillSupplyRequestAction: (
    requestId: string,
  ) => Promise<{ ok: true } | { error: string }>;
};

const HotelContext = createContext<HotelContextValue | null>(null);

async function parseJsonSafe(res: Response): Promise<{ error?: string }> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export function HotelProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<HotelState>(emptyState);
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  const loadFromApi = useCallback(async () => {
    const res = await fetch("/api/state", {
      credentials: "include",
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      setSession(null);
      setState(emptyState());
      return;
    }
    if (!res.ok) {
      throw new Error(
        (data as { error?: string }).error || "Failed to load data",
      );
    }
    if (!data.session) {
      setSession(null);
      setState(emptyState());
      return;
    }
    setSession({
      userId: data.session.userId,
      email: data.session.email,
      role: data.session.role,
    });
    const rawRooms = (data.rooms ?? []) as Room[];
    setState({
      profile: data.profile,
      users: data.users ?? [],
      rooms: rawRooms.map((r) => ({
        ...r,
        kind: r.kind === "conference" ? "conference" : "guest",
        description: r.description?.trim() || undefined,
        imageUrls: Array.isArray(r.imageUrls) ? r.imageUrls : undefined,
      })),
      bookings: data.bookings ?? [],
      auditLog: data.auditLog ?? [],
      occupancy: data.occupancy ?? [],
      walkInClientId: data.walkInClientId,
      storeItems: data.storeItems ?? [],
      supplyRequests: data.supplyRequests ?? [],
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadFromApi();
      } catch {
        if (!cancelled) {
          setSession(null);
          setState(emptyState());
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadFromApi]);

  const refresh = useCallback(async () => {
    try {
      await loadFromApi();
    } catch {
      /* keep prior state */
    }
  }, [loadFromApi]);

  // Auto-refresh every 30 seconds so admin/receptionist see new payments without manual reload
  useEffect(() => {
    const id = setInterval(() => {
      refresh();
    }, 30_000);
    return () => clearInterval(id);
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setSession(null);
    setState(emptyState());
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        role?: UserRole;
      };
      if (!res.ok) {
        return { error: data.error || "Invalid email or password." };
      }
      try {
        await loadFromApi();
      } catch {
        return { error: "Signed in but failed to load data." };
      }
      if (!data.role) return { error: "Invalid session response." };
      return { ok: true as const, role: data.role };
    },
    [loadFromApi],
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      fullName: string,
      phone: string,
    ) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName, phone }),
      });
      const data = await parseJsonSafe(res);
      if (!res.ok) {
        return {
          error: (data as { error?: string }).error || "Registration failed.",
        };
      }
      try {
        await loadFromApi();
      } catch {
        return { error: "Account created but failed to load session." };
      }
      return { ok: true as const };
    },
    [loadFromApi],
  );

  const createBooking = useCallback(
    async (
      roomIdOrIds: string | string[],
      clientUserId: string,
      checkInDate: string,
      checkOutDate: string,
      guest: GuestDetailsGhana,
    ) => {
      const res = await fetch("/api/bookings", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(Array.isArray(roomIdOrIds)
            ? { roomIds: roomIdOrIds }
            : { roomId: roomIdOrIds }),
          clientUserId,
          checkInDate,
          checkOutDate,
          guestDetails: guest,
        }),
      });
      const data = await parseJsonSafe(res);
      if (!res.ok) {
        return {
          error: (data as { error?: string }).error || "Booking failed.",
        };
      }
      await refresh();
      const bookingId = (data as { bookingId?: string }).bookingId;
      if (!bookingId) {
        return { error: "Booking created but no booking ID returned." };
      }
      return {
        ok: true as const,
        bookingId,
        status: "pending_payment" as const,
        paystackAuthorizationUrl: (data as { paystackAuthorizationUrl?: string })
          .paystackAuthorizationUrl,
      };
    },
    [refresh],
  );

  const confirmPaymentAction = useCallback(
    async (bookingId: string, cashAmountGhs: number) => {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm_payment", cashAmountGhs }),
      });
      const data = await parseJsonSafe(res);
      if (!res.ok)
        return { error: (data as { error?: string }).error || "Failed." };
      await refresh();
      return { ok: true as const };
    },
    [refresh],
  );

  const resendCashEmailAction = useCallback(
    async (bookingId: string) => {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend_cash_email" }),
      });
      const data = await parseJsonSafe(res);
      if (!res.ok)
        return { error: (data as { error?: string }).error || "Failed." };
      await refresh();
      return { ok: true as const };
    },
    [refresh],
  );

  const cancelBookingAction = useCallback(
    async (bookingId: string) => {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await parseJsonSafe(res);
      if (!res.ok)
        return { error: (data as { error?: string }).error || "Failed." };
      await refresh();
      return { ok: true as const };
    },
    [refresh],
  );

  const checkInAction = useCallback(
    async (bookingId: string) => {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check_in" }),
      });
      const data = await parseJsonSafe(res);
      if (!res.ok)
        return { error: (data as { error?: string }).error || "Failed." };
      await refresh();
      return { ok: true as const };
    },
    [refresh],
  );

  const checkOutAction = useCallback(
    async (bookingId: string) => {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check_out" }),
      });
      const data = await parseJsonSafe(res);
      if (!res.ok)
        return { error: (data as { error?: string }).error || "Failed." };
      await refresh();
      return { ok: true as const };
    },
    [refresh],
  );

  const addRoomAction = useCallback(
    async (
      roomNumber: string,
      priceGhs: number,
      kind?: RoomKind,
      description?: string,
      imageUrls?: string[],
    ) => {
      const res = await fetch("/api/rooms", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomNumber,
          priceGhs,
          ...(kind ? { kind } : {}),
          ...(description !== undefined ? { description } : {}),
          ...(imageUrls && imageUrls.length > 0 ? { imageUrls } : {}),
        }),
      });
      const data = await parseJsonSafe(res);
      if (!res.ok)
        return { error: (data as { error?: string }).error || "Failed." };
      await refresh();
      return { ok: true as const };
    },
    [refresh],
  );

  const updateRoomAction = useCallback(
    async (
      roomId: string,
      patch: Partial<Pick<Room, "roomNumber" | "priceGhs" | "kind" | "description" | "imageUrls">>,
    ) => {
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await parseJsonSafe(res);
      if (!res.ok)
        return { error: (data as { error?: string }).error || "Failed." };
      await refresh();
      return { ok: true as const };
    },
    [refresh],
  );

  const deleteRoomAction = useCallback(
    async (roomId: string) => {
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await parseJsonSafe(res);
      if (!res.ok)
        return { error: (data as { error?: string }).error || "Failed." };
      await refresh();
      return { ok: true as const };
    },
    [refresh],
  );

  const exportGuestRegisterCsv = useCallback(async () => {
    const res = await fetch("/api/export/guest-register", {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) {
      const j = await parseJsonSafe(res);
      throw new Error(j.error || "Export failed");
    }
    return res.text();
  }, []);

  const addStoreItemAction = useCallback(
    async (input: {
      name: string;
      category: StoreCategory;
      quantity: number;
      unit: string;
      priceGhs?: number;
      description?: string;
      lowStockThreshold?: number;
    }) => {
      const res = await fetch("/api/store", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await parseJsonSafe(res);
      if (!res.ok)
        return { error: (data as { error?: string }).error || "Failed." };
      await refresh();
      return { ok: true as const };
    },
    [refresh],
  );

  const updateStoreItemAction = useCallback(
    async (
      itemId: string,
      patch: {
        name?: string;
        category?: StoreCategory;
        quantity?: number;
        unit?: string;
        priceGhs?: number;
        description?: string;
        lowStockThreshold?: number;
      },
    ) => {
      const res = await fetch(`/api/store/${itemId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await parseJsonSafe(res);
      if (!res.ok)
        return { error: (data as { error?: string }).error || "Failed." };
      await refresh();
      return { ok: true as const };
    },
    [refresh],
  );

  const deleteStoreItemAction = useCallback(
    async (itemId: string) => {
      const res = await fetch(`/api/store/${itemId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await parseJsonSafe(res);
      if (!res.ok)
        return { error: (data as { error?: string }).error || "Failed." };
      await refresh();
      return { ok: true as const };
    },
    [refresh],
  );

  const restockStoreItemAction = useCallback(
    async (itemId: string, delta: number) => {
      const res = await fetch(`/api/store/${itemId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restock", delta }),
      });
      const data = await parseJsonSafe(res);
      if (!res.ok)
        return { error: (data as { error?: string }).error || "Failed." };
      await refresh();
      return { ok: true as const };
    },
    [refresh],
  );

  const createSupplyRequestAction = useCallback(
    async (
      roomId: string,
      items: Array<{ storeItemId: string; itemName: string; quantity: number }>,
      notes?: string,
    ) => {
      const res = await fetch("/api/supplies", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, items, notes }),
      });
      const data = await parseJsonSafe(res);
      if (!res.ok)
        return { error: (data as { error?: string }).error || "Failed." };
      await refresh();
      return { ok: true as const };
    },
    [refresh],
  );

  const fulfillSupplyRequestAction = useCallback(
    async (requestId: string) => {
      const res = await fetch(`/api/supplies/${requestId}`, {
        method: "PATCH",
        credentials: "include",
      });
      const data = await parseJsonSafe(res);
      if (!res.ok)
        return { error: (data as { error?: string }).error || "Failed." };
      await refresh();
      return { ok: true as const };
    },
    [refresh],
  );

  const roomFree = useCallback(
    (roomId: string, inD: string, outD: string, excludeId?: string) =>
      isRoomFreeForOccupancy(state.occupancy, roomId, inD, outD, excludeId),
    [state.occupancy],
  );

  const value = useMemo<HotelContextValue>(
    () => ({
      state,
      session,
      ready,
      login,
      logout,
      register,
      refresh,
      createBooking,
      confirmPaymentAction,
      resendCashEmailAction,
      cancelBookingAction,
      checkInAction,
      checkOutAction,
      addRoomAction,
      updateRoomAction,
      deleteRoomAction,
      exportGuestRegisterCsv,
      roomFree,
      addStoreItemAction,
      updateStoreItemAction,
      deleteStoreItemAction,
      restockStoreItemAction,
      createSupplyRequestAction,
      fulfillSupplyRequestAction,
    }),
    [
      state,
      session,
      ready,
      login,
      logout,
      register,
      refresh,
      createBooking,
      confirmPaymentAction,
      resendCashEmailAction,
      cancelBookingAction,
      checkInAction,
      checkOutAction,
      addRoomAction,
      updateRoomAction,
      deleteRoomAction,
      exportGuestRegisterCsv,
      roomFree,
      addStoreItemAction,
      updateStoreItemAction,
      deleteStoreItemAction,
      restockStoreItemAction,
      createSupplyRequestAction,
      fulfillSupplyRequestAction,
    ],
  );

  return (
    <HotelContext.Provider value={value}>{children}</HotelContext.Provider>
  );
}

export function useHotel(): HotelContextValue {
  const ctx = useContext(HotelContext);
  if (!ctx) throw new Error("useHotel must be used within HotelProvider");
  return ctx;
}
