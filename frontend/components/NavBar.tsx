"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getToken, removeToken } from "@/lib/auth";

export default function NavBar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    setIsLoggedIn(Boolean(getToken()));
  }, []);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const logout = () => {
    removeToken();
    window.location.href = "/";
  };

  const headerClass =
    isHome && !isScrolled
      ? "sticky top-0 z-20 border-b border-white/10 bg-transparent"
      : "sticky top-0 z-20 border-b border-white/30 bg-white/45 backdrop-blur-xl";
  const linkClass = isHome && !isScrolled ? "text-white/90 hover:text-white" : "text-ink hover:text-ocean";
  const brandClass = isHome && !isScrolled ? "text-white" : "text-ink";

  return (
    <header className={headerClass}>
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className={`text-lg font-bold tracking-wide ${brandClass}`}>
          Co.pet
        </Link>
        <div className="flex items-center gap-3 text-sm">
          {!isHome && (
            <>
              <Link href="/about" className={linkClass}>
                About
              </Link>
              <Link href="/help" className={linkClass}>
                Help
              </Link>
            </>
          )}
          {!isHome && (
            <>
              <Link href="/pets" className={linkClass}>
                Browse
              </Link>
              <Link href="/pets/new" className={linkClass}>
                List Pet
              </Link>
            </>
          )}
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className={linkClass}>
                Dashboard
              </Link>
              <button
                onClick={logout}
                className="rounded-xl bg-slate-900 px-3 py-1 text-white shadow-[0_8px_20px_rgba(15,23,42,0.25)]"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={linkClass}>
                Login
              </Link>
              <Link href="/register" className="rounded-xl bg-slate-900 px-3 py-1 text-white shadow-[0_8px_20px_rgba(15,23,42,0.25)]">
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
