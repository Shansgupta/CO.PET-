"use client";

import { useState } from "react";

type FAQ = {
  question: string;
  answer: string;
};

const faqItems: FAQ[] = [
  {
    question: "Is Co.pet safe?",
    answer:
      "Co.pet is built with verified accounts, transparent bookings, and clear listing controls for owners to support safer interactions.",
  },
  {
    question: "How does booking work?",
    answer:
      "Choose a pet, select an available slot, fill booking details, and confirm. The system blocks double-booking and returns confirmation.",
  },
  {
    question: "Can I cancel a booking?",
    answer:
      "For MVP, cancellation availability depends on the booking status and owner coordination. Contact support for urgent changes.",
  },
  {
    question: "How do payments work?",
    answer:
      "Payments are simulated in this MVP. Platform and lender commissions are calculated automatically and stored in booking payment records.",
  },
  {
    question: "Can I disable my pet listing?",
    answer:
      "Yes. Owners can disable bookings or remove listings from dashboard management controls at any time.",
  },
];

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="space-y-8">
      <div className="card relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-sky-200/30 via-violet-200/20 to-pink-200/30" />
        <div className="relative z-10 py-10 text-center">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">Help &amp; Support</h1>
          <p className="mt-3 text-lg text-slate-700">Everything you need to lend or borrow with confidence.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="text-2xl font-bold text-slate-900">How It Works for Lenders</h2>
          <ol className="mt-4 space-y-3 text-slate-700">
            <li>
              <span className="font-semibold text-slate-900">1.</span> Create a pet listing with profile,
              pricing, and availability slots.
            </li>
            <li>
              <span className="font-semibold text-slate-900">2.</span> Manage bookings from your dashboard
              and review borrower details.
            </li>
            <li>
              <span className="font-semibold text-slate-900">3.</span> Update availability, disable booking,
              or remove a listing when needed.
            </li>
          </ol>
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold text-slate-900">How It Works for Borrowers</h2>
          <ol className="mt-4 space-y-3 text-slate-700">
            <li>
              <span className="font-semibold text-slate-900">1.</span> Browse pets and check availability
              windows.
            </li>
            <li>
              <span className="font-semibold text-slate-900">2.</span> Open a pet profile and choose a valid
              booking slot.
            </li>
            <li>
              <span className="font-semibold text-slate-900">3.</span> Submit borrower details and confirm your
              booking.
            </li>
          </ol>
        </div>
      </div>

      <div className="card">
        <h2 className="text-2xl font-bold text-slate-900">Frequently Asked Questions</h2>
        <div className="mt-4 space-y-3">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={item.question} className="overflow-hidden rounded-xl border border-white/30 bg-white/30">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-slate-900"
                >
                  <span className="font-semibold">{item.question}</span>
                  <span className="text-lg leading-none text-slate-700">{isOpen ? "-" : "+"}</span>
                </button>
                <div
                  className={`grid transition-all duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                >
                  <div className="overflow-hidden">
                    <p className="px-4 pb-4 text-slate-700">{item.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <h2 className="text-2xl font-bold text-slate-900">Contact Support</h2>
        <p className="mt-2 text-slate-700">
          Reach us at <a className="font-semibold text-slate-900" href="mailto:support@co.pet">support@co.pet</a>
        </p>

        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
          <input type="text" placeholder="Your name" className="bg-white/70" />
          <input type="email" placeholder="Your email" className="bg-white/70" />
          <textarea placeholder="How can we help you?" className="md:col-span-2 min-h-28 bg-white/70" />
          <button
            type="submit"
            className="md:col-span-2 w-full rounded-xl bg-slate-900 px-4 py-2 text-white shadow-[0_8px_20px_rgba(15,23,42,0.25)] md:w-fit"
          >
            Send Message
          </button>
        </form>
      </div>
    </section>
  );
}
