import React, { useEffect, useState } from 'react';
import { useJarvisStore } from '../../store/jarvisStore';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

function RadarGauge({ value, label, color = '#00d4ff' }: { value: number; label: string; color?: string }) {
  const r = 36;
  const stroke = 7;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ * 0.75;
  const gap = circ - dash;
  const rotation = -135;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: 90, height: 90 }}>
        <svg width={90} height={90} viewBox="0 0 90 90">
          {/* Track */}
          <circle
            cx={45} cy={45} r={r}
            fill="none"
            stroke="#00d4ff15"
            strokeWidth={stroke}
            strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
            strokeLinecap="round"
            style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '45px 45px' }}
          />
          {/* Fill */}
          <circle
            cx={45} cy={45} r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeLinecap="round"
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: '45px 45px',
              filter: `drop-shadow(0 0 4px ${color})`,
              transition: 'stroke-dasharray 0.5s ease',
            }}
          />
          {/* Tick marks */}
          {Array.from({ length: 11 }, (_, i) => {
            const ang = (-135 + i * 27) * (Math.PI / 180);
            const inner = 26;
            const outer = i % 5 === 0 ? 22 : 24;
            return (
              <line key={i}
                x1={45 + inner * Math.cos(ang)} y1={45 + inner * Math.sin(ang)}
                x2={45 + outer * Math.cos(ang)} y2={45 + outer * Math.sin(ang)}
                stroke={color} strokeWidth={i % 5 === 0 ? 1.5 : 0.8} opacity={0.4}
              />
            );
          })}
          {/* Value */}
          <text x={45} y={49} textAnchor="middle" fill={color}
            fontSize={14} fontFamily="monospace" fontWeight="bold">
            {Math.round(value)}%
          </text>
        </svg>
      </div>
      <div className="text-[9px] tracking-widest uppercase font-mono" style={{ color: `${color}99` }}>{label}</div>
    </div>
  );
}

function ProcessBar({ name, pid, cpu }: { name: string; pid: number; cpu: number }) {
  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-[#00d4ff] opacity-70" />
          <span className="text-[10px] font-mono tracking-wide" style={{ color: '#00d4ffcc' }}>{name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono" style={{ color: '#00d4ff55' }}>PID:{pid}</span>
          <span className="text-[10px] font-mono font-bold" style={{ color: '#00d4ffaa' }}>{cpu.toFixed(1)}%</span>
        </div>
      </div>
      <div className="h-[3px] w-full rounded-full overflow-hidden" style={{ background: '#00d4ff10' }}>
        <motion.div
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(to right, #00d4ff, #00aaff)`,
            boxShadow: '0 0 6px #00d4ff',
            width: `${Math.min(100, cpu)}%`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, cpu)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

const STATE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  idle: { label: 'STANDBY', color: '#4488ff', bg: '#4488ff15' },
  listening: { label: 'LISTENING', color: '#00ff88', bg: '#00ff8815' },
  processing: { label: 'PROCESSING', color: '#ffaa00', bg: '#ffaa0015' },
  executing: { label: 'EXECUTING', color: '#ff6600', bg: '#ff660015' },
  speaking: { label: 'RESPONDING', color: '#00d4ff', bg: '#00d4ff15' },
};

export function LeftSystemPanel() {
  const { state, cpuUsage, memoryUsage, aiResponse } = useJarvisStore();
  const [showResponse, setShowResponse] = useState(false);
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setCounter(c => c + 1), 100);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (aiResponse) {
      setShowResponse(true);
      const timer = setTimeout(() => setShowResponse(false), 8000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [aiResponse]);

  const cpuData = cpuUsage.map((val, i) => ({ i, v: val }));
  const memData = memoryUsage.map((val, i) => ({ i, v: val }));
  const currentCpu = Math.round(cpuUsage[cpuUsage.length - 1] || 0);
  const currentMem = Math.round(memoryUsage[memoryUsage.length - 1] || 0);
  const cfg = STATE_CONFIG[state] || STATE_CONFIG.idle;

  const fakeProcesses = [
    { name: 'jarvis-core', pid: 7890, cpu: 45.2 },
    { name: 'llm-engine', pid: 8823, cpu: 89.9 },
    { name: 'threat-scan', pid: 9912, cpu: 12.5 },
    { name: 'neural-net', pid: 3344, cpu: 34.1 },
    { name: 'sensor-array', pid: 1122, cpu: 8.7 },
  ];

  return (
    <div
      className="fixed flex flex-col font-mono"
      style={{
        left: 20, top: 36, bottom: 32,
        width: 272,
        background: 'linear-gradient(135deg, #020d1fee 0%, #010918ee 100%)',
        border: '1px solid #00d4ff25',
        borderTop: '1px solid #00d4ff40',
        borderLeft: '1px solid #00d4ff40',
        clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)',
        boxShadow: '0 0 30px rgba(0,212,255,0.05), inset 0 0 50px rgba(0,212,255,0.02)',
        padding: '16px 16px 16px 16px',
        zIndex: 20,
      }}
      data-testid="left-panel"
    >
      {/* Cut corner indicator */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 0, height: 0,
        borderStyle: 'solid',
        borderWidth: '0 20px 20px 0',
        borderColor: `transparent #00d4ff40 transparent transparent`,
      }} />

      {/* Header */}
      <div className="mb-4 pb-3" style={{ borderBottom: '1px solid #00d4ff20' }}>
        <div className="flex items-center justify-between mb-1">
          <div className="text-[9px] tracking-[0.3em] uppercase" style={{ color: '#00d4ff55' }}>
            UNIT // SYS-01
          </div>
          <div className="flex items-center gap-1.5">
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: '#00ff88', boxShadow: '0 0 6px #00ff88' }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-[9px]" style={{ color: '#00ff8888' }}>ONLINE</span>
          </div>
        </div>
        <div className="text-[15px] font-bold tracking-[0.15em] uppercase" style={{ color: '#00d4ff' }}>
          JARVIS CORE
        </div>
        <div className="text-[9px] tracking-widest mt-0.5" style={{ color: '#00d4ff40' }}>
          J.A.R.V.I.S v4.2.1 — ACTIVE
        </div>
      </div>

      {/* System State */}
      <div className="mb-4">
        <div className="text-[9px] tracking-[0.3em] uppercase mb-2" style={{ color: '#00d4ff40' }}>
          SYS STATE
        </div>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-sm"
          style={{
            background: cfg.bg,
            border: `1px solid ${cfg.color}30`,
            boxShadow: `0 0 10px ${cfg.color}15`,
          }}
        >
          {state === 'processing' || state === 'executing' ? (
            <motion.div
              className="w-3 h-3 rounded-full border border-current flex-shrink-0"
              style={{ color: cfg.color, borderTopColor: 'transparent' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
          ) : (
            <div className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }} />
          )}
          <span className="text-[11px] font-bold tracking-[0.25em]" style={{ color: cfg.color }}>
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Gauges */}
      <div className="flex justify-around mb-4 pb-3" style={{ borderBottom: '1px solid #00d4ff15' }}>
        <RadarGauge value={currentCpu} label="CPU" color="#00d4ff" />
        <RadarGauge value={currentMem} label="MEM" color="#a78bfa" />
      </div>

      {/* CPU sparkline */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[9px] tracking-widest uppercase" style={{ color: '#00d4ff40' }}>CPU TRACE</span>
          <span className="text-[9px]" style={{ color: '#00d4ff80' }}>{currentCpu}%</span>
        </div>
        <div className="h-8 w-full overflow-hidden rounded-sm" style={{ background: '#00d4ff08', border: '1px solid #00d4ff15' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cpuData}>
              <YAxis domain={[0, 100]} hide />
              <Line type="monotone" dataKey="v" stroke="#00d4ff" strokeWidth={1.2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* MEM sparkline */}
      <div className="mb-4 pb-3" style={{ borderBottom: '1px solid #00d4ff15' }}>
        <div className="flex justify-between items-center mb-1">
          <span className="text-[9px] tracking-widest uppercase" style={{ color: '#a78bfa60' }}>MEM TRACE</span>
          <span className="text-[9px]" style={{ color: '#a78bfa80' }}>{currentMem}%</span>
        </div>
        <div className="h-8 w-full overflow-hidden rounded-sm" style={{ background: '#a78bfa08', border: '1px solid #a78bfa15' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={memData}>
              <YAxis domain={[0, 100]} hide />
              <Line type="monotone" dataKey="v" stroke="#a78bfa" strokeWidth={1.2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Response */}
      <div className="mb-3" style={{ minHeight: 60 }}>
        <AnimatePresence>
          {showResponse && aiResponse && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3 rounded-sm"
              style={{
                background: '#00d4ff08',
                border: '1px solid #00d4ff25',
                borderLeft: '2px solid #00d4ff',
              }}
            >
              <div className="text-[8px] tracking-[0.3em] uppercase mb-1.5" style={{ color: '#00d4ff55' }}>
                AI RESPONSE
              </div>
              <p className="text-[10px] leading-relaxed italic" style={{ color: '#00d4ffcc' }}>
                "{aiResponse}"
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Active Processes */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="text-[9px] tracking-[0.3em] uppercase mb-2" style={{ color: '#00d4ff40' }}>
          ACTIVE PROCESSES [{fakeProcesses.length}]
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {fakeProcesses.map(proc => (
            <ProcessBar key={proc.pid} {...proc} />
          ))}
        </div>
      </div>

      {/* Counter / signature */}
      <div className="mt-3 pt-2 flex justify-between items-center" style={{ borderTop: '1px solid #00d4ff10' }}>
        <span className="text-[8px] tracking-widest" style={{ color: '#00d4ff25' }}>STARK INDUSTRIES</span>
        <span className="text-[8px] font-mono tabular-nums" style={{ color: '#00d4ff30' }}>
          {String(counter % 100000).padStart(5, '0')}
        </span>
      </div>
    </div>
  );
}
