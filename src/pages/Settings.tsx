import React, { useEffect, useState } from 'react'
import { useLang } from '../contexts/LanguageContext'
import { db } from '../lib/platformClient'
import toast from 'react-hot-toast'
import { Globe, User, Sparkles, Layers } from 'lucide-react'
import { cn } from '../lib/utils'

const ARCHETYPES = [
  'seeker',
  'esotericist',
  'witch',
  'mage',
  'light-mage',
  'shaman',
  'healer',
  'seer',
  'oracle',
  'necromancer',
  'totemist',
  'dreamwalker',
  'enchanter',
  'knowledge-keeper',
  'invoker',
  'alchemist',
  'mystic',
  'daemon-worker',
  'spirit-worker',
]

const ARCHETYPES_EN: Record<string, string> = {
  seeker: 'Seeker',
  esotericist: 'Esotericist',
  witch: 'Witch',
  mage: 'Mage',
  'light-mage': 'Light Magic Practitioner',
  shaman: 'Shaman',
  healer: 'Healer',
  seer: 'Seer',
  oracle: 'Oracle',
  necromancer: 'Necromancer',
  totemist: 'Totemist',
  dreamwalker: 'Dreamwalker',
  enchanter: 'Enchanter',
  'knowledge-keeper': 'Knowledge Keeper',
  invoker: 'Invoker',
  alchemist: 'Alchemist',
  mystic: 'Mystic',
  'daemon-worker': 'Daemon Worker',
  'spirit-worker': 'Spirit Worker',
}

const ARCHETYPES_RU: Record<string, string> = {
  seeker: 'Искатель',
  esotericist: 'Эзотерист',
  witch: 'Ведьма',
  mage: 'Маг',
  'light-mage': 'Практик Светлой Магии',
  shaman: 'Шаман',
  healer: 'Целитель',
  seer: 'Провидец',
  oracle: 'Оракул',
  necromancer: 'Некромант',
  totemist: 'Тотемист',
  dreamwalker: 'Сновидец',
  enchanter: 'Заклинатель',
  'knowledge-keeper': 'Хранитель знаний',
  invoker: 'Инвокатор',
  alchemist: 'Алхимик',
  mystic: 'Мистик',
  'daemon-worker': 'Демонолатор',
  'spirit-worker': 'Духовник',
}

const TRADITIONS = [
  'eclectic',
  'esotericism',
  'light-magic',
  'shamanism',
  'folk-magic',
  'ceremonial',
  'hermetic',
  'kabbalistic',
  'druidic',
  'eastern',
  'arcane',
  'lunar-magic',
  'dark-lunar',
  'angelic',
  'draconian',
  'hellenic',
  'slavic',
  'norse',
  'pagan',
  'daemonic',
  'chaos',
]

const TRADITIONS_LABELS_EN: Record<string, string> = {
  eclectic: 'Eclectic',
  esotericism: 'Esotericism',
  'light-magic': 'Light Magic',
  shamanism: 'Shamanism',
  'folk-magic': 'Folk Magic',
  ceremonial: 'Ceremonial',
  hermetic: 'Hermetic',
  kabbalistic: 'Kabbalistic',
  druidic: 'Druidic',
  eastern: 'Eastern',
  arcane: 'Arcane',
  'lunar-magic': 'Lunar Magic',
  'dark-lunar': 'Dark Lunar',
  angelic: 'Angelic',
  draconian: 'Draconian',
  hellenic: 'Hellenic',
  slavic: 'Slavic',
  norse: 'Norse',
  pagan: 'Pagan',
  daemonic: 'Daemonic',
  chaos: 'Chaos',
}

const TRADITIONS_LABELS_RU: Record<string, string> = {
  eclectic: 'Эклектическая',
  esotericism: 'Эзотеризм',
  'light-magic': 'Светлая магия',
  shamanism: 'Шаманизм',
  'folk-magic': 'Народная магия',
  ceremonial: 'Церемониальная',
  hermetic: 'Герметическая',
  kabbalistic: 'Каббалистическая',
  druidic: 'Друидическая',
  eastern: 'Восточная',
  arcane: 'Арканическая',
  'lunar-magic': 'Лунная магия',
  'dark-lunar': 'Темная лунная магия',
  angelic: 'Ангельская магия',
  draconian: 'Драконианская',
  hellenic: 'Эллинская',
  slavic: 'Славянская',
  norse: 'Скандинавская',
  pagan: 'Языческая',
  daemonic: 'Демоническая',
  chaos: 'Хаос',
}

interface SettingsProps {
  user: { id: string; email?: string; displayName?: string }
}

export function Settings({ user }: SettingsProps) {
  const { t, lang, setLang } = useLang()
  const [displayName, setDisplayName] = useState(user.displayName || '')
  const [archetype, setArchetype] = useState('seeker')
  const [tradition, setTradition] = useState('eclectic')
  const [profileId, setProfileId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadProfile() }, [user.id])

  async function loadProfile() {
    try {
      const profiles = await db.userProfiles.list({ where: { userId: user.id } }) as Array<{ id: string; displayName?: string; archetype: string; tradition: string; language: string }>
      if (profiles.length > 0) {
        const p = profiles[0]
        setProfileId(p.id)
        setDisplayName(p.displayName || '')
        setArchetype(p.archetype || 'seeker')
        setTradition(p.tradition || 'eclectic')
        if (p.language === 'ru' || p.language === 'en') setLang(p.language)
      }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  async function saveSettings() {
    try {
      if (profileId) {
        await db.userProfiles.update(profileId, {
          displayName,
          archetype,
          tradition,
          language: lang,
          updatedAt: new Date().toISOString(),
        })
      } else {
        const p = await db.userProfiles.create({
          userId: user.id,
          displayName,
          archetype,
          tradition,
          language: lang,
          initiationLevel: 1,
          practiceStreak: 0,
          totalRituals: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }) as { id: string }
        setProfileId(p.id)
      }
      toast.success(t.settingsSaved)
    } catch (e) { toast.error(t.error) }
  }

  if (loading) return <div className="p-6 text-muted-foreground">{t.loading}</div>

  return (
    <div className="p-6 max-w-2xl space-y-6 animate-fade-in">
      <h2 className="text-lg font-bold font-cinzel text-foreground">{t.settingsTitle}</h2>

      {/* Language */}
      <div className="rounded-2xl bg-card border border-border/40 p-5 space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">{t.language}</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(['en', 'ru'] as const).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={cn(
                'py-3 px-4 rounded-xl border text-sm font-medium transition-all',
                lang === l
                  ? 'bg-primary/15 border-primary/40 text-primary'
                  : 'border-border/40 text-muted-foreground hover:border-primary/20 hover:text-foreground'
              )}
            >
              {l === 'en' ? '🇬🇧 English' : '🇷🇺 Русский'}
            </button>
          ))}
        </div>
      </div>

      {/* Display Name */}
      <div className="rounded-2xl bg-card border border-border/40 p-5 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <User className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">{t.displayName}</h3>
        </div>
        <input
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          placeholder={user.email?.split('@')[0] || 'Seeker'}
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50"
        />
        <p className="text-xs text-muted-foreground">{user.email}</p>
      </div>

      {/* Archetype */}
      <div className="rounded-2xl bg-card border border-border/40 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">{t.archetype}</h3>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {ARCHETYPES.map(a => (
            <button
              key={a}
              onClick={() => setArchetype(a)}
              className={cn(
                'py-2 px-3 rounded-xl border text-xs font-medium transition-all',
                archetype === a
                  ? 'bg-primary/15 border-primary/40 text-primary'
                  : 'border-border/40 text-muted-foreground hover:border-primary/20'
              )}
            >
              {lang === 'ru' ? ARCHETYPES_RU[a] || a : ARCHETYPES_EN[a] || a}
            </button>
          ))}
        </div>
      </div>

      {/* Tradition */}
      <div className="rounded-2xl bg-card border border-border/40 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">{t.yourTradition}</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {TRADITIONS.map(tr => (
            <button
              key={tr}
              onClick={() => setTradition(tr)}
              className={cn(
                'py-2 px-3 rounded-xl border text-xs font-medium transition-all capitalize',
                tradition === tr
                  ? 'bg-primary/15 border-primary/40 text-primary'
                  : 'border-border/40 text-muted-foreground hover:border-primary/20'
              )}
            >
              {lang === 'ru' ? TRADITIONS_LABELS_RU[tr] || tr : TRADITIONS_LABELS_EN[tr] || tr}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={saveSettings}
        className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-medium hover:bg-primary/90 transition-colors"
      >
        {t.saveSettings}
      </button>
    </div>
  )
}

