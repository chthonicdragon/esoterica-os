// SoundManager.ts
// A simple audio manager for Esoterica OS
// Handles SFX and Ambient Music with volume control and persistence

type SoundType = 'sfx' | 'music'

interface SoundConfig {
  volume: number;      // 0.0 to 1.0
  muted: boolean;
  sfxMuted: boolean;
  musicMuted: boolean;
}

const SOUND_SOURCES: Record<string, string[]> = {
  'soft-click': ['/sounds/tab.mp3'],
  success: ['/sounds/success.mp3', '/sounds/bell.mp3', '/sounds/tab.mp3'],
  error: ['/sounds/error.mp3', '/sounds/tab.mp3'],
  bell: ['/sounds/bell.mp3', '/sounds/tab.mp3'],
  candle: ['/sounds/candle.mp3', '/sounds/tab.mp3'],
  'ritual-start': ['/sounds/ritual-start.mp3', '/sounds/bell.mp3'],
  'ritual-end': ['/sounds/ritual-end.mp3', '/sounds/bell.mp3'],
  whisper: ['/sounds/whisper.mp3', '/sounds/wind.mp3', '/sounds/tab.mp3'],
  wind: ['/sounds/wind.mp3', '/sounds/tab.mp3'],
}

const DEFAULT_CONFIG: SoundConfig = {
  volume: 0.5,
  muted: false,
  sfxMuted: false,
  musicMuted: false,
}

class SoundManager {
  private config: SoundConfig;
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private musicTrack: HTMLAudioElement | null = null;
  private musicPlaying: boolean = false;
  private initialized: boolean = false;

  constructor() {
    this.config = this.loadConfig();
  }

  // --- Initialization ---
  
  // Call this on first user interaction to unlock audio context
  public init() {
    if (this.initialized) return;
    this.initialized = true;
    
    Object.entries(SOUND_SOURCES).forEach(([name, paths]) => this.preloadWithFallback(name, paths));
    
    // Setup music
    this.musicTrack = new Audio('/sounds/ambient.mp3');
    this.musicTrack.loop = true;
    this.updateMusicVolume();
    
    // Try to play music if not muted
    if (!this.config.muted && !this.config.musicMuted) {
      this.playMusic().catch(() => {
        // Autoplay blocked, wait for interaction
        const unlock = () => {
          this.playMusic();
          window.removeEventListener('click', unlock);
          window.removeEventListener('keydown', unlock);
        };
        window.addEventListener('click', unlock);
        window.addEventListener('keydown', unlock);
      });
    }
  }

  private preload(name: string, path: string) {
    const audio = new Audio(path);
    audio.load();
    this.sounds.set(name, audio);
  }

  private preloadWithFallback(name: string, paths: string[]) {
    if (!paths.length) return
    let index = 0
    const tryLoad = () => {
      const path = paths[index]
      const audio = new Audio(path)
      const onLoaded = () => {
        this.sounds.set(name, audio)
        audio.removeEventListener('canplaythrough', onLoaded)
        audio.removeEventListener('error', onError)
      }
      const onError = () => {
        audio.removeEventListener('canplaythrough', onLoaded)
        audio.removeEventListener('error', onError)
        index += 1
        if (index < paths.length) {
          tryLoad()
          return
        }
        this.sounds.set(name, new Audio('/sounds/tab.mp3'))
      }
      audio.addEventListener('canplaythrough', onLoaded, { once: true })
      audio.addEventListener('error', onError, { once: true })
      audio.load()
    }
    tryLoad()
  }

  // --- Playback ---

  public play(name: string) {
    if (!this.initialized) {
      this.init()
    }
    if (this.config.muted || this.config.sfxMuted) return;

    const sound = this.sounds.get(name);
    if (sound) {
      // Clone node to allow overlapping sounds of same type
      const clone = sound.cloneNode() as HTMLAudioElement;
      clone.volume = this.config.volume;
      clone.play().catch(e => console.warn('Audio play failed', e));
    } else {
      const fallback = this.sounds.get('soft-click')
      if (fallback) {
        const clone = fallback.cloneNode() as HTMLAudioElement
        clone.volume = this.config.volume * 0.8
        clone.play().catch(() => {})
      } else {
        console.warn(`Sound "${name}" not found`)
      }
    }
  }

  public async playMusic() {
    if (!this.musicTrack) return;
    if (this.config.muted || this.config.musicMuted) {
      this.musicTrack.pause();
      this.musicPlaying = false;
      return;
    }

    try {
      await this.musicTrack.play();
      this.musicPlaying = true;
    } catch (e) {
      console.warn('Music playback failed (likely autoplay policy)', e);
      this.musicPlaying = false;
    }
  }

  public pauseMusic() {
    if (this.musicTrack) {
      this.musicTrack.pause();
      this.musicPlaying = false;
    }
  }

  // --- Configuration ---

  public setVolume(val: number) {
    this.config.volume = Math.max(0, Math.min(1, val));
    this.saveConfig();
    this.updateMusicVolume();
  }

  public toggleMute() {
    this.config.muted = !this.config.muted;
    this.saveConfig();
    this.updateState();
  }

  public toggleSfxMute() {
    this.config.sfxMuted = !this.config.sfxMuted;
    this.saveConfig();
  }

  public toggleMusicMute() {
    this.config.musicMuted = !this.config.musicMuted;
    this.saveConfig();
    this.updateState();
  }

  public getConfig() {
    return { ...this.config };
  }

  // --- Internals ---

  private updateMusicVolume() {
    if (this.musicTrack) {
      // Music usually needs to be subtler than SFX
      this.musicTrack.volume = this.config.volume * 0.6; 
    }
  }

  private updateState() {
    if (this.config.muted || this.config.musicMuted) {
      this.pauseMusic();
    } else {
      this.playMusic();
    }
  }

  private loadConfig(): SoundConfig {
    if (typeof localStorage === 'undefined') return DEFAULT_CONFIG;
    try {
      const saved = localStorage.getItem('eos_sound_config');
      return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  }

  private saveConfig() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('eos_sound_config', JSON.stringify(this.config));
    }
  }
}

export const soundManager = new SoundManager();
