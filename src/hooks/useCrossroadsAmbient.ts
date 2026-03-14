import { useEffect, useRef } from 'react'

interface CrossroadsAmbientOptions {
  enabled: boolean
  volume?: number
}

/**
 * Creates an eerie, ritual-dark ambient drone using Web Audio API.
 * No external files needed — pure oscillator synthesis.
 *
 * Sound design:
 *  • 80 Hz root drone (sine)
 *  • 80.3 Hz detuned drone (creates slow beating / pulsation)
 *  • 160 Hz sub-octave (sine, quieter)
 *  • Low-pass filtered noise bed (breath / mist)
 *  • All running through a gain with slow fade-in
 */
export function useCrossroadsAmbient({ enabled, volume = 0.5 }: CrossroadsAmbientOptions) {
  const ctxRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const nodesRef = useRef<AudioNode[]>([])
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!enabled) {
      fadeOut()
      return
    }

    if (nodesRef.current.length > 0) {
      updateVolume(volume)
    } else {
      start(volume)
    }

    return () => {
      // Only fade out on unmount or when disabled
      if (!enabled) fadeOut()
    }
  }, [enabled, volume])

  function updateVolume(vol: number) {
    if (masterGainRef.current && ctxRef.current) {
      const ctx = ctxRef.current
      const now = ctx.currentTime
      masterGainRef.current.gain.cancelScheduledValues(now)
      masterGainRef.current.gain.linearRampToValueAtTime(vol * 0.28, now + 1)
    }
  }

  function start(vol: number) {
    try {
      if (!ctxRef.current || ctxRef.current.state === 'closed') {
        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
        ctxRef.current = new AudioCtx()
      }
      const ctx = ctxRef.current!

      if (ctx.state === 'suspended') {
        const resume = () => {
          ctx.resume().catch(() => {});
          window.removeEventListener('click', resume);
        };
        window.addEventListener('click', resume);
        ctx.resume().catch(() => {})
      }

      // Master gain (starts at 0, fades in)
      const master = ctx.createGain()
      master.gain.setValueAtTime(0, ctx.currentTime)
      master.gain.linearRampToValueAtTime(vol * 0.28, ctx.currentTime + 4)
      master.connect(ctx.destination)
      masterGainRef.current = master
      nodesRef.current = [master]

      // ─── Drone oscillators ───────────────────────────────────────

      const addOsc = (freq: number, gainVal: number, type: OscillatorType = 'sine') => {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = type
        osc.frequency.value = freq
        g.gain.value = gainVal
        osc.connect(g)
        g.connect(master)
        osc.start()
        nodesRef.current.push(osc, g)
      }

      // Root 80 Hz — main drone
      addOsc(80, 0.55)
      // Slightly detuned — slow beating effect (~0.3 Hz beat)
      addOsc(80.3, 0.45)
      // Sub-octave
      addOsc(40, 0.25)
      // Fifth harmonic (very quiet, adds richness)
      addOsc(120, 0.12)

      // ─── Filtered noise (mist/wind bed) ─────────────────────────

      const bufferSize = ctx.sampleRate * 4
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = noiseBuffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1)
      }

      const noiseSource = ctx.createBufferSource()
      noiseSource.buffer = noiseBuffer
      noiseSource.loop = true

      const noiseFilter = ctx.createBiquadFilter()
      noiseFilter.type = 'lowpass'
      noiseFilter.frequency.value = 260
      noiseFilter.Q.value = 0.8

      const noiseGain = ctx.createGain()
      noiseGain.gain.value = 0.055

      noiseSource.connect(noiseFilter)
      noiseFilter.connect(noiseGain)
      noiseGain.connect(master)
      noiseSource.start()
      nodesRef.current.push(noiseSource, noiseFilter, noiseGain)

      // ─── Slow LFO modulating drone pitch (eerie wavering) ───────

      const lfo = ctx.createOscillator()
      lfo.type = 'sine'
      lfo.frequency.value = 0.08 // Very slow — nearly 12 seconds per cycle

      const lfoGain = ctx.createGain()
      lfoGain.gain.value = 1.2 // Subtle pitch variation in Hz

      lfo.connect(lfoGain)
      lfo.start()
      nodesRef.current.push(lfo, lfoGain)

      // We'd connect lfoGain to osc frequency AudioParams but since they're
      // already connected above, create a second pair just for modulation
      const modOsc = ctxRef.current?.createOscillator()
      if (modOsc) {
        modOsc.type = 'sine'
        modOsc.frequency.value = 80
        const modDepth = ctx.createGain()
        modDepth.gain.value = 0.3
        lfoGain.connect(modOsc.frequency)
        modOsc.connect(modDepth)
        modDepth.connect(master)
        modOsc.start()
        nodesRef.current.push(modOsc, modDepth)
      }
    } catch (e) {
      // Web Audio not available — fail silently
      console.warn('[CrossroadsAmbient] Web Audio API not available', e)
    }
  }

  function fadeOut() {
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)

    if (!masterGainRef.current || !ctxRef.current) return
    try {
      const ctx = ctxRef.current
      const master = masterGainRef.current
      const now = ctx.currentTime
      master.gain.cancelScheduledValues(now)
      master.gain.setValueAtTime(master.gain.value, now)
      master.gain.linearRampToValueAtTime(0, now + 2.5)

      fadeTimerRef.current = setTimeout(() => {
        nodesRef.current.forEach(node => {
          try {
            if (node instanceof OscillatorNode || node instanceof AudioBufferSourceNode) {
              node.stop()
            }
            node.disconnect()
          } catch {}
        })
        nodesRef.current = []
        masterGainRef.current = null
      }, 2600)
    } catch {}
  }
}
