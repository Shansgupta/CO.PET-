"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement | null>(null);
  const brandRef = useRef<HTMLHeadingElement | null>(null);
  const taglineRef = useRef<HTMLParagraphElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);
  const bgRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (bgRefs.current.length >= 3) {
        const bgs = bgRefs.current.filter(Boolean) as HTMLDivElement[];
        gsap.set(bgs, { opacity: 0 });
        gsap.set(bgs[0], { opacity: 1 });
        const bgTl = gsap.timeline({ repeat: -1 });
        bgTl
          .to(bgs[1], { opacity: 1, duration: 2.2, ease: "power3.out" }, "+=4")
          .to(bgs[0], { opacity: 0, duration: 2.2, ease: "power3.out" }, "<")
          .to(bgs[2], { opacity: 1, duration: 2.2, ease: "power3.out" }, "+=4")
          .to(bgs[1], { opacity: 0, duration: 2.2, ease: "power3.out" }, "<")
          .to(bgs[0], { opacity: 1, duration: 2.2, ease: "power3.out" }, "+=4")
          .to(bgs[2], { opacity: 0, duration: 2.2, ease: "power3.out" }, "<");
      }

      const introTl = gsap.timeline({ defaults: { ease: "power3.out" } });
      introTl
        .fromTo(
          brandRef.current,
          { opacity: 0, scale: 0.9, letterSpacing: "0.28em" },
          { opacity: 1, scale: 1, letterSpacing: "0.06em", duration: 1.2 }
        )
        .fromTo(
          taglineRef.current,
          { opacity: 0, y: 36 },
          { opacity: 1, y: 0, duration: 0.9 },
          "-=0.15"
        )
        .fromTo(
          ctaRef.current?.children || [],
          { opacity: 0, y: 28 },
          { opacity: 1, y: 0, duration: 0.9, stagger: 0.1 },
          "-=0.45"
        );
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative left-1/2 right-1/2 -mx-[50vw] min-h-[calc(100vh-72px)] w-screen overflow-hidden"
    >
      <div className="absolute inset-0">
        <div
          ref={(el) => {
            bgRefs.current[0] = el;
          }}
          className="hero-bg-layer"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=1920&q=80')",
          }}
        />
        <div
          ref={(el) => {
            bgRefs.current[1] = el;
          }}
          className="hero-bg-layer"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&w=1920&q=80')",
          }}
        />
        <div
          ref={(el) => {
            bgRefs.current[2] = el;
          }}
          className="hero-bg-layer"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=1920&q=80')",
          }}
        />
      </div>

      <div className="absolute inset-0 bg-black/50" />

      <div className="pointer-events-none absolute inset-0">
        <div className="hero-paw hero-paw-a left-[10%] top-[22%]" />
        <div className="hero-paw hero-paw-b right-[12%] top-[28%]" />
        <div className="hero-paw hero-paw-c bottom-[18%] left-[20%]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-72px)] max-w-6xl items-center justify-center px-6 text-center">
        <div className="max-w-3xl">
          <h1 ref={brandRef} className="text-6xl font-black tracking-[0.06em] text-white md:text-8xl">
            Co.pet
          </h1>
          <p ref={taglineRef} className="mx-auto mt-6 max-w-2xl text-lg text-white/90 md:text-2xl">
            A trusted pet-lending marketplace that brings companionship, care, and joy closer to home.
          </p>
          <div ref={ctaRef} className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/pets" className="hero-btn hero-btn-primary">
              Browse Pets
            </Link>
            <Link href="/pets/new" className="hero-btn hero-btn-secondary">
              List Your Pet
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-6 text-sm text-white/90">
        <Link href="/about" className="transition hover:text-white">
          About Us
        </Link>
        <Link href="/help" className="transition hover:text-white">
          Help
        </Link>
      </div>
    </section>
  );
}
