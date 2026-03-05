"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { apiFetch } from "@/lib/api";
import { useState } from "react";

type Slot = { start_datetime: string; end_datetime: string };
type Pet = {
  id: string;
  name: string;
  type: string;
  breed: string;
  price_per_day: number;
  image_url?: string | null;
  distance_km?: number;
  bookings_enabled?: boolean;
  availability_slots: Slot[];
};

const GEO_KEY = "petlend_user_location";

export default function HomePage() {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const brandRef = useRef<HTMLHeadingElement | null>(null);
  const taglineRef = useRef<HTMLParagraphElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);
  const bgRefs = useRef<Array<HTMLDivElement | null>>([]);
  const revealRefs = useRef<Array<HTMLElement | null>>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [petsError, setPetsError] = useState("");
  const [isLoadingPets, setIsLoadingPets] = useState(true);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (bgRefs.current.length >= 3) {
        const bgs = bgRefs.current.filter(Boolean) as HTMLDivElement[];
        gsap.set(bgs, { opacity: 0 });
        gsap.set(bgs[0], { opacity: 1 });
        const bgTl = gsap.timeline({ repeat: -1 });
        bgTl
          .to(bgs[1], { opacity: 1, duration: 2.2, ease: "power3.out" }, "+=4")
          .to(bgs[0], { opacity: 0, duration: 2.2, ease: "power3.out" }, "<")
          .to(bgs[2], { opacity: 1, duration: 2.2, ease: "power3.out" }, "+=4")
          .to(bgs[1], { opacity: 0, duration: 2.2, ease: "power3.out" }, "<")
          .to(bgs[0], { opacity: 1, duration: 2.2, ease: "power3.out" }, "+=4")
          .to(bgs[2], { opacity: 0, duration: 2.2, ease: "power3.out" }, "<");
      }

      const introTl = gsap.timeline({ defaults: { ease: "power3.out" } });
      introTl
        .fromTo(
          brandRef.current,
          { opacity: 0, y: 26, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 1.05 }
        )
        .fromTo(
          taglineRef.current,
          { opacity: 0, y: 36 },
          { opacity: 1, y: 0, duration: 0.9 },
          "-=0.15"
        )
        .fromTo(
          ctaRef.current?.children || [],
          { opacity: 0, y: 28 },
          { opacity: 1, y: 0, duration: 0.9, stagger: 0.1 },
          "-=0.45"
        );

      const sections = revealRefs.current.filter(Boolean) as HTMLElement[];
      gsap.fromTo(
        sections,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.85, ease: "power3.out", stagger: 0.12, delay: 0.35 }
      );
    }, pageRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    const stored = localStorage.getItem(GEO_KEY);
    if (stored) {
      try {
        const geo = JSON.parse(stored);
        if (typeof geo?.lat === "number" && typeof geo?.lng === "number") {
          params.set("lat", String(geo.lat));
          params.set("lng", String(geo.lng));
          params.set("radius_km", "5");
        }
      } catch {
        // no-op
      }
    }

    apiFetch<Pet[]>(`/pets${params.toString() ? `?${params.toString()}` : ""}`)
      .then((data) => setPets(data.slice(0, 6)))
      .catch((err) => setPetsError((err as Error).message))
      .finally(() => setIsLoadingPets(false));
  }, []);

  return (
    <div ref={pageRef} className="relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden">
      <section className="relative min-h-[calc(100vh-72px)]">
        <div className="absolute inset-0">
          <div
            ref={(el) => {
              bgRefs.current[0] = el;
            }}
            className="hero-bg-layer"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=2200&q=80')",
            }}
          />
          <div
            ref={(el) => {
              bgRefs.current[1] = el;
            }}
            className="hero-bg-layer"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&w=2200&q=80')",
            }}
          />
          <div
            ref={(el) => {
              bgRefs.current[2] = el;
            }}
            className="hero-bg-layer"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=2200&q=80')",
            }}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/45 to-black/55" />

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-72px)] max-w-6xl items-center px-6">
          <div className="max-w-3xl">
            <h1 ref={brandRef} className="text-6xl font-black tracking-tight text-white md:text-8xl">
              Co.pet
            </h1>
            <p ref={taglineRef} className="mt-6 max-w-2xl text-lg text-white/90 md:text-2xl">
              Find loving temporary homes for pets or spend time with animals you love.
            </p>
            <div ref={ctaRef} className="mt-10 flex flex-wrap items-center gap-4">
              <Link href="/pets" className="hero-btn hero-btn-primary">
                Browse Pets
              </Link>
              <Link href="/pets/new" className="hero-btn hero-btn-secondary">
                List Your Pet
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-14 px-4 py-14 md:px-6">
        <section
          ref={(el) => {
            revealRefs.current[0] = el;
          }}
          className="card"
        >
          <div className="grid gap-3 md:grid-cols-4">
            <input
              type="text"
              placeholder="Search by location"
              className="bg-white/85 px-3 py-2"
            />
            <select className="bg-white/85 px-3 py-2">
              <option>Pet Type</option>
              <option>Dog</option>
              <option>Cat</option>
              <option>Bird</option>
            </select>
            <select className="bg-white/85 px-3 py-2">
              <option>Price Range</option>
              <option>Under $25/day</option>
              <option>$25-$60/day</option>
              <option>$60+/day</option>
            </select>
            <input type="datetime-local" className="bg-white/85 px-3 py-2" />
          </div>
        </section>

        <section
          ref={(el) => {
            revealRefs.current[1] = el;
          }}
          className="space-y-6"
        >
          <h2 className="text-3xl font-bold text-slate-900">How it works</h2>
          <div className="grid gap-5 md:grid-cols-3">
            <article className="card group">
              <h3 className="text-xl font-bold text-slate-900">List Your Pet</h3>
              <p className="mt-2 text-slate-700">
                Pet owners can list their pets temporarily when they are busy or traveling.
              </p>
            </article>
            <article className="card group">
              <h3 className="text-xl font-bold text-slate-900">Borrow a Pet</h3>
              <p className="mt-2 text-slate-700">
                Animal lovers can spend time with pets without long-term responsibility.
              </p>
            </article>
            <article className="card group">
              <h3 className="text-xl font-bold text-slate-900">Safe &amp; Trusted</h3>
              <p className="mt-2 text-slate-700">
                Secure platform with verified users and booking management.
              </p>
            </article>
          </div>
        </section>

        <section
          ref={(el) => {
            revealRefs.current[2] = el;
          }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-3xl font-bold text-slate-900">Popular Pets Nearby</h2>
            <Link href="/pets" className="text-sm font-medium text-slate-700 transition hover:text-slate-900">
              View all
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {isLoadingPets && (
              <article className="card sm:col-span-2 lg:col-span-3">
                <p className="text-slate-700">Loading pets...</p>
              </article>
            )}
            {!isLoadingPets && petsError && (
              <article className="card sm:col-span-2 lg:col-span-3">
                <p className="text-red-600">{petsError}</p>
              </article>
            )}
            {!isLoadingPets && !petsError && pets.length === 0 && (
              <article className="card sm:col-span-2 lg:col-span-3">
                <p className="text-slate-700">No pets listed yet. Be the first to list a pet.</p>
              </article>
            )}
            {pets.map((pet) => (
              <article key={pet.id} className="overflow-hidden rounded-xl border border-white/40 bg-white/70 shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={
                      pet.image_url ||
                      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80"
                    }
                    alt={pet.name}
                    className="h-full w-full object-cover transition duration-300 hover:scale-105"
                  />
                </div>
                <div className="space-y-1 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">{pet.name}</h3>
                    {pet.bookings_enabled === false ? (
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                        Unavailable
                      </span>
                    ) : pet.availability_slots.length === 0 ? (
                      <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">
                        Booked
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                        Available
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">{pet.breed}</p>
                  <p className="text-sm text-slate-600">
                    {typeof pet.distance_km === "number" ? `${pet.distance_km.toFixed(1)} km away` : "Distance unavailable"}
                  </p>
                  <p className="text-sm font-semibold text-slate-800">${pet.price_per_day.toFixed(2)}/day</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          ref={(el) => {
            revealRefs.current[3] = el;
          }}
          className="card space-y-4"
        >
          <h2 className="text-3xl font-bold text-slate-900">About Co.pet</h2>
          <p className="max-w-3xl text-slate-700">
            We connect caring pet owners with trusted animal lovers to create meaningful, flexible
            companionship experiences while prioritizing safety and pet wellbeing.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-white/40 bg-white/50 p-4">
              <p className="font-semibold text-slate-900">Verified Community</p>
              <p className="mt-1 text-sm text-slate-700">Identity-first onboarding and trusted profiles.</p>
            </div>
            <div className="rounded-xl border border-white/40 bg-white/50 p-4">
              <p className="font-semibold text-slate-900">Booking Transparency</p>
              <p className="mt-1 text-sm text-slate-700">Clear scheduling and reliable booking records.</p>
            </div>
            <div className="rounded-xl border border-white/40 bg-white/50 p-4">
              <p className="font-semibold text-slate-900">Compassionate Care</p>
              <p className="mt-1 text-sm text-slate-700">Pet comfort and routines stay the top priority.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-950 px-4 py-10 text-slate-300 md:px-6">
        <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 md:grid-cols-3">
          <div>
            <h3 className="text-lg font-bold text-white">Co.pet</h3>
            <div className="mt-3 space-y-2 text-sm">
              <Link href="/about" className="block transition hover:text-white">About</Link>
              <Link href="/help" className="block transition hover:text-white">Help</Link>
              <a href="mailto:support@co.pet" className="block transition hover:text-white">Contact</a>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Platform</h3>
            <div className="mt-3 space-y-2 text-sm">
              <Link href="/pets" className="block transition hover:text-white">Browse Pets</Link>
              <Link href="/pets/new" className="block transition hover:text-white">List Pet</Link>
              <Link href="/dashboard" className="block transition hover:text-white">Dashboard</Link>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Legal</h3>
            <div className="mt-3 space-y-2 text-sm">
              <Link href="#" className="block transition hover:text-white">Privacy Policy</Link>
              <Link href="#" className="block transition hover:text-white">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
