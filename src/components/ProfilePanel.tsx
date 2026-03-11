import React, { useEffect, useRef, useState } from 'react'
import { useUser } from '../contexts/UserContext'
import { useLang } from '../contexts/LanguageContext'
import { profileService } from '../services/profileService'
import { X, Camera, Check, Loader2, Users, Crown, Globe, Lock, Edit2, LogOut } from 'lucide-react'
import { auth } from '../lib/platformClient'
import { cn } from '../lib/utils'

interface ProfilePanelProps {
  open: boolean
  onClose: () => void
  onNavigateCovens?: () => void
}

const ARCHETYPES_RU: Record<string, string> = {
  seeker: 'Искатель', witch: 'Ведьма', mage: 'Маг', shaman: 'Шаман', alchemist: 'Алхимик',
  mystic: 'Мистик', 'daemon-worker': 'Демонолатор', 'spirit-worker': 'Духовник',
  oracle: 'Оракул', seer: 'Провидец', esotericist: 'Эзотерист', necromancer: 'Некромант',
  totemist: 'Тотемист', dreamwalker: 'Сновидец', enchanter: 'Заклинатель',
  'knowledge-keeper': 'Хранитель знаний', invoker: 'Инвокатор',
}
const TRADITIONS_RU: Record<string, string> = {
  eclectic: 'Эклектическая', hellenic: 'Эллинская', slavic: 'Славянская', norse: 'Скандинавская',
  daemonic: 'Демоническая', chaos: 'Хаос', ceremonial: 'Церемониальная', hermetic: 'Герметическая',
  kabbalistic: 'Каббалистическая', druidic: 'Друидическая', eastern: 'Восточная', shamanic: 'Шаманская',
  arcane: 'Арканическая', 'lunar-magic': 'Лунная магия', 'light-magic': 'Светлая магия',
  angelic: 'Ангельская / Светлая', draconian: 'Драконианская',
}
const fmt = (s: string) => s.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')

interface UserCoven { role: string; coven: { id: string; name: string; is_public: boolean; leader_id: string } }

export function ProfilePanel({ open, onClose, onNavigateCovens }: ProfilePanelProps) {
  const { user, updateLocalProfile } = useUser()
  const { lang } = useLang()
  const fileRef = useRef<HTMLInputElement>(null)

  const [editingName, setEditingName] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [covens, setCovens] = useState<UserCoven[]>([])
  const [covensLoading, setCovensLoading] = useState(false)

  useEffect(() => {
    if (open && user) {
      setDraftName(user.displayName || '')
      setCovensLoading(true)
      profileService.getUserCovens(user.id)
        .then(setCovens)
        .catch(() => {})
        .finally(() => setCovensLoading(false))
    }
  }, [open, user])

  const handleSaveName = async () => {
    if (!user || !draftName.trim()) return
    setSavingName(true)
    try {
      await profileService.updateDisplayName(user.id, draftName.trim())
      updateLocalProfile({ displayName: draftName.trim() })
      setEditingName(false)
    } catch {
    } finally {
      setSavingName(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (file.size > 3 * 1024 * 1024) {
      setAvatarError(lang === 'ru' ? 'Файл слишком большой (макс. 3 МБ)' : 'File too large (max 3 MB)')
      return
    }
    setAvatarError(null)
    setUploadingAvatar(true)
    try {
      const url = await profileService.uploadAvatar(user.id, file)
      updateLocalProfile({ avatarUrl: url })
    } catch (err: any) {
      setAvatarError(
        lang === 'ru'
          ? 'Ошибка загрузки. Создайте бакет "avatars" в Supabase Storage.'
          : 'Upload failed. Create an "avatars" bucket in Supabase Storage.'
      )
    } finally {
      setUploadingAvatar(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  if (!user) return null

  const avatarLetter = (user.displayName || user.email || '?').charAt(0).toUpperCase()
  const archetypeLabel = user.archetype
    ? (lang === 'ru' ? (ARCHETYPES_RU[user.archetype] || user.archetype) : fmt(user.archetype))
    : null
  const traditionLabel = user.tradition
    ? (lang === 'ru' ? (TRADITIONS_RU[user.tradition] || user.tradition) : fmt(user.tradition))
    : null

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full max-w-sm z-50 flex flex-col',
          'bg-[hsl(var(--sidebar))] border-l border-border/50',
          'transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 flex-shrink-0">
          <h2 className="text-sm font-bold font-cinzel tracking-wider text-foreground">
            {lang === 'ru' ? 'Профиль' : 'Profile'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
          {/* Avatar + name */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/40 shadow-[0_0_20px_hsl(var(--primary)/0.3)]">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-[hsl(var(--neon))] flex items-center justify-center text-3xl font-bold text-white">
                    {avatarLetter}
                  </div>
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary border-2 border-background flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
                title={lang === 'ru' ? 'Загрузить аватар' : 'Upload avatar'}
              >
                {uploadingAvatar
                  ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                  : <Camera className="w-3.5 h-3.5 text-white" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            {avatarError && (
              <p className="text-xs text-destructive text-center max-w-[240px]">{avatarError}</p>
            )}

            {/* Display name */}
            <div className="w-full">
              {editingName ? (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={draftName}
                    onChange={e => setDraftName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false) }}
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-primary/40 text-sm text-foreground outline-none focus:border-primary/60"
                    maxLength={50}
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={savingName || !draftName.trim()}
                    className="px-3 py-2 rounded-lg bg-primary text-white text-xs disabled:opacity-50 flex items-center gap-1"
                  >
                    {savingName ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => setEditingName(false)} className="px-3 py-2 rounded-lg bg-white/5 border border-border/40 text-muted-foreground text-xs">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-base font-semibold text-foreground">{user.displayName || user.email}</span>
                  <button
                    onClick={() => { setDraftName(user.displayName || ''); setEditingName(true) }}
                    className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {user.email && (
                <p className="text-xs text-muted-foreground text-center mt-1">{user.email}</p>
              )}
            </div>
          </div>

          {/* Archetype / Tradition */}
          {(archetypeLabel || traditionLabel) && (
            <div className="flex gap-2 flex-wrap justify-center">
              {archetypeLabel && (
                <span className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs text-primary font-medium">
                  {archetypeLabel}
                </span>
              )}
              {traditionLabel && (
                <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/15 text-xs text-muted-foreground">
                  {traditionLabel}
                </span>
              )}
            </div>
          )}

          <div className="border-t border-border/40" />

          {/* Covens */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary/70" />
                <span className="text-sm font-semibold text-foreground">
                  {lang === 'ru' ? 'Ковены' : 'Covens'}
                </span>
              </div>
              {onNavigateCovens && (
                <button
                  onClick={() => { onClose(); onNavigateCovens() }}
                  className="text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  {lang === 'ru' ? 'Все ковены →' : 'All covens →'}
                </button>
              )}
            </div>

            {covensLoading ? (
              <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs">{lang === 'ru' ? 'Загрузка...' : 'Loading...'}</span>
              </div>
            ) : covens.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-xs text-muted-foreground mb-3">
                  {lang === 'ru' ? 'Вы не состоите ни в одном ковене' : 'You are not in any coven'}
                </p>
                {onNavigateCovens && (
                  <button
                    onClick={() => { onClose(); onNavigateCovens() }}
                    className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs hover:bg-primary/20 transition-colors"
                  >
                    {lang === 'ru' ? 'Найти или создать ковен' : 'Find or create a coven'}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {covens.map(({ role, coven }) => (
                  <div key={coven.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-border/40 hover:border-primary/20 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                      {coven.is_public
                        ? <Globe className="w-4 h-4 text-primary/70" />
                        : <Lock className="w-4 h-4 text-muted-foreground/70" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{coven.name}</p>
                    </div>
                    {role === 'leader' && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 flex-shrink-0">
                        <Crown className="w-3 h-3 text-primary" />
                        <span className="text-[10px] text-primary">{lang === 'ru' ? 'Лидер' : 'Leader'}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border/40" />

          {/* Sign out */}
          <button
            onClick={() => auth.signOut()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border/40 text-sm text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {lang === 'ru' ? 'Выйти' : 'Sign out'}
          </button>
        </div>
      </div>
    </>
  )
}
