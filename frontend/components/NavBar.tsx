"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { getToken, removeToken } from "@/lib/auth";

export default function NavBar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    const syncAuthState = () => {
      const token = getToken();
      setIsLoggedIn(!!token);
    };
    syncAuthState();
    window.addEventListener("storage", syncAuthState);
    return () => window.removeEventListener("storage", syncAuthState);
  }, []);

  useEffect(() => {
    if (!headerRef.current) return;
    gsap.fromTo(
      headerRef.current,
      { opacity: 0, y: -24 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
    );
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
    const token = getToken();
    setIsLoggedIn(!!token);
  }, [pathname]);

  const logout = () => {
    removeToken();
    setIsLoggedIn(false);
    setIsMenuOpen(false);
    window.location.href = "/";
  };

  const closeMenu = () => setIsMenuOpen(false);

  const headerClass =
    "sticky top-0 z-30 border-b border-white/50 bg-white/60 shadow-[0_8px_30px_rgba(15,23,42,0.08)] backdrop-blur-md";
  const brandClass =
    "text-xl font-black tracking-tight text-slate-900 transition duration-200 hover:scale-[1.02] hover:text-slate-700";
  const menuButtonClass =
    "inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white/75 p-2 text-slate-800 shadow-sm transition duration-200 hover:scale-[1.03] hover:bg-white";
  const menuPanelClass =
    "border border-slate-200 bg-white/95 text-slate-900 shadow-[0_20px_45px_rgba(15,23,42,0.16)] backdrop-blur-xl";
  const itemClass =
    "block rounded-lg px-3 py-2 text-sm text-slate-700 transition duration-200 hover:bg-slate-100 hover:text-slate-900";

  return (
    <header ref={headerRef} className={headerClass}>
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className={brandClass}>
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
            {isLoggedIn ? (
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-sm font-semibold text-slate-700 transition duration-200 hover:scale-105">
                U
              </span>
            ) : (
              <span className="relative h-5 w-5">
                <span
                  className={`absolute left-0 top-0 h-0.5 w-5 rounded bg-current transition-transform duration-300 ${
                    isMenuOpen ? "translate-y-2 rotate-45" : ""
                  }`}
                />
                <span
                  className={`absolute left-0 top-2 h-0.5 w-5 rounded bg-current transition-all duration-300 ${
                    isMenuOpen ? "opacity-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`absolute left-0 top-4 h-0.5 w-5 rounded bg-current transition-transform duration-300 ${
                    isMenuOpen ? "-translate-y-2 -rotate-45" : ""
                  }`}
                />
              </span>
            )}
          </button>

          <div
            className={`absolute right-0 top-12 z-30 w-64 origin-top-right rounded-xl p-2 transition-all duration-300 ${
              isMenuOpen
                ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                : "pointer-events-none -translate-y-2 scale-95 opacity-0"
            } ${menuPanelClass}`}
          >
            {isLoggedIn ? (
              <>
                {!isHome && (
                  <>
                    <Link href="/pets" className={itemClass} onClick={closeMenu}>
                      Browse Pets
                    </Link>
                    <Link href="/about" className={itemClass} onClick={closeMenu}>
                      About Us
                    </Link>
                    <Link href="/help" className={itemClass} onClick={closeMenu}>
                      Help
                    </Link>
                    <div className="my-1 h-px bg-slate-200" />
                  </>
                )}
                <Link href="/dashboard" className={itemClass} onClick={closeMenu}>
                  Dashboard
                </Link>
                <Link href="/dashboard#my-bookings" className={itemClass} onClick={closeMenu}>
                  My Bookings
                </Link>
                <Link href="/profile" className={itemClass} onClick={closeMenu}>
                  Profile
                </Link>
                <Link href="/settings" className={itemClass} onClick={closeMenu}>
                  Settings
                </Link>
                <button onClick={logout} className={`${itemClass} w-full text-left`} type="button">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className={itemClass} onClick={closeMenu}>
                  Login
                </Link>
                <Link href="/register" className={itemClass} onClick={closeMenu}>
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
