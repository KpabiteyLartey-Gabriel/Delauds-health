"use client";

import { useEffect, useState } from "react";
import { BedDouble, Presentation, Sparkles } from "lucide-react";
import {
  conferenceAvailabilityHeading,
  conferenceAvailabilityLabel,
  conferenceSlotFree,
  type ConferenceAvailabilityFields,
} from "@/lib/conference-availability-copy";

type Summary = {
  available: number;
} & ConferenceAvailabilityFields;

export function AvailableRoomsFloat() {
  const [data, setData] = useState<Summary | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/rooms/availability", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("bad");
        const j = (await res.json()) as Partial<Summary> & {
          available: number;
        };
        if (!cancelled) {
          setData({
            available: j.available,
            conferenceTotal: j.conferenceTotal ?? 0,
            conferenceAvailable: j.conferenceAvailable ?? 0,
            conferenceState: j.conferenceState ?? "none",
          });
          setErr(false);
        }
      } catch {
        if (!cancelled) {
          setErr(true);
          setData(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (err || !data) return null;

  const conferenceLabel = conferenceAvailabilityLabel(data);

  return (
    <div
      className="pointer-events-none fixed bottom-6 left-6 z-[90] max-w-[min(calc(100vw-3rem),280px)] animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
      aria-live="polite"
    >
      <div
        className="pointer-events-auto rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-stone-50 p-4 shadow-xl shadow-amber-900/10 ring-1 ring-black/5 backdrop-blur-md dark:border-amber-500/20 dark:from-stone-900 dark:via-stone-950 dark:to-stone-900 dark:shadow-black/40"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300">
            <BedDouble className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-amber-700/90 dark:text-amber-400/90">
              <Sparkles className="h-3 w-3" aria-hidden />
              Rooms available now
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-stone-900 dark:text-white">
              {data.available}
            </p>
            {data.conferenceTotal > 0 && conferenceLabel ? (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-violet-200/80 bg-violet-50/90 px-2.5 py-2 dark:border-violet-500/30 dark:bg-violet-950/40">
                <Presentation
                  className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-300"
                  aria-hidden
                />
                <div className="min-w-0 text-[11px] leading-tight">
                  <p className="font-semibold text-violet-900 dark:text-violet-100">
                    {conferenceAvailabilityHeading(data)}
                  </p>
                  <p
                    className={
                      conferenceSlotFree(data)
                        ? "mt-0.5 font-medium text-emerald-700 dark:text-emerald-300"
                        : "mt-0.5 font-medium text-amber-800 dark:text-amber-200"
                    }
                  >
                    {conferenceLabel}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
