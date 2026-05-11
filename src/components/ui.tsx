import React, { useRef, useEffect, useState } from 'react';

/* Specular mouse-tracking glass card */
export function GlassCard({
  className = '',
  children,
  strong = false,
  style,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { strong?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={`glass glass-spec ${strong ? 'glass-strong' : ''} ${className}`}
      style={style}
      {...rest}
    >
      {children}
    </div>
  );
}

/* Animated counting number */
export function AnimatedNumber({
  value,
  decimals = 0,
  duration = 900,
  prefix = '',
  suffix = '',
}: {
  value: number;
  decimals?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const tRef = useRef<number | null>(null);

  useEffect(() => {
    if (tRef.current) cancelAnimationFrame(tRef.current);
    const start = performance.now();
    const from = fromRef.current;
    const to = value;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * e);
      if (t < 1) tRef.current = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    tRef.current = requestAnimationFrame(tick);
    return () => { if (tRef.current) cancelAnimationFrame(tRef.current); };
  }, [value, duration]);

  const formatted = display.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return <span className="ticker-digit">{prefix}{formatted}{suffix}</span>;
}

/* Sparkline SVG with draw animation */
export function Sparkline({
  data,
  width = 320,
  height = 90,
  stroke = 'var(--mint)',
  fill = true,
  animateKey,
}: {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: boolean;
  animateKey?: string | number;
}) {
  if (!data.length) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const range = Math.max(1, max - min);
  const dx = width / Math.max(1, data.length - 1);
  const pts = data.map((v, i) => [i * dx, height - ((v - min) / range) * (height - 8) - 4] as [number, number]);
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');
  const area = `${path} L${width},${height} L0,${height} Z`;
  const len = 1400;
  const gradId = `spark-fill-${animateKey ?? 'x'}`;
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${gradId})`} opacity="0.9" />}
      <path
        key={animateKey}
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={len}
        strokeDashoffset={len}
        style={{ animation: 'draw 1.4s var(--ease-spring) forwards' }}
      />
    </svg>
  );
}

/* Donut chart */
export function Donut({
  segments,
  size = 140,
  thickness = 14,
}: {
  segments: Array<{ value: number; color: string; label?: string }>;
  size?: number;
  thickness?: number;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={thickness} />
      {segments.map((s, i) => {
        const frac = s.value / total;
        const dash = frac * c;
        const offset = -(acc * 1);
        acc += dash;
        return (
          <circle
            key={i}
            cx={size/2} cy={size/2} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            strokeDasharray={`${dash} ${c - dash}`}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size/2} ${size/2})`}
            strokeLinecap="butt"
            style={{ transition: 'stroke-dasharray 1s var(--ease-spring)' }}
          />
        );
      })}
    </svg>
  );
}

/* Liquid progress bar */
export function LiquidBar({ pct, color = 'var(--mint)' }: { pct: number; color?: string }) {
  return (
    <div style={{ position: 'relative', height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        width: `${Math.min(100, Math.max(0, pct))}%`,
        background: `linear-gradient(90deg, ${color}, color-mix(in oklab, ${color} 60%, white))`,
        borderRadius: 999,
        transition: 'width 1.1s var(--ease-spring)',
        boxShadow: `0 0 18px -2px ${color}`,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)',
          mixBlendMode: 'overlay',
          animation: 'shimmer 2.6s linear infinite',
          backgroundSize: '200% 100%',
        }} />
      </div>
    </div>
  );
}
