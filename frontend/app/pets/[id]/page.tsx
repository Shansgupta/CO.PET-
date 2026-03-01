"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

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
  availability_slots: Slot[];
};

type BookingResponse = {
  id: string;
  total_amount: number;
  payment: {
    borrower_commission: number;
    lender_commission: number;
    lender_payout: number;
    platform_earnings: number;
  };
};

export default function PetDetailsPage({ params }: { params: { id: string } }) {
  const [pet, setPet] = useState<Pet | null>(null);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const qs = new URLSearchParams();
    const stored = localStorage.getItem("petlend_user_location");
    if (stored) {
      try {
        const geo = JSON.parse(stored);
        if (typeof geo?.lat === "number" && typeof geo?.lng === "number") {
          qs.set("lat", String(geo.lat));
          qs.set("lng", String(geo.lng));
        }
      } catch {
        // silently ignore
      }
    }
    apiFetch<Pet>(`/pets/${params.id}${qs.toString() ? `?${qs.toString()}` : ""}`)
      .then(setPet)
      .catch((err) => setError((err as Error).message));
  }, [params.id]);

  const onBook = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!pet || !selectedSlot) return;
    setLoading(true);
    const token = getToken();
    if (!token) {
      setError("Please log in to book.");
      setLoading(false);
      return;
    }
    const [start_datetime, end_datetime] = selectedSlot.split("|");
    try {
      const booking = await apiFetch<BookingResponse>("/bookings", {
        method: "POST",
        token,
        body: {
          pet_id: pet.id,
          start_datetime,
          end_datetime,
          full_name: fullName,
          phone_number: phoneNumber,
          pickup_address: pickupAddress,
        },
      });
      setSuccess(
        `Booking confirmed. Base: $${booking.total_amount.toFixed(2)}, platform total earnings: $${booking.payment.platform_earnings.toFixed(2)}`
      );
      if (confirmBtnRef.current) {
        gsap.fromTo(
          confirmBtnRef.current,
          { scale: 1 },
          {
            scale: 1.08,
            duration: 0.3,
            ease: "power3.out",
            yoyo: true,
            repeat: 1,
          }
        );
      }
      setPet({
        ...pet,
        availability_slots: pet.availability_slots.filter(
          (s) => `${s.start_datetime}|${s.end_datetime}` !== selectedSlot
        ),
      });
      setSelectedSlot("");
      setFullName("");
      setPhoneNumber("");
      setPickupAddress("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (error && !pet) return <p className="text-red-600">{error}</p>;
  if (!pet) return <p>Loading...</p>;

  return (
    <section className="space-y-4">
      <article className="card space-y-3">
        {pet.image_url && (
          <img src={pet.image_url} alt={pet.name} className="h-56 w-full rounded-md object-cover" />
        )}
        <h1 className="text-2xl font-bold">
          {pet.name} <span className="text-sm text-slate-500">({pet.type})</span>
        </h1>
        <p className="text-slate-700">Breed: {pet.breed}</p>
        <p>{pet.description}</p>
        <p className="font-semibold">${pet.price_per_day.toFixed(2)} / day</p>
        <p className="text-sm text-slate-600">
          {pet.address}, {pet.city} {pet.postal_code}
        </p>
        {typeof pet.distance_km === "number" && (
          <p className="text-sm text-slate-600">{pet.distance_km.toFixed(1)} km away</p>
        )}
      </article>

      <form onSubmit={onBook} className="card space-y-3">
        <h2 className="text-xl font-semibold">Book This Pet</h2>
        <input
          className="w-full px-3 py-2"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <input
          className="w-full px-3 py-2"
          placeholder="Phone Number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
        />
        <textarea
          className="w-full px-3 py-2"
          placeholder="Pickup Address"
          value={pickupAddress}
          onChange={(e) => setPickupAddress(e.target.value)}
          required
        />
        <select
          className="w-full px-3 py-2"
          value={selectedSlot}
          onChange={(e) => setSelectedSlot(e.target.value)}
          required
        >
          <option value="">Select available slot</option>
          {pet.availability_slots.map((slot) => (
            <option key={`${slot.start_datetime}-${slot.end_datetime}`} value={`${slot.start_datetime}|${slot.end_datetime}`}>
              {slot.start_datetime.replace("T", " ")} to {slot.end_datetime.replace("T", " ")}
            </option>
          ))}
        </select>
        {success && <p className="feedback-success">{success}</p>}
        {error && <p className="feedback-error">{error}</p>}
        <button ref={confirmBtnRef} disabled={loading} className="rounded-md bg-slate-900 px-4 py-2 text-white">
          {loading ? (
            <span className="btn-loading">
              <span className="spinner" />
              Processing...
            </span>
          ) : (
            "Confirm Booking"
          )}
        </button>
      </form>
    </section>
  );
}
