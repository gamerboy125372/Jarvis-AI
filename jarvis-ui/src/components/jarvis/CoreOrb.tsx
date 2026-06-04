import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimationFrame } from 'framer-motion';
import { useJarvisStore } from '../../store/jarvisStore';

const TAU = Math.PI * 2;

function ArcRing({
  r,
  dashArray,
  dashOffset,
  color = '#00d4ff',
  opacity = 1,
  strokeWidth = 1,
  rotate = 0,
  blur = false,
}: {
  r: number;
  dashArray: string;
  dashOffset?: number;
  color?: string;
  opacity?: number;
  strokeWidth?: number;
  rotate?: number;
  blur?: boolean;
}) {
  const SIZE = 500;
  const cx = SIZE / 2;
  return (
    <circle
      cx={cx}
      cy={cx}
      r={r}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeDasharray={dashArray}
      strokeDashoffset={dashOffset}
      opacity={opacity}
      style={{
        transformOrigin: `${cx}px ${cx}px`,
        transform: `rotate(${rotate}deg)`,
        filter: blur ? `drop-shadow(0 0 4px ${color})` : undefined,
      }}
    />
  );
}

export function CoreOrb() {
  const { state } = useJarvisStore();
  const [tick, setTick] = useState(0);
  const t = useRef(0);

  useAnimationFrame((_, delta) => {
    t.current += delta / 1000;
    setTick(t.current);
  });

  const isActive = state !== 'idle';
  const isListening = state === 'listening';
  const isSpeaking = state === 'speaking';
  const isProcessing = state === 'processing' || state === 'executing';

  const baseSpeed = isActive ? 1.4 : 0.5;
  const pulseScale = isListening ? 1 + Math.sin(t.current * 6) * 0.04 :
    isSpeaking ? 1 + Math.sin(t.current * 12) * 0.06 : 1;

  const ring1Angle = t.current * 45 * (isProcessing ? 2.5 : 1);
  const ring2Angle = -(t.current * 30 * (isProcessing ? 2 : 1));
  const ring3Angle = t.current * 20;
  const ring4Angle = -(t.current * 15);
  const ring5Angle = t.current * 60 * baseSpeed;
  const ring6Angle = -(t.current * 80 * baseSpeed);

  const SIZE = 500;
  const cx = SIZE / 2;

  const innerGlowOpacity = isListening ? 0.7 + Math.sin(t.current * 4) * 0.2 :
    isSpeaking ? 0.6 + Math.sin(t.current * 10) * 0.3 :
      isProcessing ? 0.5 + Math.sin(t.current * 8) * 0.2 : 0.3;

  const coreColor = isListening ? '#00ff88' : isSpeaking ? '#00d4ff' : isProcessing ? '#00aaff' : '#00d4ff';

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        top: '50%',
        left: '50%',
        width: SIZE,
        height: SIZE,
        transform: `translate(-50%, -50%) scale(${pulseScale})`,
        transition: 'transform 0.1s ease-out',
      }}
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ overflow: 'visible' }}
      >
        <defs>
          <radialGradient id="coreGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={coreColor} stopOpacity="0.9" />
            <stop offset="30%" stopColor={coreColor} stopOpacity="0.4" />
            <stop offset="60%" stopColor={coreColor} stopOpacity="0.1" />
            <stop offset="100%" stopColor={coreColor} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="innerCore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="20%" stopColor={coreColor} stopOpacity="1" />
            <stop offset="60%" stopColor={coreColor} stopOpacity="0.6" />
            <stop offset="100%" stopColor={coreColor} stopOpacity="0" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="strongGlow">
            <feGaussianBlur stdDeviation="8" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="ringClip185">
            <circle cx={cx} cy={cx} r={186} />
          </clipPath>
        </defs>

        {/* Outer ambient glow */}
        <circle cx={cx} cy={cx} r={210}
          fill="none" stroke={coreColor} strokeWidth={40}
          opacity={0.03}
          style={{ filter: 'blur(20px)' }}
        />

        {/* Ring 220 — slow outer orbit dashes */}
        <ArcRing r={210} dashArray="4 20" rotate={ring3Angle}
          color={coreColor} opacity={0.25} strokeWidth={0.8} />
        <ArcRing r={210} dashArray="2 60" rotate={-ring3Angle * 0.7}
          color={coreColor} opacity={0.15} strokeWidth={0.5} />

        {/* Ring 195 — medium arcs */}
        <ArcRing r={193} dashArray="80 20 30 70" rotate={ring4Angle}
          color={coreColor} opacity={0.5} strokeWidth={1} blur />

        {/* Tick marks at 185 */}
        {Array.from({ length: 60 }, (_, i) => {
          const angle = (i / 60) * TAU + (t.current * 0.3);
          const inner = i % 5 === 0 ? 168 : 173;
          const outer = 178;
          const x1 = cx + inner * Math.cos(angle);
          const y1 = cx + inner * Math.sin(angle);
          const x2 = cx + outer * Math.cos(angle);
          const y2 = cx + outer * Math.sin(angle);
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={coreColor}
              strokeWidth={i % 5 === 0 ? 1.5 : 0.7}
              opacity={i % 5 === 0 ? 0.7 : 0.3}
            />
          );
        })}

        {/* Ring 165 — fast rotating bold arc */}
        <ArcRing r={163} dashArray="120 20 40 80" rotate={ring2Angle}
          color={coreColor} opacity={0.7} strokeWidth={1.5} blur />
        <ArcRing r={163} dashArray="20 240" rotate={ring1Angle * 0.5}
          color={coreColor} opacity={0.4} strokeWidth={0.5} />

        {/* Inner solid ring */}
        <circle cx={cx} cy={cx} r={148} fill="none" stroke={coreColor}
          strokeWidth={0.5} opacity={0.3} />

        {/* Spinning segmented ring 140 */}
        <ArcRing r={140} dashArray="6 4" rotate={ring5Angle}
          color={coreColor} opacity={0.5} strokeWidth={1.2} />
        <ArcRing r={140} dashArray="3 11" rotate={ring6Angle}
          color="#ffffff" opacity={0.12} strokeWidth={0.8} />

        {/* Inner geometric — hexagon-ish triangle pattern */}
        {Array.from({ length: 6 }, (_, i) => {
          const a1 = (i / 6) * TAU + t.current * 0.4;
          const a2 = ((i + 1) / 6) * TAU + t.current * 0.4;
          const R = 115;
          const x1 = cx + R * Math.cos(a1);
          const y1 = cx + R * Math.sin(a1);
          const x2 = cx + R * Math.cos(a2);
          const y2 = cx + R * Math.sin(a2);
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={coreColor} strokeWidth={0.8} opacity={0.4} />
          );
        })}
        {Array.from({ length: 6 }, (_, i) => {
          const a1 = (i / 6) * TAU - t.current * 0.6;
          const a2 = ((i + 2) / 6) * TAU - t.current * 0.6;
          const R = 100;
          const x1 = cx + R * Math.cos(a1);
          const y1 = cx + R * Math.sin(a1);
          const x2 = cx + R * Math.cos(a2);
          const y2 = cx + R * Math.sin(a2);
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={coreColor} strokeWidth={0.6} opacity={0.25} />
          );
        })}

        {/* Ring 90 - counter-rotating */}
        <ArcRing r={88} dashArray="60 130" rotate={ring1Angle * 1.2}
          color={coreColor} opacity={0.6} strokeWidth={1.5} blur />
        <ArcRing r={88} dashArray="10 60" rotate={-ring1Angle}
          color="#ffffff" opacity={0.2} strokeWidth={0.8} />

        {/* Middle glow ring */}
        <circle cx={cx} cy={cx} r={75} fill="none" stroke={coreColor}
          strokeWidth={1} opacity={0.3} />

        {/* Core glow area */}
        <circle cx={cx} cy={cx} r={65} fill="url(#coreGrad)"
          opacity={innerGlowOpacity}
          style={{ filter: `drop-shadow(0 0 16px ${coreColor})` }}
        />

        {/* Fast inner spinning ring */}
        <ArcRing r={58} dashArray="4 8" rotate={ring5Angle * 1.5}
          color={coreColor} opacity={0.8} strokeWidth={1} />

        {/* Inner bright ring */}
        <circle cx={cx} cy={cx} r={48} fill="none" stroke={coreColor}
          strokeWidth={1.5} opacity={0.9}
          style={{ filter: `drop-shadow(0 0 6px ${coreColor})` }}
        />

        {/* Arc reactor triangle segments inside 48 */}
        {Array.from({ length: 3 }, (_, i) => {
          const a = (i / 3) * TAU + t.current * 0.8;
          const x = cx + 30 * Math.cos(a);
          const y = cx + 30 * Math.sin(a);
          return (
            <circle key={i} cx={x} cy={y} r={5}
              fill={coreColor} opacity={0.8}
              style={{ filter: `drop-shadow(0 0 4px ${coreColor})` }}
            />
          );
        })}
        {Array.from({ length: 3 }, (_, i) => {
          const a = (i / 3) * TAU - t.current * 1.2 + Math.PI / 3;
          const x = cx + 20 * Math.cos(a);
          const y = cx + 20 * Math.sin(a);
          return (
            <circle key={i} cx={x} cy={y} r={3}
              fill="#ffffff" opacity={0.6}
            />
          );
        })}

        {/* Arc reactor core */}
        <circle cx={cx} cy={cx} r={14}
          fill="url(#innerCore)"
          style={{ filter: `drop-shadow(0 0 12px ${coreColor}) drop-shadow(0 0 24px ${coreColor})` }}
        />
        <circle cx={cx} cy={cx} r={7}
          fill="#ffffff"
          opacity={0.95}
          style={{ filter: 'blur(1px)' }}
        />

        {/* State indicator arcs at bottom */}
        <ArcRing r={232} dashArray="30 470" rotate={-90 + t.current * 5}
          color={isListening ? '#00ff88' : isProcessing ? '#ffaa00' : coreColor}
          opacity={isActive ? 0.9 : 0} strokeWidth={2} blur />
      </svg>
    </div>
  );
}
