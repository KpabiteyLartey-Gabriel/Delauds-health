"use client";

import { useState, type KeyboardEvent } from "react";
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
  X,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Mail,
  Phone,
  Clock,
  Facebook,
  Instagram,
  Twitter,
  Send,
  MessageCircle,
  ArrowUpRight,
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
import { AvailableRoomsFloat } from "@/components/available-rooms-float";
import { ConferenceAvailabilityLanding } from "@/components/conference-availability-landing";

type LightboxImage = {
  src: string;
  alt: string;
  caption?: string;
  title?: string;
};

// Lightbox component — unchanged logic, refined visuals
function ImageLightbox({
  images,
  initialIndex,
  isOpen,
  onClose,
}: {
  images: LightboxImage[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!isOpen) return null;

  const currentImage = images[currentIndex];
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  const goToPrevious = () => { if (hasPrevious) setCurrentIndex(currentIndex - 1); };
  const goToNext = () => { if (hasNext) setCurrentIndex(currentIndex + 1); };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowLeft") goToPrevious();
    if (e.key === "ArrowRight") goToNext();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/97 backdrop-blur-xl"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="dialog"
      aria-label="Image gallery"
    >
      <button
        onClick={onClose}
        className="absolute right-6 top-6 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-all hover:bg-white/15"
        aria-label="Close gallery"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="absolute left-1/2 top-6 -translate-x-1/2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs tracking-widest text-white/60 uppercase">
        {currentIndex + 1} / {images.length}
      </div>

      {hasPrevious && (
        <button
          onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
          className="absolute left-6 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-all hover:bg-white/15"
          aria-label="Previous image"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); goToNext(); }}
          className="absolute right-6 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-all hover:bg-white/15"
          aria-label="Next image"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      )}

      <div
        className="relative max-h-[90vh] max-w-[90vw] cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={currentImage.src}
          alt={currentImage.alt || "Gallery image"}
          width={1200}
          height={800}
          className="max-h-[85vh] w-auto rounded-xl object-contain shadow-2xl"
          priority
        />
        {currentImage.caption && (
          <p className="mt-4 text-center text-xs tracking-wide text-white/40 uppercase">
            {currentImage.caption}
          </p>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState<LightboxImage[]>([]);

  const LODGE_MAP_NAME = "Waterhouse Lodge";
  const LODGE_MAP_STREET =
    "Nii Opkoti Adjei Commey, Adenta, Accra, Ghana (Between Roman Catholic Housing Commandos and Victory Presby Church Adenta)";
  const LODGE_MAP_QUERY = encodeURIComponent(`${LODGE_MAP_NAME}, ${LODGE_MAP_STREET}`);
  const LODGE_LAT = "5.713546";
  const LODGE_LNG = "-0.154072";
  const mapsEmbedSrc = `https://www.google.com/maps?q=${LODGE_MAP_QUERY}&ll=${LODGE_LAT},${LODGE_LNG}&z=17&hl=en&output=embed`;
  const mapsPlaceUrl = `https://www.google.com/maps/search/?api=1&query=${LODGE_MAP_QUERY}`;
  const mapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${LODGE_MAP_QUERY}`;

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: "Waterhouse Lodge",
    alternateName: "Waterhouse Lodge Accra",
    url: "https://waterhouselodge.com",
    image: [HERO_ROOM_IMAGE, EXPERIENCE_IMAGE],
    telephone: "+233 53-553-6119",
    email: "info@waterhouselodge.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Nii Opkoti Adjei Commey",
      addressLocality: "Adenta",
      addressRegion: "Greater Accra Region",
      addressCountry: "GH",
    },
    geo: { "@type": "GeoCoordinates", latitude: 5.713546, longitude: -0.154072 },
    areaServed: ["Adenta", "Accra", "Ghana"],
    priceRange: "GHS",
    sameAs: [
      "https://facebook.com/waterhouselodge",
      "https://instagram.com/waterhouselodge",
      "https://tiktok.com/@waterhouselodge",
      "https://wa.me/233535536119",
    ],
  };

  const openLightbox = (images: LightboxImage[], index = 0) => {
    setLightboxImages(images);
    setSelectedImageIndex(index);
    setLightboxOpen(true);
  };

  const socialLinks = [
    { name: "Facebook", icon: Facebook, href: "https://facebook.com/waterhouselodge", color: "hover:bg-[#1877F2] hover:border-[#1877F2]", bgColor: "bg-stone-100 dark:bg-stone-800" },
    { name: "Instagram", icon: Instagram, href: "https://instagram.com/waterhouselodge", color: "hover:bg-[#E4405F] hover:border-[#E4405F]", bgColor: "bg-stone-100 dark:bg-stone-800" },
    { name: "TikTok", icon: Send, href: "https://tiktok.com/@waterhouselodge", color: "hover:bg-[#111] hover:border-[#111]", bgColor: "bg-stone-100 dark:bg-stone-800" },
    { name: "WhatsApp", icon: MessageCircle, href: "https://wa.me/233535536119", color: "hover:bg-[#25D366] hover:border-[#25D366]", bgColor: "bg-stone-100 dark:bg-stone-800" },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 dark:bg-[#0E0C0A] dark:text-stone-100" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />

      <AvailableRoomsFloat />

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 border-b border-stone-200/60 bg-[#FAF8F5]/95 backdrop-blur-xl dark:border-stone-800/40 dark:bg-[#0E0C0A]/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="flex items-center gap-3 font-body">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-300/30 bg-gradient-to-br from-amber-400/20 to-amber-600/10 text-amber-500">
              <BedDouble className="h-4.5 w-4.5" aria-hidden />
            </span>
            <div className="flex flex-col leading-none">
              <span className="font-display text-base font-medium tracking-wide text-stone-900 dark:text-white">Waterhouse Lodge</span>
              <span className="font-body text-[10px] tracking-[0.15em] text-stone-400 uppercase">Accra, Ghana</span>
            </div>
          </Link>
          <nav className="flex shrink-0 items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="font-body hidden text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white sm:inline-flex"
            >
              <Link href="/login">Sign in</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="font-body bg-stone-900 font-medium text-white shadow-sm hover:bg-stone-700 dark:bg-amber-500 dark:text-stone-950 dark:hover:bg-amber-400"
            >
              <Link href="/register" className="flex items-center gap-1.5">
                Book stay
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        {/* ── HERO ── */}
        <section className="hero-gradient relative overflow-hidden">
          {/* Decorative grid */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.025] dark:opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} aria-hidden />

          <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24 lg:py-28">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
              {/* Copy */}
              <div className="order-2 lg:order-1">
                <div className="mb-6 inline-flex items-center gap-2 font-body">
                  <span className="gold-line block h-px w-8" />
                  <span className="text-xs font-medium tracking-[0.2em] text-amber-600 dark:text-amber-400 uppercase">Adenta · Accra · Ghana</span>
                </div>

                <h1 className="font-display max-w-xl text-balance text-5xl font-light leading-[1.1] tracking-tight text-stone-900 dark:text-white sm:text-6xl lg:text-7xl">
                  Rest easy —<br />
                  <em className="italic text-amber-600 dark:text-amber-400">your room</em><br />
                  is waiting
                </h1>

                <p className="font-body mt-7 max-w-lg text-pretty text-base leading-relaxed text-stone-500 dark:text-stone-400">
                  Single rooms with crisp bed linen, genuine calm, and rates displayed in Ghana Cedis.
                  Check availability and secure your stay in minutes.
                </p>

                <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button
                    asChild
                    size="lg"
                    className="font-body h-12 rounded-xl bg-stone-900 px-8 text-sm font-medium tracking-wide text-white shadow-lg hover:bg-stone-700 dark:bg-amber-500 dark:text-stone-950 dark:hover:bg-amber-400"
                  >
                    <Link href="/register" className="inline-flex items-center gap-2">
                      Reserve a room
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="font-body h-12 rounded-xl border-stone-300 bg-transparent text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800/50"
                  >
                    <Link href="/login">I have an account</Link>
                  </Button>
                </div>

                <p className="font-body mt-5 text-xs text-stone-400">Walk-ins welcome at reception.</p>

                {/* Trust signals */}
                <div className="mt-8 flex flex-wrap gap-5">
                  {[
                    { label: "GHS pricing", desc: "Local currency" },
                    { label: "Clean rooms", desc: "Verified daily" },
                    { label: "Walk-in OK", desc: "No hidden fees" },
                  ].map((t) => (
                    <div key={t.label} className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-amber-500" />
                      <div className="font-body">
                        <span className="text-xs font-medium text-stone-900 dark:text-stone-100">{t.label}</span>
                        <span className="ml-1 text-xs text-stone-400">{t.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Image */}
              <div className="order-1 lg:order-2">
                <div className="relative mx-auto max-w-xl lg:max-w-none">
                  {/* Corner accent */}
                  <div className="absolute -right-3 -top-3 h-20 w-20 rounded-2xl border border-amber-400/20 hidden lg:block" aria-hidden />
                  <div className="absolute -bottom-3 -left-3 h-16 w-16 rounded-xl border border-amber-400/10 hidden lg:block" aria-hidden />

                  <div
                    className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-stone-200 shadow-2xl shadow-stone-300/30 dark:border-stone-800 dark:shadow-black/60 sm:aspect-[5/4] lg:aspect-[4/5] lg:min-h-[480px] cursor-pointer group"
                    onClick={() =>
                      openLightbox([
                        { src: HERO_ROOM_IMAGE, alt: "Welcoming lodge bedroom with a comfortable bed and soft lighting" },
                        { src: "https://res.cloudinary.com/dfq1bz01f/image/upload/v1776258874/12_gmaf8x.jpg", alt: "Welcoming" },
                        { src: "https://res.cloudinary.com/dfq1bz01f/image/upload/v1776258874/15_mprf7p.jpg", alt: "Welcoming" },
                        { src: "https://res.cloudinary.com/dfq1bz01f/image/upload/v1776258872/17_barkhz.jpg", alt: "Welcoming" },
                        { src: "https://res.cloudinary.com/dfq1bz01f/image/upload/v1776258873/16_glaogh.jpg", alt: "Welcoming" },
                        { src: "https://res.cloudinary.com/dfq1bz01f/image/upload/v1776259348/WhatsApp_Image_2026-04-09_at_7.45.29_PM_h02nxj.jpg", alt: "Welcoming" },
                      ])
                    }
                  >
                    <Image
                      src={HERO_ROOM_IMAGE}
                      alt="Welcoming lodge bedroom with a comfortable bed and soft lighting"
                      fill
                      priority
                      className="object-cover transition duration-700 group-hover:scale-105"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-stone-950/10 to-transparent" aria-hidden />
                    <div className="absolute bottom-5 left-5 right-5">
                      <div className="font-body inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        View photo gallery
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── ACCESSIBILITY WARNING ── */}
        <section className="border-y border-red-900/20 bg-gradient-to-r from-red-950/10 via-red-950/20 to-red-950/10 dark:border-red-800/30 dark:from-red-950/40 dark:via-red-950/30 dark:to-red-950/40">
          <div className="mx-auto max-w-6xl px-6 py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="flex shrink-0 gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400">
                  <Accessibility className="h-5 w-5" aria-hidden />
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
                  <AlertTriangle className="h-5 w-5" aria-hidden />
                </div>
              </div>
              <div className="flex-1 font-body">
                <p className="text-sm font-semibold text-red-700 dark:text-red-300">Accessibility Notice — Stairs Only</p>
                <p className="mt-1 text-sm leading-relaxed text-stone-500 dark:text-stone-400">
                  We regret that guests with mobility impairments or those who use wheelchairs may not be able to access our accommodations. All rooms are on upper floors with no elevator access.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["Stairs only", "No wheelchair access", "Ground floor unavailable"].map((tag, i) => (
                    <span key={tag} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${i < 2 ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${i < 2 ? 'bg-red-500' : 'bg-amber-500'}`} />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── ROOM GALLERY ── */}
        <section className="border-b border-stone-200/60 bg-stone-50 py-20 dark:border-stone-800/40 dark:bg-stone-900/20 sm:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
              <div>
                <p className="font-body mb-3 text-xs tracking-[0.2em] text-amber-600 dark:text-amber-400 uppercase">Accommodations</p>
                <h2 className="font-display text-4xl font-light text-stone-900 dark:text-white sm:text-5xl">
                  Our rooms
                </h2>
                <p className="font-body mt-4 max-w-lg text-base leading-relaxed text-stone-500 dark:text-stone-400">
                  All singles — so you always know what you're booking. Pick the tier that suits your trip.
                </p>
              </div>
              <Button
                asChild
                variant="outline"
                className="font-body shrink-0 border-stone-300 text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
              >
                <Link href="/register" className="inline-flex items-center gap-2">
                  View availability
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {ROOM_GALLERY.map((room, idx) => (
                <article
                  key={room.src}
                  className="card-shine group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-all hover:border-amber-300/50 hover:shadow-lg dark:border-stone-800 dark:bg-stone-900/60 dark:hover:border-amber-700/30"
                >
                  <div
                    className="relative aspect-[16/10] overflow-hidden cursor-pointer"
                    onClick={() =>
                      openLightbox(
                        room.images.map((image) => ({
                          src: image.src,
                          alt: image.alt,
                          caption: "caption" in image ? image.caption : undefined,
                        }))
                      )
                    }
                  >
                    <Image
                      src={room.src}
                      alt={room.alt}
                      fill
                      className="img-hover object-cover"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-body opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 bg-white/90 dark:bg-stone-900/90 text-stone-900 dark:text-white px-4 py-2 rounded-full text-xs font-medium tracking-wide shadow-lg">
                        View gallery
                      </span>
                    </div>
                  </div>
                  <div className="p-7">
                    <p className="font-body text-sm leading-relaxed text-stone-500 dark:text-stone-400">
                      {"caption" in room && typeof room.caption === "string" ? room.caption : ""}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 font-body text-xs text-emerald-600 dark:text-emerald-400">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Available
                      </div>
                      <Button
                        asChild
                        variant="ghost"
                        className="font-body h-auto p-0 text-xs font-medium text-amber-600 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300"
                      >
                        <Link href="/register" className="inline-flex items-center gap-1">
                          Check dates & book
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── MAP & LOCATION ── */}
        <section className="border-b border-stone-200/60 bg-white py-20 dark:border-stone-800/40 dark:bg-stone-950 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-12">
              <p className="font-body mb-3 text-xs tracking-[0.2em] text-amber-600 dark:text-amber-400 uppercase">Location</p>
              <h2 className="font-display text-4xl font-light text-stone-900 dark:text-white sm:text-5xl">
                Find us in Accra
              </h2>
              <p className="font-body mt-4 max-w-xl text-base leading-relaxed text-stone-500 dark:text-stone-400">
                Situated in Adenta, a calm residential neighbourhood in Greater Accra. Easy to reach, quiet to stay in.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="relative overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
                <iframe
                  src={mapsEmbedSrc}
                  width="100%"
                  height="340"
                  loading="lazy"
                  title="Waterhouse Lodge location map"
                  className="min-h-[300px] w-full"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-10 sm:right-auto sm:max-w-sm">
                  <div className="flex items-start gap-3 rounded-2xl border border-stone-200/80 bg-white/97 px-4 py-3 shadow-xl backdrop-blur-sm dark:border-stone-700 dark:bg-stone-900/97">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                      <BedDouble className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-body text-sm font-semibold text-stone-900 dark:text-white">{LODGE_MAP_NAME}</p>
                      <p className="font-body mt-0.5 text-xs leading-snug text-stone-500 dark:text-stone-400">{LODGE_MAP_STREET}</p>
                      <a href={mapsPlaceUrl} target="_blank" rel="noreferrer" className="pointer-events-auto font-body mt-2 inline-block text-xs font-medium text-amber-600 hover:underline dark:text-amber-400 underline-offset-2">
                        Open in Google Maps ↗
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6 dark:border-stone-800 dark:bg-stone-900/60">
                  <p className="font-body text-xs font-medium tracking-widest text-stone-400 uppercase mb-3">Address</p>
                  <p className="font-body text-sm font-semibold text-stone-900 dark:text-white leading-relaxed">{LODGE_MAP_NAME}</p>
                  <p className="font-body mt-1 text-sm text-stone-500 dark:text-stone-400 leading-relaxed">{LODGE_MAP_STREET}</p>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6 dark:border-stone-800 dark:bg-stone-900/60">
                  <p className="font-body text-xs font-medium tracking-widest text-stone-400 uppercase mb-3">Reception</p>
                  <p className="font-body text-sm text-stone-600 dark:text-stone-300">Open daily 10:00 – 22:00</p>
                  <p className="font-body mt-1 text-sm text-stone-500">Desk staffed on-site</p>
                </div>
                <Button
                  asChild
                  className="font-body rounded-xl bg-stone-900 font-medium text-white hover:bg-stone-700 dark:bg-amber-500 dark:text-stone-950 dark:hover:bg-amber-400 h-12"
                >
                  <a href={mapsDirectionsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2">
                    Get directions
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ── EXPERIENCE / CONFERENCE ── */}
        <section className="bg-[#FAF8F5] py-20 dark:bg-[#0E0C0A] sm:py-28">
          <div className="mx-auto grid max-w-6xl gap-14 px-6 lg:grid-cols-2 lg:items-start lg:gap-20">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-stone-200 shadow-xl shadow-stone-200/50 dark:border-stone-800 dark:shadow-black/30 lg:aspect-auto lg:min-h-[460px]">
              <Image
                src={EXPERIENCE_IMAGE}
                alt="Bright, comfortable lodge interior"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-stone-950/20" />
            </div>
            <div className="flex flex-col justify-center">
              <p className="font-body mb-4 text-xs tracking-[0.2em] text-amber-600 dark:text-amber-400 uppercase">Conference & Events</p>
              <ConferenceAvailabilityLanding className="mt-0 w-full max-w-none" />
            </div>
          </div>
        </section>

        {/* ── WHY US ── */}
        <section className="border-y border-stone-200/60 bg-stone-50 py-20 dark:border-stone-800/40 dark:bg-stone-900/20 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center mb-14">
              <p className="font-body mb-3 text-xs tracking-[0.2em] text-amber-600 dark:text-amber-400 uppercase">Why guests choose us</p>
              <h2 className="font-display text-4xl font-light text-stone-900 dark:text-white sm:text-5xl">
                Simple, honest lodging
              </h2>
              <p className="font-body mx-auto mt-4 max-w-xl text-base text-stone-500 dark:text-stone-400">
                Transparent pricing, proper registration, and a standard of care that makes you feel at home.
              </p>
            </div>

            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: CalendarRange, title: "Easy booking", text: "Choose your dates and see available rooms clearly, with no guessing." },
                { icon: Sparkles, title: "Rates in GHS", text: "Compare nightly prices in Ghana Cedis before you commit to anything." },
                { icon: ShieldCheck, title: "Guest registration", text: "We securely collect the information required under Ghana regulations." },
                { icon: Wifi, title: "Comfort first", text: "Clean, well-kept rooms designed for genuine rest or remote work." },
              ].map((item) => (
                <li key={item.title}>
                  <div className="card-shine h-full rounded-2xl border border-stone-200 bg-white p-6 transition-all hover:border-amber-300/50 hover:shadow-md dark:border-stone-800 dark:bg-stone-900/60 dark:hover:border-amber-700/30">
                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-amber-200/50 bg-amber-50 text-amber-600 dark:border-amber-900/30 dark:bg-amber-900/20 dark:text-amber-400">
                      <item.icon className="h-5 w-5" aria-hidden />
                    </div>
                    <h3 className="font-body font-semibold text-stone-900 dark:text-white">{item.title}</h3>
                    <p className="font-body mt-2 text-sm leading-relaxed text-stone-500 dark:text-stone-400">{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex items-start gap-4 rounded-2xl border border-red-200/60 bg-red-50/50 p-5 dark:border-red-900/30 dark:bg-red-950/20">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-500 dark:bg-red-900/40 dark:text-red-400">
                <Accessibility className="h-4 w-4" />
              </div>
              <p className="font-body text-sm leading-relaxed text-stone-500 dark:text-stone-400">
                <span className="font-semibold text-red-600 dark:text-red-400">Accessibility: </span>
                Waterhouse Lodge does not have an elevator and is not wheelchair accessible. All guest rooms are on upper floors reachable only via stairs. We apologise for any inconvenience.
              </p>
            </div>
          </div>
        </section>

        {/* ── CONTACT ── */}
        <section id="contact" className="border-b border-stone-200/60 bg-white py-20 dark:border-stone-800/40 dark:bg-stone-950 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center mb-14">
              <p className="font-body mb-3 text-xs tracking-[0.2em] text-amber-600 dark:text-amber-400 uppercase">Reach us</p>
              <h2 className="font-display text-4xl font-light text-stone-900 dark:text-white sm:text-5xl">Get in touch</h2>
              <p className="font-body mx-auto mt-4 max-w-xl text-base text-stone-500 dark:text-stone-400">
                Have questions about your stay? We're happy to help — before, during, or after your visit.
              </p>
            </div>

            <div className="mx-auto max-w-2xl space-y-5">
              {/* Contact info */}
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-7 dark:border-stone-800 dark:bg-stone-900/40">
                <h3 className="font-display text-xl font-medium text-stone-900 dark:text-white mb-6">Contact Information</h3>
                <div className="space-y-5">
                  {[
                    {
                      icon: MapPin,
                      label: "Address",
                      value: "Waterhouse Lodge, Nii Opkoti Adjei Commey, Adenta, Accra, Ghana (Between Roman Catholic Housing Commandos and Victory Presby Church Adenta)"
                    },
                    { icon: Phone, label: "Phone", value: "+233 (0) 53 553 6119" },
                    { icon: Mail, label: "Email", value: "info@waterhouselodge.com" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-amber-500 dark:border-stone-700 dark:bg-stone-800">
                        <item.icon className="h-4 w-4" />
                      </span>
                      <div className="font-body">
                        <p className="text-xs font-medium tracking-wide text-stone-400 uppercase">{item.label}</p>
                        <p className="mt-0.5 text-sm text-stone-700 dark:text-stone-300 leading-relaxed">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hours */}
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-7 dark:border-stone-800 dark:bg-stone-900/40">
                <h3 className="font-display text-xl font-medium text-stone-900 dark:text-white mb-6">Opening Hours</h3>
                <div className="flex items-start gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-amber-500 dark:border-stone-700 dark:bg-stone-800">
                    <Clock className="h-4 w-4" />
                  </span>
                  <div className="font-body flex-1 space-y-2">
                    {[
                      { day: "Monday – Friday", hours: "10:00 AM – 10:00 PM" },
                      { day: "Saturday", hours: "10:00 AM – 8:00 PM" },
                      { day: "Sunday", hours: "12:00 PM – 6:00 PM" },
                    ].map((row) => (
                      <div key={row.day} className="flex justify-between text-sm">
                        <span className="text-stone-500 dark:text-stone-400">{row.day}</span>
                        <span className="font-medium text-stone-900 dark:text-stone-100">{row.hours}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Social */}
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-7 dark:border-stone-800 dark:bg-stone-900/40">
                <h3 className="font-display text-xl font-medium text-stone-900 dark:text-white mb-6">Follow Us</h3>
                <div className="flex flex-wrap gap-3">
                  {socialLinks.map((social) => (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`font-body group flex items-center gap-2 rounded-xl border border-stone-200 ${social.bgColor} px-4 py-2.5 text-sm font-medium text-stone-700 transition-all hover:text-white hover:border-transparent dark:border-stone-700 dark:text-stone-300 ${social.color}`}
                    >
                      <social.icon className="h-4 w-4 shrink-0" />
                      {social.name}
                    </a>
                  ))}
                </div>
                <p className="font-body mt-5 text-xs text-stone-400 text-center border-t border-stone-200 dark:border-stone-700 pt-5">
                  Stay connected for updates, offers, and a glimpse of life at Waterhouse Lodge.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-14 lg:grid-cols-2 lg:items-start lg:gap-20">
              <div>
                <p className="font-body mb-4 text-xs tracking-[0.2em] text-amber-600 dark:text-amber-400 uppercase">Process</p>
                <h2 className="font-display text-4xl font-light text-stone-900 dark:text-white sm:text-5xl">
                  How booking works
                </h2>
                <ol className="mt-10 space-y-7">
                  {[
                    "Create a free guest account with your name, phone, and email.",
                    "Choose your stay dates — we only show rooms that are actually available.",
                    "Pick a room by price and complete the registration details for your stay.",
                    "Arrive on check-in day; we verify ID and welcome you warmly.",
                  ].map((step, i) => (
                    <li key={i} className="flex gap-5">
                      <span className="font-display number-badge flex h-9 w-9 shrink-0 items-center justify-center text-lg font-light">
                        {i + 1}
                      </span>
                      <p className="font-body pt-1 text-sm leading-relaxed text-stone-500 dark:text-stone-400">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-3xl border border-stone-200 bg-stone-50 p-8 dark:border-stone-800 dark:bg-stone-900/40 lg:p-10">
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-amber-500 dark:border-stone-700 dark:bg-stone-800">
                    <MapPin className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <h3 className="font-body font-semibold text-stone-900 dark:text-white">Reception & local guidance</h3>
                    <p className="font-body mt-2 text-sm leading-relaxed text-stone-500 dark:text-stone-400">
                      Ask our reception team for directions, transport tips, and the best places to visit around Accra. We're here to help you plan your days.
                    </p>
                  </div>
                </div>

                <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900/60">
                  <p className="font-body text-sm font-semibold text-stone-900 dark:text-white">Questions before you book?</p>
                  <p className="font-body mt-2 text-sm text-stone-500 dark:text-stone-400">
                    Message or call us anytime — or reserve online in just a few minutes.
                  </p>
                  <Button
                    asChild
                    className="font-body mt-5 w-full rounded-xl bg-stone-900 font-medium text-white hover:bg-stone-700 dark:bg-amber-500 dark:text-stone-950 dark:hover:bg-amber-400 sm:w-auto"
                  >
                    <Link href="/register" className="inline-flex items-center gap-2">
                      Start your reservation
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="relative overflow-hidden border-t border-stone-200/60 dark:border-stone-800/40">
          <div className="absolute inset-0 hero-gradient" aria-hidden />
          <div className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} aria-hidden />
          <div className="relative mx-auto max-w-3xl px-6 py-20 text-center sm:py-24">
            <p className="font-body mb-4 text-xs tracking-[0.2em] text-amber-600 dark:text-amber-400 uppercase">Reserve today</p>
            <h2 className="font-display text-4xl font-light text-stone-900 dark:text-white sm:text-5xl lg:text-6xl">
              Ready to stay<br />
              <em className="italic text-amber-600 dark:text-amber-400">with us?</em>
            </h2>
            <p className="font-body mx-auto mt-5 max-w-md text-base leading-relaxed text-stone-500 dark:text-stone-400">
              Lock in your room today. Sign in anytime to view your booking — changes subject to lodge policy.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="font-body h-13 min-w-[200px] rounded-xl bg-stone-900 px-8 text-sm font-medium text-white hover:bg-stone-700 dark:bg-amber-500 dark:text-stone-950 dark:hover:bg-amber-400"
              >
                <Link href="/register" className="inline-flex items-center gap-2">
                  Reserve now
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="font-body h-13 rounded-xl text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800/50"
              >
                <Link href="/login">Guest login</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-stone-200/60 bg-stone-900 py-12 dark:border-stone-800/40 dark:bg-stone-950">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-400/20 bg-amber-400/10 text-amber-400">
                  <BedDouble className="h-4 w-4" />
                </span>
                <p className="font-display text-base font-medium text-white">Waterhouse Lodge</p>
              </div>
              <p className="font-body mt-2 text-sm text-stone-500">Comfortable stays · Adenta, Accra, Ghana</p>
              <div className="mt-5 flex gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex h-9 w-9 items-center justify-center rounded-xl border border-stone-700 bg-stone-800 text-stone-400 transition-all hover:scale-110 hover:text-white ${social.color}`}
                    aria-label={social.name}
                  >
                    <social.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            <nav className="flex flex-col gap-2">
              {[
                { href: "/login", label: "Guest login" },
                { href: "/register", label: "New guest registration" },
                { href: "#contact", label: "Contact us" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-body text-sm text-stone-500 transition-colors hover:text-amber-400"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-stone-800 pt-6 sm:flex-row">
            <p className="font-body text-xs text-stone-600">&copy; 2024 Waterhouse Lodge. All rights reserved.</p>
            <div className="gold-line h-px w-16 hidden sm:block" />
          </div>
        </div>
      </footer>

      {/* Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={selectedImageIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
