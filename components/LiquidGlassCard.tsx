'use client';

import React, { useEffect, useRef } from 'react';

interface LiquidGlassCardProps {
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  className?: string;
  onOpenStandaloneDemo?: () => void;
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  videoRef,
  className = '',
  onOpenStandaloneDemo,
}) => {
  const cardRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animId: number;
    let fallbackPhase = 0;
    const card = cardRef.current;
    const container = containerRef.current;
    const canvas = canvasRef.current;

    if (!card || !container || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const DUP_PIXEL_RATIO = 1;

    // Draw procedural emerald fluid gradient if video is loading or in headless/codec-constrained mode
    const drawFluidBackdrop = (w: number, h: number, time: number) => {
      // Base deep forest gradient
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#133527');
      grad.addColorStop(0.35, '#1b3b2b');
      grad.addColorStop(0.7, '#0f291e');
      grad.addColorStop(1, '#081710');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Organic moving light pool 1
      const x1 = w * (0.5 + 0.3 * Math.sin(time * 0.7));
      const y1 = h * (0.4 + 0.25 * Math.cos(time * 0.9));
      const r1 = Math.max(w, h) * 0.55;
      const rad1 = ctx.createRadialGradient(x1, y1, 10, x1, y1, r1);
      rad1.addColorStop(0, 'rgba(74, 222, 128, 0.45)');
      rad1.addColorStop(0.4, 'rgba(34, 197, 94, 0.25)');
      rad1.addColorStop(0.8, 'rgba(16, 185, 129, 0.08)');
      rad1.addColorStop(1, 'rgba(5, 46, 22, 0)');
      ctx.fillStyle = rad1;
      ctx.fillRect(0, 0, w, h);

      // Organic moving light pool 2
      const x2 = w * (0.35 + 0.28 * Math.cos(time * 0.8));
      const y2 = h * (0.65 + 0.22 * Math.sin(time * 0.6));
      const r2 = Math.max(w, h) * 0.6;
      const rad2 = ctx.createRadialGradient(x2, y2, 20, x2, y2, r2);
      rad2.addColorStop(0, 'rgba(167, 243, 208, 0.35)');
      rad2.addColorStop(0.5, 'rgba(52, 211, 153, 0.15)');
      rad2.addColorStop(1, 'rgba(6, 78, 59, 0)');
      ctx.fillStyle = rad2;
      ctx.fillRect(0, 0, w, h);
    };

    const render = () => {
      animId = requestAnimationFrame(render);
      fallbackPhase += 0.02;

      const video = videoRef?.current || (document.getElementById('bg-video') as HTMLVideoElement | null);

      const rect = card.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const vRect = video ? video.getBoundingClientRect() : null;
      const vw = vRect && vRect.width > 0 ? vRect.width : document.documentElement.clientWidth;
      const vh = vRect && vRect.height > 0 ? vRect.height : document.documentElement.clientHeight;
      const vLeft = vRect && vRect.width > 0 ? vRect.left : 0;
      const vTop = vRect && vRect.height > 0 ? vRect.top : 0;

      container.style.left = `${vLeft - rect.left}px`;
      container.style.top = `${vTop - rect.top}px`;
      container.style.width = `${vw}px`;
      container.style.height = `${vh}px`;

      const w = Math.round(vw * DUP_PIXEL_RATIO);
      const h = Math.round(vh * DUP_PIXEL_RATIO);

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      let videoDrawn = false;
      if (video && video.videoWidth > 0 && video.videoHeight > 0 && video.readyState >= 2) {
        try {
          const cover = Math.max(vw / video.videoWidth, vh / video.videoHeight);
          const sw = vw / cover;
          const sh = vh / cover;
          const sx = (video.videoWidth - sw) / 2;
          const sy = (video.videoHeight - sh) / 2;
          ctx.drawImage(video, sx, sy, sw, sh, 0, 0, w, h);
          videoDrawn = true;
        } catch {
          videoDrawn = false;
        }
      }

      if (!videoDrawn) {
        drawFluidBackdrop(w, h, fallbackPhase);
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [videoRef]);

  return (
    <>
      {/* SVG Defs for Real-time Refraction & Chromatic Dispersion */}
      <svg
        className="glass-defs"
        width="0"
        height="0"
        aria-hidden="true"
        focusable="false"
        style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}
      >
        <defs>
          <filter
            id="liquid-glass-refraction"
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.015" numOctaves={3} result="noise" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              result="boosted_alpha"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 100 0"
            />
            <feGaussianBlur in="boosted_alpha" stdDeviation="45" result="blurred_alpha" />
            <feComponentTransfer in="blurred_alpha" result="edge_mask">
              <feFuncA type="linear" slope="-1.3" intercept="1" />
            </feComponentTransfer>
            <feComposite in="noise" in2="edge_mask" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="masked_noise" />

            {/* Chromatic dispersion: one displacement pass per channel */}
            <feDisplacementMap
              in="SourceGraphic"
              in2="masked_noise"
              scale="65"
              xChannelSelector="R"
              yChannelSelector="G"
              result="red_displaced"
            />
            <feColorMatrix
              in="red_displaced"
              type="matrix"
              result="red"
              values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"
            />

            <feDisplacementMap
              in="SourceGraphic"
              in2="masked_noise"
              scale="56"
              xChannelSelector="R"
              yChannelSelector="G"
              result="green_displaced"
            />
            <feColorMatrix
              in="green_displaced"
              type="matrix"
              result="green"
              values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0"
            />

            <feDisplacementMap
              in="SourceGraphic"
              in2="masked_noise"
              scale="47"
              xChannelSelector="R"
              yChannelSelector="G"
              result="blue_displaced"
            />
            <feColorMatrix
              in="blue_displaced"
              type="matrix"
              result="blue"
              values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0"
            />

            <feBlend in="red" in2="green" mode="screen" result="rg" />
            <feBlend in="rg" in2="blue" mode="screen" result="chromatic_dispersion" />
          </filter>
        </defs>
      </svg>

      {/* Terranova Liquid Glass Card */}
      <aside
        ref={cardRef}
        className={`card group terranova-card ${className}`}
        data-glass-card
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '340px',
          maxWidth: '100%',
          height: '460px',
          padding: '2rem',
          borderRadius: '48px',
          overflow: 'hidden',
          background: 'transparent',
          border: '1px solid rgba(47, 47, 47, 0.15)',
          pointerEvents: 'auto',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.12)',
        }}
      >
        {/* Full-viewport-aligned copy of the backdrop with SVG refraction filter */}
        <div
          ref={containerRef}
          id="dup-video-container"
          className="dup-video-container"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            zIndex: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          <canvas
            ref={canvasRef}
            id="dup-image"
            className="dup-image"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              filter: 'url(#liquid-glass-refraction)',
            }}
          />
        </div>

        {/* Frosted Sheen Layer */}
        <div
          className="card__frost terranova-card__frost"
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            borderRadius: '48px',
            pointerEvents: 'none',
            background: 'rgba(255, 255, 255, 0.05)',
            boxShadow: 'inset 0 1.5px 2px rgba(255, 255, 255, 0.3), inset 0 -1px 2px rgba(0, 0, 0, 0.15)',
            transition: 'background 400ms',
          }}
        />

        {/* Card Header */}
        <div
          className="card__head terranova-card__head"
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: '1rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
          }}
        >
          <div className="flex items-center gap-2">
            <h2
              className="card__title terranova-card__title"
              style={{
                fontSize: '1.25rem',
                fontWeight: 500,
                letterSpacing: '-0.025em',
                color: '#000000',
                fontFamily: "'Helvetica Neue Light', 'Helvetica Neue', Helvetica, Arial, sans-serif",
              }}
            >
              Latest findings
            </h2>
          </div>
          <span
            className="card__index terranova-card__index"
            style={{
              fontSize: '0.75rem',
              color: 'rgba(0, 0, 0, 0.45)',
              fontFamily: 'monospace',
            }}
          >
            {'//02'}
          </span>
        </div>

        {/* Card Body */}
        <div
          className="card__body terranova-card__body"
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            marginTop: '1rem',
          }}
        >
          <div className="finding">
            <h3
              className="finding__title terranova-finding__title"
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                letterSpacing: '-0.025em',
                color: '#000000',
                fontFamily: "'Helvetica Neue Light', 'Helvetica Neue', Helvetica, Arial, sans-serif",
              }}
            >
              Canopy Pulse Analysis 09.17
            </h3>
            <p
              className="finding__text terranova-finding__text"
              style={{
                marginTop: '0.375rem',
                fontSize: '0.875rem',
                lineHeight: 1.625,
                color: 'rgba(0, 0, 0, 0.65)',
                fontFamily: "'Helvetica Neue Light', 'Helvetica Neue', Helvetica, Arial, sans-serif",
              }}
            >
              Identified harmonic oscillation links between root mycelia networks and surrounding atmospheric moisture.
            </p>
          </div>

          <div className="finding">
            <h3
              className="finding__title terranova-finding__title"
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                letterSpacing: '-0.025em',
                color: '#000000',
                fontFamily: "'Helvetica Neue Light', 'Helvetica Neue', Helvetica, Arial, sans-serif",
              }}
            >
              Watershed Harmonic Index 11.06
            </h3>
            <p
              className="finding__text terranova-finding__text"
              style={{
                marginTop: '0.375rem',
                fontSize: '0.875rem',
                lineHeight: 1.625,
                color: 'rgba(0, 0, 0, 0.65)',
                fontFamily: "'Helvetica Neue Light', 'Helvetica Neue', Helvetica, Arial, sans-serif",
              }}
            >
              Forecasting framework for ecosystem regeneration spanning six continents using over 2,400 sensor arrays.
            </p>
          </div>
        </div>

        {/* SVG Waveform Line */}
        <div style={{ position: 'relative', zIndex: 2, marginTop: '1.25rem' }}>
          <svg
            className="card__wave terranova-card__wave"
            viewBox="0 0 220 50"
            fill="none"
            aria-hidden="true"
            style={{
              display: 'block',
              width: '100%',
              height: 'auto',
            }}
          >
            <path
              d="M0 30 C10 30 12 45 18 45 C24 45 26 10 34 10 C42 10 44 40 52 40 C60 40 62 5 70 5 C78 5 80 42 88 42 C96 42 98 15 106 15 C114 15 116 38 124 38 C132 38 134 20 142 20 C150 20 152 35 160 35 C168 35 170 22 178 22 C186 22 188 32 196 32 C204 32 210 28 220 28"
              stroke="#000000"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>
      </aside>
    </>
  );
};

export default LiquidGlassCard;
