import React, { useState, useEffect, useRef } from 'react'
import { useLang } from '../contexts/LanguageContext'
import { useAudio } from '../contexts/AudioContext'
import { blink } from '../blink/client'
import { generateSigilSVG } from '../utils/sigilGenerator'
import { Sparkles, Download, Zap, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '../lib/utils'

interface Sigil {
  id: string
  intention: string
  svgData: string
  isCharged: string | number
  createdAt: string
}

interface SigilLabProps {
  user: { id: string }
}

export function SigilLab({ user }: SigilLabProps) {
  const { t, lang } = useLang()
  const { playUiSound } = useAudio()
  const [intention, setIntention] = useState('')
  const [currentSigil, setCurrentSigil] = useState<string | null>(null)
  const [currentIntention, setCurrentIntention] = useState('')
  const [sigils, setSigils] = useState<Sigil[]>([])
  const [generating, setGenerating] = useState(false)
  const [charging, setCharging] = useState(false)
  const [chargeLevel, setChargeLevel] = useState(0)
  const chargeInterval = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => { loadSigils() }, [user.id])
  useEffect(() => () => { if (chargeInterval.current) clearInterval(chargeInterval.current) }, [])

  async function loadSigils() {
    const data = await blink.db.sigils.list({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      limit: 20,
    }) as Sigil[]
    setSigils(data)
  }

  function generateSigil() {
    if (!intention.trim()) return
    playUiSound('click')
    setGenerating(true)
    setChargeLevel(0)
    setCharging(false)
    setTimeout(() => {
      const svg = generateSigilSVG(intention)
      setCurrentSigil(svg)
      setCurrentIntention(intention)
      setGenerating(false)
      playUiSound('success')
    }, 800)
  }

  async function saveSigil() {
    if (!currentSigil || !currentIntention) return
    playUiSound('click')
    try {
      const sigil = await blink.db.sigils.create({
        userId: user.id,
        intention: currentIntention,
        svgData: currentSigil,
        isCharged: Number(chargeLevel >= 100) ? 1 : 0,
        chargedAt: chargeLevel >= 100 ? new Date().toISOString() : null,
        createdAt: new Date().toISOString(),
      }) as Sigil
      setSigils(prev => [sigil, ...prev])
      toast.success(lang === 'ru' ? 'Сигил сохранён' : 'Sigil saved')
    } catch (e) { toast.error(t.error) }
  }

  function startCharging() {
    playUiSound('bell')
    setCharging(true)
    setChargeLevel(0)
    chargeInterval.current = setInterval(() => {
      setChargeLevel(prev => {
        if (prev >= 100) {
          clearInterval(chargeInterval.current!)
          setCharging(false)
          toast.success(t.sigilCharged + ' ✨')
          return 100
        }
        return prev + 2
      })
    }, 60)
  }

  function exportSigil() {
    if (!currentSigil) return
    playUiSound('click')
    const blob = new Blob([currentSigil], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sigil-${currentIntention.slice(0, 20)}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function deleteSigil(id: string) {
    playUiSound('click')
    await blink.db.sigils.delete(id)
    setSigils(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <h2 className="text-lg font-bold font-cinzel text-foreground">{t.sigilLabTitle}</h2>

      {/* Generator */}
      <div className="rounded-2xl bg-card border border-primary/20 p-5 space-y-4">
        <div className="flex gap-3">
          <input
            value={intention}
            onChange={e => setIntention(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && generateSigil()}
            placeholder={t.enterIntention}
            className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50"
          />
          <button
            onClick={generateSigil}
            disabled={!intention.trim() || generating}
            className="px-5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {generating ? t.generating : t.generateSigilBtn}
          </button>
        </div>

        {/* Sigil canvas */}
        {currentSigil && (
          <div className="space-y-4 animate-fade-in">
            <div className="relative flex justify-center">
              {/* Charging glow ring */}
              {charging && (
                <div
                  className="absolute inset-0 rounded-2xl border-2 border-primary transition-all"
                  style={{
                    boxShadow: `0 0 ${chargeLevel / 2}px hsl(var(--primary)), inset 0 0 ${chargeLevel / 4}px hsl(var(--primary)/0.2)`,
                    opacity: chargeLevel / 100,
                  }}
                />
              )}
              {chargeLevel >= 100 && (
                <div className="absolute inset-0 rounded-2xl border-2 border-[hsl(var(--neon))] shadow-[0_0_30px_hsl(var(--neon)/0.5)]" />
              )}
              <div
                className={cn('w-72 h-72 rounded-2xl overflow-hidden transition-all duration-300', charging && 'scale-105')}
                dangerouslySetInnerHTML={{ __html: currentSigil }}
              />
            </div>

            {/* Charge bar */}
            {chargeLevel > 0 && (
              <div className="space-y-1">
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-100"
                    style={{
                      width: `${chargeLevel}%`,
                      background: chargeLevel >= 100
                        ? 'hsl(var(--neon))'
                        : 'hsl(var(--primary))',
                      boxShadow: `0 0 8px hsl(var(--primary))`,
                    }}
                  />
                </div>
                {chargeLevel >= 100 && (
                  <p className="text-xs text-center text-[hsl(var(--neon))]">{t.sigilCharged} ✨</p>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center italic">"{currentIntention}"</p>

            <div className="flex gap-2 justify-center">
              <button
                onClick={startCharging}
                disabled={charging}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-primary/30 text-primary text-sm hover:bg-primary/10 transition-colors disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                {t.chargeSigil}
              </button>
              <button
                onClick={saveSigil}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm hover:bg-primary/20 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                {lang === 'ru' ? 'Сохранить' : 'Save'}
              </button>
              <button
                onClick={exportSigil}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/40 text-muted-foreground text-sm hover:text-foreground hover:border-border transition-colors"
              >
                <Download className="w-4 h-4" />
                {t.exportSigil}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Saved sigils */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">{t.mySigils}</h3>
        {sigils.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/40 p-8 text-center">
            <Sparkles className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{t.noSigils}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {sigils.map(sigil => (
              <div key={sigil.id} className="relative group rounded-xl bg-card border border-border/40 overflow-hidden hover:border-primary/30 transition-all">
                <div
                  className="w-full aspect-square"
                  dangerouslySetInnerHTML={{ __html: sigil.svgData }}
                />
                {Number(sigil.isCharged) > 0 && (
                  <div className="absolute top-1.5 right-1.5 text-xs bg-[hsl(var(--neon)/0.2)] border border-[hsl(var(--neon)/0.4)] text-[hsl(var(--neon))] px-1.5 py-0.5 rounded-full">
                    ✨
                  </div>
                )}
                <div className="p-2">
                  <p className="text-xs text-muted-foreground truncate">{sigil.intention}</p>
                </div>
                <button
                  onClick={() => deleteSigil(sigil.id)}
                  className="absolute top-1.5 left-1.5 p-1 rounded-full bg-destructive/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}