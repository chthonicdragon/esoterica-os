import React, { useState, useRef, useEffect } from 'react'
import { useLang } from '../contexts/LanguageContext'
import { Send, User, Loader2, Network, Compass } from 'lucide-react'
import { cn } from '../lib/utils'
import { askOpenRouter } from '../services/openRouterService'
import { mapAiErrorMessage } from '../lib/aiErrorMessages'
import { db } from '../lib/platformClient'
import { supabase } from '../lib/supabaseClient'
import { loadLocalState } from '../altar/altarStore'
import { loadGraph } from '../services/knowledgeGraphBridge'

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

interface KnowledgeGraphSnapshot {
  nodes: Array<{ id: string; name: string; type: string }>
  links: Array<{ source: string; target: string; relation: string }>
}

interface AIMentorProps {
  user: { id: string }
}

const CHAT_STORAGE_PREFIX = 'esoterica_mentor_chat_'

function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatMentorMessage(text: string): string {
  const safe = escapeHtml(text.trim())
  const lines = safe.split(/\r?\n/).map(l => l.trim())
  const html = lines
    .map(l => {
      if (!l) return '<br/>'
      const withBold = l.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      const withItalic = withBold.replace(/\*(.+?)\*/g, '<em>$1</em>')
      return `<p>${withItalic}</p>`
    })
    .join('')
  return html
}

function loadChatHistory(archetype: ArchetypeKey): Message[] {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_PREFIX + archetype)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.slice(-30) : []
  } catch { return [] }
}

function saveChatHistory(archetype: ArchetypeKey, messages: Message[]) {
  try {
    localStorage.setItem(CHAT_STORAGE_PREFIX + archetype, JSON.stringify(messages.slice(-30)))
  } catch { /* ignore */ }
}

async function buildPracticeContext(userId: string, lang: string): Promise<string> {
  const parts: string[] = []

  // Altar progression
  const state = loadLocalState()
  const p = state.progression
  parts.push(`Progression: Level ${p.level}, ${p.points} points, streak ${p.streak} days, ${p.totalRituals} rituals total.`)
  parts.push(`XP sources — ritual: ${p.ritualXp}, journal: ${p.journalXp}, knowledge: ${p.knowledgeXp}, altar: ${p.altarXp}.`)

  // Knowledge Graph stats
  const graph = loadGraph()
  if (graph.nodes.length > 0) {
    const types: Record<string, number> = {}
    graph.nodes.forEach(n => { types[n.type] = (types[n.type] || 0) + 1 })
    parts.push(`Knowledge Web: ${graph.nodes.length} nodes, ${graph.links.length} links. Types: ${JSON.stringify(types)}.`)
  }

  // Recent journal entries
  try {
    const { data } = await supabase
      .from('journals')
      .select('title, type, mood, createdAt')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
      .limit(3)
    if (data && data.length > 0) {
      parts.push('Recent journal entries: ' + data.map((e: any) => `"${e.title}" (${e.type}, ${e.mood || ''})`).join('; ') + '.')
    }
  } catch { /* ignore */ }

  // Recent rituals
  try {
    const rituals = await db.rituals.list({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      limit: 5,
    }) as any[]
    if (rituals.length > 0) {
      parts.push('Recent rituals: ' + rituals.map(r => `"${r.title}" (${r.type || 'general'})`).join('; ') + '.')
    }
  } catch { /* ignore */ }

  return parts.join('\n')
}

export default function AIMentor({ user }: AIMentorProps) {
  const { t, lang } = useLang()
  const [selectedArchetype, setSelectedArchetype] = useState<ArchetypeKey>('hecate')
  const [messages, setMessages] = useState<Message[]>(() => loadChatHistory('hecate'))
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const archetype = ARCHETYPES[selectedArchetype]
  const archetypeInfo = lang === 'ru' ? archetype.ru : archetype.en

  // Persist chat on every message change
  useEffect(() => {
    saveChatHistory(selectedArchetype, messages)
  }, [messages, selectedArchetype])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function getKnowledgeWebSnapshot(): KnowledgeGraphSnapshot | null {
    try {
      const raw = localStorage.getItem('esoteric_knowledge_web_v1')
      if (!raw) return null
      const parsed = JSON.parse(raw) as { nodes?: any[]; links?: any[] }
      if (!Array.isArray(parsed?.nodes) || !Array.isArray(parsed?.links)) return null

      return {
        nodes: parsed.nodes
          .filter(node => node?.id && node?.name && node?.type)
          .map(node => ({ id: String(node.id), name: String(node.name), type: String(node.type) })),
        links: parsed.links
          .filter(link => link?.source && link?.target && link?.relation)
          .map(link => ({ source: String(link.source), target: String(link.target), relation: String(link.relation) })),
      }
    } catch {
      return null
    }
  }

  async function analyzeKnowledgeWeb() {
    if (loading) return

    const snapshot = getKnowledgeWebSnapshot()
    if (!snapshot || snapshot.nodes.length === 0) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: lang === 'ru'
            ? 'Паутина пока пуста. Сначала добавьте описание в Паутина знаний, затем я смогу провести анализ.'
            : 'Your web is empty so far. Add some entries in Knowledge Web first, then I can analyze it.',
        },
      ])
      return
    }

    const summaryByType = snapshot.nodes.reduce<Record<string, number>>((acc, node) => {
      acc[node.type] = (acc[node.type] ?? 0) + 1
      return acc
    }, {})

    const topConnected = snapshot.nodes
      .map(node => {
        const degree = snapshot.links.reduce((acc, link) => {
          return acc + (link.source === node.id || link.target === node.id ? 1 : 0)
        }, 0)
        return { name: node.name, type: node.type, degree }
      })
      .sort((a, b) => b.degree - a.degree)
      .slice(0, 8)

    const userPrompt = lang === 'ru'
      ? `Сделай глубокий анализ моей паутины знаний.

Статистика:
- Узлы: ${snapshot.nodes.length}
- Связи: ${snapshot.links.length}
- По типам: ${JSON.stringify(summaryByType)}

Наиболее связанные сущности:
${topConnected.map(item => `- ${item.name} (${item.type}) — ${item.degree} связей`).join('\n')}

Дай ответ на русском в 4 блоках:
1) Главные паттерны
2) Слепые зоны и недостающие связи
3) Потенциальные усилители практики (что добавить)
4) Конкретные 3 шага на ближайшие ритуалы`
      : `Give a deep analysis of my knowledge web.

Stats:
- Nodes: ${snapshot.nodes.length}
- Links: ${snapshot.links.length}
- By type: ${JSON.stringify(summaryByType)}

Most connected entities:
${topConnected.map(item => `- ${item.name} (${item.type}) - ${item.degree} links`).join('\n')}

Respond in English in 4 blocks:
1) Main patterns
2) Blind spots and missing links
3) Practice amplifiers (what to add)
4) Concrete next 3 ritual steps`

    const userMsg: Message = {
      role: 'user',
      content: lang === 'ru' ? 'Проанализируй мою паутину знаний.' : 'Analyze my knowledge web.',
    }

    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const langInstruction = lang === 'ru' ? ' IMPORTANT: Always respond in Russian.' : ' Always respond in English.'
      const prompt = `${archetype.systemPrompt}${langInstruction}\n\n${userPrompt}\n\n${archetypeInfo.name}:`
      const text = await askOpenRouter(prompt)
      const cleaned = text.trim()
      if (!cleaned) throw new Error('empty_ai_response')
      setMessages(prev => [...prev, { role: 'assistant', content: cleaned }])
    } catch (e: any) {
      const reason = typeof e?.message === 'string' ? e.message : ''
      const detailed = mapAiErrorMessage(reason, lang as 'en' | 'ru', 'mentor')
      setMessages(prev => [...prev, { role: 'assistant', content: detailed }])
    } finally {
      setLoading(false)
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return

    const userMsg: Message = { role: 'user', content: input }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const practiceCtx = await buildPracticeContext(user.id, lang)
      const history = newMessages.slice(-10).map(m => `${m.role === 'user' ? 'Seeker' : archetypeInfo.name}: ${m.content}`).join('\n')
      const langInstruction = lang === 'ru' ? ' IMPORTANT: Always respond in Russian.' : ' Always respond in English.'
      const prompt = `${archetype.systemPrompt}${langInstruction}\n\nSeeker's practice context:\n${practiceCtx}\n\nConversation:\n${history}\n\n${archetypeInfo.name}:`

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

  async function analyzeMyPath() {
    if (loading) return
    setLoading(true)

    const userMsg: Message = {
      role: 'user',
      content: lang === 'ru' ? 'Проанализируй мой путь практики.' : 'Analyze my practice path.',
    }
    setMessages(prev => [...prev, userMsg])

    try {
      const practiceCtx = await buildPracticeContext(user.id, lang)
      const langInstruction = lang === 'ru' ? ' IMPORTANT: Always respond in Russian.' : ' Always respond in English.'
      const pathPrompt = lang === 'ru'
        ? `На основе контекста практики ниже дай персональный анализ в 4 блоках:
1) Сильные стороны практики
2) Что стоит развить (слабые зоны)
3) Рекомендации на следующую неделю
4) Конкретный ритуал, идеальный для текущего уровня`
        : `Based on the practice context below, give a personal analysis in 4 blocks:
1) Practice strengths
2) Areas to develop
3) Recommendations for the next week
4) A specific ritual ideal for the current level`

      const prompt = `${archetype.systemPrompt}${langInstruction}\n\nSeeker's practice context:\n${practiceCtx}\n\n${pathPrompt}\n\n${archetypeInfo.name}:`

      const text = await askOpenRouter(prompt)
      const cleaned = text.trim()
      if (!cleaned) throw new Error('empty_ai_response')
      setMessages(prev => [...prev, { role: 'assistant', content: cleaned }])
    } catch (e: any) {
      const reason = typeof e?.message === 'string' ? e.message : ''
      const detailed = mapAiErrorMessage(reason, lang as 'en' | 'ru', 'mentor')
      setMessages(prev => [...prev, { role: 'assistant', content: detailed }])
    } finally {
      setLoading(false)
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
              onClick={() => { setSelectedArchetype(key); setMessages(loadChatHistory(key)) }}
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
          <div className="ml-auto flex gap-1.5">
            <button
              onClick={analyzeMyPath}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-400 hover:bg-amber-500/20 disabled:opacity-50"
            >
              <Compass className="w-3.5 h-3.5" />
              {lang === 'ru' ? 'Мой путь' : 'My Path'}
            </button>
            <button
              onClick={analyzeKnowledgeWeb}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary hover:bg-primary/20 disabled:opacity-50"
            >
              <Network className="w-3.5 h-3.5" />
              {lang === 'ru' ? 'Анализ паутины' : 'Analyze Web'}
            </button>
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
              <div
                className={cn(
                  'rounded-2xl px-4 py-3 max-w-[88%] md:max-w-lg text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'rounded-tr-none bg-primary/15 border border-primary/20 text-foreground'
                    : 'rounded-tl-none bg-card border border-border/40 text-foreground'
                )}
                {...(msg.role === 'assistant' ? {
                  dangerouslySetInnerHTML: { __html: formatMentorMessage(msg.content) }
                } : {})}
              >
                {msg.role === 'user' ? msg.content : null}
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
