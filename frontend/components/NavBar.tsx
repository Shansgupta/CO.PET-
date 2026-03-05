"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getToken, removeToken } from "@/lib/auth";

export default function NavBar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const logout = () => {
    removeToken();
    window.location.href = "/";
  };

  const headerClass =
    isHome && !isScrolled
      ? "sticky top-0 z-20 border-b border-white/10 bg-transparent"
      : "sticky top-0 z-20 border-b border-white/30 bg-white/45 backdrop-blur-xl";
  const brandClass = isHome && !isScrolled ? "text-white" : "text-ink";
  const menuButtonClass =
    isHome && !isScrolled
      ? "inline-flex items-center justify-center rounded-xl border border-white/40 bg-white/10 p-2 text-white transition hover:bg-white/20"
      : "inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white/70 p-2 text-slate-800 transition hover:bg-white";
  const menuPanelClass =
    isHome && !isScrolled
      ? "border-white/30 bg-slate-900/85 text-white backdrop-blur-xl"
      : "border-slate-200 bg-white/95 text-slate-900 backdrop-blur-xl";
  const itemClass =
    isHome && !isScrolled
      ? "block rounded-lg px-3 py-2 text-sm text-white/90 transition hover:bg-white/15 hover:text-white"
      : "block rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 hover:text-slate-900";

  return (
    <header className={headerClass}>
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className={`text-lg font-bold tracking-wide ${brandClass}`}>
          Co.pet
        </Link>
        <div ref={menuRef} className="relative">
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className={menuButtonClass}
          >
            <span className="flex h-5 w-5 flex-col justify-between">
              <span className="h-0.5 w-full rounded bg-current" />
              <span className="h-0.5 w-full rounded bg-current" />
              <span className="h-0.5 w-full rounded bg-current" />
            </span>
          </button>

          <div
            className={`absolute right-0 top-11 z-30 w-56 origin-top-right rounded-xl border p-2 shadow-[0_14px_32px_rgba(15,23,42,0.22)] transition-all duration-200 ${
              isMenuOpen
                ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                : "pointer-events-none -translate-y-1 scale-95 opacity-0"
            } ${menuPanelClass}`}
          >
            {!isHome && (
              <>
                <Link href="/about" className={itemClass}>
                  About
                </Link>
                <Link href="/help" className={itemClass}>
                  Help
                </Link>
                <Link href="/pets" className={itemClass}>
                  Browse
                </Link>
                <Link href="/pets/new" className={itemClass}>
                  List Pet
                </Link>
              </>
            )}
            <div className={`my-1 h-px ${isHome && !isScrolled ? "bg-white/20" : "bg-slate-200"}`} />
            <Link href="/dashboard" className={itemClass}>
              Dashboard
            </Link>
            <Link href="/profile" className={itemClass}>
              Profile
            </Link>
            <Link href="/notifications" className={itemClass}>
              Notifications
            </Link>
            <Link href="/settings" className={itemClass}>
              Settings
            </Link>
            {isLoggedIn ? (
              <button onClick={logout} className={`${itemClass} w-full text-left`} type="button">
                Logout
              </button>
            ) : (
              <>
                <Link href="/login" className={itemClass}>
                  Login
                </Link>
                <Link href="/register" className={itemClass}>
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
