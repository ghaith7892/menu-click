import { useState, useEffect } from "react";
import { Link } from "wouter";
import { QrCode } from "lucide-react";

/* ─── Phone Slide Illustrations ──────────────────────────── */
function SlideQR() {
  return (
    <div className="flex items-center justify-center" style={{ height: 320 }}>
      <img
        src={`${import.meta.env.BASE_URL}slide-qr.png`}
        alt="Scan QR"
        className="h-full w-auto object-contain drop-shadow-2xl"
        style={{ maxWidth: "90%" }}
      />
    </div>
  );
}

function SlideMenu() {
  return (
    <div className="flex items-center justify-center" style={{ height: 320 }}>
      <img
        src={`${import.meta.env.BASE_URL}slide-menu.png`}
        alt="Menu"
        className="h-full w-auto object-contain drop-shadow-2xl"
        style={{ maxWidth: "90%" }}
      />
    </div>
  );
}

function SlidePreview() {
  return (
    <div className="flex items-center justify-center" style={{ height: 320 }}>
      <img
        src={`${import.meta.env.BASE_URL}slide-preview.png`}
        alt="Menu Preview"
        className="h-full w-auto object-contain drop-shadow-2xl"
        style={{ maxWidth: "90%" }}
      />
    </div>
  );
}

const SLIDES = [
  { illustration: <SlideQR /> },
  { illustration: <SlideMenu /> },
  { illustration: <SlidePreview /> },
];

/* ─── Landing Page (single-screen, no scroll) ─────────────── */
export default function LandingPage() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % SLIDES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      style={{
        height: "100svh",
        overflow: "hidden",
        background: "linear-gradient(160deg, #7c3aed 0%, #6366f1 50%, #4f46e5 100%)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Cairo', sans-serif",
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');`}</style>

      {/* ── Logo ── */}
      <div className="flex items-center justify-center pt-10 pb-2 z-10 gap-2">
        <div className="w-9 h-9 rounded-2xl flex items-center justify-center bg-white/20">
          <QrCode className="w-5 h-5 text-white" />
        </div>
        <span className="text-white font-black text-xl tracking-tight">MenuClick</span>
      </div>

      {/* ── Slides ── */}
      <div className="flex-1 relative overflow-hidden">
        {SLIDES.map((s, i) => (
          <div
            key={i}
            className="absolute inset-0 flex items-center justify-center px-6 transition-all duration-500"
            style={{
              opacity: i === current ? 1 : 0,
              transform:
                i === current
                  ? "translateX(0)"
                  : i < current
                  ? "translateX(8%)"
                  : "translateX(-8%)",
              pointerEvents: i === current ? "auto" : "none",
            }}
          >
            <div className="w-full max-w-xs">{s.illustration}</div>
          </div>
        ))}
      </div>

      {/* ── Dots ── */}
      <div className="flex justify-center gap-2 pb-5 z-10">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === current ? 28 : 8,
              height: 6,
              background: i === current ? "white" : "rgba(255,255,255,0.35)",
            }}
          />
        ))}
      </div>

      {/* ── Two CTA buttons ── */}
      <div className="px-5 pb-10 z-10 flex flex-col gap-3">
        {/* Login — dark */}
        <Link href="/login">
          <button
            className="w-full font-black text-white text-base py-4 rounded-3xl flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{ background: "rgba(10,10,20,0.85)", backdropFilter: "blur(8px)" }}
          >
            تسجيل الدخول
          </button>
        </Link>

        {/* Sign Up — translucent */}
        <Link href="/register">
          <button
            className="w-full font-black text-white text-base py-4 rounded-3xl flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)" }}
          >
            إنشاء حساب
          </button>
        </Link>
      </div>
    </div>
  );
}
