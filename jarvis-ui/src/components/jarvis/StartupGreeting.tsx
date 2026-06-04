import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning, sir.';
  if (hour >= 12 && hour < 18) return 'Good afternoon, sir.';
  return 'Good evening, sir.';
}

function speakGreeting(text: string) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.88;
  utter.pitch = 0.85;
  utter.volume = 0.9;

  const setVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.name.toLowerCase().includes('daniel') ||
      v.name.toLowerCase().includes('alex') ||
      v.name.toLowerCase().includes('google uk english male') ||
      v.name.toLowerCase().includes('english') ||
      v.lang.startsWith('en')
    );
    if (preferred) utter.voice = preferred;
    window.speechSynthesis.speak(utter);
  };

  if (window.speechSynthesis.getVoices().length > 0) {
    setVoice();
  } else {
    window.speechSynthesis.onvoiceschanged = setVoice;
  }
}

export function StartupGreeting() {
  const [phase, setPhase] = useState<'booting' | 'greeting' | 'done'>('booting');
  const [displayText, setDisplayText] = useState('');
  const [bootLines, setBootLines] = useState<string[]>([]);
  const greeting = useRef(getGreeting());
  const spokenRef = useRef(false);

  const bootSequence = [
    'INITIALIZING J.A.R.V.I.S. AI CORE...',
    'LOADING NEURAL NETWORK MATRICES...',
    'ESTABLISHING SECURE UPLINK...',
    'CALIBRATING SENSOR ARRAY...',
    'SUIT SYSTEMS NOMINAL.',
    'ALL SYSTEMS ONLINE.',
  ];

  useEffect(() => {
    let cancelled = false;

    const runBoot = async () => {
      await delay(400);

      for (let i = 0; i < bootSequence.length; i++) {
        if (cancelled) return;
        await delay(320);
        setBootLines(prev => [...prev, bootSequence[i]]);
      }

      await delay(600);
      if (cancelled) return;
      setPhase('greeting');

      if (!spokenRef.current) {
        spokenRef.current = true;
        setTimeout(() => speakGreeting(greeting.current), 300);
      }

      let i = 0;
      const typeInterval = setInterval(() => {
        if (cancelled) { clearInterval(typeInterval); return; }
        i++;
        setDisplayText(greeting.current.slice(0, i));
        if (i >= greeting.current.length) {
          clearInterval(typeInterval);
        }
      }, 55);

      await delay(greeting.current.length * 55 + 2800);
      if (cancelled) return;
      setPhase('done');
    };

    runBoot();
    return () => { cancelled = true; };
  }, []);

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 1.2, ease: 'easeInOut' } }}
          className="fixed inset-0 flex flex-col items-center justify-center font-mono pointer-events-none"
          style={{ zIndex: 100, background: 'radial-gradient(ellipse 60% 50% at 50% 50%, #020d1fdd 0%, #000000bb 100%)' }}
        >
          {/* Boot log — shown during booting phase */}
          <AnimatePresence>
            {phase === 'booting' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.5 } }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] flex flex-col gap-2"
              >
                {bootLines.map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-[10px]" style={{ color: '#00d4ff40' }}>▸</span>
                    <span
                      className="text-[10px] tracking-widest uppercase"
                      style={{
                        color: i === bootLines.length - 1 ? '#00d4ff' : '#00d4ff60',
                        textShadow: i === bootLines.length - 1 ? '0 0 10px #00d4ff' : 'none',
                      }}
                    >
                      {line}
                    </span>
                    {i === bootLines.length - 1 && (
                      <motion.span
                        className="text-[10px]"
                        style={{ color: '#00ff88' }}
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity }}
                      >
                        OK
                      </motion.span>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Greeting phase */}
          <AnimatePresence>
            {phase === 'greeting' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center gap-6"
              >
                {/* Decorative arcs */}
                <svg width={320} height={60} viewBox="0 0 320 60" style={{ opacity: 0.5 }}>
                  <line x1={0} y1={30} x2={120} y2={30} stroke="#00d4ff" strokeWidth={0.8} strokeDasharray="4 4" />
                  <line x1={200} y1={30} x2={320} y2={30} stroke="#00d4ff" strokeWidth={0.8} strokeDasharray="4 4" />
                  <circle cx={160} cy={30} r={18} fill="none" stroke="#00d4ff" strokeWidth={0.8} />
                  <circle cx={160} cy={30} r={6} fill="#00d4ff" opacity={0.6} />
                  <line x1={120} y1={30} x2={142} y2={30} stroke="#00d4ff" strokeWidth={0.8} />
                  <line x1={178} y1={30} x2={200} y2={30} stroke="#00d4ff" strokeWidth={0.8} />
                </svg>

                <div className="text-center">
                  <div className="text-[11px] tracking-[0.4em] uppercase mb-3" style={{ color: '#00d4ff50' }}>
                    J.A.R.V.I.S. ONLINE
                  </div>
                  <div
                    className="text-[32px] font-bold tracking-[0.12em] uppercase"
                    style={{
                      color: '#00d4ff',
                      textShadow: '0 0 20px #00d4ff, 0 0 60px #00d4ff44',
                      minHeight: '1.2em',
                      letterSpacing: '0.12em',
                    }}
                  >
                    {displayText}
                    <motion.span
                      style={{ display: 'inline-block', width: 2, height: '0.9em', background: '#00d4ff', marginLeft: 4, verticalAlign: 'middle' }}
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 0.7, repeat: Infinity }}
                    />
                  </div>
                </div>

                {/* Bottom decoration */}
                <div className="flex items-center gap-3" style={{ opacity: 0.4 }}>
                  {Array.from({ length: 7 }, (_, i) => (
                    <motion.div
                      key={i}
                      className="rounded-full"
                      style={{ width: i === 3 ? 6 : 3, height: i === 3 ? 6 : 3, background: '#00d4ff' }}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
