import Image from "next/image";
import Link from "next/link";
import {
  BedDouble,
  CalendarRange,
  ChevronRight,
  MapPin,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  Utensils,
  Wifi,
  Accessibility,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  EXPERIENCE_IMAGE,
  HERO_ROOM_IMAGE,
  ROOM_GALLERY,
} from "@/lib/lodge-media";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <header className="sticky top-0 z-50 border-b border-stone-800/80 bg-stone-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight text-white"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
              <BedDouble className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-sm sm:text-base">Waterhouse Lodge</span>
          </Link>
          <nav className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden text-stone-300 hover:text-white sm:inline-flex"
            >
              <Link href="/login">Sign in</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-amber-500 font-semibold text-stone-950 shadow-sm hover:bg-amber-400"
            >
              <Link href="/register">Book your stay</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero — room photo + headline */}
        <section className="relative overflow-hidden border-b border-stone-800">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_70%_-10%,rgba(245,158,11,0.18),transparent)]"
            aria-hidden
          />
          <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14 lg:py-20">
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
              <div className="order-2 lg:order-1">
                <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-200 sm:text-sm">
                  <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Accra, Ghana · Rates in GHS
                </p>
                <h1 className="max-w-xl text-balance font-serif text-4xl font-medium leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Rest easy — your room is waiting
                </h1>
                <p className="mt-6 max-w-lg text-pretty text-base leading-relaxed text-stone-400 sm:text-lg">
                  Real photos of the kind of stay we offer: single rooms, fresh
                  linens, and space to breathe. Check availability for your
                  dates, compare nightly prices in Ghana Cedis, and book in
                  minutes.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <Button
                    asChild
                    size="lg"
                    className="h-12 rounded-lg bg-amber-500 px-8 text-base font-semibold text-stone-950 shadow-lg shadow-amber-950/25 hover:bg-amber-400"
                  >
                    <Link
                      href="/register"
                      className="inline-flex items-center gap-2"
                    >
                      Book a reservation
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-12 rounded-lg border-stone-600 bg-stone-900/40 text-stone-100 hover:bg-stone-800"
                  >
                    <Link href="/login">I have an account</Link>
                  </Button>
                </div>
                <p className="mt-6 text-sm text-stone-500">
                  Walk-ins welcome at reception.{" "}
                  <Link
                    href="/login"
                    className="font-medium text-amber-400/90 underline-offset-4 hover:underline"
                  >
                    {/* Staff portal */}
                  </Link>
                </p>
              </div>

              <div className="order-1 lg:order-2">
                <div className="relative mx-auto max-w-xl lg:max-w-none">
                  <div
                    className="absolute -right-4 -top-4 hidden h-24 w-24 rounded-2xl border border-amber-500/20 bg-amber-500/5 lg:block"
                    aria-hidden
                  />
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-stone-800 shadow-2xl shadow-black/50 sm:aspect-[5/4] lg:aspect-[4/5] lg:min-h-[420px]">
                    <Image
                      src={HERO_ROOM_IMAGE}
                      alt="Welcoming lodge bedroom with a comfortable bed and soft lighting"
                      fill
                      priority
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-stone-950/50 via-transparent to-transparent pointer-events-none"
                      aria-hidden
                    />
                    <p className="absolute bottom-4 left-4 right-4 rounded-lg bg-stone-950/75 px-4 py-2 text-center text-xs text-stone-200 backdrop-blur-sm sm:text-sm">
                      Fresh linens · Calm spaces designed for a good
                      night&apos;s rest
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* IMPORTANT: Accessibility Warning Banner */}
        <section className="border-b border-red-800/50 bg-gradient-to-r from-red-950/30 via-red-950/20 to-red-950/30">
          <div className="mx-auto max-w-6xl px-4 py-5 sm:py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-xl border border-red-800/40 bg-red-950/40 p-5 backdrop-blur-sm shadow-lg">
              <div className="flex shrink-0 gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-900/60 text-red-400">
                  <Accessibility className="h-6 w-6" aria-hidden />
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-900/60 text-amber-500">
                  <AlertTriangle className="h-6 w-6" aria-hidden />
                </div>
              </div>
              <div className="flex-1">
                <p className="mt-1 text-sm leading-relaxed text-red-200/90 sm:text-base">
                  <strong className="font-semibold text-red-300">
                    Stairs Only
                  </strong>
                  <span className="block mt-2 text-amber-300">
                    We regret that guests with mobility impairments or those who
                    use wheelchairs may not be able to access our
                    accommodations.
                  </span>
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-900/60 px-3 py-1 text-xs font-medium text-red-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                    Stairs only
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-900/60 px-3 py-1 text-xs font-medium text-red-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                    No wheelchair access
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-900/60 px-3 py-1 text-xs font-medium text-amber-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                    Ground floor unavailable
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Room gallery */}
        <section className="border-b border-stone-800 bg-stone-900/35 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="max-w-2xl">
              <h2 className="font-serif text-3xl font-medium text-white sm:text-4xl">
                Our rooms
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-stone-400">
                All singles — so you always know what you are booking. Pick the
                tier and price that match your trip; photos below illustrate the
                calm, tidy standard we keep across the lodge.
              </p>
            </div>

            <div className="mt-12 grid gap-8 sm:grid-cols-2">
              {ROOM_GALLERY.map((room) => (
                <article
                  key={room.title}
                  className="group overflow-hidden rounded-2xl border border-stone-800 bg-stone-900/40 shadow-lg transition hover:border-amber-900/40 hover:shadow-xl"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={room.src}
                      alt={room.alt}
                      fill
                      className="object-cover transition duration-700 ease-out group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                  </div>
                  <div className="p-6 sm:p-7">
                    <h3 className="font-serif text-xl font-medium text-white">
                      {room.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-stone-400">
                      {room.caption}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-red-400">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500"></span>
                    </div>
                    <Button
                      asChild
                      variant="link"
                      className="mt-3 h-auto p-0 text-amber-400 hover:text-amber-300"
                    >
                      <Link href="/register">Check dates &amp; book →</Link>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Location maps + directions */}
        <section className="border-b border-stone-800 bg-stone-950/70 py-14 sm:py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="font-serif text-3xl font-medium text-white sm:text-4xl">
              Find Waterhouse Lodge
            </h2>
            <p className="mt-3 max-w-3xl text-stone-300">
              See our location in Accra and get directions instantly with Google
              Maps.
            </p>
            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="overflow-hidden rounded-2xl border border-stone-800 bg-stone-900">
                <iframe
                  src="https://www.google.com/maps?q=Waterhouse+Lodge+Accra+Ghana&output=embed"
                  width="100%"
                  height="300"
                  loading="lazy"
                  title="Waterhouse Lodge location map"
                  className="min-h-[280px] w-full"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="rounded-2xl border border-stone-800 bg-stone-900 p-5">
                <p className="text-sm text-stone-400">Address:</p>
                <p className="mt-1 font-semibold text-white">
                  Waterhouse Lodge, Accra, Ghana
                </p>
                <p className="mt-2 text-sm text-stone-400">
                  Open daily 10:00–22:00. Reception desk on site.
                </p>
                {/* <div className="mt-3 rounded-lg bg-red-950/30 p-2 text-xs text-red-300">
                  ⚠️ No elevator access — stairs only
                </div> */}
                <Button
                  asChild
                  className="mt-6 w-full bg-amber-500 font-semibold text-stone-950 hover:bg-amber-400"
                >
                  <a
                    href="https://www.google.com/maps/dir/?api=1&destination=Waterhouse+Lodge+Accra+Ghana"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Get directions
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Marketing story + image */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-stone-800 lg:aspect-auto lg:min-h-[420px]">
              <Image
                src={EXPERIENCE_IMAGE}
                alt="Peaceful guest room interior inviting relaxation"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-amber-400/90">
                The experience
              </p>
              <h2 className="mt-3 font-serif text-3xl font-medium text-white sm:text-4xl">
                More than a bed — a base for your Accra plans
              </h2>
              <p className="mt-5 text-stone-400 leading-relaxed">
                Whether you are in town for meetings, family, or a few quiet
                nights away, we keep things straightforward: fair rates, helpful
                front desk, and registration handled the way Ghana lodging rules
                expect—so you can focus on why you came.
              </p>
              <ul className="mt-8 space-y-4 text-stone-300">
                <li className="flex gap-3">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400"
                    aria-hidden
                  />
                  Early check-in when we can — always ask before arrival day
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-5 w-5 shrink-0 rounded-full bg-amber-500/20 text-center text-xs leading-5 text-amber-400">
                    ✓
                  </span>
                  Secure online booking and guest login to view your reservation
                </li>
                <li className="flex gap-3">
                  {/* <span className="mt-1.5 h-5 w-5 shrink-0 rounded-full bg-red-500/20 text-center text-xs leading-5 text-red-400">
                    !
                  </span> */}
                  {/* <span className="text-red-300">
                    <strong>Accessibility note:</strong> All rooms require stair
                    access — no elevator available
                  </span> */}
                </li>
              </ul>
              <Button
                asChild
                size="lg"
                className="mt-10 bg-amber-500 font-semibold text-stone-950 hover:bg-amber-400"
              >
                <Link href="/register">See availability</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Social proof */}
        <section className="border-y border-stone-800 bg-gradient-to-b from-stone-900/80 to-stone-950 py-16">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <div
              className="flex justify-center gap-1 text-amber-400"
              aria-label="5 out of 5 stars"
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="h-5 w-5 fill-amber-400 text-amber-400"
                  aria-hidden
                />
              ))}
            </div>
            <Quote
              className="mx-auto mt-6 h-10 w-10 text-stone-600"
              aria-hidden
            />
            <blockquote className="mt-4 font-serif text-xl leading-relaxed text-stone-200 sm:text-2xl">
              &ldquo;Easy online booking, room matched the photos, and the team
              made check-in smooth.&rdquo;
            </blockquote>
            <p className="mt-4 text-sm text-stone-500">
              Sample guest quote — replace with real testimonials.
            </p>
          </div>
        </section>

        {/* Why choose us — icon cards */}
        <section className="border-b border-stone-800 bg-stone-900/30 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center font-serif text-2xl font-medium text-white sm:text-3xl">
              Why guests choose us
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-stone-400">
              Simple booking, honest pricing, and lodging registration done
              right.
            </p>
            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: CalendarRange,
                  title: "Live availability",
                  text: "Pick dates and see which rooms are free—no guessing.",
                },
                {
                  icon: Sparkles,
                  title: "Rates in GHS",
                  text: "Compare nightly prices in Ghana Cedis before you commit.",
                },
                {
                  icon: ShieldCheck,
                  title: "Guest register",
                  text: "We collect what Ghana regulations expect, securely online.",
                },
                {
                  icon: Wifi,
                  title: "Comfort first",
                  text: "Rooms kept clean and ready for rest or remote work.",
                },
              ].map((item) => (
                <li key={item.title}>
                  <Card className="h-full border-stone-800 bg-stone-900/60 shadow-none transition hover:border-amber-900/50">
                    <CardContent className="p-6">
                      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                        <item.icon className="h-5 w-5" aria-hidden />
                      </div>
                      <h3 className="font-semibold text-white">{item.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-stone-400">
                        {item.text}
                      </p>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
            <div className="mt-10 rounded-xl border border-red-800/30 bg-red-950/20 p-5 text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-red-900/40 px-4 py-1.5 text-xs font-medium text-red-300">
                <Accessibility className="h-3.5 w-3.5" />
                Accessibility information
              </div>
              <p className="mt-3 text-sm text-stone-400">
                Please note: Waterhouse Lodge does not have an elevator and is
                not wheelchair accessible. All guest rooms are located on upper
                floors and can only be reached via stairs. We apologize for any
                inconvenience this may cause.
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-16">
              <div>
                <h2 className="font-serif text-2xl font-medium text-white sm:text-3xl">
                  How booking works
                </h2>
                <ol className="mt-8 space-y-6">
                  {[
                    "Create a free guest account with your name, phone, and email.",
                    "Choose stay dates—we only show rooms that are available.",
                    "Pick your room by price and complete the registration details for your stay.",
                    "Arrive on check-in day; we verify ID and welcome you.",
                  ].map((step, i) => (
                    <li key={i} className="flex gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-sm font-bold text-amber-400">
                        {i + 1}
                      </span>
                      <p className="pt-0.5 leading-relaxed text-stone-300">
                        {step}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
              <Card className="border-stone-800 bg-gradient-to-br from-stone-900 to-stone-950 p-8 lg:p-10">
                <div className="flex items-start gap-3">
                  <Utensils
                    className="mt-0.5 h-5 w-5 shrink-0 text-amber-400"
                    aria-hidden
                  />
                  <div>
                    <h3 className="font-semibold text-white">
                      Dining & local tips
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-stone-400">
                      Ask reception about breakfast, directions, and what to see
                      around Accra—we love sharing local picks.
                    </p>
                  </div>
                </div>
                <div className="mt-8 rounded-xl border border-stone-800 bg-stone-950/50 p-6">
                  <p className="text-sm font-medium text-white">
                    Questions before you book?
                  </p>
                  <p className="mt-2 text-sm text-stone-400">
                    Message or call us anytime, or reserve online—it only takes
                    a few minutes.
                  </p>
                  <Button
                    asChild
                    className="mt-4 w-full bg-amber-500 font-semibold text-stone-950 hover:bg-amber-400 sm:w-auto"
                  >
                    <Link href="/register">Start your reservation</Link>
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </section>

        <section className="border-t border-stone-800 bg-amber-500/10 py-14 sm:py-16">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="font-serif text-2xl font-medium text-white sm:text-3xl">
              Ready to stay with us?
            </h2>
            <p className="mt-3 text-stone-300">
              Lock in your room today. Sign in anytime to view your booking
              (changes subject to lodge policy).
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 min-w-[200px] bg-amber-500 font-semibold text-stone-950 hover:bg-amber-400"
              >
                <Link href="/register">Reserve now</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="h-12 text-stone-200 hover:bg-stone-800 hover:text-white"
              >
                <Link href="/login">Guest login</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-800 bg-stone-950 py-10">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-semibold text-white">Waterhouse Lodge</p>
              <p className="mt-2 text-sm text-stone-500">
                Comfortable stays · Accra, Ghana
              </p>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <Link
                href="/login"
                className="text-stone-400 hover:text-amber-400"
              >
                Guest login
              </Link>
              <Link
                href="/register"
                className="text-stone-400 hover:text-amber-400"
              >
                New guest registration
              </Link>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-red-800/30 bg-red-950/10 p-4">
            {/* <p className="text-center text-xs text-red-400">
              ⚠️ Accessibility Notice: Waterhouse Lodge has no elevator and is
              not wheelchair accessible. All rooms require stair access. Guests
              with mobility impairments are advised to consider alternative
              accommodations.
            </p> */}
          </div>
        </div>
      </footer>
    </div>
  );
}
