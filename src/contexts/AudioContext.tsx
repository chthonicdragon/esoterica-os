import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

interface AudioContextType {
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  playUiSound: (type: 'click' | 'hover' | 'whoosh' | 'success' | 'error' | 'bell') => void;
  playAmbient: (active: boolean) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ambientOscRef = useRef<{ osc1: OscillatorNode; osc2: OscillatorNode; gain: GainNode } | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  // Initialize Audio Context on first interaction
  const initAudio = useCallback(() => {
    if (audioCtxRef.current) return;
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    audioCtxRef.current = new Ctx();
    masterGainRef.current = audioCtxRef.current.createGain();
    masterGainRef.current.connect(audioCtxRef.current.destination);
    masterGainRef.current.gain.value = isMuted ? 0 : 0.3;
  }, [isMuted]);

  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.setTargetAtTime(isMuted ? 0 : 0.3, audioCtxRef.current!.currentTime, 0.1);
    }
  }, [isMuted]);

  const playUiSound = useCallback((type: 'click' | 'hover' | 'whoosh' | 'success' | 'error' | 'bell') => {
    initAudio();
    if (!audioCtxRef.current || isMuted) return;

    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    
    osc.connect(g);
    g.connect(masterGainRef.current!);

    const now = ctx.currentTime;

    switch (type) {
      case 'click':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        g.gain.setValueAtTime(0.1, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'hover':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(300, now + 0.05);
        g.gain.setValueAtTime(0.02, now);
        g.gain.linearRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
      case 'whoosh':
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseBuffer.length; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.2);
        noise.connect(filter);
        filter.connect(g);
        g.gain.setValueAtTime(0.1, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        noise.start(now);
        noise.stop(now + 0.2);
        return; // Early return for noise based sound
      case 'success':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);
        g.gain.setValueAtTime(0.1, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      case 'error':
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.3);
        g.gain.setValueAtTime(0.1, now);
        g.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      case 'bell':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        g.gain.setValueAtTime(0.1, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        osc.start(now);
        osc.stop(now + 1.5);
        break;
    }
  }, [initAudio, isMuted]);

  const playAmbient = useCallback((active: boolean) => {
    initAudio();
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;

    if (active) {
      if (ambientOscRef.current) return;
      
      const g = ctx.createGain();
      g.connect(masterGainRef.current!);
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 2); // Slow fade in

      const o1 = ctx.createOscillator();
      o1.type = 'sine';
      o1.frequency.setValueAtTime(40, ctx.currentTime); // Deep hum

      const o2 = ctx.createOscillator();
      o2.type = 'sine';
      o2.frequency.setValueAtTime(42, ctx.currentTime); // Slightly detuned for beating

      o1.connect(g);
      o2.connect(g);
      o1.start();
      o2.start();
      ambientOscRef.current = { osc1: o1, osc2: o2, gain: g };
    } else {
      if (!ambientOscRef.current) return;
      const { osc1, osc2, gain } = ambientOscRef.current;
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1); // Fade out
      setTimeout(() => {
        osc1.stop();
        osc2.stop();
        osc1.disconnect();
        osc2.disconnect();
        gain.disconnect();
      }, 1000);
      ambientOscRef.current = null;
    }
  }, [initAudio]);

  return (
    <AudioContext.Provider value={{ isMuted, setIsMuted, playUiSound, playAmbient }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
