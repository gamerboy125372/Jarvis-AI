import { useEffect, useRef, useCallback, useState } from 'react';
import { useJarvisStore } from '../store/jarvisStore';

const WAKE_PHRASES = ['hey jarvis', 'jarvis', 'hey jarvis,', 'ok jarvis'];
const SILENCE_MS = 1800;
const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';

interface Message { role: 'user' | 'assistant'; content: string; }
export type MicPermission = 'unknown' | 'granted' | 'denied';

function playBase64Audio(base64: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
      audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
      audio.play().catch(() => resolve());
    } catch { resolve(); }
  });
}

function speakFallback(text: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      const synth = window.speechSynthesis;
      if (!synth) { resolve(); return; }
      synth.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 0.88; utt.pitch = 0.85; utt.volume = 1;
      const voices = synth.getVoices();
      const preferred = voices.find(v => /daniel|george|david|male|en-gb/i.test(v.name + v.lang))
        || voices.find(v => v.lang.startsWith('en'));
      if (preferred) utt.voice = preferred;
      utt.onend = () => resolve();
      utt.onerror = () => resolve();
      synth.speak(utt);
    } catch { resolve(); }
  });
}

export function useJarvisVoice() {
  // ── Stable refs (never change hook order) ──────────────────────────────
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const historyRef = useRef<Message[]>([]);
  const phaseRef = useRef<'passive' | 'listening' | 'processing' | 'speaking'>('passive');
  const interimRef = useRef('');
  const streamRef = useRef<MediaStream | null>(null);
  const permissionRef = useRef<MicPermission>('unknown');

  // ── State ───────────────────────────────────────────────────────────────
  const [speechSupported] = useState(
    () => !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition
  );
  const [micPermission, _setMicPermission] = useState<MicPermission>('unknown');
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isActive, setIsActive] = useState(false);

  const { setState, setTranscript, setAiResponse } = useJarvisStore();

  // Keep ref in sync so closures can read current value
  const setMicPermission = useCallback((p: MicPermission) => {
    permissionRef.current = p;
    _setMicPermission(p);
  }, []);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
  }, []);

  const submitCommand = useCallback(async (text: string) => {
    if (!text.trim() || phaseRef.current === 'processing' || phaseRef.current === 'speaking') return;

    phaseRef.current = 'processing';
    setState('processing');
    setTranscript(text);

    try {
      const isComplex = text.split(' ').length > 5;
      if (isComplex) {
        const phrases = ['Let me see…', 'Alright…', 'One moment…'];
        setAiResponse(phrases[Math.floor(Math.random() * phrases.length)]);
        await new Promise(r => setTimeout(r, 400 + Math.random() * 600));
      }

      const res = await fetch(`${BASE_URL}/api/voice/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, history: historyRef.current }),
      });

      if (res.status === 402) {
        setAiResponse('My AI module needs a credit top-up, sir. Standing by.');
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json() as { text: string; audio?: string | null };

      historyRef.current = [
        ...historyRef.current.slice(-8),
        { role: 'user', content: text },
        { role: 'assistant', content: data.text },
      ];

      setAiResponse(data.text);
      phaseRef.current = 'speaking';
      setState('speaking');

      if (data.audio) {
        await playBase64Audio(data.audio);
      } else {
        await speakFallback(data.text);
      }
    } catch (err) {
      console.error('JARVIS voice error:', err);
      setAiResponse("I'm having trouble connecting right now, sir.");
    } finally {
      phaseRef.current = 'passive';
      setState('idle');
      setTranscript('');
      setIsActive(false);
    }
  }, [setState, setTranscript, setAiResponse]);

  const startActiveListening = useCallback(() => {
    phaseRef.current = 'listening';
    setState('listening');
    setIsActive(true);
    interimRef.current = '';
  }, [setState]);

  const refreshDevices = useCallback(async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      const inputs = all.filter(d => d.kind === 'audioinput' && d.deviceId);
      setAudioDevices(inputs);
      if (inputs.length > 0) {
        setSelectedDeviceId(prev => prev || inputs.find(d => d.deviceId === 'default')?.deviceId || inputs[0].deviceId);
      }
    } catch { /* ignore */ }
  }, []);

  const requestPermission = useCallback(async (deviceId?: string) => {
    try {
      streamRef.current?.getTracks().forEach(t => t.stop());
      const constraints: MediaStreamConstraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setMicPermission('granted');
      await refreshDevices();
    } catch (err) {
      console.warn('Mic permission denied:', err);
      setMicPermission('denied');
    }
  }, [setMicPermission, refreshDevices]);

  // Start SpeechRecognition — only called once permission is 'granted'
  const startRecognition = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR || recognitionRef.current) return;

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.maxAlternatives = 1;

    rec.onresult = (event: any) => {
      let interim = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) finalText += r[0].transcript.trim() + ' ';
        else interim += r[0].transcript.toLowerCase().trim();
      }

      const combined = (interimRef.current + ' ' + interim + ' ' + finalText).toLowerCase().trim();

      if (phaseRef.current === 'passive') {
        if (WAKE_PHRASES.some(p => combined.includes(p))) {
          startActiveListening();
          interimRef.current = '';
        }
        return;
      }

      if (phaseRef.current === 'listening' && finalText) {
        let cmd = finalText.trim();
        for (const p of WAKE_PHRASES) {
          const idx = cmd.toLowerCase().indexOf(p);
          if (idx !== -1) cmd = cmd.slice(idx + p.length).trim();
        }
        interimRef.current = cmd;
        setTranscript(cmd);

        clearSilenceTimer();
        if (cmd) {
          silenceTimerRef.current = setTimeout(() => {
            const c = interimRef.current.trim();
            interimRef.current = '';
            if (c) submitCommand(c);
          }, SILENCE_MS);
        }
      }
    };

    rec.onerror = (event: any) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setMicPermission('denied');
        recognitionRef.current = null;
      }
      // no-speech / aborted / network are non-fatal
    };

    rec.onend = () => {
      if (permissionRef.current !== 'granted') return;
      const restart = () => { try { rec.start(); } catch { /* already started */ } };
      if (phaseRef.current !== 'processing' && phaseRef.current !== 'speaking') {
        restart();
      } else {
        const check = setInterval(() => {
          if (permissionRef.current !== 'granted') { clearInterval(check); return; }
          if (phaseRef.current === 'passive') { clearInterval(check); restart(); }
        }, 500);
      }
    };

    recognitionRef.current = rec;
    try { rec.start(); } catch { /* ignore */ }
  }, [startActiveListening, submitCommand, setTranscript, clearSilenceTimer, setMicPermission]);

  // Kick off recognition when permission transitions to 'granted'
  useEffect(() => {
    if (micPermission === 'granted' && speechSupported) {
      startRecognition();
    }
  }, [micPermission, speechSupported, startRecognition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearSilenceTimer();
      try { recognitionRef.current?.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [clearSilenceTimer]);

  const manualSubmit = useCallback((text: string) => {
    if (text.trim()) submitCommand(text);
  }, [submitCommand]);

  const cancelListening = useCallback(() => {
    clearSilenceTimer();
    interimRef.current = '';
    phaseRef.current = 'passive';
    setState('idle');
    setIsActive(false);
    setTranscript('');
  }, [setState, setTranscript, clearSilenceTimer]);

  return {
    speechSupported,
    micPermission,
    audioDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    requestPermission,
    isActive,
    manualSubmit,
    cancelListening,
  };
}
