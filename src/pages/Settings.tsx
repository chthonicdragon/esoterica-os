import React, { useEffect, useState } from 'react'
import { useLang } from '../contexts/LanguageContext'
import { useAudio } from '../contexts/AudioContext'
import { supabase } from '../lib/supabaseClient'
import toast from 'react-hot-toast'
import { Globe, User, Sparkles, Layers, Lock, ChevronDown, Volume2, VolumeX, Music, Palette } from 'lucide-react'
import { cn } from '../lib/utils'
import { db, auth } from '../lib/platformClient'

import { getNavTheme, setNavTheme, type NavTheme } from '../lib/navTheme'

const ADMIN_CODE = 'esoterica2025' // Код администратора
const ARCHETYPES = [
  'seeker',
  'witch',
  'mage',
  'shaman',
  'alchemist',
  'mystic',
  'daemon-worker',
  'spirit-worker',
  'oracle',
  'seer',
  'esotericist',
  'necromancer',
  'totemist',
  'dreamwalker',
  'enchanter',
  'knowledge-keeper',
  'invoker',
  'astral-explorer',
  'psychomancer',
  'nature-guide',
  'ceremonial-mage',
]
const ARCHETYPES_RU: Record<string, string> = {
  seeker: 'Искатель',
  witch: 'Ведьма',
  mage: 'Маг',
  shaman: 'Шаман',
  alchemist: 'Алхимик',
  mystic: 'Мистик',
  'daemon-worker': 'Демонолатор',
  'spirit-worker': 'Духовник',
  oracle: 'Оракул',
  seer: 'Провидец',
  esotericist: 'Эзотерист',
  necromancer: 'Некромант',
  totemist: 'Тотемист',
  dreamwalker: 'Сновидец',
  enchanter: 'Заклинатель',
  'knowledge-keeper': 'Хранитель знаний',
  invoker: 'Инвокатор',
  'astral-explorer': 'Астральный исследователь',
  psychomancer: 'Психомант',
  'nature-guide': 'Природный проводник',
  'ceremonial-mage': 'Церемониальный маг',
}

const TRADITIONS = [
  'eclectic',
  'hellenic',
  'slavic',
  'norse',
  'daemonic',
  'chaos',
  'ceremonial',
  'hermetic',
  'kabbalistic',
  'druidic',
  'eastern',
  'shamanic',
  'arcane',
  'lunar-magic',
  'light-magic',
  'dark',
  'angelic',
  'draconian',
  'elemental-magic',
  'solar-magic',
  'astral-magic',
]
const TRADITIONS_RU: Record<string, string> = {
  eclectic: 'Эклектическая',
  hellenic: 'Эллинская',
  slavic: 'Славянская',
  norse: 'Скандинавская',
  daemonic: 'Демоническая',
  chaos: 'Хаос',
  ceremonial: 'Церемониальная',
  hermetic: 'Герметическая',
  kabbalistic: 'Каббалистическая',
  druidic: 'Друидическая',
  eastern: 'Восточная',
  shamanic: 'Шаманская',
  arcane: 'Арканическая',
  'lunar-magic': 'Лунная магия',
  'light-magic': 'Светлая магия',
  dark: 'Тёмная',
  angelic: 'Ангельская / Светлая',
  draconian: 'Драконианская',
  'elemental-magic': 'Элементальная магия',
  'solar-magic': 'Солярная магия',
  'astral-magic': 'Астральная магия',
}
const TRADITIONS_EN: Record<string, string> = {
  eclectic: 'Eclectic',
  hellenic: 'Hellenic',
  slavic: 'Slavic',
  norse: 'Norse',
  daemonic: 'Daemonic',
  chaos: 'Chaos',
  ceremonial: 'Ceremonial',
  hermetic: 'Hermetic',
  kabbalistic: 'Kabbalistic',
  druidic: 'Druidic',
  eastern: 'Eastern',
  shamanic: 'Shamanic',
  arcane: 'Arcane',
  'lunar-magic': 'Lunar Magic',
  'light-magic': 'Light Magic',
  dark: 'Dark',
  angelic: 'Angelic',
  draconian: 'Draconian',
  'elemental-magic': 'Elemental Magic',
  'solar-magic': 'Solar Magic',
  'astral-magic': 'Astral Magic',
}

const ZODIAC_SIGNS_EASTERN = [
  'rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake',
  'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig'
]
const ZODIAC_SIGNS_EASTERN_RU: Record<string, string> = {
  rat: 'Крыса', ox: 'Бык', tiger: 'Тигр', rabbit: 'Кролик',
  dragon: 'Дракон', snake: 'Змея', horse: 'Лошадь', goat: 'Коза',
  monkey: 'Обезьяна', rooster: 'Петух', dog: 'Собака', pig: 'Свинья'
}

interface SettingsProps {
  user: { id: string; email?: string; displayName?: string }
}

export function Settings({ user }: SettingsProps) {
  const { t, lang, setLang } = useLang()
  const { config, setVolume, setIsMuted, toggleSfx, toggleMusic } = useAudio()
  const [displayName, setDisplayName] = useState(user.displayName || '')
  const [archetype, setArchetype] = useState('seeker')
  const [tradition, setTradition] = useState('eclectic')
  const [easternZodiac, setEasternZodiac] = useState('')
  const [profileId, setProfileId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isForumAdmin, setIsForumAdmin] = useState(false)
  const [adminCodeInput, setAdminCodeInput] = useState('')
  const [showAdminCodeInput, setShowAdminCodeInput] = useState(false)
  const [openSection, setOpenSection] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [navTheme, setNavThemeState] = useState<NavTheme>(getNavTheme)

  function handleNavThemeChange(theme: NavTheme) {
    setNavTheme(theme)
    setNavThemeState(theme)
    // Update stored page so next reload respects the new theme default
    try {
      localStorage.setItem(
        'esoterica_current_page_v1',
        theme === 'crossroads' ? 'crossroads' : 'dashboard'
      )
    } catch {}
    toast.success(
      theme === 'crossroads'
        ? (lang === 'ru' ? '✦ Тема «Перекрёсток Гекаты» активирована' : '✦ Hecate\'s Crossroads theme activated')
        : (lang === 'ru' ? '✦ Тема «Esoterica OS» активирована' : '✦ Esoterica OS theme activated'),
      { duration: 2200 }
    )
  }

  useEffect(() => { loadProfile() }, [user.id])

  async function loadProfile() {
    try {
      console.log('📋 Loading profile for user:', user.id)
      const { data: profiles, error } = await supabase
        .from('userProfiles')
        .select('*')
        .eq('userId', user.id)

      if (error) throw error

      if (profiles && profiles.length > 0) {
        const p = profiles[0] as { id: string; displayName?: string; archetype: string; tradition: string; language: string }
        console.log('✅ Profile loaded:', { displayName: p.displayName, archetype: p.archetype })
        setProfileId(p.id)
        setDisplayName(p.displayName || '')
        setArchetype(p.archetype || 'seeker')
        setTradition(p.tradition || 'eclectic')
        // Try load eastern zodiac from local storage if not in DB schema yet
        const ez = localStorage.getItem(`esoterica_eastern_zodiac_${user.id}`)
        if (ez) setEasternZodiac(ez)
        
        // Загружаем админский статус из localStorage
        const isAdmin = localStorage.getItem(`forum_admin_${user.id}`) === 'true'
        console.log('📍 Admin status from localStorage:', isAdmin)
        setIsForumAdmin(isAdmin)
        
        if (p.language === 'ru' || p.language === 'en') setLang(p.language)
      }
    } catch (e) { 
      console.error('❌ Error loading profile:', e) 
    } finally { 
      setLoading(false) 
    }
  }

  async function saveSettings() {
    try {
      console.log('💾 Saving settings...', { displayName, archetype, tradition, easternZodiac })
      
      // Save eastern zodiac locally for now (until DB migration)
      localStorage.setItem(`esoterica_eastern_zodiac_${user.id}`, easternZodiac)

      if (profileId) {
        await supabase.from('userProfiles').update({
          displayName,
          archetype,
          tradition,
          language: lang,
          updatedAt: new Date().toISOString(),
        }).eq('id', profileId)
        console.log('✅ Profile updated')
      } else {
        const { data: p, error: createError } = await supabase
          .from('userProfiles')
          .insert([{
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
          }])
          .select()
          .single()
        if (createError) throw createError
        if (p) setProfileId(p.id)
        console.log('✅ Profile created')
      }
      toast.success(t.settingsSaved)
    } catch (e: any) { 
      console.error('❌ Error saving settings:', e)
      toast.error(t.error) 
    }
  }

  async function handleAdminCodeSubmit() {
    if (adminCodeInput === ADMIN_CODE) {
      console.log('✅ Admin code correct!')
      setIsForumAdmin(true)
      setAdminCodeInput('')
      setShowAdminCodeInput(false)
      
      // Сохраняем в localStorage немедленно
      localStorage.setItem(`forum_admin_${user.id}`, 'true')
      console.log('💾 Admin status saved to localStorage')
      
      toast.success(lang === 'ru' ? '✅ Код верный!' : '✅ Code correct!')
      toast.success(lang === 'ru' ? '✅ Вы стали администратором форума!' : '✅ You are now a forum admin!')
    } else {
      console.log('❌ Admin code incorrect')
      setAdminCodeInput('')
      toast.error(lang === 'ru' ? '❌ Неверный код' : '❌ Invalid code')
    }
  }

  async function deleteAccount() {
    if (deleting) return
    const mustType = lang === 'ru' ? 'УДАЛИТЬ' : 'DELETE'
    if (confirmText !== mustType) {
      toast.error(lang === 'ru' ? `Введите "${mustType}" для подтверждения` : `Type "${mustType}" to confirm`)
      return
    }
    setDeleting(true)
    try {
      // 1) Удаляем пользовательские данные во всех разделах
      const safeBulkDelete = async (entity: keyof typeof db) => {
        try {
          const rows = await (db as any)[entity].list({ where: { userId: { eq: user.id } }, limit: 500 }).catch(() => []) as any[]
          for (const row of rows) { await (db as any)[entity].delete(row.id).catch(() => false) }
        } catch {}
      }
      await Promise.all([
        safeBulkDelete('rituals'),
        safeBulkDelete('journals'),
        safeBulkDelete('sigils'),
        safeBulkDelete('forumPosts'),
        safeBulkDelete('forumTopics'),
        safeBulkDelete('forumLikes'),
        safeBulkDelete('forumNotifications'),
        safeBulkDelete('forumReports'),
      ])

      // 2) Удаляем профиль
      try {
        const profiles = await db.userProfiles.list({ where: { userId: { eq: user.id } }, limit: 1 })
        if (profiles && profiles[0]?.id) await db.userProfiles.delete(profiles[0].id)
      } catch {}

      // 3) Локальные данные
      try {
        localStorage.removeItem('esoterica_altar_v2')
        localStorage.removeItem('esoteric_knowledge_web_v1')
        localStorage.removeItem('esoterica_geo_coords')
        localStorage.removeItem(`forum_admin_${user.id}`)
      } catch {}

      // 4) Выход из аккаунта
      await auth.logout()

      toast.success(lang === 'ru' ? 'Аккаунт и данные удалены' : 'Account and data removed')
      // Перезагружаем приложение, чтобы вернуться на экран входа
      setTimeout(() => { window.location.href = '/' }, 800)
    } catch (e) {
      console.error('Delete account error', e)
      toast.error(lang === 'ru' ? 'Не удалось удалить аккаунт' : 'Failed to delete account')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <div className="p-6 text-muted-foreground">{t.loading}</div>

  return (
    <div className="p-6 max-w-2xl space-y-6 animate-fade-in">
      <h2 className="text-lg font-bold font-cinzel text-foreground">{t.settingsTitle}</h2>

      {/* Sound Settings */}
      <div className="rounded-2xl bg-card border border-border/40 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          {config.muted ? <VolumeX className="w-4 h-4 text-muted-foreground" /> : <Volume2 className="w-4 h-4 text-primary" />}
          <h3 className="text-sm font-semibold text-foreground">{lang === 'ru' ? 'Звук и Атмосфера' : 'Sound & Atmosphere'}</h3>
        </div>

        {/* Master Volume */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{lang === 'ru' ? 'Громкость' : 'Volume'}</span>
            <span>{Math.round(config.volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={config.volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setIsMuted(!config.muted)}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all gap-2",
              config.muted 
                ? "bg-muted/20 border-border text-muted-foreground" 
                : "bg-primary/10 border-primary/30 text-primary"
            )}
          >
            {config.muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            {lang === 'ru' ? 'Звук' : 'Master'}
          </button>

          <button
            onClick={toggleMusic}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all gap-2",
              config.musicMuted 
                ? "bg-muted/20 border-border text-muted-foreground" 
                : "bg-primary/10 border-primary/30 text-primary"
            )}
          >
            <Music className="w-5 h-5" />
            {lang === 'ru' ? 'Музыка' : 'Music'}
          </button>

          <button
            onClick={toggleSfx}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all gap-2",
              config.sfxMuted 
                ? "bg-muted/20 border-border text-muted-foreground" 
                : "bg-primary/10 border-primary/30 text-primary"
            )}
          >
            <Sparkles className="w-5 h-5" />
            {lang === 'ru' ? 'Эффекты' : 'SFX'}
          </button>
        </div>
      </div>

      {/* Navigation Theme */}
      <div className="rounded-2xl bg-card border border-border/40 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Palette className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            {lang === 'ru' ? 'Тема навигации' : 'Navigation Theme'}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground -mt-1">
          {lang === 'ru'
            ? 'Выберите экран, который открывается при входе в приложение'
            : 'Choose the screen shown when you open the app'}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {/* Hecate's Crossroads theme */}
          <button
            data-testid="theme-crossroads"
            onClick={() => handleNavThemeChange('crossroads')}
            className={cn(
              'relative flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition-all',
              navTheme === 'crossroads'
                ? 'bg-violet-500/10 border-violet-500/50 text-violet-300'
                : 'border-border/40 text-muted-foreground hover:border-primary/25 hover:text-foreground'
            )}
          >
            {navTheme === 'crossroads' && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-violet-400" />
            )}
            <span className="text-2xl">🌙</span>
            <div>
              <p className="text-xs font-semibold font-cinzel tracking-wide">
                {lang === 'ru' ? 'Перекрёсток Гекаты' : "Hecate's Crossroads"}
              </p>
              <p className="text-[10px] opacity-60 mt-0.5 leading-tight">
                {lang === 'ru' ? 'Мистический перекрёсток' : 'Mystical crossroads'}
              </p>
            </div>
          </button>

          {/* Standard theme */}
          <button
            data-testid="theme-standard"
            onClick={() => handleNavThemeChange('standard')}
            className={cn(
              'relative flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition-all',
              navTheme === 'standard'
                ? 'bg-primary/10 border-primary/50 text-primary'
                : 'border-border/40 text-muted-foreground hover:border-primary/25 hover:text-foreground'
            )}
          >
            {navTheme === 'standard' && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
            )}
            <span className="text-2xl">✦</span>
            <div>
              <p className="text-xs font-semibold font-cinzel tracking-wide">Esoterica OS</p>
              <p className="text-[10px] opacity-60 mt-0.5 leading-tight">
                {lang === 'ru' ? 'Стандартная панель' : 'Standard dashboard'}
              </p>
            </div>
          </button>
        </div>
        {navTheme === 'crossroads' && (
          <p className="text-[10px] text-violet-400/60 text-center">
            {lang === 'ru'
              ? '✦ При входе открывается Перекрёсток. Из любой страницы вернитесь через кнопку ⊕'
              : '✦ Crossroads opens on login. Return from any page via the ⊕ button'}
          </p>
        )}
      </div>

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
        <div className="grid grid-cols-3 gap-2">
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
              {lang === 'ru'
                ? ARCHETYPES_RU[a] || a
                : a.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
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
        <div className="grid grid-cols-2 gap-2">
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
              {lang === 'ru' ? TRADITIONS_RU[tr] || tr : TRADITIONS_EN[tr] || tr.charAt(0).toUpperCase() + tr.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Eastern Zodiac */}
      <div className="rounded-2xl bg-card border border-border/40 p-5 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">{lang === 'ru' ? 'Восточный Знак' : 'Eastern Zodiac'}</h3>
        </div>
        <div className="relative">
          <select
            value={easternZodiac}
            onChange={(e) => setEasternZodiac(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50 appearance-none"
          >
            <option value="">{lang === 'ru' ? 'Не выбрано' : 'Not selected'}</option>
            {ZODIAC_SIGNS_EASTERN.map((z) => (
              <option key={z} value={z}>
                {lang === 'ru' ? ZODIAC_SIGNS_EASTERN_RU[z] || z : z.charAt(0).toUpperCase() + z.slice(1)}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Admin Code */}
      <div className="rounded-2xl bg-card border border-border/40 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              {lang === 'ru' ? 'Статус администратора форума' : 'Forum Admin Status'}
            </h3>
          </div>
          <div className={cn('text-xs font-medium px-2 py-1 rounded', isForumAdmin ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground')}>
            {isForumAdmin ? (lang === 'ru' ? '👑 Администратор' : '👑 Admin') : (lang === 'ru' ? 'Пользователь' : 'User')}
          </div>
        </div>
        
        {!isForumAdmin && (
          <>
            {!showAdminCodeInput ? (
              <button
                onClick={() => setShowAdminCodeInput(true)}
                className="w-full bg-primary/10 border border-primary/30 text-primary rounded-xl py-2 text-xs font-medium hover:bg-primary/20 transition-colors"
              >
                {lang === 'ru' ? '🔑 Ввести код администратора' : '🔑 Enter Admin Code'}
              </button>
            ) : (
              <div className="flex gap-2">
                <input
                  type="password"
                  value={adminCodeInput}
                  onChange={(e) => setAdminCodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdminCodeSubmit()}
                  placeholder={lang === 'ru' ? 'Введите код...' : 'Enter code...'}
                  className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50"
                  autoFocus
                />
                <button
                  onClick={handleAdminCodeSubmit}
                  className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-xs font-medium hover:bg-primary/90 transition-colors"
                >
                  ✓
                </button>
                <button
                  onClick={() => { setShowAdminCodeInput(false); setAdminCodeInput('') }}
                  className="bg-muted text-muted-foreground rounded-xl px-3 py-2 text-xs font-medium hover:bg-muted/80 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <button
        onClick={saveSettings}
        className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-medium hover:bg-primary/90 transition-colors"
      >
        {t.saveSettings}
      </button>

      {/* Danger Zone */}
      <div className="rounded-2xl bg-card border border-destructive/40 p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Lock className="w-4 h-4 text-destructive" />
          <h3 className="text-sm font-semibold text-foreground">
            {lang === 'ru' ? 'Удаление аккаунта' : 'Delete Account'}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          {lang === 'ru'
            ? 'Это безвозвратно удалит ваши ритуалы, журналы, сигиллы и профиль. Введите УДАЛИТЬ для подтверждения.'
            : 'This will permanently remove your rituals, journals, sigils and profile. Type DELETE to confirm.'}
        </p>
        <input
          value={confirmText}
          onChange={e => setConfirmText(e.target.value.toUpperCase())}
          placeholder={lang === 'ru' ? 'УДАЛИТЬ' : 'DELETE'}
          className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm outline-none focus:border-destructive/60"
        />
        <button
          onClick={deleteAccount}
          disabled={deleting}
          className="w-full py-2 rounded-xl bg-destructive/80 text-white text-sm font-medium hover:bg-destructive transition-colors disabled:opacity-60"
        >
          {deleting
            ? (lang === 'ru' ? 'Удаление…' : 'Deleting…')
            : (lang === 'ru' ? 'Удалить аккаунт' : 'Delete my account')}
        </button>
      </div>

      {/* ── Information sections ─────────────────────────────────────────── */}
      <div className="pt-2 space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 px-1">
          {lang === 'ru' ? 'Информация о платформе' : 'Platform Information'}
        </p>

        {[
          {
            id: 'about',
            icon: <Info className="w-4 h-4" />,
            title: lang === 'ru' ? 'О приложении' : 'About the App',
            content: (
              <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                <p>
                  {lang === 'ru'
                    ? 'EsotericaOS объединяет магию, духовные практики и технологии, позволяя управлять знаниями, алтарями, ритуалами и потоками энергии в интерактивной цифровой среде.'
                    : 'EsotericaOS unites magic, spiritual practices, and technology — letting you manage knowledge, altars, rituals, and energy flows in an interactive digital environment.'}
                </p>
                <ul className="space-y-1.5 pl-3">
                  {[
                    lang === 'ru' ? '🕸 Паутина знаний — визуализация сущностей, связей и потоков энергии с аналитикой и ритуальным слоем' : '🕸 Knowledge Web — visualise entities, links & energy flows with analytics and ritual layer',
                    lang === 'ru' ? '🕯 3D-Алтари: создание, декорирование, ритуалы и система прогрессии с XP и уровнями' : '🕯 3D Altars: create, decorate, perform rituals & progression system with XP and levels',
                    lang === 'ru' ? '✦ Трекер ритуалов: планирование, выполнение с таймером, лунные фазы и история' : '✦ Ritual Tracker: planning, timed execution, moon phases & history',
                    lang === 'ru' ? '🤖 ИИ Наставник: чат с архетипами (Геката, Тот, Один), анализ практики, память контекста' : '🤖 AI Mentor: chat with archetypes (Hecate, Thoth, Odin), practice analysis, context memory',
                    lang === 'ru' ? '✨ Лаборатория сигил: генерация сигил из намерений, зарядка, экспорт SVG, интеграция с XP' : '✨ Sigil Lab: generate sigils from intentions, charge, export SVG, XP integration',
                    lang === 'ru' ? '📓 Журнал снов: записи снов и заметки с автоматическим извлечением символов в паутину знаний' : '📓 Dream Journal: dream entries & notes with automatic symbol extraction to the knowledge web',
                    lang === 'ru' ? '💬 Форум: обсуждения, публикации, комментарии, репутация и уведомления' : '💬 Forum: discussions, posts, comments, reputation & notifications',
                    lang === 'ru' ? '📈 Система прогрессии: единый XP из ритуалов, журнала, паутины и алтарей, 10 уровней, разблокировки' : '📈 Progression System: unified XP from rituals, journal, web & altars, 10 levels, unlocks',
                    lang === 'ru' ? '🌙 Лунный календарь: фазы луны с энергетическими рекомендациями на главной' : '🌙 Moon Calendar: moon phases with energy recommendations on dashboard',
                    lang === 'ru' ? '🏅 Бейджи и достижения: награды за вклад и активность в сообществе' : '🏅 Badges & achievements: rewards for contribution and community activity',
                    lang === 'ru' ? '🛒 Маркетплейс: эзотерические товары и ресурсы (в разработке)' : '🛒 Marketplace: esoteric goods and resources (in development)',
                    lang === 'ru' ? '🌐 Мультиязычность: полная поддержка English / Русский' : '🌐 Multilingual: full English / Russian support',
                  ].map((item, i) => (
                    <li key={i} className="flex gap-2">{item}</li>
                  ))}
                </ul>
                <p className="text-muted-foreground/70 italic">
                  {lang === 'ru'
                    ? 'Целевая аудитория: практики магии, исследователи эзотерики, духовные учителя и ученики (16+).'
                    : 'Audience: magic practitioners, esoteric researchers, spiritual teachers and students (16+).'}
                </p>
              </div>
            ),
          },
          {
            id: 'rules',
            icon: <BookOpen className="w-4 h-4" />,
            title: lang === 'ru' ? 'Правила сообщества' : 'Community Rules',
            content: (
              <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                {[
                  [lang === 'ru' ? '1. Уважение' : '1. Respect', lang === 'ru' ? 'Относитесь с уважением к другим участникам. Оскорбления, травля и дискриминация запрещены.' : 'Treat all members with respect. Insults, harassment, and discrimination are prohibited.'],
                  [lang === 'ru' ? '2. Законность' : '2. Legality', lang === 'ru' ? 'Запрещено поощрять или описывать противоправные действия, причиняющие вред третьим лицам.' : 'Do not promote or describe illegal actions that harm third parties.'],
                  [lang === 'ru' ? '3. Конфиденциальность' : '3. Privacy', lang === 'ru' ? 'Не публикуйте чужие личные данные без явного согласия.' : 'Do not publish others\' personal data without explicit consent.'],
                  [lang === 'ru' ? '4. Тематичность' : '4. Relevance', lang === 'ru' ? 'Контент должен соответствовать эзотерическому, образовательному или исследовательскому контексту.' : 'Content must fit the esoteric, educational, or research context of the platform.'],
                  [lang === 'ru' ? '5. Честность и авторство' : '5. Honesty & Authorship', lang === 'ru' ? 'Указывайте источники; запрещено выдавать чужой контент за свой.' : 'Cite your sources; do not claim others\' content as your own.'],
                  [lang === 'ru' ? '6. Безопасность практик' : '6. Practice Safety', lang === 'ru' ? 'Опасные практики публикуются только с предупреждениями о безопасности.' : 'Dangerous practices must include clear safety warnings.'],
                ].map(([title, body], i) => (
                  <div key={i}>
                    <span className="font-semibold text-foreground/80">{title}: </span>
                    <span>{body}</span>
                  </div>
                ))}
                <p className="pt-1 text-muted-foreground/60 italic">
                  {lang === 'ru'
                    ? 'Нарушения → предупреждение, скрытие контента или блокировка аккаунта.'
                    : 'Violations → warning, content removal, or account suspension.'}
                </p>
              </div>
            ),
          },
          {
            id: 'privacy',
            icon: <Shield className="w-4 h-4" />,
            title: lang === 'ru' ? 'Политика конфиденциальности' : 'Privacy Policy',
            content: (
              <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                <div>
                  <p className="font-semibold text-foreground/80 mb-1">{lang === 'ru' ? 'Что мы собираем:' : 'What we collect:'}</p>
                  <ul className="space-y-1 pl-3">
                    <li>{lang === 'ru' ? '— Профиль: имя/псевдоним, email, настройки аккаунта' : '— Profile: name/alias, email, account settings'}</li>
                    <li>{lang === 'ru' ? '— Контент: записи дневников, алтари, ритуалы' : '— Content: journal entries, altars, rituals'}</li>
                    <li>{lang === 'ru' ? '— Метаданные: связи в графе знаний, статистика использования' : '— Metadata: knowledge graph links, usage statistics'}</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-foreground/80 mb-1">{lang === 'ru' ? 'Хранение и безопасность:' : 'Storage & security:'}</p>
                  <p>{lang === 'ru' ? 'Данные хранятся в Supabase/Postgres. Для приватных ресурсов применяется Row-Level Security (RLS).' : 'Data is stored in Supabase/Postgres. Row-Level Security (RLS) is applied to private resources.'}</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground/80 mb-1">{lang === 'ru' ? 'Ваш контроль:' : 'Your control:'}</p>
                  <p>{lang === 'ru' ? 'Вы управляете видимостью записей. Запрос на экспорт или удаление данных — через настройки аккаунта.' : 'You control the visibility of your entries. Request data export or deletion through account settings.'}</p>
                </div>
                <p className="text-muted-foreground/70 italic">
                  {lang === 'ru'
                    ? 'Мы не продаём ваши личные данные третьим лицам.'
                    : 'We do not sell your personal data to third parties.'}
                </p>
              </div>
            ),
          },
          {
            id: 'terms',
            icon: <FileText className="w-4 h-4" />,
            title: lang === 'ru' ? 'Условия использования' : 'Terms of Use',
            content: (
              <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                {[
                  [lang === 'ru' ? 'Право собственности' : 'Ownership', lang === 'ru' ? 'Вы сохраняете авторские права на свой контент.' : 'You retain copyright to your content.'],
                  [lang === 'ru' ? 'Лицензия платформе' : 'Platform licence', lang === 'ru' ? 'Размещая контент, вы предоставляете EsotericaOS неисключительное право использовать его внутри платформы.' : 'By posting content you grant EsotericaOS a non-exclusive right to display it within the platform.'],
                  [lang === 'ru' ? 'Ограничение ответственности' : 'Limitation of liability', lang === 'ru' ? 'Информация носит образовательный характер. Платформа не несёт ответственности за последствия практик.' : 'Information is educational. The platform is not liable for the consequences of practices.'],
                  [lang === 'ru' ? 'Запрещённый контент' : 'Prohibited content', lang === 'ru' ? 'Контент, нарушающий закон или правила сообщества, удаляется.' : 'Content violating laws or community rules will be removed.'],
                  [lang === 'ru' ? 'Изменения условий' : 'Changes to terms', lang === 'ru' ? 'Об изменениях пользователи уведомляются заблаговременно.' : 'Users are notified in advance of any changes.'],
                ].map(([title, body], i) => (
                  <div key={i}>
                    <span className="font-semibold text-foreground/80">{title}: </span>
                    <span>{body}</span>
                  </div>
                ))}
              </div>
            ),
          },
          {
            id: 'faq',
            icon: <HelpCircle className="w-4 h-4" />,
            title: 'FAQ',
            content: (
              <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                {[
                  [
                    lang === 'ru' ? 'Как работает AI Mentor?' : 'How does AI Mentor work?',
                    lang === 'ru' ? 'AI Mentor анализирует ваши записи и граф знаний, предлагает идеи, объясняет техники. Не даёт медицинских или незаконных инструкций.' : 'AI Mentor analyses your entries and knowledge graph, suggests ideas, and explains techniques. It does not provide medical or illegal instructions.',
                  ],
                  [
                    lang === 'ru' ? 'Могу ли я сделать запись приватной?' : 'Can I make an entry private?',
                    lang === 'ru' ? 'Да — у каждой записи есть настройки видимости: публично, приватно, ограниченная группа.' : 'Yes — each entry has visibility settings: public, private, or limited group.',
                  ],
                  [
                    lang === 'ru' ? 'Где хранятся мои данные?' : 'Where is my data stored?',
                    lang === 'ru' ? 'В Supabase/Postgres с применением RLS для приватных данных.' : 'In Supabase/Postgres with RLS applied to private data.',
                  ],
                  [
                    lang === 'ru' ? 'Как удалить аккаунт?' : 'How do I delete my account?',
                    lang === 'ru' ? 'В настройках аккаунта есть опция запроса удаления. Перед удалением можно экспортировать данные.' : 'Account settings include a deletion request option. You can export your data before deletion.',
                  ],
                  [
                    lang === 'ru' ? 'Что делать при нарушении правил?' : 'What if someone breaks the rules?',
                    lang === 'ru' ? 'Пометьте контент и отправьте жалобу. Модераторы рассмотрят её в установленный срок.' : 'Flag the content and submit a report. Moderators will review it within the set timeframe.',
                  ],
                ].map(([q, a], i) => (
                  <div key={i} className="space-y-0.5">
                    <p className="font-semibold text-foreground/80">Q: {q}</p>
                    <p className="pl-3 text-muted-foreground/80">A: {a}</p>
                  </div>
                ))}
              </div>
            ),
          },
        ].map(({ id, icon, title, content }) => (
          <div key={id} className="rounded-2xl bg-card border border-border/40 overflow-hidden">
            <button
              onClick={() => setOpenSection(openSection === id ? null : id)}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <span className="text-primary">{icon}</span>
                {title}
              </div>
              <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform duration-200', openSection === id && 'rotate-180')} />
            </button>
            {openSection === id && (
              <div className="px-5 pb-4 pt-1 border-t border-border/30">
                {content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
