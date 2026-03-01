"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { apiFetch } from "@/lib/api";

type Slot = { start_datetime: string; end_datetime: string };
type Pet = {
  id: string;
  owner_id: string;
  name: string;
  type: string;
  breed: string;
  description: string;
  price_per_day: number;
  address: string;
  city: string;
  postal_code: string;
  image_url?: string | null;
  distance_km?: number;
  bookings_enabled?: boolean;
  availability_slots: Slot[];
};

const GEO_KEY = "petlend_user_location";

export default function PetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [error, setError] = useState("");
  const cardsRef = useRef<Array<HTMLElement | null>>([]);

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

    apiFetch<Pet[]>(`/pets?${params.toString()}`)
      .then(setPets)
      .catch((err) => setError((err as Error).message));
  }, []);

  useEffect(() => {
    if (pets.length === 0) return;
    const elements = cardsRef.current.filter(Boolean);
    if (elements.length === 0) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        elements,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.08,
          clearProps: "opacity,transform",
        }
      );
    });
    return () => ctx.revert();
  }, [pets]);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Browse Pets</h1>
      {error && <p className="text-red-600">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {pets.map((pet, idx) => (
          <article
            key={pet.id}
            ref={(el) => {
              cardsRef.current[idx] = el;
            }}
            className="card space-y-2"
          >
            {pet.image_url && (
              <img src={pet.image_url} alt={pet.name} className="h-40 w-full rounded-md object-cover" />
            )}
            <h2 className="text-xl font-semibold">
              {pet.name} <span className="text-sm text-slate-500">({pet.type})</span>
            </h2>
            <p className="line-clamp-3 text-slate-700">{pet.description}</p>
            <p className="font-semibold">${pet.price_per_day.toFixed(2)} / day</p>
            <p className="text-sm text-slate-600">
              Location:{" "}
              {pet.address || pet.city || pet.postal_code
                ? `${pet.address}${pet.address ? ", " : ""}${pet.city} ${pet.postal_code}`.trim()
                : "Not provided"}
            </p>
            {typeof pet.distance_km === "number" && (
              <p className="text-sm text-slate-600">{pet.distance_km.toFixed(1)} km away</p>
            )}
            <p className="text-sm text-slate-500">
              {pet.availability_slots.length} available slot(s)
            </p>
            {pet.bookings_enabled === false ? (
              <span className="inline-block rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                Unavailable
              </span>
            ) : pet.availability_slots.length === 0 ? (
              <span className="inline-block rounded-full bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700">
                Booked
              </span>
            ) : null}
            <Link href={`/pets/${pet.id}`} className="inline-block rounded-md bg-slate-900 px-3 py-1 text-white">
              View Details
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
