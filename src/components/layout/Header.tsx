import React from 'react'
import { useLang } from '../../contexts/LanguageContext'
import { useAudio } from '../../contexts/AudioContext'
import { getMoonPhase, moonEmoji } from '../../utils/moonPhase'
import { Volume2, VolumeX, Menu } from 'lucide-react'

interface HeaderProps {
  title: string
  userName?: string
  userArchetype?: string
  userTradition?: string
  userAvatarUrl?: string
  onMenuClick?: () => void
  onProfileClick?: () => void
}

const ARCHETYPES_RU: Record<string, string> = {
  seeker: 'Искатель', witch: 'Ведьма', mage: 'Маг', shaman: 'Шаман', alchemist: 'Алхимик', mystic: 'Мистик',
  'daemon-worker': 'Демонолатор', 'spirit-worker': 'Духовник', oracle: 'Оракул', seer: 'Провидец', esotericist: 'Эзотерист',
  necromancer: 'Некромант', totemist: 'Тотемист', dreamwalker: 'Сновидец', enchanter: 'Заклинатель',
  'knowledge-keeper': 'Хранитель знаний', invoker: 'Инвокатор',
}

const TRADITIONS_RU: Record<string, string> = {
  eclectic: 'Эклектическая', hellenic: 'Эллинская', slavic: 'Славянская', norse: 'Скандинавская', daemonic: 'Демоническая',
  chaos: 'Хаос', ceremonial: 'Церемониальная', hermetic: 'Герметическая', kabbalistic: 'Каббалистическая', druidic: 'Друидическая',
  eastern: 'Восточная', shamanic: 'Шаманская', arcane: 'Арканическая', 'lunar-magic': 'Лунная магия',
  'light-magic': 'Светлая магия', 'dark-lunar': 'Темная / Лунная', angelic: 'Ангельская / Светлая', draconian: 'Драконианская',
}

const formatTitleCase = (value: string) => value.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

export function Header({ title, userName, userArchetype, userTradition, userAvatarUrl, onMenuClick, onProfileClick }: HeaderProps) {
  const { t, lang } = useLang()
  const { isMuted, setIsMuted, playUiSound } = useAudio()
  const moonPhase = getMoonPhase()
  const moonPhaseLabel = t.moonPhases[moonPhase]

  const archetypeLabel = userArchetype
    ? (lang === 'ru' ? (ARCHETYPES_RU[userArchetype] || userArchetype) : formatTitleCase(userArchetype))
    : null

  const traditionLabel = userTradition
    ? (lang === 'ru' ? (TRADITIONS_RU[userTradition] || userTradition) : formatTitleCase(userTradition))
    : null

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    const newMuted = !isMuted
    setIsMuted(newMuted)
    if (!newMuted) playUiSound('click')
  }

  const avatarLetter = userName ? userName.charAt(0).toUpperCase() : '?'

  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-border/40 bg-background/80 backdrop-blur-sm z-20">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg bg-secondary border border-border/40 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-sm sm:text-lg font-semibold text-foreground font-cinzel tracking-wide truncate max-w-[120px] sm:max-w-none">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Audio Toggle */}
        <button
          onClick={toggleMute}
          className="p-2 rounded-lg bg-secondary border border-border/40 text-muted-foreground hover:text-foreground transition-colors"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Moon Phase Widget */}
        <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] sm:text-xs">
          <span className="text-sm sm:text-base">{moonEmoji[moonPhase]}</span>
          <span className="text-primary font-medium hidden xs:inline">{moonPhaseLabel}</span>
        </div>

        {/* User avatar — clickable */}
        {userName && (
          <button
            onClick={onProfileClick}
            className="flex items-center gap-2 rounded-xl hover:bg-white/5 transition-colors p-1 -m-1"
            title={lang === 'ru' ? 'Мой профиль' : 'My profile'}
          >
            <div className="hidden md:flex flex-col items-end gap-1">
              <span className="text-xs text-foreground/90 max-w-[160px] truncate">{userName}</span>
              <div className="flex items-center gap-1">
                {archetypeLabel && (
                  <span className="px-1.5 py-0.5 rounded border border-primary/30 bg-primary/10 text-[10px] text-primary/90 uppercase tracking-wider">
                    {archetypeLabel}
                  </span>
                )}
                {traditionLabel && (
                  <span className="px-1.5 py-0.5 rounded border border-white/20 bg-white/5 text-[10px] text-muted-foreground uppercase tracking-wider">
                    {traditionLabel}
                  </span>
                )}
              </div>
            </div>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/40 shadow-[0_0_10px_hsl(var(--primary)/0.3)] flex-shrink-0">
              {userAvatarUrl ? (
                <img src={userAvatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-[hsl(var(--neon))] flex items-center justify-center text-xs font-bold text-white">
                  {avatarLetter}
                </div>
              )}
            </div>
          </button>
        )}
      </div>
    </header>
  )
}
