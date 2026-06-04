import React from 'react';
import { motion } from 'framer-motion';
import { useJarvisStore } from '../../store/jarvisStore';

function CornerBracket({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const size = 32;
  const thickness = 2;
  const color = '#00d4ff';
  const glow = `drop-shadow(0 0 4px ${color})`;

  const tl = pos === 'tl';
  const tr = pos === 'tr';
  const bl = pos === 'bl';
  const br = pos === 'br';

  const style: React.CSSProperties = {
    position: 'absolute',
    ...(tl ? { top: 0, left: 0 } : {}),
    ...(tr ? { top: 0, right: 0 } : {}),
    ...(bl ? { bottom: 0, left: 0 } : {}),
    ...(br ? { bottom: 0, right: 0 } : {}),
    width: size + 4,
    height: size + 4,
    filter: glow,
  };

  const hFlip = tr || br;
  const vFlip = bl || br;

  return (
    <div style={style}>
      <svg
        width={size + 4}
        height={size + 4}
        viewBox={`0 0 ${size + 4} ${size + 4}`}
        style={{
          transform: `scale(${hFlip ? -1 : 1}, ${vFlip ? -1 : 1})`,
        }}
      >
        <path
          d={`M2,${size + 2} L2,2 L${size + 2},2`}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="square"
        />
        <line x1="2" y1="2" x2="10" y2="2" stroke="#ffffff" strokeWidth={thickness} strokeLinecap="square" opacity={0.5} />
        <line x1="2" y1="2" x2="2" y2="10" stroke="#ffffff" strokeWidth={thickness} strokeLinecap="square" opacity={0.5} />
      </svg>
    </div>
  );
}

function TopBar() {
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour12: false });
  const date = now.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });

  const [displayTime, setDisplayTime] = React.useState(time);
  React.useEffect(() => {
    const iv = setInterval(() => {
      setDisplayTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-8 flex items-center justify-between px-6 font-mono text-[10px] tracking-widest uppercase"
      style={{ zIndex: 50, color: '#00d4ff99', borderBottom: '1px solid #00d4ff15' }}>
      <div className="flex items-center gap-6">
        <span className="text-[#00d4ff]">STARK INDUSTRIES</span>
        <span>MARK // VII</span>
        <span>SUIT DIAGNOSTICS</span>
      </div>
      <div className="flex items-center gap-6">
        <span>SYS: NOMINAL</span>
        <span>LAT: 40.7128°N · LON: 74.0060°W</span>
        <span className="text-[#00d4ff]">{displayTime}</span>
        <span>{date}</span>
      </div>
    </div>
  );
}

function BottomBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-6 flex items-center justify-between px-6 font-mono text-[9px] tracking-widest uppercase"
      style={{ zIndex: 50, color: '#00d4ff40', borderTop: '1px solid #00d4ff10' }}>
      <div className="flex items-center gap-6">
        <span>NEURAL LINK: ACTIVE</span>
        <span>ENCRYPTION: AES-2048</span>
        <span>UPLINK: SECURE</span>
      </div>
      <div className="flex items-center gap-6">
        <span>REACTOR OUTPUT: 3.0 GJ</span>
        <span>POWER: 97%</span>
        <span>JARVIS AI v4.2.1</span>
      </div>
    </div>
  );
}

function CrosshairCenter() {
  return (
    <div
      className="fixed pointer-events-none"
      style={{
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 500,
        height: 500,
        zIndex: 10,
      }}
    >
      {/* 4 corner markers */}
      {[
        { top: 0, left: 0, deg: 0 },
        { top: 0, right: 0, deg: 90 },
        { bottom: 0, right: 0, deg: 180 },
        { bottom: 0, left: 0, deg: 270 },
      ].map(({ deg, ...pos }, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            ...pos,
            width: 20,
            height: 20,
            transform: `rotate(${deg}deg)`,
            borderTop: '1px solid #00d4ff55',
            borderLeft: '1px solid #00d4ff55',
          }}
        />
      ))}

      {/* Crosshair lines */}
      <div className="absolute top-1/2 left-0 right-0 h-px" style={{ background: 'linear-gradient(to right, transparent, #00d4ff22 30%, #00d4ff22 70%, transparent)' }} />
      <div className="absolute left-1/2 top-0 bottom-0 w-px" style={{ background: 'linear-gradient(to bottom, transparent, #00d4ff22 30%, #00d4ff22 70%, transparent)' }} />
    </div>
  );
}

export function HudOverlay() {
  return (
    <>
      <TopBar />
      <BottomBar />
      <CrosshairCenter />

      {/* Screen corner brackets */}
      <div className="fixed inset-4 pointer-events-none" style={{ zIndex: 50 }}>
        <CornerBracket pos="tl" />
        <CornerBracket pos="tr" />
        <CornerBracket pos="bl" />
        <CornerBracket pos="br" />
      </div>

      {/* Vertical center guide lines */}
      <div className="fixed left-1/2 top-8 bottom-6 w-px pointer-events-none" style={{ zIndex: 5, background: 'linear-gradient(to bottom, transparent, #00d4ff08 20%, #00d4ff08 80%, transparent)' }} />
      <div className="fixed top-1/2 left-4 right-4 h-px pointer-events-none" style={{ zIndex: 5, background: 'linear-gradient(to right, transparent, #00d4ff06 20%, #00d4ff06 80%, transparent)' }} />
    </>
  );
}
