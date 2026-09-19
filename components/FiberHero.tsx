'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const TOTAL_FRAMES = 202;

function getFramePath(index: number): string {
  const padIndex = String(index).padStart(3, '0');
  const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
  return `${base}/frames/frame_${padIndex}.webp`;
}

/**
 * FiberHero — the cable/fiber film is back, running on local frames.
 * A tall scroll track pins the viewport while scroll progress scrubs
 * frames 1..202 with eased lerp. Poster-first: frame_001 paints instantly.
 */
export const FiberHero: React.FC = () => {
  const router = useRouter();
  const trackRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES + 1).fill(null));
  const [ready, setReady] = useState(false);
  const targetRef = useRef(1);
  const currentRef = useRef(1);
  const lastDrawnRef = useRef(-1);

  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    let img = imagesRef.current[frameIndex];
    if (!img || !img.complete || img.naturalWidth === 0) {
      for (let offset = 1; offset <= TOTAL_FRAMES; offset++) {
        const prev = imagesRef.current[Math.max(1, frameIndex - offset)];
        if (prev && prev.complete && prev.naturalWidth > 0) { img = prev; break; }
        const next = imagesRef.current[Math.min(TOTAL_FRAMES, frameIndex + offset)];
        if (next && next.complete && next.naturalWidth > 0) { img = next; break; }
      }
    }
    img = img && img.complete && img.naturalWidth > 0 ? img : imagesRef.current[1];
    if (!img || !img.complete || img.naturalWidth === 0) return;
    const cw = canvas.width;
    const ch = canvas.height;
    const ratio = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const drawW = img.naturalWidth * ratio;
    const drawH = img.naturalHeight * ratio;
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, (cw - drawW) / 2, (ch - drawH) / 2, drawW, drawH);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const first = new Image();
    first.src = getFramePath(1);
    first.onload = () => {
      if (cancelled) return;
      imagesRef.current[1] = first;
      setReady(true);
      drawFrame(1);
    };
    for (let i = 2; i <= TOTAL_FRAMES; i += 4) {
      const img = new Image();
      img.src = getFramePath(i);
      img.onload = () => { if (!cancelled) imagesRef.current[i] = img; };
    }
    const timer = setTimeout(() => {
      if (cancelled) return;
      for (let i = 2; i <= TOTAL_FRAMES; i++) {
        if (imagesRef.current[i]) continue;
        const img = new Image();
        img.src = getFramePath(i);
        img.onload = () => { if (!cancelled) imagesRef.current[i] = img; };
      }
    }, 200);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [drawFrame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      drawFrame(Math.round(currentRef.current));
    };
    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [drawFrame]);

  useEffect(() => {
    const onScroll = () => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const scrollable = Math.max(1, rect.height - window.innerHeight);
      const progress = Math.min(Math.max(-rect.top / scrollable, 0), 1);
      targetRef.current = 1 + progress * (TOTAL_FRAMES - 1);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    let raf = 0;
    const loop = () => {
      const diff = targetRef.current - currentRef.current;
      if (Math.abs(diff) > 0.02) {
        currentRef.current += diff * 0.22;
        const f = Math.min(TOTAL_FRAMES, Math.max(1, Math.round(currentRef.current)));
        if (f !== lastDrawnRef.current) { drawFrame(f); lastDrawnRef.current = f; }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll); };
  }, [drawFrame]);

  return (
    <div ref={trackRef} className="relative z-10 h-[220vh] bg-black">
      <div className="sticky top-0 z-10 flex h-screen flex-col overflow-hidden bg-black">
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${ready ? 'opacity-100' : 'opacity-0'}`}
        />
        {!ready && (
          <img src={getFramePath(1)} alt="" aria-hidden="true" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
        )}
        {/* Cinematic grade — mist blue + readable scrims */}
        <div className="pointer-events-none absolute inset-0 bg-[#0c2444]/30 mix-blend-screen" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_700px_at_50%_20%,rgba(56,189,248,0.2),transparent_70%)]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#061424]/60 via-transparent to-black/90" />

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end px-5 pb-16 sm:px-8 md:px-12">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-sky-200">
            House Health · Live Fiber Console
          </p>
          <h1 className="mt-3 font-serif text-4xl font-normal leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Every fiber of the case,
            <br />
            <span className="italic">verified before induction.</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
            Scroll — the fiber film scrubs with you. Then step into the OT console:
            roster, labs, vitals, checklists and attestation in one Harvey-grade workspace.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push('/console')}
              className="veracity-press inline-flex items-center gap-1.5 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black shadow-lg hover:bg-white/85"
            >
              Open OT Console <ChevronRight size={15} aria-hidden="true" />
            </button>
            <a
              href="#pillars"
              className="veracity-press inline-flex items-center rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-medium text-white backdrop-blur-md hover:bg-white/20"
            >
              How it works
            </a>
          </div>
          <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
            Scroll to scrub the fiber film ↓
          </p>
        </div>
      </div>
    </div>
  );
};

export default FiberHero;
