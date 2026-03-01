"use client";

import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

type Slot = {
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
};

export default function NewPetPage() {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [breed, setBreed] = useState("");
  const [description, setDescription] = useState("");
  const [pricePerDay, setPricePerDay] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [slots, setSlots] = useState<Slot[]>([
    { start_date: "", start_time: "", end_date: "", end_time: "" },
  ]);
  const [locationStatus, setLocationStatus] = useState<"idle" | "ok" | "denied" | "error">("idle");
  const [latLng, setLatLng] = useState<{ latitude: number; longitude: number } | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const updateSlot = (idx: number, key: keyof Slot, value: string) => {
    setSlots((prev) => prev.map((slot, i) => (i === idx ? { ...slot, [key]: value } : slot)));
  };

  const addSlot = () => {
    setSlots((prev) => [
      ...prev,
      { start_date: "", start_time: "", end_date: "", end_time: "" },
    ]);
  };

  const buildIso = (date: string, time: string) => `${date}T${time}:00`;

  const toDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read image file"));
      reader.readAsDataURL(file);
    });

  const useCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocationStatus("error");
      setError("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLatLng(coords);
        setLocationStatus("ok");
        localStorage.setItem("petlend_user_location", JSON.stringify({ lat: coords.latitude, lng: coords.longitude }));
      },
      () => {
        setLocationStatus("denied");
      }
    );
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    const token = getToken();
    if (!token) {
      setError("Please log in first.");
      setLoading(false);
      return;
    }
    try {
      const imageUrl = imageFile ? await toDataUrl(imageFile) : null;
      const payload: Record<string, unknown> = {
        name,
        type,
        breed,
        description,
        price_per_day: Number(pricePerDay),
        address: addressLine,
        city,
        postal_code: postalCode,
        image_url: imageUrl,
        availability_slots: slots.map((slot) => ({
          start_datetime: buildIso(slot.start_date, slot.start_time),
          end_datetime: buildIso(slot.end_date, slot.end_time),
        })),
      };
      if (latLng) {
        payload.latitude = latLng.latitude;
        payload.longitude = latLng.longitude;
      }

      await apiFetch("/pets", {
        method: "POST",
        token,
        body: payload,
      });
      setMessage("Pet listed successfully.");
      setName("");
      setType("");
      setBreed("");
      setDescription("");
      setPricePerDay("");
      setAddressLine("");
      setCity("");
      setPostalCode("");
      setImageFile(null);
      setSlots([{ start_date: "", start_time: "", end_date: "", end_time: "" }]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-2xl">
      <form onSubmit={onSubmit} className="card space-y-4">
        <h1 className="text-2xl font-bold">List a Pet</h1>
        <input className="w-full rounded-md border border-slate-300 px-3 py-2" placeholder="Pet name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="w-full rounded-md border border-slate-300 px-3 py-2" placeholder="Pet type" value={type} onChange={(e) => setType(e.target.value)} required />
        <input className="w-full rounded-md border border-slate-300 px-3 py-2" placeholder="Pet breed" value={breed} onChange={(e) => setBreed(e.target.value)} required />
        <textarea className="w-full rounded-md border border-slate-300 px-3 py-2" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
        <input className="w-full rounded-md border border-slate-300 px-3 py-2" placeholder="Price per day" type="number" min="1" step="0.01" value={pricePerDay} onChange={(e) => setPricePerDay(e.target.value)} required />
        <input className="w-full rounded-md border border-slate-300 px-3 py-2" placeholder="Address" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} required />
        <div className="grid gap-2 md:grid-cols-2">
          <input className="rounded-md border border-slate-300 px-3 py-2" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} required />
          <input className="rounded-md border border-slate-300 px-3 py-2" placeholder="Postal code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required />
        </div>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        />
        <div className="space-y-2">
          <button type="button" onClick={useCurrentLocation} className="rounded-md border border-slate-300 px-3 py-2">
            Use my current location
          </button>
          {locationStatus === "ok" && <p className="text-sm text-green-700">Location captured.</p>}
          {locationStatus === "denied" && <p className="text-sm text-slate-600">Location permission denied. Address fields will be used.</p>}
        </div>

        <div className="space-y-3">
          <p className="font-semibold">Availability Slots</p>
          {slots.map((slot, idx) => (
            <div key={idx} className="space-y-2">
              <div className="grid gap-2 md:grid-cols-2">
                <input className="rounded-md border border-slate-300 px-3 py-2" type="date" value={slot.start_date} onChange={(e) => updateSlot(idx, "start_date", e.target.value)} required />
                <input className="rounded-md border border-slate-300 px-3 py-2" type="time" value={slot.start_time} onChange={(e) => updateSlot(idx, "start_time", e.target.value)} required />
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <input className="rounded-md border border-slate-300 px-3 py-2" type="date" value={slot.end_date} onChange={(e) => updateSlot(idx, "end_date", e.target.value)} required />
                <input className="rounded-md border border-slate-300 px-3 py-2" type="time" value={slot.end_time} onChange={(e) => updateSlot(idx, "end_time", e.target.value)} required />
              </div>
            </div>
          ))}
          <button type="button" onClick={addSlot} className="rounded-md border border-slate-300 px-3 py-1">
            Add Slot
          </button>
        </div>

        {message && <p className="feedback-success">{message}</p>}
        {error && <p className="feedback-error">{error}</p>}

        <button disabled={loading} className="rounded-md bg-slate-900 px-4 py-2 text-white">
          {loading ? (
            <span className="btn-loading">
              <span className="spinner" />
              Processing...
            </span>
          ) : (
            "Create Listing"
          )}
        </button>
      </form>
    </section>
  );
}
