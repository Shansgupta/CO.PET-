"use client";

import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOk(false);
    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: { name, email, password },
      });
      setOk(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-md">
      <form onSubmit={onSubmit} className="card space-y-4">
        <h1 className="text-2xl font-bold">Register</h1>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="feedback-error">{error}</p>}
        {ok && <p className="feedback-success">Registered successfully. You can now log in.</p>}
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
            "Create Account"
          )}
        </button>
      </form>
    </section>
  );
}
