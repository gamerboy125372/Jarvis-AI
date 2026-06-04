import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const HEX_SIZE = 36;
const HEX_W = HEX_SIZE * 2;
const HEX_H = Math.sqrt(3) * HEX_SIZE;

function hexPoints(cx: number, cy: number, r: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(' ');
}

function HexGrid() {
  const hexes = useMemo(() => {
    const items: { cx: number; cy: number; key: string }[] = [];
    const cols = Math.ceil(1920 / (HEX_W * 0.75)) + 2;
    const rows = Math.ceil(1080 / HEX_H) + 2;
    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const cx = col * HEX_W * 0.75;
        const cy = row * HEX_H + (col % 2 === 0 ? 0 : HEX_H / 2);
        items.push({ cx, cy, key: `${row}-${col}` });
      }
    }
    return items;
  }, []);

  return (
    <svg
      className="absolute inset-0 w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity: 0.06 }}
    >
      {hexes.map(({ cx, cy, key }) => (
        <polygon
          key={key}
          points={hexPoints(cx, cy, HEX_SIZE - 1)}
          fill="none"
          stroke="#00d4ff"
          strokeWidth="0.7"
        />
      ))}
    </svg>
  );
}

export function BackgroundFX() {
  const dataStreams = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: 5 + i * 13,
      duration: 4 + Math.random() * 6,
      delay: Math.random() * 4,
      opacity: 0.03 + Math.random() * 0.07,
    })), []);

  const floatingDots = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: 8 + Math.random() * 12,
      delay: Math.random() * 6,
    })), []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Deep atmospheric gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 50%, #020d1f 0%, #010a18 40%, #000508 100%)',
        }}
      />

      {/* Vignette edges */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 120% 120% at 50% 50%, transparent 40%, #000000cc 100%)',
        }}
      />

      {/* Hex grid */}
      <HexGrid />

      {/* Vertical data streams */}
      {dataStreams.map((s) => (
        <motion.div
          key={s.id}
          className="absolute top-0 bottom-0 w-px"
          style={{
            left: `${s.x}%`,
            background: 'linear-gradient(to bottom, transparent 0%, #00d4ff 40%, #00d4ff 60%, transparent 100%)',
            opacity: s.opacity,
          }}
          animate={{ y: ['-100%', '100%'] }}
          transition={{
            duration: s.duration,
            repeat: Infinity,
            ease: 'linear',
            delay: s.delay,
          }}
        />
      ))}

      {/* Horizontal scan line */}
      <motion.div
        className="absolute left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(to right, transparent 0%, #00d4ff33 20%, #00d4ff66 50%, #00d4ff33 80%, transparent 100%)',
        }}
        animate={{ y: ['-10px', '100vh'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(to right, transparent 0%, #00d4ff22 20%, #00d4ff44 50%, #00d4ff22 80%, transparent 100%)',
        }}
        animate={{ y: ['-10px', '100vh'] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear', delay: 5 }}
      />

      {/* Ambient glow blobs */}
      <div
        className="absolute"
        style={{
          left: '15%', top: '20%',
          width: 400, height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,100,200,0.06) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        className="absolute"
        style={{
          right: '15%', bottom: '20%',
          width: 300, height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,180,255,0.05) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Floating micro-particles */}
      {floatingDots.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: 2,
            height: 2,
            background: '#00d4ff',
          }}
          animate={{
            x: [(Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60],
            y: [(Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60],
            opacity: [0, 0.6, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            repeatType: 'reverse',
            delay: p.delay,
          }}
        />
      ))}

      {/* CRT scanlines overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
