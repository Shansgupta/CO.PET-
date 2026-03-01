"use client";

import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const requestOtp = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await apiFetch<{ message: string }>("/auth/forgot-password", {
        method: "POST",
        body: { email },
      });
      setMessage(res.message);
      setStep(2);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await apiFetch<{ message: string }>("/auth/reset-password", {
        method: "POST",
        body: { email, otp, new_password: newPassword },
      });
      setMessage(res.message);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-md">
      <div className="card space-y-4">
        <h1 className="text-2xl font-bold">Forgot Password</h1>

        {step === 1 ? (
          <form onSubmit={requestOtp} className="space-y-3">
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              type="email"
              placeholder="Registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              disabled={loading}
              className="w-full rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
            >
              {loading ? (
                <span className="btn-loading">
                  <span className="spinner" />
                  Processing...
                </span>
              ) : (
                "Send OTP"
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="space-y-3">
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              type="email"
              placeholder="Registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              type="text"
              placeholder="6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              required
            />
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button
              disabled={loading}
              className="w-full rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
            >
              {loading ? (
                <span className="btn-loading">
                  <span className="spinner" />
                  Processing...
                </span>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        )}

        {message && <p className="feedback-success">{message}</p>}
        {error && <p className="feedback-error">{error}</p>}
      </div>
    </section>
  );
}
