"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  conferenceAvailabilityHeading,
  conferenceAvailabilityLabel,
  conferenceSlotFree,
  type ConferenceAvailabilityFields,
} from "@/lib/conference-availability-copy";
import { cn } from "@/lib/utils";

export type ConferenceAvailabilityLandingProps = {
  className?: string;
};

const AMENITY_GROUPS = [
  {
    title: "Core Amenities",
    items: [
      "High-speed WiFi",
      "Air conditioning",
      "Comfortable seating",
      "Large table / meeting setup",
    ],
  },
  {
    title: "Presentation & Work Tools",
    items: [
      "TV screen",
      "HDMI / laptop connection",
      "Power outlets for devices",
    ],
  },
  {
    title: "Comfort & Convenience",
    items: ["Good lighting", "Quiet, private space", "Cleaning / tidy setup"],
  },
] as const;

export function ConferenceAvailabilityLanding({
  className,
}: ConferenceAvailabilityLandingProps) {
  const [data, setData] = useState<ConferenceAvailabilityFields | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/rooms/availability", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("bad");
        const j = (await res.json()) as Record<string, unknown>;
        if (!cancelled) {
          setData({
            conferenceTotal: Number(j.conferenceTotal) || 0,
            conferenceAvailable: Number(j.conferenceAvailable) || 0,
            conferenceState:
              (j.conferenceState as ConferenceAvailabilityFields["conferenceState"]) ??
              "none",
          });
        }
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    load();
    const id = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!ready || !data || data.conferenceTotal <= 0) return null;

  const label = conferenceAvailabilityLabel(data);
  if (!label) return null;

  const free = conferenceSlotFree(data);
  const title =
    data.conferenceTotal === 1
      ? "Professional Conference Room"
      : "Professional conference spaces";

  return (
    <div
      className={cn(
        "mt-8 max-w-3xl rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/90 to-white p-5 shadow-sm dark:border-violet-500/30 dark:from-violet-950/40 dark:to-stone-900/80 sm:p-7",
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300">
            <Presentation className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-700/90 dark:text-violet-300/90">
              Meeting space
            </p>
            <h3 className="mt-1 font-serif text-xl font-medium text-stone-900 dark:text-white sm:text-2xl">
              {title}
            </h3>
            <p className="mt-0.5 text-sm text-stone-500 dark:text-stone-400">
              {conferenceAvailabilityHeading(data)} · same live calendar as guest
              rooms
            </p>
            <p
              className={
                free
                  ? "mt-2 text-base font-semibold text-emerald-700 dark:text-emerald-300"
                  : "mt-2 text-base font-semibold text-amber-800 dark:text-amber-200"
              }
            >
              {label}
            </p>
          </div>
        </div>
        <Button
          asChild
          className="w-full shrink-0 bg-violet-600 font-semibold text-white hover:bg-violet-500 dark:bg-violet-600 dark:hover:bg-violet-500 sm:w-auto sm:self-start"
        >
          <Link href="/register">Book or check dates</Link>
        </Button>
      </div>

      <div className="mt-6 space-y-4 border-t border-violet-200/60 pt-6 text-sm leading-relaxed text-stone-600 dark:border-violet-500/25 dark:text-stone-400 sm:text-[15px]">
        <p>
          Host your meetings in a comfortable, well-equipped professional space
          designed for productivity and focus. Suitable for up to 20 people, this
          conference room is ideal for presentations, training sessions, team
          meetings, workshops, and small corporate events.
        </p>
        <p>
          Enjoy a quiet, private environment that helps you stay on track and host
          meetings with confidence, whether you&apos;re working with your team or
          meeting clients.
        </p>
      </div>

      <div className="mt-8 border-t border-violet-200/60 pt-6 dark:border-violet-500/25">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {AMENITY_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-800 dark:text-violet-300/90">
                {group.title}
              </p>
              <ul className="mt-2 space-y-2 text-sm text-stone-600 dark:text-stone-400">
                {group.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span
                      className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-500"
                      aria-hidden
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
