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

// Lightbox component
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

  const goToPrevious = () => {
    if (hasPrevious) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (hasNext) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowLeft") goToPrevious();
    if (e.key === "ArrowRight") goToNext();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="dialog"
      aria-label="Image gallery"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-stone-800/50 p-2 text-white hover:bg-stone-700/50 transition-colors"
        aria-label="Close gallery"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Image counter */}
      <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-stone-800/50 px-3 py-1 text-sm text-white">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Previous button */}
      {hasPrevious && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToPrevious();
          }}
          className="absolute left-4 z-10 rounded-full bg-stone-800/50 p-2 text-white hover:bg-stone-700/50 transition-colors"
          aria-label="Previous image"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Next button */}
      {hasNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToNext();
          }}
          className="absolute right-4 z-10 rounded-full bg-stone-800/50 p-2 text-white hover:bg-stone-700/50 transition-colors"
          aria-label="Next image"
        >
          <ChevronRightIcon className="h-6 w-6" />
        </button>
      )}

      {/* Main image */}
      <div
        className="relative max-h-[90vh] max-w-[90vw] cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-auto w-auto">
          <Image
            src={currentImage.src}
            alt={currentImage.alt || "Gallery image"}
            width={1200}
            height={800}
            className="max-h-[85vh] w-auto object-contain"
            priority
          />
        </div>
        {currentImage.caption && (
          <p className="mt-4 text-center text-sm text-stone-400">
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
  const LODGE_MAP_QUERY = encodeURIComponent(
    `${LODGE_MAP_NAME}, ${LODGE_MAP_STREET}`,
  );
  const LODGE_LAT = "5.713546";
  const LODGE_LNG = "-0.154072";
  /** Name + address so Google can match a Place; ll pins the exact coordinates. */
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
    geo: {
      "@type": "GeoCoordinates",
      latitude: 5.713546,
      longitude: -0.154072,
    },
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

  // Social media links configuration
  const socialLinks = [
    {
      name: "Facebook",
      icon: Facebook,
      href: "https://facebook.com/waterhouselodge",
      color: "hover:bg-[#1877F2]",
      bgColor: "bg-[#1877F2]/10",
    },
    {
      name: "Instagram",
      icon: Instagram,
      href: "https://instagram.com/waterhouselodge",
      color: "hover:bg-[#E4405F]",
      bgColor: "bg-[#E4405F]/10",
    },
    {
      name: "TikTok",
      icon: Send,
      href: "https://tiktok.com/@waterhouselodge",
      color: "hover:bg-[#000000]",
      bgColor: "bg-[#69C9D0]/10",
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      href: "https://wa.me/233535536119", // Replace with your WhatsApp number
      color: "hover:bg-[#25D366]",
      bgColor: "bg-[#25D366]/10",
    },
  ];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <AvailableRoomsFloat />
      <header className="sticky top-0 z-50 border-b border-stone-200 bg-stone-50/90 backdrop-blur-md dark:border-stone-800/80 dark:bg-stone-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight text-stone-900 dark:text-white"
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
              className="hidden text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white sm:inline-flex"
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
        <section className="relative overflow-hidden border-b border-stone-200 dark:border-stone-800">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_70%_-10%,rgba(245,158,11,0.18),transparent)]"
            aria-hidden
          />
          <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14 lg:py-20">
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
              <div className="order-2 lg:order-1">
                <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200 sm:text-sm">
                  <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Adenta, Accra, Ghana · Rates in GHS
                </p>
                <h1 className="max-w-xl text-balance font-serif text-4xl font-medium leading-tight tracking-tight text-stone-900 dark:text-white sm:text-5xl lg:text-6xl">
                  Rest easy — your room is waiting
                </h1>
                <p className="mt-6 max-w-lg text-pretty text-base leading-relaxed text-stone-600 dark:text-stone-400 sm:text-lg">
                  Relax in single rooms with fresh bed linen and space to truly unwind.
                  Check availability, view nightly rates in Ghana Cedis, and book your stay in minutes
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
                    className="h-12 rounded-lg border-stone-300 bg-white text-stone-800 hover:bg-stone-100 dark:border-stone-600 dark:bg-stone-900/40 dark:text-stone-100 dark:hover:bg-stone-800"
                  >
                    <Link href="/login">I have an account</Link>
                  </Button>
                </div>
                <p className="mt-6 text-sm text-stone-600 dark:text-stone-500">
                  Walk-ins welcome at reception.
                </p>
              </div>

              <div className="order-1 lg:order-2">
                <div className="relative mx-auto max-w-xl lg:max-w-none">
                  <div
                    className="absolute -right-4 -top-4 hidden h-24 w-24 rounded-2xl border border-amber-500/20 bg-amber-500/5 lg:block"
                    aria-hidden
                  />
                  <div
                    className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-stone-300 shadow-2xl shadow-stone-300/30 dark:border-stone-800 dark:shadow-black/50 sm:aspect-[5/4] lg:aspect-[4/5] lg:min-h-[420px] cursor-pointer group"
                    onClick={() =>
                      openLightbox([
                        {
                          src: HERO_ROOM_IMAGE,
                          alt: "Welcoming lodge bedroom with a comfortable bed and soft lighting",
                        },
                        {
                          src: "https://res.cloudinary.com/dfq1bz01f/image/upload/v1776258874/12_gmaf8x.jpg",
                          alt: "Welcoming",
                        },
                        {
                          src: "https://res.cloudinary.com/dfq1bz01f/image/upload/v1776258874/15_mprf7p.jpg",
                          alt: "Welcoming",
                        },
                        {
                          src: "https://res.cloudinary.com/dfq1bz01f/image/upload/v1776258872/17_barkhz.jpg",
                          alt: "Welcoming",
                        },
                        {
                          src: "https://res.cloudinary.com/dfq1bz01f/image/upload/v1776258873/16_glaogh.jpg",
                          alt: "Welcoming",
                        },
                        {
                          src: "https://res.cloudinary.com/dfq1bz01f/image/upload/v1776259348/WhatsApp_Image_2026-04-09_at_7.45.29_PM_h02nxj.jpg",
                          alt: "Welcoming",
                        },
                      
                      ])
                    }
                  >
                    <Image
                      src={HERO_ROOM_IMAGE}
                      alt="Welcoming lodge bedroom with a comfortable bed and soft lighting"
                      fill
                      priority
                      className="object-cover transition duration-500 group-hover:scale-105"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-stone-950/50 via-transparent to-transparent pointer-events-none"
                      aria-hidden
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                        Click to view gallery
                      </span>
                    </div>
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
        <section className="border-b border-stone-200 bg-stone-100/60 py-16 dark:border-stone-800 dark:bg-stone-900/35 sm:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="max-w-2xl">
              <h2 className="font-serif text-3xl font-medium text-stone-900 dark:text-white sm:text-4xl">
                Our rooms
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-stone-600 dark:text-stone-400">
                All singles — so you always know what you are booking. Pick the
                tier and price that match your trip; photos below illustrate the
                calm, tidy standard we keep across the lodge.
              </p>
            </div>

            <div className="mt-12 grid gap-8 sm:grid-cols-2">
              {ROOM_GALLERY.map((room) => (
                <article
                  key={room.src}
                  className="group overflow-hidden rounded-2xl border border-stone-300 bg-white shadow-lg transition hover:border-amber-400/40 hover:shadow-xl dark:border-stone-800 dark:bg-stone-900/40 dark:hover:border-amber-900/40"
                >
                  <div
                    className="relative aspect-[16/10] overflow-hidden cursor-pointer"
                    onClick={() =>
                      openLightbox(
                        room.images.map((image) => ({
                          src: image.src,
                          alt: image.alt,
                          caption:
                            "caption" in image ? image.caption : undefined,
                        })),
                      )
                    }
                  >
                    <Image
                      src={room.src}
                      alt={room.alt}
                      fill
                      className="object-cover transition duration-700 ease-out group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                        Click to view gallery
                      </span>
                    </div>
                  </div>
                  <div className="p-6 sm:p-7">
                    <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                      {"caption" in room && typeof room.caption === "string"
                        ? room.caption
                        : ""}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
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
        <section className="border-b border-stone-200 bg-white py-14 dark:border-stone-800 dark:bg-stone-950/70 sm:py-16">
          <div className="mx-auto max-w-6xl px-4">
              <h2 className="font-serif text-3xl font-medium text-stone-900 dark:text-white sm:text-4xl">
              Find Waterhouse Lodge
            </h2>
            <p className="mt-3 max-w-3xl text-stone-600 dark:text-stone-300">
              See our location in Accra and get directions instantly with Google
              Maps.
            </p>
            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="relative overflow-hidden rounded-2xl border border-stone-300 bg-white dark:border-stone-800 dark:bg-stone-900">
                <iframe
                  src={mapsEmbedSrc}
                  width="100%"
                  height="300"
                  loading="lazy"
                  title="Waterhouse Lodge location map"
                  className="min-h-[280px] w-full"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                {/* Google only shows the official lodging/bed pin for claimed Business Profiles; this card mirrors a place label on the map. */}
                <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-10 sm:right-auto sm:max-w-sm">
                  <div className="flex items-start gap-3 rounded-lg border border-stone-200/90 bg-white/95 px-3 py-2.5 shadow-lg backdrop-blur-sm dark:border-stone-600 dark:bg-stone-900/95">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-800 dark:bg-amber-500/25 dark:text-amber-300"
                      aria-hidden
                    >
                      <BedDouble className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-tight text-stone-900 dark:text-white">
                        {LODGE_MAP_NAME}
                      </p>
                      <p className="mt-0.5 text-xs leading-snug text-stone-600 dark:text-stone-400">
                        {LODGE_MAP_STREET}
                      </p>
                      <a
                        href={mapsPlaceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="pointer-events-auto mt-2 inline-block text-xs font-medium text-amber-700 underline-offset-2 hover:underline dark:text-amber-400"
                      >
                        Open in Google Maps
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-stone-300 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
                <p className="text-sm text-stone-600 dark:text-stone-400">Address:</p>
                <p className="mt-1 font-semibold text-stone-900 dark:text-white">
                  {LODGE_MAP_NAME}, {LODGE_MAP_STREET}
                </p>
                <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
                  Open daily 10:00–22:00. Reception desk on site.
                </p>
                <Button
                  asChild
                  className="mt-6 w-full bg-amber-500 font-semibold text-stone-950 hover:bg-amber-400"
                >
                  <a href={mapsDirectionsUrl} target="_blank" rel="noreferrer">
                    Get directions
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Conference room + lodge imagery (replaces former “experience” block) */}
        <section className="bg-stone-100/70 py-16 dark:bg-transparent sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 lg:grid-cols-2 lg:items-start lg:gap-16">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-stone-900 shadow-lg shadow-stone-400/40 dark:border-stone-800 dark:shadow-none lg:aspect-auto lg:min-h-[420px]">
              <Image
                src={EXPERIENCE_IMAGE}
                alt="Bright, comfortable lodge interior"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <ConferenceAvailabilityLanding className="mt-0 w-full max-w-none" />
          </div>
        </section>

        {/*
        Social proof (temporarily hidden)
        <section className="border-y border-stone-200 bg-gradient-to-b from-stone-100 to-white py-16 dark:border-stone-800 dark:from-stone-900/80 dark:to-stone-950">
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
              className="mx-auto mt-6 h-10 w-10 text-stone-400 dark:text-stone-600"
              aria-hidden
            />
            <blockquote className="mt-4 font-serif text-xl leading-relaxed text-stone-700 dark:text-stone-200 sm:text-2xl">
              &ldquo;Easy online booking, room matched the photos, and the team
              made check-in smooth.&rdquo;
            </blockquote>
            <p className="mt-4 text-sm text-stone-500 dark:text-stone-500">
              Sample guest quote — replace with real testimonials.
            </p>
          </div>
        </section>
        */}

        {/* Why choose us — icon cards */}
        <section className="border-b border-stone-200 bg-stone-100/60 py-16 dark:border-stone-800 dark:bg-stone-900/30 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center font-serif text-2xl font-medium text-stone-900 dark:text-white sm:text-3xl">
              Why guests choose us
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-stone-600 dark:text-stone-400">
              Simple booking, transparent pricing, and proper lodging
              registration for a smooth stay.
            </p>
            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: CalendarRange,
                  title: "Easy booking",
                  text: "Choose your dates and see available rooms clearly, with no guessing.",
                },
                {
                  icon: Sparkles,
                  title: "Rates in GHS",
                  text: "Compare nightly prices in Ghana Cedis before you commit.",
                },
                {
                  icon: ShieldCheck,
                  title: "Guest registration",
                  text: "We securely collect the information required under Ghana regulations.",
                },
                {
                  icon: Wifi,
                  title: "Comfort first",
                  text: "Clean, well-kept rooms designed for rest or remote work.",
                },
              ].map((item) => (
                <li key={item.title}>
                  <Card className="h-full border-stone-300 bg-white shadow-none transition hover:border-amber-400/50 dark:border-stone-800 dark:bg-stone-900/60 dark:hover:border-amber-900/50">
                    <CardContent className="p-6">
                      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                        <item.icon className="h-5 w-5" aria-hidden />
                      </div>
                      <h3 className="font-semibold text-stone-900 dark:text-white">{item.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
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
              <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
                Please note: Waterhouse Lodge does not have an elevator and is
                not wheelchair accessible. All guest rooms are located on upper
                floors and can only be reached via stairs. We apologize for any
                inconvenience this may cause.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="border-b border-stone-200 bg-gradient-to-b from-stone-100/60 to-white py-16 dark:border-stone-800 dark:from-stone-900/50 dark:to-stone-950 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="font-serif text-3xl font-medium text-stone-900 dark:text-white sm:text-4xl">
                Get in touch
              </h2>
              <p className="mt-4 text-stone-600 dark:text-stone-400">
                Have questions about your stay? Reach out to us anytime. We're
                here to help make your experience memorable.
              </p>
            </div>

            <div className="mx-auto max-w-2xl space-y-6">
                <div className="rounded-2xl border border-stone-300 bg-white p-6 dark:border-stone-800 dark:bg-stone-900/40 sm:p-8">
                  <h3 className="text-xl font-semibold text-stone-900 dark:text-white mb-6">
                    Contact Information
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-stone-900 dark:text-white">Address</p>
                        <p className="text-sm text-stone-400">
                       
                        Waterhouse Lodge, Nii Opkoti Adjei Commey, Adenta, Accra, Ghana (Between Roman Catholic Housing Commandos and Victory Presby Church Adenta)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-stone-900 dark:text-white">Phone</p>
                        <p className="text-sm text-stone-400">
                          +233 (0) 53 553 6119
                        </p>
                        {/* <p className="text-sm text-stone-400">
                          +233 (0) 54 123 4567
                        </p> */}
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-stone-900 dark:text-white">Email</p>
                        <p className="text-sm text-stone-400">
                          info@waterhouselodge.com
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-stone-300 bg-white p-6 dark:border-stone-800 dark:bg-stone-900/40 sm:p-8">
                  <h3 className="text-xl font-semibold text-stone-900 dark:text-white mb-6">
                    Opening Hours
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <div className="flex justify-between py-1">
                          <span className="text-stone-400">Monday - Friday</span>
                          <span className="text-stone-900 dark:text-white">10:00 AM - 10:00 PM</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-stone-400">Saturday</span>
                          <span className="text-stone-900 dark:text-white">10:00 AM - 8:00 PM</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-stone-400">Sunday</span>
                          <span className="text-stone-900 dark:text-white">12:00 PM - 6:00 PM</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Social Media Section */}
                <div className="rounded-2xl border border-stone-300 bg-white p-6 dark:border-stone-800 dark:bg-stone-900/40 sm:p-8">
                  <h3 className="text-xl font-semibold text-stone-900 dark:text-white mb-6">
                    Follow Us
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    {socialLinks.map((social) => (
                      <a
                        key={social.name}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`group flex items-center gap-2 rounded-full ${social.bgColor} px-4 py-2 transition-all duration-300 hover:scale-105 ${social.color} hover:text-white`}
                      >
                        <social.icon className="h-5 w-5" />
                        <span className="text-sm font-medium">{social.name}</span>
                      </a>
                    ))}
                  </div>
                  <div className="mt-6 pt-6 border-t border-stone-300 dark:border-stone-700">
                    <p className="text-sm text-stone-600 text-center dark:text-stone-400">
                      Follow us on social media for updates, special offers, and
                      a glimpse into life at Waterhouse Lodge!
                    </p>
                  </div>
                </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-16">
              <div>
                <h2 className="font-serif text-2xl font-medium text-stone-900 dark:text-white sm:text-3xl">
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
                      <p className="pt-0.5 leading-relaxed text-stone-600 dark:text-stone-300">
                        {step}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
              <Card className="border-stone-300 bg-gradient-to-br from-white to-stone-100 p-8 dark:border-stone-800 dark:from-stone-900 dark:to-stone-950 lg:p-10">
                <div className="flex items-start gap-3">
                  <MapPin
                    className="mt-0.5 h-5 w-5 shrink-0 text-amber-400"
                    aria-hidden
                  />
                  <div>
                    <h3 className="font-semibold text-stone-900 dark:text-white">
                      Reception & local guidance
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                      Ask reception for directions, transport tips, and places to
                      visit around Accra. We are happy to help you plan your day.
                    </p>
                  </div>
                </div>
                <div className="mt-8 rounded-xl border border-stone-300 bg-white p-6 dark:border-stone-800 dark:bg-stone-950/50">
                  <p className="text-sm font-medium text-stone-900 dark:text-white">
                    Questions before you book?
                  </p>
                  <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
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

        <section className="border-t border-stone-200 bg-amber-100/40 py-14 dark:border-stone-800 dark:bg-amber-500/10 sm:py-16">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="font-serif text-2xl font-medium text-stone-900 dark:text-white sm:text-3xl">
              Ready to stay with us?
            </h2>
            <p className="mt-3 text-stone-700 dark:text-stone-300">
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
                className="h-12 text-stone-700 hover:bg-stone-200 hover:text-stone-900 dark:text-stone-200 dark:hover:bg-stone-800 dark:hover:text-white"
              >
                <Link href="/login">Guest login</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200 bg-stone-100 py-10 dark:border-stone-800 dark:bg-stone-950">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-semibold text-stone-900 dark:text-white">Waterhouse Lodge</p>
              <p className="mt-2 text-sm text-stone-500">
                Comfortable stays · Adenta, Accra, Ghana
              </p>
              {/* Social links in footer */}
              <div className="mt-4 flex gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`rounded-full ${social.bgColor} p-2 transition-all duration-300 hover:scale-110 ${social.color}`}
                    aria-label={social.name}
                  >
                    <social.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
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
              <Link
                href="#contact"
                className="text-stone-400 hover:text-amber-400"
              >
                Contact us
              </Link>
            </div>
          </div>
          <div className="mt-8 text-center text-xs text-stone-500">
            <p>&copy; 2024 Waterhouse Lodge. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Lightbox component */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={selectedImageIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}