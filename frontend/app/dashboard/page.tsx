"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

type Slot = {
  start_datetime: string;
  end_datetime: string;
};

type Pet = {
  id: string;
  name: string;
  type: string;
  price_per_day: number;
  bookings_enabled?: boolean;
  availability_slots?: Slot[];
};
type ReceivedBooking = {
  id: string;
  pet_id: string;
  pet_name: string;
  borrower_name: string;
  borrower_email: string;
  borrower_phone: string;
  borrower_address: string;
  start_datetime: string;
  end_datetime: string;
  booking_status: string;
  total_amount: number;
};

type MyBooking = {
  id: string;
  pet_id: string;
  pet_name: string;
  pet_type: string;
  owner_name: string;
  owner_email: string;
  start_datetime: string;
  end_datetime: string;
  booking_status: string;
  total_amount: number;
};

type DashboardData = {
  lender: {
    listed_pets: Pet[];
    received_bookings: ReceivedBooking[];
  };
  borrower: {
    my_bookings: MyBooking[];
  };
};

type Notification = {
  id: string;
  title?: string;
  message?: string;
  is_read?: boolean;
  created_at?: string;
  booking_id?: string;
  pet_id?: string;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState("");
  const [loadingAction, setLoadingAction] = useState("");
  const [activeTab, setActiveTab] = useState<"lender" | "borrower">("lender");
  const [editingPetId, setEditingPetId] = useState<string | null>(null);
  const [slotDrafts, setSlotDrafts] = useState<
    Record<string, { start_datetime: string; end_datetime: string }[]>
  >({});
  const sectionRef = useRef<HTMLDivElement | null>(null);

  const toInputDateTime = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const toIso = (input: string) => `${input}:00`;

  const loadDashboard = async () => {
    const token = getToken();
    if (!token) {
      setError("Please log in first.");
      return;
    }
    const dashboard = await apiFetch<DashboardData>("/dashboard/me", { token });
    setData(dashboard);
  };

  const loadNotifications = async () => {
    const token = getToken();
    if (!token) return;
    const items = await apiFetch<Notification[]>("/notifications", { token });
    setNotifications(items);
  };

  useEffect(() => {
    Promise.all([loadDashboard(), loadNotifications()]).catch((err) =>
      setError((err as Error).message)
    );
  }, []);

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        sectionRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, [activeTab, data]);

  const toggleBookingStatus = async (pet: Pet) => {
    const token = getToken();
    if (!token) return;
    setLoadingAction(`toggle-${pet.id}`);
    setError("");
    try {
      await apiFetch(`/pets/${pet.id}/booking-status`, {
        method: "PATCH",
        token,
        body: { bookings_enabled: !(pet.bookings_enabled ?? true) },
      });
      await loadDashboard();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingAction("");
    }
  };

  const removePet = async (pet: Pet) => {
    const token = getToken();
    if (!token) return;
    const ok = window.confirm(`Remove "${pet.name}" listing?`);
    if (!ok) return;
    setLoadingAction(`delete-${pet.id}`);
    setError("");
    try {
      await apiFetch(`/pets/${pet.id}`, { method: "DELETE", token });
      await loadDashboard();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingAction("");
    }
  };

  const startEditingSlots = (pet: Pet) => {
    const current = (pet.availability_slots || []).map((slot) => ({
      start_datetime: toInputDateTime(slot.start_datetime),
      end_datetime: toInputDateTime(slot.end_datetime),
    }));
    setSlotDrafts((prev) => ({
      ...prev,
      [pet.id]: current.length > 0 ? current : [{ start_datetime: "", end_datetime: "" }],
    }));
    setEditingPetId(pet.id);
  };

  const updateSlotDraft = (
    petId: string,
    idx: number,
    key: "start_datetime" | "end_datetime",
    value: string
  ) => {
    setSlotDrafts((prev) => ({
      ...prev,
      [petId]: (prev[petId] || []).map((slot, i) => (i === idx ? { ...slot, [key]: value } : slot)),
    }));
  };

  const addSlotDraft = (petId: string) => {
    setSlotDrafts((prev) => ({
      ...prev,
      [petId]: [...(prev[petId] || []), { start_datetime: "", end_datetime: "" }],
    }));
  };

  const removeSlotDraft = (petId: string, idx: number) => {
    setSlotDrafts((prev) => ({
      ...prev,
      [petId]: (prev[petId] || []).filter((_, i) => i !== idx),
    }));
  };

  const saveSlots = async (petId: string) => {
    const token = getToken();
    if (!token) return;
    const drafts = slotDrafts[petId] || [];
    if (drafts.length === 0) {
      setError("Add at least one slot.");
      return;
    }
    if (drafts.some((s) => !s.start_datetime || !s.end_datetime)) {
      setError("Please fill both start and end datetime for every slot.");
      return;
    }
    setLoadingAction(`slots-${petId}`);
    setError("");
    try {
      await apiFetch(`/pets/${petId}/availability`, {
        method: "PATCH",
        token,
        body: {
          availability_slots: drafts.map((slot) => ({
            start_datetime: toIso(slot.start_datetime),
            end_datetime: toIso(slot.end_datetime),
          })),
        },
      });
      setEditingPetId(null);
      await loadDashboard();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingAction("");
    }
  };

  const hasPendingOrActiveBooking = (petId: string) => {
    const now = new Date();
    return data.lender.received_bookings.some((booking) => {
      if (booking.pet_id !== petId) return false;
      if (!["confirmed", "active"].includes((booking.booking_status || "").toLowerCase())) {
        return false;
      }
      const end = new Date(booking.end_datetime);
      if (Number.isNaN(end.getTime())) return false;
      return end > now;
    });
  };

  const markNotificationRead = async (id: string) => {
    const token = getToken();
    if (!token) return;
    try {
      await apiFetch(`/notifications/${id}/read`, { method: "PATCH", token });
      await loadNotifications();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (error) return <p className="feedback-error">{error}</p>;
  if (!data) return <p>Loading dashboard...</p>;

  return (
    <section className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Link href="/pets/new" className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white">
            List New Pet
          </Link>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setActiveTab("lender")}
            className={`rounded-md px-3 py-1 text-sm ${activeTab === "lender" ? "bg-slate-900 text-white" : "border border-slate-300"}`}
          >
            Lender
          </button>
          <button
            onClick={() => setActiveTab("borrower")}
            className={`rounded-md px-3 py-1 text-sm ${activeTab === "borrower" ? "bg-slate-900 text-white" : "border border-slate-300"}`}
          >
            Borrower
          </button>
        </div>
      </div>

      <div ref={sectionRef}>
      {activeTab === "lender" && (
        <>
          <div className="card">
            <h2 className="text-2xl font-bold">Notifications</h2>
            <div className="mt-3 space-y-2">
              {notifications.length === 0 && (
                <p className="text-slate-600">No notifications yet.</p>
              )}
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`rounded-md border p-3 ${n.is_read ? "border-slate-200 bg-white" : "border-emerald-200 bg-emerald-50"}`}
                >
                  <p className="font-semibold">{n.title || "Notification"}</p>
                  <p className="text-sm text-slate-700">{n.message || "You have a new update."}</p>
                  {n.created_at && (
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  )}
                  {!n.is_read && (
                    <button
                      onClick={() => markNotificationRead(n.id)}
                      className="mt-2 rounded-md border border-slate-300 px-3 py-1 text-xs"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="text-2xl font-bold">Manage Listings</h2>
            <div className="mt-3 space-y-2">
              {data.lender.listed_pets.length === 0 && <p className="text-slate-600">No listed pets yet.</p>}
              {data.lender.listed_pets.map((pet) => (
                <div key={pet.id} className="rounded-md border border-slate-200 p-3">
                  <p className="font-semibold">{pet.name} ({pet.type})</p>
                  <p className="text-sm text-slate-600">${pet.price_per_day.toFixed(2)} / day</p>
                  <p className="text-sm text-slate-600">
                    Booking: {(pet.bookings_enabled ?? true) ? "Enabled" : "Disabled"}
                  </p>
                  {(pet.bookings_enabled ?? true) && hasPendingOrActiveBooking(pet.id) && (
                    <p className="mt-1 text-xs text-amber-700">
                      Disable booking will be available after current lending period finishes.
                    </p>
                  )}
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => toggleBookingStatus(pet)}
                      disabled={
                        loadingAction.length > 0 ||
                        ((pet.bookings_enabled ?? true) && hasPendingOrActiveBooking(pet.id))
                      }
                      className="rounded-md border border-slate-300 px-3 py-1 text-sm"
                    >
                      {loadingAction === `toggle-${pet.id}` ? (
                        <span className="btn-loading">
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-slate-700" />
                          Processing...
                        </span>
                      ) : (pet.bookings_enabled ?? true) && hasPendingOrActiveBooking(pet.id) ? (
                        "Disable Booking (Locked)"
                      ) : (
                        <>{(pet.bookings_enabled ?? true) ? "Disable Booking" : "Enable Booking"}</>
                      )}
                    </button>
                    <button
                      onClick={() => removePet(pet)}
                      disabled={loadingAction.length > 0}
                      className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-700"
                    >
                      {loadingAction === `delete-${pet.id}` ? (
                        <span className="btn-loading">
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-300 border-t-red-700" />
                          Processing...
                        </span>
                      ) : (
                        "Remove Pet"
                      )}
                    </button>
                    <button
                      onClick={() => startEditingSlots(pet)}
                      disabled={loadingAction.length > 0}
                      className="rounded-md border border-slate-300 px-3 py-1 text-sm"
                    >
                      Edit Slots
                    </button>
                  </div>
                  {editingPetId === pet.id && (
                    <div className="mt-3 space-y-2 rounded-md border border-slate-200 p-3">
                      {(slotDrafts[pet.id] || []).map((slot, idx) => (
                        <div key={idx} className="grid gap-2 md:grid-cols-3">
                          <input
                            className="px-3 py-2"
                            type="datetime-local"
                            value={slot.start_datetime}
                            onChange={(e) => updateSlotDraft(pet.id, idx, "start_datetime", e.target.value)}
                            required
                          />
                          <input
                            className="px-3 py-2"
                            type="datetime-local"
                            value={slot.end_datetime}
                            onChange={(e) => updateSlotDraft(pet.id, idx, "end_datetime", e.target.value)}
                            required
                          />
                          <button
                            onClick={() => removeSlotDraft(pet.id, idx)}
                            className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-700"
                            type="button"
                          >
                            Remove Slot
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <button
                          onClick={() => addSlotDraft(pet.id)}
                          className="rounded-md border border-slate-300 px-3 py-1 text-sm"
                          type="button"
                        >
                          Add Slot
                        </button>
                        <button
                          onClick={() => saveSlots(pet.id)}
                          disabled={loadingAction.length > 0}
                          className="rounded-md bg-slate-900 px-3 py-1 text-sm text-white"
                          type="button"
                        >
                          {loadingAction === `slots-${pet.id}` ? (
                            <span className="btn-loading">
                              <span className="spinner" />
                              Processing...
                            </span>
                          ) : (
                            "Save Slots"
                          )}
                        </button>
                        <button
                          onClick={() => setEditingPetId(null)}
                          className="rounded-md border border-slate-300 px-3 py-1 text-sm"
                          type="button"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="text-2xl font-bold">View Bookings</h2>
            <div className="mt-3 space-y-2">
              {data.lender.received_bookings.length === 0 && <p className="text-slate-600">No received bookings yet.</p>}
              {data.lender.received_bookings.map((booking) => (
                <div key={booking.id} className="rounded-md border border-slate-200 p-3">
                  <p className="font-semibold">{booking.pet_name}</p>
                  <p className="text-sm text-slate-600">Borrower: {booking.borrower_name} ({booking.borrower_email})</p>
                  <p className="text-sm text-slate-600">Phone: {booking.borrower_phone}</p>
                  <p className="text-sm text-slate-600">Address: {booking.borrower_address}</p>
                  <p className="text-sm text-slate-600">{booking.start_datetime} to {booking.end_datetime}</p>
                  <p className="text-sm text-slate-600">Status: {booking.booking_status}</p>
                  <p className="text-sm">${booking.total_amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === "borrower" && (
        <div className="card">
          <h2 className="text-2xl font-bold">My Bookings</h2>
          <div className="mt-3 space-y-2">
            {data.borrower.my_bookings.length === 0 && <p className="text-slate-600">No bookings yet.</p>}
            {data.borrower.my_bookings.map((booking) => (
              <div key={booking.id} className="rounded-md border border-slate-200 p-3">
                <p className="font-semibold">
                  {booking.pet_name} {booking.pet_type ? `(${booking.pet_type})` : ""}
                </p>
                <p className="text-sm text-slate-600">Owner: {booking.owner_name || "N/A"}</p>
                <p className="text-sm text-slate-600">{booking.start_datetime} to {booking.end_datetime}</p>
                <p className="text-sm text-slate-600">Status: {booking.booking_status}</p>
                <p className="text-sm">${booking.total_amount.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </section>
  );
}
