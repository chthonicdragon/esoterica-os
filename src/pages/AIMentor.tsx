import React, { useState, useRef, useEffect } from 'react'
import { useLang } from '../contexts/LanguageContext'
import { Send, User, Loader2 } from 'lucide-react'
import { cn } from '../lib/utils'
import { askOpenRouter } from '../services/openRouterService'
import { mapAiErrorMessage } from '../lib/aiErrorMessages'

const ARCHETYPES = {
  hecate: {
    en: { name: 'Hecate', title: 'Keeper of Crossroads', color: 'text-purple-400', emoji: '🌙' },
    ru: { name: 'Геката', title: 'Хранительница Перекрёстков', color: 'text-purple-400', emoji: '🌙' },
    systemPrompt: `You are Hecate, the ancient goddess of the crossroads, magic, and the liminal spaces between worlds. You speak with deep wisdom, poetic mystery, and compassion. You guide the seeker through symbolic and psychological landscapes. You never give medical, legal, or financial advice. You honor free will and personal sovereignty. Speak in mystical but clear language. Reference moon phases, threshold moments, and transformation. Always end responses with a question or reflection that empowers the seeker's own discernment.`,
  },
  hermes: {
    en: { name: 'Hermes', title: 'Messenger of Mysteries', color: 'text-blue-400', emoji: '⚡' },
    ru: { name: 'Гермес', title: 'Вестник Тайн', color: 'text-blue-400', emoji: '⚡' },
    systemPrompt: `You are Hermes, guide of souls and messenger between worlds. You are witty, intelligent, and bridge the gap between the mundane and divine. You translate symbols, interpret signs, and help navigate the invisible currents of life. You speak with precision and a touch of humor. You help decode dreams, synchronicities, and esoteric symbols. Never give medical or legal advice. Always respect the seeker's autonomy.`,
  },
  morrigan: {
    en: { name: 'Morrigan', title: 'Weaver of Fate', color: 'text-red-400', emoji: '🐦‍⬛' },
    ru: { name: 'Морриган', title: 'Ткачиха Судьбы', color: 'text-red-400', emoji: '🐦‍⬛' },
    systemPrompt: `You are the Morrigan, the great queen of fate, battle, and sovereignty. You speak truth without softening it. You call the seeker to face their shadows, claim their power, and transform through difficulty. You are fierce but never cruel. You honor those who face their fears with courage. You speak about cycles, death and rebirth, and the sacred nature of endings. Never give medical or legal advice.`,
  },
  odin: {
    en: { name: 'Odin', title: 'Seeker of Wisdom', color: 'text-amber-400', emoji: '🦅' },
    ru: { name: 'Один', title: 'Искатель Мудрости', color: 'text-amber-400', emoji: '🦅' },
    systemPrompt: `You are Odin, the Allfather, who sacrificed his eye for wisdom and hung on the world tree for the runes. You speak with gravitas, depth, and earned wisdom. You ask piercing questions that reveal hidden truths. You speak of sacrifice, discipline, and the long view. You reference runes, wyrd (fate), and cosmic patterns. Never give medical or legal advice. Guide through questions as much as answers.`,
  },
  lilith: {
    en: { name: 'Lilith', title: 'Sovereign of Self', color: 'text-rose-400', emoji: '🌹' },
    ru: { name: 'Лилит', title: 'Владычица Себя', color: 'text-rose-400', emoji: '🌹' },
    systemPrompt: `You are Lilith, the first woman who refused to submit, the embodiment of primal sovereignty, shadow work, and authentic self-expression. You speak about reclaiming power, integrating shadow, setting boundaries, and radical self-acceptance. You challenge societal conditioning and support the seeker in owning their full nature. You speak with confidence, warmth, and psychological depth. Never give medical or legal advice.`,
  },
}

type ArchetypeKey = keyof typeof ARCHETYPES

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AIMentorProps {
  user: { id: string }
}

export function AIMentor({ user }: AIMentorProps) {
  const { t, lang } = useLang()
  const [selectedArchetype, setSelectedArchetype] = useState<ArchetypeKey>('hecate')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const archetype = ARCHETYPES[selectedArchetype]
  const archetypeInfo = lang === 'ru' ? archetype.ru : archetype.en

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || loading) return

    const userMsg: Message = { role: 'user', content: input }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const history = newMessages.slice(-10).map(m => `${m.role === 'user' ? 'Seeker' : archetypeInfo.name}: ${m.content}`).join('\n')
      const langInstruction = lang === 'ru' ? ' IMPORTANT: Always respond in Russian.' : ' Always respond in English.'
      const prompt = `${archetype.systemPrompt}${langInstruction}\n\nConversation:\n${history}\n\n${archetypeInfo.name}:`

      const text = await askOpenRouter(prompt)
      const cleaned = text.trim()
      if (!cleaned) {
        throw new Error('empty_ai_response')
      }

      const assistantMsg: Message = { role: 'assistant', content: cleaned }
      setMessages(prev => [...prev, assistantMsg])
    } catch (e: any) {
      const reason = typeof e?.message === 'string' ? e.message : ''
      const detailed = mapAiErrorMessage(reason, lang as 'en' | 'ru', 'mentor')

      setMessages(prev => [...prev, { role: 'assistant', content: detailed }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex h-full min-w-0 flex-col md:flex-row">
      {/* Archetype selector */}
      <div className="w-full md:w-56 flex-shrink-0 border-b md:border-b-0 md:border-r border-border/40 p-3 md:p-4">
        <p className="text-xs text-muted-foreground mb-2 md:mb-3">{t.selectArchetype}</p>
        <div className="flex md:block gap-2 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0">
          {(Object.keys(ARCHETYPES) as ArchetypeKey[]).map(key => {
          const info = lang === 'ru' ? ARCHETYPES[key].ru : ARCHETYPES[key].en
          return (
            <button
              key={key}
              onClick={() => { setSelectedArchetype(key); setMessages([]) }}
              className={cn(
                'min-w-[170px] md:min-w-0 md:w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all',
                selectedArchetype === key
                  ? 'bg-primary/15 border border-primary/30'
                  : 'hover:bg-white/5 border border-transparent'
              )}
            >
              <span className="text-lg">{info.emoji}</span>
              <div>
                <p className={cn('text-xs font-semibold', info.color)}>{info.name}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{info.title}</p>
              </div>
            </button>
          )
          })}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mentor header */}
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-border/40 flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xl')}>
            {archetypeInfo.emoji}
          </div>
          <div>
            <p className={cn('font-semibold', archetypeInfo.color)}>{archetypeInfo.name}</p>
            <p className="text-xs text-muted-foreground">{archetypeInfo.title}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-start gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm flex-shrink-0">
                {archetypeInfo.emoji}
              </div>
              <div className="rounded-2xl rounded-tl-none bg-card border border-border/40 px-4 py-3 max-w-[88%] md:max-w-lg">
                <p className="text-sm text-foreground leading-relaxed">
                  {lang === 'ru'
                    ? `Я ${archetypeInfo.name}. Чем я могу помочь вам сегодня, искатель? Спрашивайте о символах, снах, ритуалах или о пути трансформации.`
                    : `I am ${archetypeInfo.name}. How may I guide you today, seeker? Ask about symbols, dreams, rituals, or the path of transformation.`
                  }
                </p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={cn('flex items-start gap-3 animate-fade-in', msg.role === 'user' ? 'flex-row-reverse' : '')}>
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0',
                msg.role === 'user'
                  ? 'bg-primary/20 border border-primary/30'
                  : 'bg-card border border-border/40'
              )}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-primary" /> : archetypeInfo.emoji}
              </div>
              <div className={cn(
                'rounded-2xl px-4 py-3 max-w-[88%] md:max-w-lg text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'rounded-tr-none bg-primary/15 border border-primary/20 text-foreground'
                  : 'rounded-tl-none bg-card border border-border/40 text-foreground'
              )}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-card border border-border/40 flex items-center justify-center text-sm flex-shrink-0">
                {archetypeInfo.emoji}
              </div>
              <div className="rounded-2xl rounded-tl-none bg-card border border-border/40 px-4 py-3">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Disclaimer */}
        <p className="px-4 md:px-6 text-[10px] text-muted-foreground/60 italic">{t.mentorDisclaimer}</p>

        {/* Input */}
        <div className="p-3 md:p-4 border-t border-border/40">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.askMentor}
              className="flex-1 min-w-0 bg-card border border-border/40 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50 resize-none max-h-32 min-h-[44px]"
              rows={1}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
