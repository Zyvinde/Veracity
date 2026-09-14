'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Hexagon, ChevronRight, X, Menu, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePatientStore } from '@/lib/store';
import PatientPreOpQuestionnaire from '@/components/PatientPreOpQuestionnaire';
import MobileAnesthesiaBloodView from '@/components/MobileAnesthesiaBloodView';

const HERO_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260729_102822_0e6c87e8-c141-4744-bf32-ad30db296371.mp4';

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
  const [visible, setVisible] = useState(true);

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
      { threshold: 0.01, rootMargin: '100px' }
    );
    io.observe(el);

    // Initial check in case observer doesn't fire immediately
    const rect = el.getBoundingClientRect();
    if (rect.top < (window.innerHeight || 1000) + 100 && rect.bottom > -100) {
      setVisible(true);
    }

    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${Math.min(delay, 300)}ms` }}
      className={`transition-all duration-500 ease-out will-change-transform ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* ── Apple-Style High-Performance Canvas Image Sequence (60-120fps Zero-Lag) ───────────────────────────── */
const TOTAL_FRAMES = 202;

function getFramePath(index: number): string {
  const padIndex = String(index).padStart(3, '0');
  const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
  return `${base}/frames/frame_${padIndex}.webp`;
}

function ScrollCanvas({ posterSrc }: { posterSrc?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES + 1).fill(null));
  const [isFirstFrameReady, setIsFirstFrameReady] = useState<boolean>(false);
  const targetFrameRef = useRef<number>(1);
  const currentFrameRef = useRef<number>(1);
  const lastDrawnFrameRef = useRef<number>(-1);
  const rafIdRef = useRef<number | null>(null);

  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Find the closest loaded image
    let img = imagesRef.current[frameIndex];
    if (!img || !img.complete || img.naturalWidth === 0) {
      for (let offset = 1; offset <= TOTAL_FRAMES; offset++) {
        const prev = imagesRef.current[Math.max(1, frameIndex - offset)];
        if (prev && prev.complete && prev.naturalWidth > 0) {
          img = prev;
          break;
        }
        const next = imagesRef.current[Math.min(TOTAL_FRAMES, frameIndex + offset)];
        if (next && next.complete && next.naturalWidth > 0) {
          img = next;
          break;
        }
      }
    }
    if (!img || !img.complete || img.naturalWidth === 0) {
      img = imagesRef.current[1];
    }

    if (!img || !img.complete || img.naturalWidth === 0) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    const hRatio = cw / iw;
    const vRatio = ch / ih;
    const ratio = Math.max(hRatio, vRatio);
    const drawW = iw * ratio;
    const drawH = ih * ratio;
    const shiftX = (cw - drawW) / 2;
    const shiftY = (ch - drawH) / 2;

    ctx.drawImage(img, 0, 0, iw, ih, shiftX, shiftY, drawW, drawH);
  }, []);

  // Preload frames in priority batches: Frame 1 immediately, then every 4th frame, then all
  useEffect(() => {
    let isCancelled = false;

    // Frame 1 immediate load
    const firstImg = new Image();
    firstImg.src = getFramePath(1);
    firstImg.onload = () => {
      if (isCancelled) return;
      imagesRef.current[1] = firstImg;
      setIsFirstFrameReady(true);
      drawFrame(1);
    };

    // Phase 1: key milestone frames for rapid scrubbing readiness
    for (let i = 2; i <= TOTAL_FRAMES; i += 3) {
      const img = new Image();
      img.src = getFramePath(i);
      img.onload = () => {
        if (!isCancelled) imagesRef.current[i] = img;
      };
    }

    // Phase 2: complete frame suite
    const timer = setTimeout(() => {
      if (isCancelled) return;
      for (let i = 2; i <= TOTAL_FRAMES; i++) {
        if (imagesRef.current[i]) continue;
        const img = new Image();
        img.src = getFramePath(i);
        img.onload = () => {
          if (!isCancelled) imagesRef.current[i] = img;
        };
      }
    }, 150);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [drawFrame]);

  // Window resize & DPR handling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      drawFrame(Math.round(currentFrameRef.current));
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [drawFrame]);

  // Scroll listener & RAF lerp loop (60-120fps)
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.min(Math.max(scrollY / maxScroll, 0), 1);
      targetFrameRef.current = 1 + progress * (TOTAL_FRAMES - 1);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    const loop = () => {
      const diff = targetFrameRef.current - currentFrameRef.current;
      if (Math.abs(diff) > 0.02) {
        currentFrameRef.current += diff * 0.26; // High performance butter-smooth lerp
        const frameToDraw = Math.min(TOTAL_FRAMES, Math.max(1, Math.round(currentFrameRef.current)));
        if (frameToDraw !== lastDrawnFrameRef.current) {
          drawFrame(frameToDraw);
          lastDrawnFrameRef.current = frameToDraw;
        }
      }
      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [drawFrame]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#071626]">
      {/* 1 — Fallback poster if first frame loading */}
      {posterSrc && !isFirstFrameReady && (
        <img
          src={posterSrc}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 opacity-100"
        />
      )}

      {/* 2 — Apple-Grade HTML5 Canvas Hardware Scrub */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 h-full w-full object-cover will-change-transform transition-opacity duration-500 scale-[1.02] ${
          isFirstFrameReady ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* 3 — Cinematic mist blue atmospheric overlays */}
      <div className="absolute inset-0 bg-[#0c2444]/35 mix-blend-screen pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(1200px_700px_at_50%_20%,rgba(56,189,248,0.22),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#061424]/40 via-transparent to-[#0a0a0a]/85 pointer-events-none" />
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
    { label: 'OT Economics', href: '#value-matrix', id: 'value-matrix', sup: null },
    { label: 'Safety Specs', href: '#compliance', id: 'compliance', sup: null },
    { label: 'Inquiries', href: '#contact', id: 'contact', sup: null },
  ];

  return (
    <div className="nova-scope relative min-h-screen bg-[#0a0a0a] font-sans text-white antialiased overflow-x-hidden w-full">
      <ScrollCanvas posterSrc={posterSrc} />

      <div className="relative z-10 w-full overflow-x-hidden">
        {/* ── Navbar ── */}
        <header className="fixed inset-x-0 top-0 z-50 border-b border-white/15 backdrop-blur-md bg-black/60">
          <div className="flex items-center justify-between px-3 sm:px-8 md:px-12 max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <a href="/" className="flex items-center gap-2">
                <Hexagon size={22} strokeWidth={1.5} className="text-white shrink-0" />
                <span className="text-base sm:text-xl font-medium tracking-tight text-white">veracity</span>
              </a>
              <span className="hidden sm:inline-block rounded-full border border-sky-400/40 bg-sky-500/15 px-2 py-0.5 font-mono text-[9px] font-bold tracking-wider text-sky-300 uppercase shrink-0">
                Private Beta
              </span>
              <span className="hidden xl:inline-flex items-center gap-1 rounded-full border border-amber-400/35 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[9px] font-semibold tracking-wider text-amber-300 uppercase">
                <AlertTriangle className="h-2.5 w-2.5" />
                Non-Diagnostic CDS Demo
              </span>
            </div>

            <nav className="hidden items-center gap-8 md:flex lg:gap-10">
              {navLinks.map((link) => {
                const isActive = activeSection === link.id;
                return (
                  <a
                    key={link.label}
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
                );
              })}
            </nav>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={goConsole}
                className="rounded-full bg-white px-3 sm:px-5 py-2 sm:py-2.5 text-xs font-semibold text-black transition-all duration-300 hover:bg-white/85 active:scale-95 sm:text-sm shadow-md min-h-[40px] flex items-center justify-center shrink-0"
              >
                <span className="sm:hidden">Console</span>
                <span className="hidden sm:inline">Open OT Console</span>
              </button>

              <button
                type="button"
                onClick={() => setModal('QUESTIONNAIRE')}
                className="hidden lg:block rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-xs text-white backdrop-blur-md transition-colors duration-300 hover:bg-white/20 sm:px-5 sm:text-sm shrink-0 min-h-[44px]"
              >
                Sample Intake
              </button>

              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Toggle menu"
                className="rounded-xl border border-white/20 bg-white/15 p-2 text-white backdrop-blur-md transition-colors duration-300 hover:bg-white/25 md:hidden min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer shrink-0"
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
          {menuOpen && (
            <nav className="border-t border-white/15 px-5 py-4 backdrop-blur-xl sm:px-8 md:hidden bg-black/90 space-y-2 animate-fade-in shadow-2xl">
              <div className="space-y-1">
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center justify-between py-3 px-3 rounded-xl text-sm transition-colors duration-200 min-h-[44px] ${
                      activeSection === link.id
                        ? 'font-bold text-white bg-white/15'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>{link.label}</span>
                    {link.sup && (
                      <span className="font-mono text-[10px] text-sky-300 bg-sky-950/70 border border-sky-400/30 px-1.5 py-0.5 rounded">
                        {link.sup}
                      </span>
                    )}
                  </a>
                ))}
              </div>

              <div className="pt-2 border-t border-white/10 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setModal('QUESTIONNAIRE');
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20 min-h-[44px]"
                >
                  <span>Sample Pre-Op Intake</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setModal('BLOOD');
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20 min-h-[44px]"
                >
                  <span>In-OT Blood Triage</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    goConsole();
                  }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-3 text-sm font-bold text-black transition hover:bg-white/85 shadow-lg min-h-[44px]"
                >
                  <span>Open OT Console</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </nav>
          )}
        </header>

        <main>
          {/* ── Section One — Hero ── */}
          <section className="flex min-h-screen flex-col justify-between px-5 pb-12 pt-24 sm:px-8 sm:pt-28 md:px-12 md:pb-16 supports-[height:100svh]:min-h-[100svh]">
            <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
              <div className="flex flex-col gap-1.5 sm:gap-2">
                {['/ Pre-Op Screening', '/ Mobile Blood Triage', '/ 1-Tap Attestation'].map((s, i) => (
                  <Reveal key={s} delay={150 + i * 120}>
                    <p className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.15em] text-white/90 drop-shadow-md">
                      {s}
                    </p>
                  </Reveal>
                ))}
              </div>
              <Reveal delay={300} className="max-w-xs sm:text-right">
                <p className="text-base sm:text-xl leading-relaxed text-white drop-shadow-md">
                  Clinical decision support designed to bring clarity, precision, and verified safety
                  to operating theatre assessment.
                </p>
                <p className="mt-3 font-mono text-[10.5px] sm:text-[11px] uppercase tracking-[0.15em] text-white/60">
                  Screening · Triage · Attestation
                </p>
              </Reveal>
            </div>

            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mt-6 sm:mt-0">
              <div className="max-w-3xl">
                <Reveal delay={120} className="mb-3.5 max-w-full">
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-xl border border-amber-400/40 bg-amber-950/50 px-2.5 sm:px-3 py-1.5 sm:py-2 backdrop-blur-md text-amber-200 text-[10px] sm:text-xs font-mono shadow-md max-w-full">
                    <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-300 shrink-0" />
                    <span className="truncate">FOR CDS EVALUATION ONLY · DHA § 3060(a)</span>
                  </div>
                </Reveal>
                <Reveal delay={180} className="mb-4">
                  <span className="inline-block border-l-2 border-sky-400 bg-white/10 px-2.5 py-1 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.15em] text-sky-200 backdrop-blur-md">
                    Clinical Decision Support · OT Defense
                  </span>
                </Reveal>
                <Reveal delay={280}>
                  <h1 className="font-serif text-3xl xs:text-5xl sm:text-6xl lg:text-7xl font-normal leading-[1.08] tracking-tight text-white drop-shadow-lg">
                    Clear. Precise.
                    <br />
                    <span className="italic">Defended.</span>
                  </h1>
                </Reveal>
              </div>

              <Reveal delay={380}>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={goConsole}
                    className="flex items-center justify-center gap-1.5 rounded-full bg-white px-6 py-3.5 text-xs sm:text-sm font-semibold text-black transition-all duration-300 hover:bg-white/85 shadow-lg active:scale-95 min-h-[44px]"
                  >
                    <span>Open OT Console</span>
                    <ChevronRight size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setModal('QUESTIONNAIRE')}
                    className="flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-5 py-3.5 text-xs sm:text-sm text-white backdrop-blur-md transition-colors duration-300 hover:bg-white/20 font-medium min-h-[44px]"
                  >
                    Sample Pre-Op Intake
                  </button>
                </div>
              </Reveal>
            </div>
          </section>

          {/* ── Mid spacer: room for the scroll scrub ── */}
          <div aria-hidden="true" className="h-[12vh] sm:h-[45vh]" />

          {/* ── How Veracity works ── */}
          <section id="pillars" className="scroll-mt-20 px-5 py-12 sm:py-16 sm:px-8 md:px-12">
            <div className="mx-auto max-w-5xl">
              <Reveal delay={100}>
                <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/60">
                  Architecture & Workflow
                </p>
              </Reveal>
              <Reveal delay={180}>
                <h2 className="mt-4 font-serif text-3xl sm:text-4xl lg:text-5xl font-normal leading-tight tracking-tight text-white drop-shadow-lg">
                  Three defenses, <span className="italic">zero unverified steps.</span>
                </h2>
              </Reveal>
              <div className="mt-8 sm:mt-10 grid gap-4 md:grid-cols-3">
                {[
                  {
                    index: '01',
                    title: 'Automated Patient Intake',
                    body: 'A smart clinical questionnaire captures patient history before admission. Contraceptive, smoking, psychiatric, and cardiac risks are parsed automatically.',
                    action: 'Sample intake',
                    onClick: () => setModal('QUESTIONNAIRE'),
                  },
                  {
                    index: '02',
                    title: 'Bedside Point-of-Care Triage',
                    body: 'In the pre-op holding area, clinicians review potassium, hemoglobin, platelets, and coagulation against strict physiological cutoff thresholds.',
                    action: 'See triage demo',
                    onClick: () => setModal('BLOOD'),
                  },
                  {
                    index: '03',
                    title: 'Statutory CDS Attestation',
                    body: 'One cryptographic signature records the statutory PAC review under Dubai DHA § 3060(a) CDS guidelines, maintaining a verifiable audit trail.',
                    action: 'Open console',
                    onClick: goConsole,
                  },
                ].map((step, i) => (
                  <Reveal key={step.index} delay={220 + i * 110}>
                    <div className="flex h-full flex-col rounded-2xl border border-white/15 bg-white/10 p-5 sm:p-6 backdrop-blur-md">
                      <span className="font-mono text-[11px] tracking-[0.15em] text-sky-300 font-bold">
                        {step.index}
                      </span>
                      <p className="mt-3 text-base sm:text-lg font-medium text-white">{step.title}</p>
                      <p className="mt-2 flex-1 text-xs sm:text-sm leading-relaxed text-white/70">{step.body}</p>
                      <button
                        type="button"
                        onClick={step.onClick}
                        className="mt-5 flex items-center gap-1 self-start text-xs font-medium text-white transition-colors duration-300 hover:text-sky-200 min-h-[36px]"
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
          <div aria-hidden="true" className="h-[14vh] sm:h-[45vh]" />

          {/* ── Section Two — Capability ── */}
          <section className="flex min-h-screen flex-col justify-between px-5 pb-12 pt-20 sm:px-8 sm:pt-28 md:px-12 md:pb-16 supports-[height:100svh]:min-h-[100svh]">
            <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
              <Reveal delay={120}>
                <span className="inline-block border-l-2 border-sky-400 bg-white/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-sky-200 backdrop-blur-md">
                  Pre-Induction Verification
                </span>
              </Reveal>
              <Reveal delay={220} className="max-w-sm sm:text-right">
                <p className="text-base sm:text-xl leading-relaxed text-white drop-shadow-md">
                  Deterministic rules evaluation aligned with ASA 2023 and ASRA 2025 guidelines.
                </p>
              </Reveal>
            </div>

            <div className="flex flex-1 flex-col justify-end gap-10 md:flex-row md:items-end md:justify-between md:gap-16">
              <div className="max-w-xl">
                <Reveal delay={180}>
                  <h2 className="font-serif text-3xl xs:text-5xl sm:text-6xl lg:text-7xl font-normal leading-[1.05] tracking-tight text-white drop-shadow-lg">
                    Structured signals.
                    <br />
                    <span className="italic">Defensible data.</span>
                  </h2>
                </Reveal>
                <Reveal delay={320}>
                  <p className="mt-4 sm:mt-6 max-w-md text-xs sm:text-base text-white/80 drop-shadow-md">
                    From raw lab reports to final pre-induction attestation, Veracity evaluates medication hold windows,
                    electrolytes, and NPO status transparently.
                  </p>
                </Reveal>
                <Reveal delay={360}>
                  <p className="mt-3 sm:mt-4 max-w-md text-xs sm:text-base leading-relaxed text-white/60">
                    Every case check is logged with SHA-256 provenance bounding boxes, so clinical rationale is always auditable.
                  </p>
                </Reveal>
                <Reveal delay={420}>
                  <div className="mt-6 sm:mt-8 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={goConsole}
                      className="flex items-center gap-1 rounded-full bg-white px-5 py-2.5 text-xs font-medium text-black transition-colors duration-300 hover:bg-white/85 sm:text-sm min-h-[44px]"
                    >
                      Explore Console
                      <ChevronRight size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setModal('BLOOD')}
                      className="rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-xs text-white backdrop-blur-md transition-colors duration-300 hover:bg-white/20 sm:text-sm min-h-[44px]"
                    >
                      View Blood Triage
                    </button>
                  </div>
                </Reveal>
              </div>

              <Reveal delay={200} className="w-full max-w-md">
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 sm:px-6 backdrop-blur-md">
                  {[
                    {
                      index: '01',
                      title: 'Point-of-Care Biomarker Check',
                      body: 'Evaluates potassium, hemoglobin, troponin, and renal function against safe surgical cutoffs.',
                    },
                    {
                      index: '02',
                      title: 'Pharmacotherapy Hold Engine',
                      body: 'Calculates hold durations for GLP-1 RAs, DOACs, ACE inhibitors, and antiplatelet agents.',
                    },
                    {
                      index: '03',
                      title: 'Live Fasting Timers',
                      body: 'NPO clocks track solids (8h) and clear fluids (2h) down to the minute.',
                    },
                    {
                      index: '04',
                      title: 'Sovereign Regulatory Audit',
                      body: 'Full compatibility with UAE DHA § 3060(a) and Indian Medical Council CDS standards.',
                    },
                  ].map((row, i) => (
                    <Reveal key={row.index} delay={300 + i * 110}>
                      <div
                        className={`group flex gap-4 sm:gap-5 py-4 sm:py-5 ${
                          i < 3 ? 'border-b border-white/15' : ''
                        }`}
                      >
                        <span className="font-mono text-[11px] tracking-[0.15em] text-sky-300 font-bold">
                          {row.index}
                        </span>
                        <div>
                          <button
                            type="button"
                            onClick={() => setModal('BLOOD')}
                            className="flex items-center gap-1 text-left text-sm sm:text-lg font-medium text-white min-h-[36px]"
                          >
                            {row.title}
                            <ChevronRight
                              size={16}
                              className="text-white/40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-white"
                            />
                          </button>
                          <p className="mt-1 text-xs sm:text-sm leading-relaxed text-white/70">{row.body}</p>
                        </div>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </Reveal>
            </div>
          </section>

          {/* ── Breather: fullscreen footage ── */}
          <div aria-hidden="true" className="h-[14vh] sm:h-[45vh]" />

          {/* ── Section Three — Operating Theatre Waste Elimination & Economics ── */}
          <section id="value-matrix" className="scroll-mt-20 px-5 py-12 sm:py-16 sm:px-8 md:px-12">
            <div className="mx-auto max-w-5xl">
              <Reveal delay={100}>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-sky-300 font-bold">
                    Operating Theatre Economics &amp; Waste Elimination
                  </span>
                </div>
              </Reveal>
              <Reveal delay={180}>
                <h2 className="mt-4 font-serif text-3xl sm:text-4xl lg:text-5xl font-normal leading-tight tracking-tight text-white drop-shadow-lg">
                  Stopping the multimillion-dollar leak in <span className="italic">theatre utilization.</span>
                </h2>
              </Reveal>
              <Reveal delay={240}>
                <p className="mt-4 max-w-2xl text-xs sm:text-base leading-relaxed text-white/70">
                  Operating theatre downtime costs hospitals $60 to $100 per minute. Veracity eliminates avoidable morning cancellations and holding bay delays through verified, pre-induction protocol defense.
                </p>
              </Reveal>

              {/* 4 Core ROI Pillars */}
              <div className="mt-8 sm:mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    stat: '120+ Min',
                    headline: 'Surgical Delay Reduction',
                    detail: 'Catches missed GLP-1 (Semaglutide/Ozempic) and DOAC (Apixaban/Xarelto) hold windows 7 days prior at intake rather than in the morning holding bay.',
                    tag: 'Pharmacotherapy Defense',
                  },
                  {
                    stat: '0%',
                    headline: 'Day-of-Surgery NPO Cancellations',
                    detail: 'Automated pre-op intake screens strict 8h solid / 2h clear fluid adherence and flags difficult airway anatomy (Mallampati/OSA) days in advance.',
                    tag: 'Aspiration & Airway Guard',
                  },
                  {
                    stat: '100%',
                    headline: 'Morning Blood Bank Readiness',
                    detail: 'Pre-op anemia optimization (IV iron/EPO cutoffs) and automated blood type & crossmatch reservation eliminates morning blood bank scramble.',
                    tag: 'Transfusion Preparation',
                  },
                  {
                    stat: '80%',
                    headline: 'Anaesthetist Clinic Time Saved',
                    detail: 'Tele-PAC digital triage fast-tracks healthy ASA I/II patients, liberating senior consultant time for high-risk ASA III/IV complex cases.',
                    tag: 'Tele-PAC Fast-Track',
                  },
                ].map((card, i) => (
                  <Reveal key={card.headline} delay={220 + i * 100}>
                    <div className="flex h-full flex-col justify-between rounded-2xl border border-white/15 bg-white/10 p-5 sm:p-6 backdrop-blur-md hover:border-sky-400/40 transition">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-serif text-2xl sm:text-4xl font-normal text-white">
                            {card.stat}
                          </span>
                          <span className="rounded-full border border-sky-400/30 bg-sky-500/15 px-2 py-0.5 font-mono text-[9px] font-bold text-sky-200">
                            {card.tag}
                          </span>
                        </div>
                        <p className="mt-3 text-sm sm:text-base font-semibold text-white leading-snug">
                          {card.headline}
                        </p>
                        <p className="mt-2 text-xs leading-relaxed text-white/70">
                          {card.detail}
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-1.5 text-[11px] font-mono text-emerald-300 font-semibold">
                        <CheckCircle2 size={13} className="shrink-0" />
                        <span>Verified Protocol</span>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* ── Safety & compliance ── */}
          <section id="compliance" className="scroll-mt-20 px-5 py-12 sm:py-16 sm:px-8 md:px-12">
            <div className="mx-auto max-w-5xl">
              <Reveal delay={100}>
                <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/60">
                  Compliance &amp; Clinical Standards
                </p>
              </Reveal>
              <Reveal delay={180}>
                <h2 className="mt-4 font-serif text-3xl sm:text-4xl lg:text-5xl font-normal leading-tight tracking-tight text-white drop-shadow-lg">
                  Held to rigorous <span className="italic">clinical standards.</span>
                </h2>
              </Reveal>
              <Reveal delay={240}>
                <p className="mt-4 max-w-2xl text-xs sm:text-base leading-relaxed text-white/70">
                  Every clearance recommendation is structured around verified clinical guidelines, physiological cutoffs, and transparent audit logging.
                </p>
              </Reveal>
              <div className="mt-8 sm:mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    index: 'DHA §3060',
                    title: 'Statutory Attestation',
                    body: 'Designed in alignment with Dubai Health Authority non-device CDS governance frameworks.',
                  },
                  {
                    index: 'AUDIT',
                    title: 'Immutable Audit Log',
                    body: 'Every parameter inspection, override, and sign-off is recorded with timestamps and session context.',
                  },
                  {
                    index: 'DATA',
                    title: 'Sovereign Enclave',
                    body: 'Architected for local tenant isolation with no external training on sensitive patient health data.',
                  },
                  {
                    index: 'CUT-OFFS',
                    title: 'Published Thresholds',
                    body: 'K⁺ 3.5–5.1 · Hb ≥ 12 · Plt > 100k · INR < 1.4 · Standardized pre-op fasting parameters.',
                  },
                ].map((card, i) => (
                  <Reveal key={card.title} delay={260 + i * 100}>
                    <div className="flex h-full flex-col rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur-md">
                      <span className="font-mono text-[11px] tracking-[0.15em] text-sky-300 font-bold">
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
                  className="mt-8 flex items-center gap-1 rounded-full border border-sky-400/30 bg-sky-500/20 px-6 py-3 text-xs text-white backdrop-blur-md transition-colors duration-300 hover:bg-sky-500/30 sm:text-sm font-semibold"
                >
                  Open the OT Console
                  <ChevronRight size={14} />
                </button>
              </Reveal>
            </div>
          </section>

          {/* ── Closing Inquiries ── */}
          <section id="contact" className="scroll-mt-20 px-5 pb-20 pt-4 sm:px-8 md:px-12">
            <Reveal delay={120}>
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="font-serif text-3xl font-normal leading-tight tracking-tight text-white drop-shadow-lg sm:text-4xl">
                  Evaluate Veracity in your <span className="italic">theatre.</span>
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-white/80 drop-shadow-md sm:text-base">
                  Currently accepting clinical evaluation partners for our Private Beta program. Explore the interactive OT Console or test a sample pre-op intake.
                </p>
                <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={goConsole}
                    className="flex items-center gap-1 rounded-full bg-white px-6 py-3 text-xs font-semibold text-black transition-colors duration-300 hover:bg-white/85 sm:text-sm shadow-md"
                  >
                    Open OT Console
                    <ChevronRight size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setModal('QUESTIONNAIRE')}
                    className="rounded-full border border-white/25 bg-white/10 px-6 py-3 text-xs text-white backdrop-blur-md transition-colors duration-300 hover:bg-white/20 sm:text-sm font-medium"
                  >
                    Sample Pre-Op Intake
                  </button>
                </div>
              </div>
            </Reveal>
          </section>

          {/* ── Footer ── */}
          <footer className="border-t border-white/15 px-5 py-10 sm:px-8 md:px-12 bg-black/40">
            <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 md:flex-row">
              <div className="flex items-center gap-3">
                <a href="/" className="flex items-center gap-2.5">
                  <Hexagon size={20} strokeWidth={1.5} className="text-white" />
                  <span className="text-base font-medium tracking-tight text-white">veracity</span>
                </a>
                <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 font-mono text-[8.5px] text-white/70">
                  v2.5 Beta
                </span>
              </div>
              <nav className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2">
                {[
                  { label: 'Platform', href: '#pillars' },
                  { label: 'OT Economics', href: '#value-matrix' },
                  { label: 'Safety Specs', href: '#compliance' },
                  { label: 'Inquiries', href: '#contact' },
                  { label: 'OT Console', href: '/console' },
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
                © 2026 Veracity Healthcare
              </p>
            </div>

            {/* Prominent Regulatory & Legal Liability Disclaimer */}
            <div className="mx-auto max-w-5xl mt-8 p-4 rounded-xl border border-amber-400/30 bg-amber-950/20 backdrop-blur-md text-center">
              <div className="flex items-center justify-center gap-2 mb-1.5 text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span className="font-mono text-[10.5px] font-bold uppercase tracking-wider">
                  Regulatory Notice · Clinical Decision Support Evaluation
                </span>
              </div>
              <p className="text-xs text-white/80 leading-relaxed font-sans max-w-3xl mx-auto">
                FOR DEMONSTRATION &amp; CLINICAL DECISION SUPPORT EVALUATION ONLY. Not for primary diagnosis or autonomous medical decisions. All surgical clearances and medication directives require independent physician verification under applicable regulatory frameworks (DHA § 3060(a) CDS / MOHAP).
              </p>
            </div>
          </footer>
        </main>
      </div>

      {/* ── Working modals: our real intake + blood views ── */}
      {modal === 'QUESTIONNAIRE' && activePatient && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/70 p-2 sm:p-4 backdrop-blur-sm">
          <div className="relative my-4 sm:my-8 w-full max-w-4xl">
            <button
              type="button"
              onClick={() => setModal('NONE')}
              aria-label="Close"
              className="absolute top-2 right-2 sm:-right-3 sm:-top-3 z-20 flex h-10 w-10 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-white/20 bg-white text-slate-800 shadow-lg transition hover:bg-white/90 active:scale-95 cursor-pointer"
            >
              <X className="h-5 w-5 sm:h-4 sm:w-4" />
            </button>
            <PatientPreOpQuestionnaire patientId={activePatient.id} onClose={() => setModal('NONE')} />
          </div>
        </div>
      )}

      {modal === 'BLOOD' && activePatient && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/70 p-2 sm:p-4 backdrop-blur-sm">
          <div className="relative my-4 sm:my-8 w-full max-w-md">
            <button
              type="button"
              onClick={() => setModal('NONE')}
              aria-label="Close"
              className="absolute top-2 right-2 sm:-right-3 sm:-top-3 z-20 flex h-10 w-10 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-white/20 bg-white text-slate-800 shadow-lg transition hover:bg-white/90 active:scale-95 cursor-pointer"
            >
              <X className="h-5 w-5 sm:h-4 sm:w-4" />
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
