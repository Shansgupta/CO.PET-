import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import GeoBootstrap from "@/components/GeoBootstrap";
import RouteTransition from "@/components/RouteTransition";

export const metadata: Metadata = {
  title: "PetLend MVP",
  description: "Temporary pet-lending marketplace MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="animated-gradient-bg relative overflow-x-hidden">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="mesh-blob mesh-blob-a -left-24 -top-24 h-80 w-80 bg-indigo-300" />
          <div className="mesh-blob mesh-blob-b -right-32 -top-20 h-96 w-96 bg-violet-300" />
          <div className="mesh-blob mesh-blob-a -bottom-24 -left-20 h-[26rem] w-[26rem] bg-pink-300" />
          <div className="mesh-blob mesh-blob-b -bottom-28 -right-24 h-80 w-80 bg-sky-300" />
        </div>
        <GeoBootstrap />
        <div className="relative z-10">
          <NavBar />
          <main className="mx-auto max-w-5xl px-4 py-8">
            <RouteTransition>{children}</RouteTransition>
          </main>
        </div>
      </body>
    </html>
  );
}
