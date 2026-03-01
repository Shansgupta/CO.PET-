"use client";

import { useEffect } from "react";

const GEO_KEY = "petlend_user_location";
const GEO_TRIED_KEY = "petlend_geo_requested";

export default function GeoBootstrap() {
  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) return;
    if (localStorage.getItem(GEO_KEY) || localStorage.getItem(GEO_TRIED_KEY)) return;

    localStorage.setItem(GEO_TRIED_KEY, "1");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const payload = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          captured_at: new Date().toISOString(),
        };
        localStorage.setItem(GEO_KEY, JSON.stringify(payload));
      },
      () => {
        localStorage.setItem(GEO_KEY, JSON.stringify({ denied: true }));
      }
    );
  }, []);

  return null;
}
