import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { soundManager } from '../lib/soundManager';

interface AudioContextType {
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  playUiSound: (type: 'click' | 'hover' | 'whoosh' | 'success' | 'error' | 'bell' | 'candle' | 'ritual-start' | 'ritual-end' | 'whisper' | 'wind') => void;
  playAmbient: (active: boolean) => void;
  toggleSfx: () => void;
  toggleMusic: () => void;
  setVolume: (vol: number) => void;
  config: { volume: number; sfxMuted: boolean; musicMuted: boolean; muted: boolean };
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  // We keep a local state to trigger re-renders when config changes
  const [config, setConfig] = useState(soundManager.getConfig());

  // Sync state with SoundManager updates
  const updateConfig = useCallback(() => {
    setConfig(soundManager.getConfig());
  }, []);

  // Initialize on mount (add listener for first interaction)
  useEffect(() => {
    const init = () => {
      soundManager.init();
      window.removeEventListener('click', init);
      window.removeEventListener('keydown', init);
    };
    window.addEventListener('click', init);
    window.addEventListener('keydown', init);
    return () => {
      window.removeEventListener('click', init);
      window.removeEventListener('keydown', init);
    };
  }, []);

  const setIsMuted = useCallback((muted: boolean) => {
    // If we want to set specific mute state, we might need to adjust SoundManager API
    // For now, toggleMute flips the state. If we need "set", we should check current state.
    const current = soundManager.getConfig().muted;
    if (current !== muted) {
      soundManager.toggleMute();
      updateConfig();
    }
  }, [updateConfig]);

  const toggleSfx = useCallback(() => {
    soundManager.toggleSfxMute();
    updateConfig();
  }, [updateConfig]);

  const toggleMusic = useCallback(() => {
    soundManager.toggleMusicMute();
    updateConfig();
  }, [updateConfig]);

  const setVolume = useCallback((vol: number) => {
    soundManager.setVolume(vol);
    updateConfig();
  }, [updateConfig]);

  const playUiSound = useCallback((type: string) => {
    // Map legacy types to new files if needed, or just play directly
    let soundName = type;
    if (type === 'click') soundName = 'soft-click';
    if (type === 'hover') return; // Skip hover sounds for now to avoid noise
    if (type === 'whoosh') soundName = 'wind'; 
    
    soundManager.play(soundName);
  }, []);

  const playAmbient = useCallback((active: boolean) => {
    if (active) soundManager.playMusic();
    else soundManager.pauseMusic();
  }, []);

  return (
    <AudioContext.Provider value={{ 
      isMuted: config.muted, 
      setIsMuted, 
      playUiSound, 
      playAmbient,
      toggleSfx,
      toggleMusic,
      setVolume,
      config
    }}>
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
