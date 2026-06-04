import React, { useEffect, useRef, useState } from 'react';
import { useJarvisStore } from '../../store/jarvisStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useJarvisVoice } from '../../hooks/useJarvisVoice';
import { Send } from 'lucide-react';

const NUM_BARS = 48;

const STATE_LABELS: Record<string, string> = {
  idle: 'STANDBY',
  listening: 'LISTENING',
  processing: 'PROCESSING',
  executing: 'EXECUTING',
  speaking: 'RESPONDING',
};

const STATE_COLORS: Record<string, string> = {
  idle: '#00d4ff55',
  listening: '#00ff88',
  processing: '#ffaa00',
  executing: '#ff6600',
  speaking: '#00d4ff',
};

export function VoiceHUD() {
  const { state, transcript, isConnected, aiResponse } = useJarvisStore();
  const {
    speechSupported,
    micPermission,
    audioDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    requestPermission,
    isActive,
    manualSubmit,
    cancelListening,
  } = useJarvisVoice();

  const barsRef = useRef<HTMLDivElement[]>([]);
  const [textInput, setTextInput] = useState('');
  const [dots, setDots] = useState('');
  const [showDevices, setShowDevices] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (state !== 'idle') {
      interval = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400);
    } else {
      setDots('');
    }
    return () => clearInterval(interval);
  }, [state]);

  useEffect(() => {
    let af: number;
    let t = 0;
    const animate = () => {
      af = requestAnimationFrame(animate);
      t += 0.05;
      const isLoud = state === 'listening' || state === 'speaking';
      const amp = isLoud ? 28 : 4;
      const base = isLoud ? 8 : 3;
      barsRef.current.forEach((bar, i) => {
        if (!bar) return;
        const offset = i * 0.28;
        const w = Math.sin(t * 2.2 + offset) + Math.sin(t * 1.4 - offset * 1.1);
        const n = isLoud ? Math.random() * 8 : 0;
        const h = base + Math.abs(w) * amp * 0.5 + n;
        bar.style.height = `${Math.max(3, Math.min(48, h))}px`;
      });
    };
    animate();
    return () => cancelAnimationFrame(af);
  }, [state]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) { manualSubmit(textInput); setTextInput(''); }
  };

  const stateColor = STATE_COLORS[state] || STATE_COLORS.idle;
  const stateLabel = STATE_LABELS[state] || 'STANDBY';

  // Selected device label
  const selectedDevice = audioDevices.find(d => d.deviceId === selectedDeviceId);
  const deviceLabel = selectedDevice
    ? (selectedDevice.label || `Mic ${audioDevices.indexOf(selectedDevice) + 1}`)
    : '';

  return (
    <div
      className="fixed left-[22%] right-[22%] bottom-8 font-mono"
      style={{
        height: micPermission === 'unknown' || micPermission === 'denied' ? 90 : (audioDevices.length > 1 && micPermission === 'granted' ? 110 : 90),
        background: 'linear-gradient(180deg, #010a18f0 0%, #020d20f8 100%)',
        border: '1px solid #00d4ff25',
        borderBottom: '1px solid #00d4ff40',
        clipPath: 'polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%, 0 12px)',
        boxShadow: '0 -4px 30px rgba(0,212,255,0.08), inset 0 0 30px rgba(0,212,255,0.02)',
        zIndex: 30,
        transition: 'height 0.3s ease',
      }}
    >
      {/* Top edge glow */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(to right, transparent, ${stateColor}60, transparent)`, transition: 'background 0.5s ease' }} />

      {/* Corner decorations */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: 12, height: 12, borderTop: '1px solid #00d4ff60', borderLeft: '1px solid #00d4ff60' }} />
      <div style={{ position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderTop: '1px solid #00d4ff60', borderRight: '1px solid #00d4ff60' }} />

      {/* Connection status */}
      <div className="absolute top-2 left-4 flex items-center gap-1.5">
        <motion.div className="w-1.5 h-1.5 rounded-full"
          style={{ background: isConnected ? '#00ff88' : '#4488ff', boxShadow: isConnected ? '0 0 5px #00ff88' : '0 0 5px #4488ff' }}
          animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }} />
        <span className="text-[8px] tracking-widest uppercase" style={{ color: isConnected ? '#00ff8860' : '#4488ff60' }}>
          {isConnected ? 'UPLINK: SECURE' : 'NEURAL LINK: LOCAL'}
        </span>
      </div>

      {/* State label top center */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {(state === 'processing' || state === 'executing') && (
          <motion.div className="w-2 h-2 rounded-full border border-current"
            style={{ color: stateColor, borderTopColor: 'transparent' }}
            animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
        )}
        <span className="text-[10px] font-bold tracking-[0.3em] uppercase"
          style={{ color: stateColor, textShadow: `0 0 10px ${stateColor}` }}>
          {stateLabel}{dots}
        </span>
      </div>

      {/* Wake word hint when idle + mic active */}
      <AnimatePresence>
        {state === 'idle' && micPermission === 'granted' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute top-2 right-4 text-[8px] tracking-widest uppercase"
            style={{ color: '#00d4ff25' }}>
            SAY "HEY JARVIS"
          </motion.div>
        )}
      </AnimatePresence>

      {/* Device selector row — shown when granted + multiple mics */}
      {micPermission === 'granted' && audioDevices.length > 1 && (
        <div className="absolute top-[22px] left-0 right-0 flex items-center justify-center gap-2 px-4">
          <span className="text-[7px] tracking-widest uppercase" style={{ color: '#00d4ff30' }}>INPUT:</span>
          <div className="relative">
            <button
              onClick={() => setShowDevices(v => !v)}
              className="flex items-center gap-1 text-[7px] tracking-wider uppercase"
              style={{ color: '#00d4ff70', background: '#00d4ff08', border: '1px solid #00d4ff20', padding: '2px 6px', borderRadius: 2 }}
            >
              <svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x={9} y={2} width={6} height={12} rx={3} />
                <path d="M5 10a7 7 0 0 0 14 0" />
              </svg>
              {deviceLabel.length > 22 ? deviceLabel.slice(0, 22) + '…' : deviceLabel || 'SELECT MIC'}
              <svg width={6} height={6} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {showDevices && (
              <div className="absolute bottom-full left-0 mb-1 min-w-[200px] z-50"
                style={{ background: '#020d20f8', border: '1px solid #00d4ff30', borderRadius: 2 }}>
                {audioDevices.map((dev, idx) => (
                  <button key={dev.deviceId}
                    onClick={() => { setSelectedDeviceId(dev.deviceId); setShowDevices(false); requestPermission(); }}
                    className="w-full text-left px-3 py-1.5 text-[8px] tracking-wider uppercase flex items-center gap-2"
                    style={{
                      color: dev.deviceId === selectedDeviceId ? '#00ff88' : '#00d4ff80',
                      background: dev.deviceId === selectedDeviceId ? '#00ff8808' : 'transparent',
                    }}>
                    {dev.deviceId === selectedDeviceId && <span style={{ color: '#00ff88' }}>▶</span>}
                    {dev.label || `Microphone ${idx + 1}`}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="absolute inset-x-0 bottom-0 flex items-center px-4 gap-4"
        style={{ top: micPermission === 'granted' && audioDevices.length > 1 ? 36 : 24 }}>

        {/* Left: mic button / enable button / text input */}
        <div className="flex-shrink-0">
          {micPermission === 'granted' ? (
            // Active mic button
            <button onClick={isActive ? cancelListening : undefined}
              className="relative flex items-center justify-center rounded-full transition-all duration-300"
              style={{
                width: 40, height: 40,
                background: state === 'listening' ? '#00ff8820' : state === 'speaking' ? '#00d4ff20' : state === 'processing' ? '#ffaa0020' : '#00d4ff08',
                border: `1px solid ${state === 'listening' ? '#00ff8860' : state === 'speaking' ? '#00d4ff60' : state === 'processing' ? '#ffaa0060' : '#00d4ff25'}`,
                color: stateColor,
                boxShadow: state !== 'idle' ? `0 0 16px ${stateColor}33` : 'none',
                cursor: isActive ? 'pointer' : 'default',
              }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <rect x={9} y={2} width={6} height={12} rx={3} />
                <path d="M5 10a7 7 0 0 0 14 0" />
                <line x1={12} y1={19} x2={12} y2={22} />
                <line x1={8} y1={22} x2={16} y2={22} />
              </svg>
              {state === 'listening' && (
                <motion.div className="absolute inset-0 rounded-full"
                  style={{ border: '1px solid #00ff88' }}
                  animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity }} />
              )}
            </button>
          ) : micPermission === 'denied' ? (
            // Denied state — show text input + retry button
            <div className="flex items-center gap-2">
              <button onClick={() => requestPermission()}
                className="flex items-center gap-1.5 text-[8px] tracking-widest uppercase px-2 py-1 rounded-sm"
                style={{ background: '#ff440010', border: '1px solid #ff440040', color: '#ff440080' }}>
                <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx={12} cy={12} r={10} /><line x1={12} y1={8} x2={12} y2={12} /><line x1={12} y1={16} x2={12.01} y2={16} />
                </svg>
                MIC DENIED — RETRY
              </button>
            </div>
          ) : (
            // Unknown — show enable button
            speechSupported ? (
              <button onClick={() => requestPermission()}
                className="flex items-center gap-2 text-[9px] tracking-widest uppercase px-3 py-2 rounded-sm transition-all duration-200"
                style={{ background: '#00d4ff12', border: '1px solid #00d4ff50', color: '#00d4ffcc',
                  boxShadow: '0 0 12px #00d4ff15' }}>
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <rect x={9} y={2} width={6} height={12} rx={3} />
                  <path d="M5 10a7 7 0 0 0 14 0" />
                  <line x1={12} y1={19} x2={12} y2={22} />
                  <line x1={8} y1={22} x2={16} y2={22} />
                </svg>
                ENABLE MIC
              </button>
            ) : (
              // Speech not supported — text input
              <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
                <input type="text" value={textInput} onChange={e => setTextInput(e.target.value)}
                  placeholder="ENTER COMMAND..."
                  className="rounded-sm px-2 py-1 text-[10px] font-mono tracking-wider focus:outline-none w-[130px]"
                  style={{ background: '#00d4ff08', border: '1px solid #00d4ff30', color: '#00d4ffcc' }} />
                <button type="submit" className="flex items-center justify-center rounded-sm"
                  style={{ width: 28, height: 28, background: '#00d4ff15', border: '1px solid #00d4ff40', color: '#00d4ff' }}>
                  <Send size={12} />
                </button>
              </form>
            )
          )}
        </div>

        {/* Text input always available when mic is granted */}
        {micPermission === 'granted' && (
          <form onSubmit={handleManualSubmit} className="flex items-center gap-1.5 flex-shrink-0">
            <input type="text" value={textInput} onChange={e => setTextInput(e.target.value)}
              placeholder="TYPE COMMAND..."
              className="rounded-sm px-2 py-1 text-[9px] font-mono tracking-wider focus:outline-none w-[110px]"
              style={{ background: '#00d4ff05', border: '1px solid #00d4ff20', color: '#00d4ff80' }} />
            <button type="submit" className="flex items-center justify-center rounded-sm"
              style={{ width: 22, height: 22, background: '#00d4ff10', border: '1px solid #00d4ff30', color: '#00d4ff60' }}>
              <Send size={10} />
            </button>
          </form>
        )}

        {/* Waveform visualizer */}
        <div className="flex-1 min-w-0 flex items-end justify-center gap-[2px]" style={{ height: 50 }}>
          {Array.from({ length: NUM_BARS }).map((_, i) => (
            <div key={i} ref={el => { if (el) barsRef.current[i] = el; }}
              className="rounded-full flex-shrink-0"
              style={{
                width: 3, height: 4,
                background: STATE_COLORS[state] || '#00d4ff55',
                boxShadow: (state === 'listening' || state === 'speaking') ? `0 0 4px ${stateColor}` : 'none',
                transition: 'background 0.3s ease, box-shadow 0.3s ease',
              }} />
          ))}
        </div>

        {/* Transcript / AI Response display */}
        <div className="flex-shrink-0 w-[180px] text-right">
          <AnimatePresence mode="wait">
            {transcript && state === 'listening' && (
              <motion.div key="transcript" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className="text-[10px] leading-relaxed italic truncate" style={{ color: '#00ff8888' }}>
                "{transcript}"
              </motion.div>
            )}
            {aiResponse && state === 'speaking' && (
              <motion.div key="response" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className="text-[10px] leading-relaxed" style={{ color: '#00d4ffaa' }}>
                {aiResponse}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
