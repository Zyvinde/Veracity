'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Hexagon, ChevronRight, X, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePatientStore } from '@/lib/store';
import PatientPreOpQuestionnaire from '@/components/PatientPreOpQuestionnaire';
import MobileAnesthesiaBloodView from '@/components/MobileAnesthesiaBloodView';

const HERO_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260729_102822_0e6c87e8-c141-4744-bf32-ad30db296371.mp4';
const PORTRAIT_URL =
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=256';

/* ── Reveal: staggered fade-up on entering viewport ─────────────── */
function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out will-change-transform ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* ── Scroll-scrubbed video background ───────────────────────────── */
function ScrollVideo({ posterSrc }: { posterSrc?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stage, setStage] = useState<'poster' | 'video' | 'canvas'>('poster');

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let cancelled = false;
    let raf = 0;
    let smoothed = 0;
    let target = 0;
    let frames: ImageBitmap[] = [];
    let framesReady = false;
    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      canvas.width = Math.max(2, Math.round(window.innerWidth * dpr));
      canvas.height = Math.max(2, Math.round(window.innerHeight * dpr));
    };
    resize();
    window.addEventListener('resize', resize);

    const updateTarget = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      target = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    };
    updateTarget();
    window.addEventListener('scroll', updateTarget, { passive: true });

    const drawCover = (img: CanvasImageSource, iw: number, ih: number) => {
      if (!iw || !ih) return;
      const cw = canvas.width;
      const ch = canvas.height;
      const scale = Math.max(cw / iw, ch / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    };

    const onVideoData = () => {
      if (!cancelled && !framesReady) setStage('video');
    };
    // The video may already have a decoded frame (warm cache) before this
    // effect attaches — check synchronously instead of waiting for the event.
    if (video.readyState >= 2) {
      onVideoData();
    }
    video.addEventListener('loadeddata', onVideoData);

    const seekTo = (v: HTMLVideoElement, t: number) =>
      new Promise<void>((resolve) => {
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          v.removeEventListener('seeked', finish);
          resolve();
        };
        v.addEventListener('seeked', finish);
        try {
          v.currentTime = Math.min(Math.max(0, t), Math.max(0, (v.duration || t + 1) - 0.02));
        } catch {
          finish();
        }
        window.setTimeout(finish, 900);
      });

    // Frame-cache path: offscreen video → up to 90 ImageBitmaps (≤960px wide)
    const extract = async () => {
      const off = document.createElement('video');
      off.muted = true;
      off.playsInline = true;
      off.preload = 'auto';
      off.src = HERO_VIDEO_URL;
      try {
        await new Promise<void>((resolve, reject) => {
          off.addEventListener('loadeddata', () => resolve(), { once: true });
          off.addEventListener('error', () => reject(new Error('frame-source failed')), { once: true });
        });
        await new Promise((r) => window.setTimeout(r, 300));
        if (cancelled) return;
        const dur = off.duration;
        if (!Number.isFinite(dur) || dur <= 0 || off.videoWidth === 0) return;
        const count = Math.max(24, Math.min(90, Math.floor(dur * 12)));
        const scale = Math.min(1, 960 / off.videoWidth);
        const rw = Math.max(2, Math.round(off.videoWidth * scale));
        const rh = Math.max(2, Math.round(off.videoHeight * scale));
        const collected: ImageBitmap[] = [];
        for (let i = 0; i < count; i++) {
          if (cancelled) return;
          const t = (i / (count - 1)) * Math.max(0, dur - 0.05);
          await seekTo(off, t);
          if (cancelled) return;
          try {
            try {
              collected.push(
                await createImageBitmap(off, {
                  resizeWidth: rw,
                  resizeHeight: rh,
                  resizeQuality: 'high',
                })
              );
            } catch {
              collected.push(await createImageBitmap(off));
            }
          } catch {
            /* skip undecodable frame */
          }
        }
        try {
          off.removeAttribute('src');
          off.load();
        } catch {
          /* noop */
        }
        const valid = collected.filter(Boolean);
        // NOTE: frames are display-only — the CDN file is not CORS-enabled,
        // so no pixel readback (poster capture) is possible; canvas display
        // of the cached bitmaps is unaffected.
        if (!cancelled && valid.length > 8) {
          frames = valid;
          framesReady = true;
          setStage('canvas');
        }
      } catch {
        /* stay on the video-seek fallback path */
      }
    };
    void extract();

    const loop = () => {
      raf = requestAnimationFrame(loop);
      smoothed += (target - smoothed) * (reduceMotion ? 1 : 0.12);
      if (Math.abs(target - smoothed) < 0.0005) smoothed = target;
      if (framesReady && frames.length > 0) {
        const idx = Math.min(frames.length - 1, Math.round(smoothed * (frames.length - 1)));
        const bmp = frames[idx];
        if (bmp && bmp.width > 0) drawCover(bmp, bmp.width, bmp.height);
      } else {
        const dur = video.duration;
        if (dur && Number.isFinite(dur) && video.readyState >= 2) {
          const t = smoothed * Math.max(0, dur - 0.05);
          if (Math.abs(video.currentTime - t) > 0.04) {
            try {
              video.currentTime = t;
            } catch {
              /* seek while busy — retry next frame */
            }
          }
        }
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', updateTarget);
      video.removeEventListener('loadeddata', onVideoData);
      frames.forEach((f) => {
        try {
          f.close();
        } catch {
          /* noop */
        }
      });
      frames = [];
      try {
        video.pause();
      } catch {
        /* noop */
      }
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#0a0a0a]">
      {/* 1 — poster: supplied still when available, tinted wash behind as fallback.
          (A runtime still is impossible here: the CDN file is not CORS-enabled,
          so canvas pixel readback throws SecurityError.) */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${
          stage === 'poster' && !posterSrc ? 'opacity-100' : 'opacity-0'
        } bg-[radial-gradient(ellipse_at_50%_40%,rgba(46,66,87,0.45),rgba(10,10,10,0)_65%)]`}
      />
      {posterSrc && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={posterSrc}
          alt=""
          aria-hidden="true"
          draggable={false}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            stage === 'poster' ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
      {/* 2 — video (fallback seek path) */}
      <video
        ref={videoRef}
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        src={HERO_VIDEO_URL}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
          stage === 'video' ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {/* 3 — scrubbed frame cache */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${
          stage === 'canvas' ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {/* 4 — brand grade: cool slate tint + mist lift (tune to taste; footage stays visible) */}
      <div className="absolute inset-0 bg-[#2E4257]/30 mix-blend-color" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#E4E9ED]/15 via-transparent to-[#0a0a0a]/30" />
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────── */
type ModalKind = 'NONE' | 'QUESTIONNAIRE' | 'BLOOD';

export const NovaCinematicLanding: React.FC<{ posterSrc?: string }> = ({ posterSrc }) => {
  const router = useRouter();
  const { patients, currentPatientId } = usePatientStore();
  const activePatient = patients.find((p) => p.id === currentPatientId) || patients[0];
  const [modal, setModal] = useState<ModalKind>('NONE');
  const [menuOpen, setMenuOpen] = useState(false);

  // Cinematic page owns the viewport chrome — keep overscroll black too.
  useEffect(() => {
    const prev = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#0a0a0a';
    return () => {
      document.body.style.backgroundColor = prev;
    };
  }, []);

  const goConsole = () => router.push('/console');

  // Scroll-spy: highlight the nav item for the section in view
  const [activeSection, setActiveSection] = useState<string>('top');
  useEffect(() => {
    const ids = ['pillars', 'value-matrix', 'compliance', 'contact'];
    if (typeof IntersectionObserver === 'undefined') return;
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (!sections.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActiveSection(e.target.id);
        }
      },
      { rootMargin: '-38% 0px -55% 0px' }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  const navLinks = [
    { label: 'Platform', href: '#pillars', id: 'pillars', sup: '3' },
    { label: 'Outcomes', href: '#value-matrix', id: 'value-matrix', sup: null },
    { label: 'Safety', href: '#compliance', id: 'compliance', sup: null },
    { label: 'Contact', href: '#contact', id: 'contact', sup: null },
  ];

  return (
    <div className="nova-scope relative min-h-screen bg-[#0a0a0a] font-sans text-white antialiased">
      <ScrollVideo posterSrc={posterSrc} />

      <div className="relative z-10">
        {/* ── Navbar ── */}
        <header className="fixed inset-x-0 top-0 z-50 border-b border-white/15">
          <div className="flex items-center justify-between px-5 py-4 sm:px-8 md:px-12">
            <Reveal delay={0}>
              <a href="/nova" className="flex items-center gap-2.5">
                <Hexagon size={24} strokeWidth={1.5} className="text-white" />
                <span className="text-lg font-medium tracking-tight text-white sm:text-xl">veracity</span>
              </a>
            </Reveal>
            <nav className="hidden items-center gap-8 md:flex lg:gap-10">
              {navLinks.map((link, i) => {
                const isActive = activeSection === link.id;
                return (
                  <Reveal key={link.label} delay={100 + i * 100}>
                    <a
                      href={link.href}
                      aria-current={isActive ? 'true' : undefined}
                      className={`flex items-center gap-1.5 text-sm transition-colors duration-300 ${
                        isActive ? 'font-medium text-white' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      <span
                        className={`h-1 w-1 rounded-full transition-all duration-300 ${
                          isActive ? 'bg-white' : 'bg-transparent'
                        }`}
                      />
                      {link.label}
                      {link.sup && (
                        <sup className="ml-0.5 font-mono text-[10px] text-white/60">{link.sup}</sup>
                      )}
                    </a>
                  </Reveal>
                );
              })}
            </nav>
            <div className="flex items-center gap-2">
              <Reveal delay={450}>
                <button
                  type="button"
                  onClick={goConsole}
                  className="rounded-md bg-white px-4 py-2 text-xs font-medium text-black transition-all duration-300 hover:bg-white/85 active:scale-95 sm:px-5 sm:text-sm"
                >
                  Launch Console
                </button>
              </Reveal>
              <Reveal delay={500}>
                <button
                  type="button"
                  onClick={() => setModal('QUESTIONNAIRE')}
                  className="hidden rounded-md border border-white/20 bg-white/15 px-4 py-2 text-xs text-white backdrop-blur-md transition-colors duration-300 hover:bg-white/25 sm:block sm:px-5 sm:text-sm"
                >
                  Get Free Consultation
                </button>
              </Reveal>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Toggle menu"
                className="rounded-md border border-white/20 bg-white/15 p-2 text-white backdrop-blur-md transition-colors duration-300 hover:bg-white/25 md:hidden"
              >
                {menuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
          {menuOpen && (
            <nav className="border-t border-white/15 px-5 py-3 backdrop-blur-md sm:px-8 md:hidden">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`block py-2.5 text-sm transition-colors duration-300 ${
                    activeSection === link.id
                      ? 'font-medium text-white'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {link.label}
                </a>
              ))}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  goConsole();
                }}
                className="mt-2 flex w-full items-center justify-center gap-1 rounded-md bg-white px-4 py-2.5 text-sm font-medium text-black transition-colors duration-300 hover:bg-white/85"
              >
                Launch Console
                <ChevronRight size={14} />
              </button>
            </nav>
          )}
        </header>

        <main>
          {/* ── Section One — Hero ── */}
          <section className="flex min-h-screen flex-col justify-between px-5 pb-12 pt-24 sm:px-8 sm:pt-28 md:px-12 md:pb-16 supports-[height:100svh]:min-h-[100svh]">
            <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
              <div className="flex flex-col gap-2">
                {['/ Pre-Op Screening', '/ Mobile Blood Triage', '/ 1-Tap Attestation'].map((s, i) => (
                  <Reveal key={s} delay={150 + i * 120}>
                    <p className="font-mono text-xs uppercase tracking-[0.15em] text-white/90 drop-shadow-md">
                      {s}
                    </p>
                  </Reveal>
                ))}
              </div>
              <Reveal delay={300} className="max-w-xs sm:text-right">
                <p className="text-lg leading-relaxed text-white drop-shadow-md sm:text-xl">
                  We design clearance that brings clarity, precision, and efficiency to the way your
                  theatre operates.
                </p>
                <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.15em] text-white/60">
                  Screening · Triage · Attestation
                </p>
              </Reveal>
            </div>

            <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div>
                <Reveal delay={150} className="mb-5">
                  <span className="border-l-2 border-white bg-white/15 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-white backdrop-blur-md">
                    We Defend 100+ Surgical Lists
                  </span>
                </Reveal>
                <Reveal delay={280}>
                  <h1 className="font-serif text-5xl font-normal leading-[1.05] tracking-tight text-white drop-shadow-lg sm:text-6xl lg:text-7xl">
                    Clear. Precise.
                    <br />
                    <span className="italic">Defended.</span>
                  </h1>
                </Reveal>
              </div>
              <Reveal delay={420}>
                <div className="flex items-center gap-4 rounded-xl bg-white/15 p-3 backdrop-blur-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={PORTRAIT_URL}
                    alt="Dr. Tariq, consultant anaesthetist at Veracity"
                    className="h-24 w-20 rounded-lg object-cover"
                    loading="eager"
                  />
                  <div className="flex flex-col gap-1.5 pr-2">
                    <p className="text-sm font-medium text-white">Talk with Tariq</p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/60">
                      Consultant Anaesthetist
                    </p>
                    <button
                      type="button"
                      onClick={() => setModal('QUESTIONNAIRE')}
                      className="mt-1.5 flex items-center gap-1 rounded-full bg-white px-4 py-2 text-xs font-medium text-black transition-colors duration-300 hover:bg-white/85"
                    >
                      Book 15-mins call
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>

          {/* ── Mid spacer: room for the scroll scrub ── */}
          <div aria-hidden="true" className="h-[80vh]" />

          {/* ── How Veracity works ── */}
          <section id="pillars" className="scroll-mt-20 px-5 py-16 sm:px-8 md:px-12">
            <div className="mx-auto max-w-5xl">
              <Reveal delay={100}>
                <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/60">
                  How Veracity works
                </p>
              </Reveal>
              <Reveal delay={180}>
                <h2 className="mt-4 font-serif text-4xl font-normal leading-tight tracking-tight text-white drop-shadow-lg sm:text-5xl">
                  Three defenses, <span className="italic">zero delays.</span>
                </h2>
              </Reveal>
              <div className="mt-10 grid gap-4 md:grid-cols-3">
                {[
                  {
                    index: '01',
                    title: 'Send the intake',
                    body: 'A smart questionnaire goes out on WhatsApp before the visit. Contraceptive, smoking, psychiatric and cardiac risks are captured and scored automatically.',
                    action: 'Open intake',
                    onClick: () => setModal('QUESTIONNAIRE'),
                  },
                  {
                    index: '02',
                    title: 'Triage in the OT',
                    body: 'At the theatre door, the anesthetist opens a phone-first view: potassium, hemoglobin, platelets and INR against hard cutoffs, with fasting clocks live.',
                    action: 'See triage',
                    onClick: () => setModal('BLOOD'),
                  },
                  {
                    index: '03',
                    title: 'Attest in one tap',
                    body: 'One signature creates the statutory clearance record and dispatches the PAC slip to the team — audited under DHA §3060(a).',
                    action: 'Open console',
                    onClick: goConsole,
                  },
                ].map((step, i) => (
                  <Reveal key={step.index} delay={220 + i * 110}>
                    <div className="flex h-full flex-col rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur-md">
                      <span className="font-mono text-[11px] tracking-[0.15em] text-white/55">
                        {step.index}
                      </span>
                      <p className="mt-3 text-lg font-medium text-white">{step.title}</p>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-white/70">{step.body}</p>
                      <button
                        type="button"
                        onClick={step.onClick}
                        className="mt-5 flex items-center gap-1 self-start text-xs font-medium text-white transition-colors duration-300 hover:text-white/70"
                      >
                        {step.action}
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* ── Breather: fullscreen footage, zero overlay ── */}
          <div aria-hidden="true" className="h-[100vh]" />

          {/* ── Section Two — Capability ── */}
          <section className="flex min-h-screen flex-col justify-between px-5 pb-12 pt-24 sm:px-8 sm:pt-28 md:px-12 md:pb-16 supports-[height:100svh]:min-h-[100svh]">
            <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
              <Reveal delay={120}>
                <span className="inline-block border-l-2 border-white bg-white/15 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-white backdrop-blur-md">
                  Clearance On Demand
                </span>
              </Reveal>
              <Reveal delay={220} className="max-w-sm sm:text-right">
                <p className="text-lg leading-relaxed text-white drop-shadow-md sm:text-xl">
                  Our engine doesn&apos;t just respond — it screens, sharpens, and delivers the
                  signal your OT needs.
                </p>
              </Reveal>
            </div>

            <div className="flex flex-1 flex-col justify-end gap-12 md:flex-row md:items-end md:justify-between md:gap-16">
              <div className="max-w-xl">
                <Reveal delay={180}>
                  <h2 className="font-serif text-5xl font-normal leading-[1.05] tracking-tight text-white drop-shadow-lg sm:text-6xl lg:text-7xl">
                    Learn to see
                    <br />
                    <span className="italic">clearly.</span>
                  </h2>
                </Reveal>
                <Reveal delay={320}>
                  <p className="mt-6 max-w-md text-sm text-white/80 drop-shadow-md sm:text-base">
                    From the first intake to final induction, Veracity turns raw history into
                    decisions your team can act on — quietly, precisely, at speed.
                  </p>
                </Reveal>
                <Reveal delay={360}>
                  <p className="mt-4 max-w-md text-sm leading-relaxed text-white/60 sm:text-base">
                    Every list hides risks — an unheld pill, a borderline potassium, a short fast.
                    Veracity watches all of them, continuously, so nothing reaches the table unseen.
                  </p>
                </Reveal>
                <Reveal delay={420}>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setModal('BLOOD')}
                      className="flex items-center gap-1 rounded-full bg-white px-5 py-2.5 text-xs font-medium text-black transition-colors duration-300 hover:bg-white/85 sm:text-sm"
                    >
                      Run the demo
                      <ChevronRight size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setModal('QUESTIONNAIRE')}
                      className="rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-xs text-white backdrop-blur-md transition-colors duration-300 hover:bg-white/20 sm:text-sm"
                    >
                      Free consultation
                    </button>
                  </div>
                </Reveal>
              </div>

              <Reveal delay={200} className="w-full max-w-md">
                <div className="rounded-2xl border border-white/15 bg-white/10 px-5 backdrop-blur-md sm:px-6">
                  {[
                    {
                      index: '01',
                      title: 'Real-time triage',
                      body: 'Reads labs and holds as they happen and surfaces what matters before induction.',
                    },
                    {
                      index: '02',
                      title: 'Layered screening',
                      body: 'Moves from rough intake to sharp clearance without losing the thread.',
                    },
                    {
                      index: '03',
                      title: 'Adaptive holds',
                      body: 'Learns your list cadence and tightens every check as you work.',
                    },
                    {
                      index: '04',
                      title: 'Fasting clocks',
                      body: 'NPO timers track solids and clears against the 8-hour line, down to the minute.',
                    },
                    {
                      index: '05',
                      title: 'Hold engine',
                      body: 'GLP-1, DOAC and ACEi holds counted against guideline windows, automatically.',
                    },
                  ].map((row, i) => (
                    <Reveal key={row.index} delay={300 + i * 110}>
                      <div
                        className={`group flex gap-5 py-5 ${
                          i < 4 ? 'border-b border-white/15' : ''
                        }`}
                      >
                        <span className="font-mono text-[11px] tracking-[0.15em] text-white/55">
                          {row.index}
                        </span>
                        <div>
                          <button
                            type="button"
                            onClick={() => setModal('BLOOD')}
                            className="flex items-center gap-1 text-left text-base font-medium text-white sm:text-lg"
                          >
                            {row.title}
                            <ChevronRight
                              size={16}
                              className="text-white/40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-white"
                            />
                          </button>
                          <p className="mt-1.5 text-sm leading-relaxed text-white/70">{row.body}</p>
                        </div>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </Reveal>
            </div>
          </section>

          {/* ── Breather: fullscreen footage, zero overlay ── */}
          <div aria-hidden="true" className="h-[100vh]" />

          {/* ── Proof band (centered content moment) ── */}
          <section id="value-matrix" className="scroll-mt-20 px-5 py-16 sm:px-8 md:px-12">
            <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { value: '0', label: 'Day-of delays', sub: 'Morning cancellations eliminated' },
                { value: '100%', label: 'Risks caught', sub: 'VTE, QTc and cardiac risks screened' },
                { value: '4.8 min', label: 'Average OT review', sub: 'STAT triage and bedside sign-off' },
                { value: '100%', label: 'DHA §3060(a) aligned', sub: 'Sovereign UAE data residency' },
              ].map((stat, i) => (
                <Reveal key={stat.label} delay={120 + i * 100}>
                  <div className="rounded-2xl border border-white/15 bg-white/10 p-6 text-center backdrop-blur-md">
                    <p className="font-serif text-4xl font-normal text-white sm:text-[42px]">
                      {stat.value}
                    </p>
                    <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.15em] text-white/85">
                      {stat.label}
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-white/60">{stat.sub}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          {/* ── Safety & compliance ── */}
          <section id="compliance" className="scroll-mt-20 px-5 py-16 sm:px-8 md:px-12">
            <div className="mx-auto max-w-5xl">
              <Reveal delay={100}>
                <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/60">
                  Safety & Compliance
                </p>
              </Reveal>
              <Reveal delay={180}>
                <h2 className="mt-4 font-serif text-4xl font-normal leading-tight tracking-tight text-white drop-shadow-lg sm:text-5xl">
                  Held to the <span className="italic">statute.</span>
                </h2>
              </Reveal>
              <Reveal delay={240}>
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
                  Every clearance Veracity produces is a defensible record — hard physiological
                  cutoffs, counted holds, and a signature trail your surveyor can replay.
                </p>
              </Reveal>
              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    index: '§3060(a)',
                    title: 'Statutory attestation',
                    body: 'One anesthetist signature creates the DHA-aligned PAC record and dispatches the slip to the team.',
                  },
                  {
                    index: 'TRAIL',
                    title: 'Immutable audit trail',
                    body: 'Every hold, check, override and sign-off is timestamped — replay any list, any morning.',
                  },
                  {
                    index: 'UAE',
                    title: 'Sovereign residency',
                    body: 'Patient data stays in the UAE North enclave. Nothing trains abroad, nothing leaves.',
                  },
                  {
                    index: 'CUT-OFF',
                    title: 'Hard safety cutoffs',
                    body: 'K⁺ 3.5–5.1 · Hb ≥ 12 · Plt > 100k · INR < 1.4 · NPO 8h solids / 2h clears. No vibes.',
                  },
                ].map((card, i) => (
                  <Reveal key={card.title} delay={260 + i * 100}>
                    <div className="flex h-full flex-col rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur-md">
                      <span className="font-mono text-[11px] tracking-[0.15em] text-white/55">
                        {card.index}
                      </span>
                      <p className="mt-3 text-lg font-medium text-white">{card.title}</p>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-white/70">{card.body}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
              <Reveal delay={300}>
                <button
                  type="button"
                  onClick={goConsole}
                  className="mt-8 flex items-center gap-1 rounded-full border border-white/25 bg-white/10 px-6 py-3 text-xs text-white backdrop-blur-md transition-colors duration-300 hover:bg-white/20 sm:text-sm"
                >
                  Open the OT console
                  <ChevronRight size={14} />
                </button>
              </Reveal>
            </div>
          </section>

          {/* ── Testimonial (centered content moment) ── */}
          <section className="px-5 py-16 sm:px-8 md:px-12">
            <div className="mx-auto max-w-3xl text-center">
              <Reveal delay={100}>
                <p className="text-sm font-medium tracking-[0.3em] text-white/70">★★★★★</p>
              </Reveal>
              <Reveal delay={180}>
                <blockquote className="mt-6 font-serif text-2xl font-normal leading-snug text-white drop-shadow-lg sm:text-[32px]">
                  “Our lists start <span className="italic">on time</span>, every time. Veracity
                  catches what paper screening missed —{' '}
                  <span className="italic">quietly</span>, before it costs us a slot.”
                </blockquote>
              </Reveal>
              <Reveal delay={260}>
                <div className="mt-7 flex items-center justify-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/15 text-sm font-medium text-white backdrop-blur-md">
                    SA
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">Dr. Sara Ahmed, MD</p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/60">
                      Chief of Anesthesia, Dubai Day Surgery
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>

          {/* ── Closing CTA (bare, docked right — visual stays clear) ── */}
          <section id="contact" className="scroll-mt-20 px-5 pb-24 pt-4 sm:px-8 md:px-12">
            <Reveal delay={120}>
              <div className="ml-auto max-w-xl text-left">
                <h2 className="font-serif text-3xl font-normal leading-tight tracking-tight text-white drop-shadow-lg sm:text-5xl">
                  Bring <span className="italic">clarity</span> to your lists.
                </h2>
                <p className="mt-5 text-sm leading-relaxed text-white drop-shadow-md sm:text-base">
                  Join surgical teams running zero-delay lists on autonomous clearance. Start with
                  a complimentary list analysis — intake today, defended list tomorrow.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-start gap-3">
                  <button
                    type="button"
                    onClick={() => setModal('BLOOD')}
                    className="flex items-center gap-1 rounded-full bg-white px-6 py-3 text-xs font-medium text-black transition-colors duration-300 hover:bg-white/85 sm:text-sm"
                  >
                    Run the demo
                    <ChevronRight size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setModal('QUESTIONNAIRE')}
                    className="rounded-full border border-white/25 bg-white/10 px-6 py-3 text-xs text-white backdrop-blur-md transition-colors duration-300 hover:bg-white/20 sm:text-sm"
                  >
                    Free consultation
                  </button>
                </div>
              </div>
            </Reveal>
          </section>

          {/* ── Final breather: footage owns the outro ── */}
          <div aria-hidden="true" className="h-[70vh]" />

          {/* ── Footer ── */}
          <footer className="border-t border-white/15 px-5 py-10 sm:px-8 md:px-12">
            <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 md:flex-row">
              <a href="/nova" className="flex items-center gap-2.5">
                <Hexagon size={20} strokeWidth={1.5} className="text-white" />
                <span className="text-base font-medium tracking-tight text-white">veracity</span>
              </a>
              <nav className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2">
                {[
                  { label: 'Platform', href: '#pillars' },
                  { label: 'Outcomes', href: '#value-matrix' },
                  { label: 'Safety', href: '#compliance' },
                  { label: 'Contact', href: '#contact' },
                ].map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-xs text-white/70 transition-colors duration-300 hover:text-white"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/50">
                © 2026 Veracity
              </p>
            </div>
          </footer>
        </main>
      </div>

      {/* ── Working modals: our real intake + blood views ── */}
      {modal === 'QUESTIONNAIRE' && activePatient && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative my-8 w-full max-w-4xl">
            <button
              type="button"
              onClick={() => setModal('NONE')}
              aria-label="Close"
              className="absolute -right-3 -top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white text-slate-700 shadow-md transition hover:bg-white/85"
            >
              <X className="h-4 w-4" />
            </button>
            <PatientPreOpQuestionnaire patientId={activePatient.id} onClose={() => setModal('NONE')} />
          </div>
        </div>
      )}

      {modal === 'BLOOD' && activePatient && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative my-8 w-full max-w-md">
            <button
              type="button"
              onClick={() => setModal('NONE')}
              aria-label="Close"
              className="absolute -right-3 -top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white text-slate-700 shadow-md transition hover:bg-white/85"
            >
              <X className="h-4 w-4" />
            </button>
            <MobileAnesthesiaBloodView
              patientId={activePatient.id}
              onOpenAttestation={() => {
                setModal('NONE');
                goConsole();
              }}
              onOpenWhatsApp={() => {
                setModal('NONE');
                goConsole();
              }}
              onOpenQuestionnaire={() => setModal('QUESTIONNAIRE')}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default NovaCinematicLanding;
