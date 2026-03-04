import React, { useEffect, useState } from 'react'
import { useLang } from '../contexts/LanguageContext'
import { blink } from '../blink/client'
import { Plus, FlameKindling, Flame, X, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '../lib/utils'

interface AltarObject {
  id: string
  type: string
  emoji: string
  label: string
  x: number
  y: number
}

interface Altar {
  id: string
  name: string
  tradition: string
  description?: string
  objects: AltarObject[]
  ritualState: string
}

const ALTAR_OBJECTS = [
  { type: 'candle', emoji: '🕯️', label: 'Candle' },
  { type: 'incense', emoji: '🌿', label: 'Incense' },
  { type: 'crystal', emoji: '💎', label: 'Crystal' },
  { type: 'skull', emoji: '💀', label: 'Skull' },
  { type: 'pentacle', emoji: '⭐', label: 'Pentacle' },
  { type: 'chalice', emoji: '🍷', label: 'Chalice' },
  { type: 'athame', emoji: '🗡️', label: 'Athame' },
  { type: 'book', emoji: '📖', label: 'Grimoire' },
  { type: 'mirror', emoji: '🪞', label: 'Mirror' },
  { type: 'flower', emoji: '🌹', label: 'Offering' },
]

interface AltarsProps {
  user: { id: string }
}

export function Altars({ user }: AltarsProps) {
  const { t, lang } = useLang()
  const [altars, setAltars] = useState<Altar[]>([])
  const [activeAltar, setActiveAltar] = useState<Altar | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newTradition, setNewTradition] = useState('eclectic')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAltars() }, [user.id])

  async function loadAltars() {
    try {
      const data = await blink.db.altars.list({ where: { userId: user.id } }) as Altar[]
      const parsed = data.map(a => ({ ...a, objects: typeof a.objects === 'string' ? JSON.parse(a.objects) : a.objects }))
      setAltars(parsed)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  async function createAltar() {
    if (!newName.trim()) return
    try {
      const altar = await blink.db.altars.create({
        userId: user.id,
        name: newName,
        tradition: newTradition,
        objects: JSON.stringify([]),
        ritualState: 'inactive',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }) as Altar
      altar.objects = []
      setAltars(prev => [...prev, altar])
      setActiveAltar(altar)
      setShowCreate(false)
      setNewName('')
      toast.success(lang === 'ru' ? 'Алтарь создан' : 'Altar created')
    } catch (e) { toast.error(t.error) }
  }

  async function addObject(objTemplate: typeof ALTAR_OBJECTS[0]) {
    if (!activeAltar) return
    const newObj: AltarObject = {
      id: `obj_${Date.now()}`,
      type: objTemplate.type,
      emoji: objTemplate.emoji,
      label: objTemplate.label,
      x: 20 + Math.random() * 60,
      y: 20 + Math.random() * 60,
    }
    const updatedObjects = [...activeAltar.objects, newObj]
    try {
      await blink.db.altars.update(activeAltar.id, {
        objects: JSON.stringify(updatedObjects),
        updatedAt: new Date().toISOString(),
      })
      const updated = { ...activeAltar, objects: updatedObjects }
      setActiveAltar(updated)
      setAltars(prev => prev.map(a => a.id === updated.id ? updated : a))
    } catch (e) { toast.error(t.error) }
  }

  async function removeObject(objId: string) {
    if (!activeAltar) return
    const updatedObjects = activeAltar.objects.filter(o => o.id !== objId)
    await blink.db.altars.update(activeAltar.id, {
      objects: JSON.stringify(updatedObjects),
      updatedAt: new Date().toISOString(),
    })
    const updated = { ...activeAltar, objects: updatedObjects }
    setActiveAltar(updated)
    setAltars(prev => prev.map(a => a.id === updated.id ? updated : a))
  }

  async function toggleRitual() {
    if (!activeAltar) return
    const newState = activeAltar.ritualState === 'active' ? 'inactive' : 'active'
    await blink.db.altars.update(activeAltar.id, { ritualState: newState, updatedAt: new Date().toISOString() })
    const updated = { ...activeAltar, ritualState: newState }
    setActiveAltar(updated)
    setAltars(prev => prev.map(a => a.id === updated.id ? updated : a))
    toast.success(newState === 'active' ? (lang === 'ru' ? 'Ритуал начат' : 'Ritual begun') : (lang === 'ru' ? 'Ритуал завершён' : 'Ritual ended'))
  }

  async function deleteAltar(id: string) {
    await blink.db.altars.delete(id)
    setAltars(prev => prev.filter(a => a.id !== id))
    if (activeAltar?.id === id) setActiveAltar(null)
    toast.success(lang === 'ru' ? 'Алтарь удалён' : 'Altar deleted')
  }

  if (loading) return <div className="p-6 text-muted-foreground">{t.loading}</div>

  return (
    <div className="p-6 flex gap-6 h-full">
      {/* Altar list */}
      <div className="w-64 flex-shrink-0 space-y-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">{t.myAltars}</h2>
          <button onClick={() => setShowCreate(true)} className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {showCreate && (
          <div className="rounded-xl bg-card border border-primary/30 p-4 space-y-3">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder={t.altarName}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50"
            />
            <select
              value={newTradition}
              onChange={e => setNewTradition(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none"
            >
              {Object.entries(t.traditions).map(([key, val]) => (
                <option key={key} value={key}>{val}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button onClick={createAltar} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium hover:bg-primary/90 transition-colors">{t.save}</button>
              <button onClick={() => setShowCreate(false)} className="px-3 rounded-lg border border-border text-muted-foreground hover:text-foreground text-sm transition-colors">{t.cancel}</button>
            </div>
          </div>
        )}

        {altars.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/40 p-6 text-center">
            <p className="text-xs text-muted-foreground">{t.noAltars}</p>
          </div>
        ) : altars.map(altar => (
          <div
            key={altar.id}
            onClick={() => setActiveAltar(altar)}
            className={cn(
              'rounded-xl border p-3 cursor-pointer transition-all duration-200 group',
              activeAltar?.id === altar.id ? 'border-primary/40 bg-primary/10' : 'border-border/40 bg-card hover:border-primary/20'
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{altar.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{(t.traditions as Record<string, string>)[altar.tradition] || altar.tradition}</p>
              </div>
              <div className="flex items-center gap-1">
                {altar.ritualState === 'active' && (
                  <div className="w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_6px_theme(colors.orange.400)] animate-pulse" />
                )}
                <button
                  onClick={e => { e.stopPropagation(); deleteAltar(altar.id) }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Altar canvas */}
      {activeAltar ? (
        <div className="flex-1 flex flex-col gap-4">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold font-cinzel text-foreground">{activeAltar.name}</h2>
              <p className="text-xs text-muted-foreground capitalize">{(t.traditions as Record<string, string>)[activeAltar.tradition]}</p>
            </div>
            <button
              onClick={toggleRitual}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-300',
                activeAltar.ritualState === 'active'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30'
                  : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20'
              )}
            >
              <Flame className={cn('w-4 h-4', activeAltar.ritualState === 'active' && 'animate-pulse')} />
              {activeAltar.ritualState === 'active' ? t.endRitual : t.beginRitual}
            </button>
          </div>

          {/* Canvas */}
          <div className={cn(
            'flex-1 relative rounded-2xl border overflow-hidden min-h-[400px] transition-all duration-500',
            activeAltar.ritualState === 'active'
              ? 'border-orange-500/40 shadow-[0_0_40px_hsl(30,100%,50%/0.15)]'
              : 'border-border/30'
          )}>
            <div className="absolute inset-0 bg-gradient-to-b from-background via-[hsl(var(--primary)/0.03)] to-background" />
            {/* Sacred geometry overlay */}
            <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50%" cy="50%" r="38%" fill="none" stroke="currentColor" />
              <circle cx="50%" cy="50%" r="28%" fill="none" stroke="currentColor" />
              <polygon points="50,15 90,80 10,80" fill="none" stroke="currentColor" transform="translate(0,0) scale(1)" style={{ transform: 'scale(0.7) translate(21%, 15%)' }} />
            </svg>

            {/* Glow effect when active */}
            {activeAltar.ritualState === 'active' && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-orange-400/60 animate-float"
                    style={{
                      left: `${10 + i * 15}%`,
                      bottom: `${10 + Math.sin(i) * 20}%`,
                      animationDelay: `${i * 0.4}s`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Altar objects */}
            {activeAltar.objects.map((obj) => (
              <div
                key={obj.id}
                className="absolute group"
                style={{ left: `${obj.x}%`, top: `${obj.y}%`, transform: 'translate(-50%,-50%)' }}
              >
                <div className={cn(
                  'text-3xl cursor-pointer select-none transition-transform hover:scale-125',
                  activeAltar.ritualState === 'active' && 'drop-shadow-[0_0_8px_rgba(255,150,50,0.8)]'
                )}>
                  {obj.emoji}
                </div>
                <button
                  onClick={() => removeObject(obj.id)}
                  className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-destructive text-white items-center justify-center hidden group-hover:flex text-xs"
                >
                  <X className="w-2 h-2" />
                </button>
              </div>
            ))}

            {activeAltar.objects.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <FlameKindling className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground/50">{lang === 'ru' ? 'Добавьте священные объекты' : 'Add sacred objects'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Object palette */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">{t.altarObjects}</p>
            <div className="flex gap-2 flex-wrap">
              {ALTAR_OBJECTS.map(obj => (
                <button
                  key={obj.type}
                  onClick={() => addObject(obj)}
                  className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg bg-card border border-border/40 hover:border-primary/30 hover:bg-primary/5 transition-all text-xs"
                  title={obj.label}
                >
                  <span className="text-xl">{obj.emoji}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FlameKindling className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground">{altars.length === 0 ? t.noAltars : (lang === 'ru' ? 'Выберите алтарь' : 'Select an altar')}</p>
          </div>
        </div>
      )}
    </div>
  )
}
