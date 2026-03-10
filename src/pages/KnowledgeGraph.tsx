import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Send, Database, Share2, Info, Loader2, X,
  Fingerprint, Tag, Layers, Download, Trash2, Search,
  Filter, Eye, EyeOff, Link as LinkIcon, Activity,
  FileJson, FileSpreadsheet, Image as ImageIcon, Upload,
  Zap, ChevronDown, Maximize2, Minimize2, RotateCcw
} from 'lucide-react'
import { extractGraph, GraphData, Node, Link, suggestConnections, suggestConnectionsLocal } from '../services/openRouterService'
import { extractGraphLocally } from '../services/localExtract'
import GraphVisualization from '../components/GraphVisualization'
import AnalyticsPanel from '../components/AnalyticsPanel'
import { SigilGenerator } from '../components/SigilGenerator'
import { useIsMobile } from '../hooks/use-mobile'
import KnowledgeWebGuideModal from '../components/KnowledgeWebGuideModal'
import { useLang } from '../contexts/LanguageContext'
import { getKnowledgeWeavePoints, grantProgressionPoints, syncProgressionToDb } from '../altar/altarStore'
import { mapAiErrorMessage } from '../lib/aiErrorMessages'
import { SpiderWebIcon } from '../components/icons/SpiderWebIcon'
import { syncGraph, pushToRemote } from '../services/knowledgeGraphSync'
import { getRelationLabel } from '../lib/relationLabels'
import { MythologyService, type MythologyEntity } from '../services/magicalDataService'
import { MythScanService, type MythScanResult } from '../services/MythScanService'
import { MythReviewUI } from '../components/MythReviewUI'

const STORAGE_KEY = 'esoteric_knowledge_web_v1'
const HISTORY_KEY = 'esoteric_knowledge_web_history_v1'
const ALL_TYPES = ['deity', 'spirit', 'ritual', 'symbol', 'concept', 'place', 'creature', 'artifact', 'spell', 'sigil', 'epithet']
const TYPE_LABELS: Record<string, { en: string; ru: string }> = {
  deity: { en: 'Deity', ru: 'Божество' },
  spirit: { en: 'Spirit', ru: 'Дух' },
  ritual: { en: 'Ritual', ru: 'Ритуал' },
  symbol: { en: 'Symbol', ru: 'Символ' },
  concept: { en: 'Concept', ru: 'Концепт' },
  place: { en: 'Place', ru: 'Место' },
  creature: { en: 'Creature', ru: 'Существо' },
  artifact: { en: 'Artifact', ru: 'Артефакт' },
  spell: { en: 'Spell', ru: 'Заклинание' },
  sigil: { en: 'Sigil', ru: 'Сигилл' },
  epithet: { en: 'Epithet', ru: 'Эпитет' },
}

type WebHistoryEvent = {
  id: string
  date: string
  kind: 'weave' | 'merge' | 'myth_scan' | 'ai_help' | 'edit' | 'delete' | 'preset_import'
  summary: string
}

const PANTHEONS = ['Greek', 'Goetia', 'Egyptian', 'Norse', 'Chaos', 'Folk']
const PLANETS = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon']
const ELEMENTS = ['Fire', 'Water', 'Air', 'Earth', 'Spirit']
const OFFERINGS = ['incense', 'wine', 'blood', 'honey', 'coins', 'candles']

const translations = {
  en: {
    subtitle: "Magical Knowledge Web",
    searchPlaceholder: "Search entities...",
    filters: "Filters",
    ritualLayer: "Ritual Layer",
    inputPlaceholder: "Describe a deity, a ritual, or a place of power...",
    weaveBtn: "Weave",
    nodes: "Nodes",
    links: "Links",
    downloadJson: "Download JSON",
    exportCsv: "Export CSV",
    exportPng: "Export PNG",
    importJsons: "Import JSONs",
    analytics: "Analytics",
    clearTooltip: "Clear Graph",
    clearConfirm: "Are you sure you want to clear the entire web? This action cannot be undone.",
    importSuccess: "Successfully imported {count} file(s).",
    error: "Failed to extract entities. Check your API key and try again.",
    entityDetails: "Entity Details",
    name: "Name",
    type: "Type",
    relation: "Relation",
    source: "Source",
    target: "Target",
    ritualText: "Description / Ritual Text",
    markAsRitual: "Mark as Ritual",
    ritualName: "Ritual Name (optional)",
    exportRitual: "Export Ritual JSON",
    updateWeb: "Reorganize Web",
    resetWeb: "Reset Web",
    updateSuccess: "Web updated: {count} nodes merged, links recalculated.",
    xpEarned: "Knowledge weave strengthened (+{xp} XP).",
    resetConfirm: "Are you sure you want to reset the entire web? Data will be lost.",
    close: "Close",
    powerFlows: "Power Flows",
    flowSpeed: "Flow Speed",
    flowIntensity: "Intensity",
    flowThickness: "Thickness",
    hideWeak: "Hide weak flows",
    vizSettings: "Visualization Settings",
    expand: "Expand",
    shrink: "Shrink",
    ritualPreviewTitle: "Ritual preview before weaving",
    ritualPreviewHint: "The full ritual text will be preserved in the ritual node. Suggested tags are shown below for quick verification.",
    ritualPreviewTags: "Suggested tags",
    ritualPreviewEmptyTags: "No obvious tags found yet. AI will still process the full text.",
    ritualPreviewCancel: "Cancel",
    ritualPreviewConfirm: "Send to AI",
    ritualTags: "Ritual Tags",
    activeLinks: "Active Links",
    noRitualTags: "No tags extracted yet for this ritual.",
    noActiveLinks: "No active links found for this ritual.",
    pantheons: "Pantheons",
    planetary: "Planetary",
    elements: "Elements",
    offerings: "Offerings",
    genSigil: "Gen Sigil",
    suggestLinks: "Suggest Links",
  },
  ru: {
    subtitle: "Магическая Паутина Знаний",
    searchPlaceholder: "Поиск сущностей...",
    filters: "Фильтры",
    ritualLayer: "Ритуальный слой",
    inputPlaceholder: "Опишите божество, ритуал или место силы...",
    weaveBtn: "Плести",
    nodes: "Узлы",
    links: "Связи",
    downloadJson: "Скачать JSON",
    exportCsv: "Экспорт CSV",
    exportPng: "Экспорт PNG",
    importJsons: "Импорт JSON",
    analytics: "Аналитика",
    clearTooltip: "Очистить граф",
    clearConfirm: "Вы уверены, что хотите очистить всю паутину? Действие необратимо.",
    importSuccess: "Успешно импортировано файлов: {count}.",
    error: "Не удалось извлечь сущности. Проверьте API‑ключ и попробуйте снова.",
    entityDetails: "Детали сущности",
    name: "Имя",
    type: "Тип",
    relation: "Связь",
    source: "Источник",
    target: "Цель",
    ritualText: "Описание / Текст ритуала",
    markAsRitual: "Отметить как ритуал",
    ritualName: "Название ритуала (необязательно)",
    exportRitual: "Экспорт Ритуала JSON",
    updateWeb: "Обновить паутину",
    resetWeb: "Сброс паутины",
    updateSuccess: "Паутина обновлена: объединено узлов — {count}, связи пересчитаны.",
    xpEarned: "Паутина укреплена (+{xp} XP).",
    resetConfirm: "Вы уверены, что хотите сбросить всю паутину? Данные будут потеряны.",
    close: "Закрыть",
    powerFlows: "Потоки силы",
    flowSpeed: "Скорость",
    flowIntensity: "Яркость",
    flowThickness: "Толщина",
    hideWeak: "Скрыть слабые потоки",
    vizSettings: "Настройки визуализации",
    expand: "Развернуть",
    shrink: "Свернуть",
    ritualPreviewTitle: "Предпросмотр ритуала",
    ritualPreviewHint: "Полный текст ритуала будет сохранен в узле. Ниже показаны предложенные теги для быстрой проверки.",
    ritualPreviewTags: "Предложенные теги",
    ritualPreviewEmptyTags: "Очевидные теги не найдены. ИИ все равно обработает полный текст.",
    ritualPreviewCancel: "Отмена",
    ritualPreviewConfirm: "Отправить ИИ",
    ritualTags: "Теги ритуала",
    activeLinks: "Активные связи",
    noRitualTags: "Теги пока не извлечены.",
    noActiveLinks: "Активные связи не найдены.",
    pantheons: "Пантеоны",
    planetary: "Планеты",
    elements: "Стихии",
    offerings: "Подношения",
    genSigil: "Созд. Сигил",
    suggestLinks: "Предложить связи",
  },
}

interface Props {
  user: any
}

interface WeaveAttempt {
  input: string
  ritualMode: boolean
  ritualName: string
}

export function KnowledgeGraph({ user }: Props) {
  const { lang } = useLang()
  const t = translations[lang as 'en' | 'ru'] ?? translations.en
  const getTypeLabel = useCallback((type: string) => {
    const labels = TYPE_LABELS[type]
    if (!labels) return type
    return lang === 'ru' ? labels.ru : labels.en
  }, [lang])

  const [inputText, setInputText] = useState('')
  const [graphData, setGraphData] = useState<GraphData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : { nodes: [], links: [] }
  })
  const [webHistory, setWebHistory] = useState<WebHistoryEvent[]>(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? (parsed as WebHistoryEvent[]) : []
    } catch {
      return []
    }
  })
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [selectedLink, setSelectedLink] = useState<Link | null>(null)
  const [linkScanOpen, setLinkScanOpen] = useState(false)
  const [linkScanReport, setLinkScanReport] = useState<null | {
    nodeId: string
    outgoing: number
    incoming: number
    byRelation: Array<{ relation: Link['relation']; count: number }>
    byStrength: Array<{ strength: string; count: number }>
    strongest: Array<{ otherId: string; otherName: string; direction: 'out' | 'in'; relation: Link['relation']; strength?: string }>
    weakest: Array<{ otherId: string; otherName: string; direction: 'out' | 'in'; relation: Link['relation']; strength?: string }>
  }>(null)
  const [linkScanHighlightNodes, setLinkScanHighlightNodes] = useState<Set<string>>(new Set())
  const [linkScanHighlightLinks, setLinkScanHighlightLinks] = useState<Set<string>>(new Set())
  const [presetModalOpen, setPresetModalOpen] = useState(false)
  const [presetLibrary, setPresetLibrary] = useState<GraphData | null>(null)
  const [presetLibraryError, setPresetLibraryError] = useState<string | null>(null)
  const [presetMode, setPresetMode] = useState<'merge' | 'replace'>('merge')
  const [presetDepth, setPresetDepth] = useState(2)
  const [selectedPresetPacks, setSelectedPresetPacks] = useState<Set<string>>(new Set(['greek']))
  const [presetRootQuery, setPresetRootQuery] = useState('')
  const [selectedPresetRoots, setSelectedPresetRoots] = useState<Set<string>>(new Set())
  const [manualLinkOpen, setManualLinkOpen] = useState(false)
  const [manualLinkTargetQuery, setManualLinkTargetQuery] = useState('')
  const [manualLinkTargetId, setManualLinkTargetId] = useState<string | null>(null)
  const [manualLinkRelation, setManualLinkRelation] = useState<Link['relation']>('associated_with')
  const [manualLinkStrength, setManualLinkStrength] = useState<'weak' | 'medium' | 'strong' | 'personal'>('medium')
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [draftType, setDraftType] = useState<string>('concept')
  const [draftDesc, setDraftDesc] = useState('')
  const [draftTags, setDraftTags] = useState('')
  const [draftAliases, setDraftAliases] = useState('')
  const [draftSigilId, setDraftSigilId] = useState('')
  const [draftImageUrl, setDraftImageUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pushWebHistory = useCallback((event: Omit<WebHistoryEvent, 'id' | 'date'> & { date?: string }) => {
    setWebHistory((prev) => {
      const next: WebHistoryEvent = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `web_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        date: event.date || new Date().toISOString(),
        kind: event.kind,
        summary: event.summary,
      }
      const merged = [next, ...prev].slice(0, 60)
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(merged))
      } catch {}
      return merged
    })
  }, [])

  // Автоматическая синхронизация: при заходе загружаем из Supabase, сохраняем в localStorage, любые изменения пушим обратно
  useEffect(() => {
    if (user && user.id) {
      syncGraph(user.id).then(synced => {
        setGraphData(synced)
        if (!autoPullTried && (!synced.nodes || synced.nodes.length === 0)) {
          setSyncNotice(lang === 'ru' ? 'Пробую подтянуть паутину из облака…' : 'Trying to pull your web from cloud…')
          setAutoPullTried(true)
          setTimeout(async () => {
            const again = await syncGraph(user.id)
            setGraphData(again)
            setSyncNotice(null)
          }, 1800)
        }
      })
    }
  }, [user?.id, lang])

  useEffect(() => {
    if (!presetModalOpen) return
    if (presetLibrary || presetLibraryError) return

    let cancelled = false
    fetch('/presets/knowledge_web_library.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        if (!data?.nodes || !data?.links) throw new Error('Invalid library format')
        setPresetLibrary(data as GraphData)
      })
      .catch(() => {
        if (cancelled) return
        setPresetLibraryError(lang === 'ru'
          ? 'Не удалось загрузить библиотеку пресетов. Проверьте файл public/presets/knowledge_web_library.json'
          : 'Failed to load preset library. Check public/presets/knowledge_web_library.json')
      })

    return () => { cancelled = true }
  }, [lang, presetLibrary, presetLibraryError, presetModalOpen])

  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [visibleTypes, setVisibleTypes] = useState<Set<string>>(new Set(ALL_TYPES))
  const [activePantheons, setActivePantheons] = useState<Set<string>>(new Set(['*']))
  const [activePlanets, setActivePlanets] = useState<Set<string>>(new Set(['*']))
  const [activeElements, setActiveElements] = useState<Set<string>>(new Set(['*']))
  const [activeOfferings, setActiveOfferings] = useState<Set<string>>(new Set(['*']))
  const [showRitualsOnly, setShowRitualsOnly] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [isRitualMode, setIsRitualMode] = useState(false)
  const [ritualNameInput, setRitualNameInput] = useState('')
  const [showFlows, setShowFlows] = useState(true)
  const [flowSpeed, setFlowSpeed] = useState(1)
  const [flowIntensity, setFlowIntensity] = useState(1)
  const [flowThickness] = useState(1)
  const [hideWeakFlows, setHideWeakFlows] = useState(false)
  const [showVizSettings, setShowVizSettings] = useState(false)
  const vizStorageKey = useMemo(
    () => (user?.id ? `esoteric_knowledge_web_viz_${user.id}` : 'esoteric_knowledge_web_viz_guest'),
    [user?.id]
  )
  const [showFilterBadges, setShowFilterBadges] = useState(() => {
    try {
      const raw = localStorage.getItem(vizStorageKey)
      if (!raw) return true
      const parsed = JSON.parse(raw)
      return typeof parsed?.showFilterBadges === 'boolean' ? parsed.showFilterBadges : true
    } catch {
      return true
    }
  })
  const [labelMode, setLabelMode] = useState<'all' | 'important'>(() => {
    try {
      const raw = localStorage.getItem(vizStorageKey)
      if (!raw) return 'important'
      const parsed = JSON.parse(raw)
      return parsed?.labelMode === 'all' ? 'all' : 'important'
    } catch {
      return 'important'
    }
  })
  const [maxRenderNodes, setMaxRenderNodes] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(vizStorageKey)
      if (!raw) return 2000
      const parsed = JSON.parse(raw)
      const v = Number(parsed?.maxRenderNodes)
      return Number.isFinite(v) && v >= 300 ? Math.floor(v) : 2000
    } catch {
      return 2000
    }
  })
  const [isExpanded, setIsExpanded] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [lastAttempt, setLastAttempt] = useState<WeaveAttempt | null>(null)
  const [showRitualPreview, setShowRitualPreview] = useState(false)
  const [pendingRitualAttempt, setPendingRitualAttempt] = useState<WeaveAttempt | null>(null)
  const [ritualPreviewTags, setRitualPreviewTags] = useState<string[]>([])
  const [syncNotice, setSyncNotice] = useState<string | null>(null)
  const [autoPullTried, setAutoPullTried] = useState(false)
  const [showSigilGenerator, setShowSigilGenerator] = useState(false)
  
  // Mythology
  const [mythData, setMythData] = useState<MythologyEntity | null>(null)
  const [loadingMyth, setLoadingMyth] = useState(false)
  const [wikiData, setWikiData] = useState<{ title: string; extract: string; url: string; lang: 'en' | 'ru' } | null>(null)
  const [wikiOpen, setWikiOpen] = useState(false)
  const [wikiLoading, setWikiLoading] = useState(false)
  const [wikiError, setWikiError] = useState<string | null>(null)
  const wikiScrollRef = useRef<HTMLDivElement | null>(null)
  const [wikiScrollTop, setWikiScrollTop] = useState(0)
  const wikiLines = useMemo(() => (wikiData?.extract ? wikiData.extract.split('\n') : []), [wikiData])
  const isMobile = useIsMobile()

  useEffect(() => {
    try {
      localStorage.setItem(vizStorageKey, JSON.stringify({ showFilterBadges, labelMode, maxRenderNodes }))
    } catch {}
  }, [labelMode, maxRenderNodes, showFilterBadges, vizStorageKey])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(vizStorageKey)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (typeof parsed?.showFilterBadges === 'boolean') setShowFilterBadges(parsed.showFilterBadges)
      setLabelMode(parsed?.labelMode === 'all' ? 'all' : 'important')
      const v = Number(parsed?.maxRenderNodes)
      if (Number.isFinite(v) && v >= 300) setMaxRenderNodes(Math.floor(v))
    } catch {}
  }, [vizStorageKey])
  
  // AI Myth Scan
  const [isScanningMyth, setIsScanningMyth] = useState(false)
  const [scanResult, setScanResult] = useState<MythScanResult | null>(null)
  const [aiHelpOpen, setAiHelpOpen] = useState(false)
  const [aiHelpLoading, setAiHelpLoading] = useState(false)
  const [aiHelpError, setAiHelpError] = useState<string | null>(null)
  const [aiHelpSuggestions, setAiHelpSuggestions] = useState<Array<{ sourceId: string; targetId: string; relation: Link['relation']; reason: string; strength?: string }>>([])
  const [aiHelpSelected, setAiHelpSelected] = useState<Set<string>>(new Set())

  const handleMythScan = async (node: Node) => {
    if (!node.name) return
    setIsScanningMyth(true)
    try {
      // Pass undefined pantheon for now to let AI infer
      const result = await MythScanService.scanEntity(node.name)
      setScanResult(result)
    } catch (e) {
      setError(lang === 'ru' ? 'Ошибка сканирования мифов' : 'Myth scan failed')
    } finally {
      setIsScanningMyth(false)
    }
  }

  const extractJsonArray = (raw: string): string | null => {
    const s = raw.trim()
    const start = s.indexOf('[')
    const end = s.lastIndexOf(']')
    if (start === -1 || end === -1 || end <= start) return null
    return s.slice(start, end + 1)
  }

  const normalizeRelation = (value: any): Link['relation'] => {
    const allowed: Array<Link['relation']> = ['associated_with', 'controls', 'appears_in', 'teaches', 'symbol_of']
    return allowed.includes(value) ? value : 'associated_with'
  }

  const suggestConnectionsDeepseekFirst = async (node: Node): Promise<Array<{ targetId: string; relation: string; reason: string; strength: string }>> => {
    const contextNodes = graphData.nodes
      .filter(n => n.id !== node.id)
      .map(n => `${n.name} (${n.type}) [id:${n.id}]`)
      .slice(0, 50)
      .join(', ')

    const promptLang = /[а-яА-ЯёЁ]/.test(`${node.name} ${(node as any).description || ''}`) ? 'ru' : 'en'
    const userPrompt = promptLang === 'ru'
      ? `Проанализируй сущность "${node.name}" (${node.type}).\n\nСуществующие узлы:\n${contextNodes}\n\nПредложи 1–3 новых уместных связи между "${node.name}" и существующими узлами. Возвращай ТОЛЬКО JSON-массив вида:\n[{ "targetId": "id_from_list", "relation": "associated_with", "reason": "краткое объяснение", "strength": "medium" }]\n\nrelation: associated_with|controls|appears_in|teaches|symbol_of\nstrength: weak|medium|strong|personal`
      : `Analyze the entity "${node.name}" (${node.type}).\n\nExisting nodes:\n${contextNodes}\n\nSuggest 1-3 new relevant connections between "${node.name}" and existing nodes. Return ONLY JSON array:\n[{ "targetId": "id_from_list", "relation": "associated_with", "reason": "short explanation", "strength": "medium" }]\n\nrelation: associated_with|controls|appears_in|teaches|symbol_of\nstrength: weak|medium|strong|personal`

    try {
      const isLocal = typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)/.test(window.location.hostname)
      if (!isLocal) {
        const ds = await fetch('/api/deepseek', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: userPrompt }],
            max_tokens: 800,
          }),
        })
        if (ds.ok) {
          const dsData = await ds.json().catch(() => null)
          const dsContent: string = dsData?.choices?.[0]?.message?.content || ''
          const json = extractJsonArray(dsContent) || dsContent
          const parsed = JSON.parse(json)
          if (Array.isArray(parsed)) return parsed
        }
      }
    } catch {}

    const ai = await suggestConnections(node, graphData.nodes, promptLang as 'en' | 'ru').catch(() => [])
    if (ai && ai.length > 0) return ai as any
    return suggestConnectionsLocal(node, graphData.nodes, graphData.links, promptLang as 'en' | 'ru') as any
  }

  const runAiHelp = async () => {
    if (!graphData.nodes.length) return
    setAiHelpError(null)
    setAiHelpLoading(true)
    try {
      const degree = new Map<string, number>()
      graphData.nodes.forEach(n => degree.set(n.id, 0))
      graphData.links.forEach(l => {
        degree.set(l.source as string, (degree.get(l.source as string) || 0) + 1)
        degree.set(l.target as string, (degree.get(l.target as string) || 0) + 1)
      })
      const focusNodes = [...graphData.nodes]
        .sort((a, b) => (degree.get(b.id) || 0) - (degree.get(a.id) || 0))
        .slice(0, 8)

      const existing = new Set(graphData.links.map(l => {
        const a = String(l.source)
        const b = String(l.target)
        const pair = a < b ? `${a}|${b}` : `${b}|${a}`
        return `${pair}|${l.relation}`
      }))

      const collected: Array<{ sourceId: string; targetId: string; relation: Link['relation']; reason: string; strength?: string }> = []

      for (const node of focusNodes) {
        const suggestions = await suggestConnectionsDeepseekFirst(node)
        suggestions.forEach(s => {
          const targetId = s.targetId
          if (!targetId || targetId === node.id) return
          if (!graphData.nodes.some(n => n.id === targetId)) return
          const relation = normalizeRelation((s as any).relation)
          const a = node.id < targetId ? `${node.id}|${targetId}` : `${targetId}|${node.id}`
          const key = `${a}|${relation}`
          if (existing.has(key)) return
          if (collected.some(x => {
            const aa = x.sourceId < x.targetId ? `${x.sourceId}|${x.targetId}` : `${x.targetId}|${x.sourceId}`
            return aa === a && x.relation === relation
          })) return
          collected.push({ sourceId: node.id, targetId, relation, reason: s.reason || '', strength: (s as any).strength })
        })
      }

      setAiHelpSuggestions(collected)
      setAiHelpSelected(new Set(collected.map(s => `${s.sourceId}|${s.targetId}|${s.relation}`)))
      setAiHelpOpen(true)
      pushWebHistory({
        kind: 'ai_help',
        summary: lang === 'ru' ? `ИИ предложил ${collected.length} связей` : `AI suggested ${collected.length} links`,
      })
    } catch (e) {
      setAiHelpError(lang === 'ru' ? 'Не удалось получить предложения ИИ' : 'Failed to get AI suggestions')
    } finally {
      setAiHelpLoading(false)
    }
  }

  const applyAiHelp = () => {
    const picked = aiHelpSuggestions.filter(s => aiHelpSelected.has(`${s.sourceId}|${s.targetId}|${s.relation}`))
    if (!picked.length) {
      setAiHelpOpen(false)
      return
    }
    setGraphData(prev => {
      const existing = new Set(prev.links.map(l => `${l.source}|${l.target}|${l.relation}`))
      const nextLinks = [...prev.links]
      let added = 0
      picked.forEach(s => {
        const direct = `${s.sourceId}|${s.targetId}|${s.relation}`
        const reverse = `${s.targetId}|${s.sourceId}|${s.relation}`
        if (existing.has(direct) || existing.has(reverse)) return
        nextLinks.push({ source: s.sourceId, target: s.targetId, relation: s.relation, strength: (s.strength as any) || 'medium' })
        existing.add(direct)
        added++
      })
      if (added > 0) {
        pushWebHistory({
          kind: 'merge',
          summary: lang === 'ru' ? `Добавлено связей: +${added}` : `Links added: +${added}`,
        })
      }
      return { ...prev, links: nextLinks }
    })
    setAiHelpOpen(false)
  }

  const handleMythSave = (approved: Partial<MythScanResult>) => {
    if (!selectedNode || !graphData) return
    
    // Create new nodes and links from approved data
    const newNodes: Node[] = []
    const newLinks: Link[] = []
    const originId = selectedNode.id

    // Helper to add node if not exists
    const addNode = (name: string, group: string, meta: any = {}) => {
      // Check if node exists by name (case-insensitive)
      const existing = graphData.nodes.find(n => n.name.toLowerCase() === name.toLowerCase())
      // Also check in newNodes to avoid duplicates in this batch
      const inBatch = newNodes.find(n => n.name.toLowerCase() === name.toLowerCase())
      
      let targetId = existing?.id || inBatch?.id

      if (!targetId) {
        // Create new
        targetId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        newNodes.push({ id: targetId, name: name, type: group as any, ...meta })
      }

      // Create link if not exists
      const linkExists = graphData.links.some(l => 
        (l.source === originId && l.target === targetId) || 
        (l.source === targetId && l.target === originId)
      )
      const linkInBatch = newLinks.some(l => 
        (l.source === originId && l.target === targetId) || 
        (l.source === targetId && l.target === originId)
      )

      if (!linkExists && !linkInBatch) {
        newLinks.push({ source: originId, target: targetId!, relation: 'associated_with', strength: 'medium' })
      }
    }

    // Process categories
    if (approved.symbols) approved.symbols.forEach(s => addNode(s, 'symbol'))
    if (approved.plants) approved.plants.forEach(s => addNode(s, 'concept')) // Mapped to concept as 'plant' is not in ALL_TYPES yet
    if (approved.animals) approved.animals.forEach(s => addNode(s, 'creature'))
    if (approved.associated_deities) approved.associated_deities.forEach(s => addNode(s, 'deity'))
    if (approved.sacred_objects) approved.sacred_objects.forEach(s => addNode(s, 'artifact'))
    if (approved.offerings) approved.offerings.forEach(s => addNode(s, 'concept'))
    if (approved.colors) approved.colors.forEach(s => addNode(s, 'symbol'))
    if (approved.elements) approved.elements.forEach(s => addNode(s, 'concept'))
    if (approved.planets) approved.planets.forEach(s => addNode(s, 'place')) // Mapped loosely
    if (approved.days) approved.days.forEach(s => addNode(s, 'concept'))
    if (approved.festivals) approved.festivals.forEach(s => addNode(s, 'ritual'))
    
    // Process Epithets
    if (approved.epithets) {
      approved.epithets.forEach(ep => {
        addNode(ep.name, 'concept', {
          meaning: ep.meaning,
          epithetType: ep.type,
          confidence: ep.confidence,
          description: `${ep.type}: ${ep.meaning}`,
          tags: ['epithet'],
        })
      })
    }

    // Update Graph
    if (newNodes.length > 0 || newLinks.length > 0) {
      const updatedGraph = {
        nodes: [...graphData.nodes, ...newNodes],
        links: [...graphData.links, ...newLinks]
      }
      setGraphData(updatedGraph)
      setSuccessMsg(lang === 'ru' ? `Добавлено ${newNodes.length} узлов` : `Added ${newNodes.length} nodes`)
      pushWebHistory({
        kind: 'myth_scan',
        summary: lang === 'ru'
          ? `AI-скан: узлы +${newNodes.length}, связи +${newLinks.length} (${selectedNode.name})`
          : `AI scan: nodes +${newNodes.length}, links +${newLinks.length} (${selectedNode.name})`,
      })
    }
    
    setScanResult(null)
  }

  const fetchMythData = async () => {
    if (!selectedNode) return
    setLoadingMyth(true)
    setWikiLoading(true)
    setWikiError(null)
    setError(null)
    try {
      const data = await MythologyService.getEntityInfo(selectedNode.name)
      setMythData(data)
      const wiki = await MythologyService.getWikipediaFullText(selectedNode.name)
      setWikiData(wiki)
      if (!wiki) setWikiError(lang === 'ru' ? 'Полный текст Wikipedia не найден.' : 'Wikipedia full text not found.')
      if (!data) {
        if (!import.meta.env.VITE_API_NINJAS_KEY) {
           setError(lang === 'ru' ? 'API ключ не настроен. Показаны только локальные данные.' : 'API Key missing. Only local data available.')
        } else {
           setError(lang === 'ru' ? 'Информация не найдена в мифах.' : 'No mythology data found.')
        }
        setTimeout(() => setError(null), 4000)
      }
    } catch (e) {
      setError(lang === 'ru' ? 'Ошибка поиска.' : 'Search failed.')
    } finally {
      setLoadingMyth(false)
      setWikiLoading(false)
    }
  }

  const mergeMythData = () => {
    if (!selectedNode || !mythData) return
    const nowIso = new Date().toISOString()
    const mainId = selectedNode.id
    const createdNodes: Array<{ id: string; name: string; type: string }> = []
    const createdLinks: Array<{ source: string; target: string }> = []
    let updatedFields = 0

    setGraphData(prev => {
      const nodes = [...prev.nodes]
      const links = [...prev.links]
      const byName = new Map(nodes.map(n => [n.name.toLowerCase(), n]))
      const byId = new Map(nodes.map(n => [n.id, n]))

      // Update main node fields
      const idx = nodes.findIndex(n => n.id === mainId)
      if (idx !== -1) {
        const n = nodes[idx]
        const next = {
          ...n,
          pantheon: n.pantheon || mythData.pantheon,
          description: n.description || mythData.description,
          tags: [...(n.tags || []), ...(mythData.domain ? mythData.domain.split(',').map(s=>s.trim()) : [])]
        }
        // Count updated fields
        if (!n.pantheon && next.pantheon) updatedFields++
        if (!n.description && next.description) updatedFields++
        if ((n.tags?.length || 0) !== (next.tags?.length || 0)) updatedFields++
        nodes[idx] = next as typeof n
      }

      // Helper upsert
      const ensureNode = (name: string, type: string) => {
        const key = name.trim().toLowerCase()
        if (!key) return null
        const existing = byName.get(key)
        if (existing) return existing.id
        const id = `node_${Date.now()}_${Math.random().toString(36).slice(2,9)}`
        const newNode = { id, name: name.trim(), type: type as any, created_at: nowIso, updated_at: nowIso } as any
        nodes.push(newNode)
        byName.set(key, newNode)
        byId.set(id, newNode)
        createdNodes.push({ id, name: newNode.name, type: newNode.type })
        return id
      }

      const ensureLink = (source: string, target: string) => {
        const exists = links.some(l => (l.source === source && l.target === target))
        if (exists) return
        const link = {
          source,
          target,
          relation: 'associated_with',
          // link metadata kept loosely to avoid TS constraints in Link type
          merge_date: nowIso,
          source_tag: 'merge_routine',
        } as any
        links.push(link)
        createdLinks.push({ source, target })
      }

      // Analyze mythData fields
      const pantheon = (mythData.pantheon || '').trim()
      if (pantheon) {
        const pid = ensureNode(pantheon, 'concept')
        if (pid) ensureLink(mainId, pid)
      }

      const domains = (mythData.domain || '').split(',').map(s => s.trim()).filter(Boolean)
      domains.forEach(d => {
        const did = ensureNode(d, 'concept')
        if (did) ensureLink(mainId, did)
      })

      const symbols = (mythData.symbol || '').split(',').map(s => s.trim()).filter(Boolean)
      symbols.forEach(sym => {
        const sid = ensureNode(sym, 'symbol')
        if (sid) ensureLink(mainId, sid)
      })

      const report = {
        createdNodes: createdNodes.length,
        createdLinks: createdLinks.length,
        updatedFields,
      }
      setSuccessMsg(
        lang === 'ru'
          ? `Объединено: поля ${report.updatedFields}, узлов +${report.createdNodes}, связей +${report.createdLinks}`
          : `Merged: fields ${report.updatedFields}, nodes +${report.createdNodes}, links +${report.createdLinks}`
      )

      return { ...prev, nodes, links }
    })
    setMythData(null)
    pushWebHistory({
      kind: 'merge',
      summary: lang === 'ru'
        ? `Объединение мифов: поля ${updatedFields}, узлы +${createdNodes.length}, связи +${createdLinks.length} (${selectedNode.name})`
        : `Myth merge: fields ${updatedFields}, nodes +${createdNodes.length}, links +${createdLinks.length} (${selectedNode.name})`,
    })
  }

  const stopwords = useMemo(() => new Set([
    'the', 'and', 'with', 'from', 'this', 'that', 'have', 'your', 'for', 'you', 'are', 'was', 'were', 'into', 'within', 'about',
    'что', 'это', 'для', 'как', 'или', 'так', 'при', 'над', 'под', 'через', 'после', 'перед', 'если', 'когда', 'где', 'только',
    'ритуал', 'ритуала', 'ритуале', 'ритуалом', 'ритуалы', 'обряд', 'обряда', 'обряде', 'обряды',
  ]), [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(graphData))
    // Debounced push to Supabase
    const timer = setTimeout(() => {
      if (graphData.nodes.length > 0) pushToRemote(user.id, graphData)
    }, 3000)
    // Fix overlap issue: Close details when opening sigil gen, or use z-index
  // We'll modify the "Gen Sigil" button to open the generator and close details if needed
  // But actually the SigilGenerator is a full screen overlay or modal?
  // Let's check where it is rendered.
  
  return () => clearTimeout(timer)
  }, [graphData, user.id])

  useEffect(() => {
    if (selectedNode) {
      setEditing(false)
      setDraftName(selectedNode.name || '')
      setDraftType(selectedNode.type || 'concept')
      setDraftDesc(selectedNode.description || '')
      setDraftTags(Array.isArray((selectedNode as any).tags) ? ((selectedNode as any).tags as string[]).join(', ') : '')
      setDraftAliases(Array.isArray((selectedNode as any).aliases) ? ((selectedNode as any).aliases as string[]).join(', ') : '')
      setDraftSigilId(((selectedNode as any).sigil_id as string) || '')
      setDraftImageUrl(((selectedNode as any).image_url as string) || '')
    }
  }, [selectedNode])

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [successMsg])

  const getSimilarity = (s1: string, s2: string) => {
    const longer = s1.length < s2.length ? s2 : s1
    const shorter = s1.length < s2.length ? s1 : s2
    if (longer.length === 0) return 1.0
    const costs: number[] = []
    for (let i = 0; i <= longer.length; i++) {
      let lastValue = i
      for (let j = 0; j <= shorter.length; j++) {
        if (i === 0) costs[j] = j
        else if (j > 0) {
          let newValue = costs[j - 1]
          if (longer.charAt(i - 1) !== shorter.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
          costs[j - 1] = lastValue
          lastValue = newValue
        }
      }
      if (i > 0) costs[shorter.length] = lastValue
    }
    return (longer.length - costs[shorter.length]) / longer.length
  }

  const SEMANTIC_GROUPS: Record<string, string> = {
    'богатство': 'money_magic', 'денежная магия': 'money_magic', 'привлечение денег': 'money_magic',
    'wealth': 'money_magic', 'prosperity': 'money_magic', 'abundance': 'money_magic',
    'защита': 'protection_magic', 'оберег': 'protection_magic',
    'protection': 'protection_magic', 'shielding': 'protection_magic', 'warding': 'protection_magic',
    'любовь': 'love_magic', 'приворот': 'love_magic',
    'love': 'love_magic', 'attraction': 'love_magic',
  }

  const mergeGraphData = useCallback((newData: GraphData) => {
    setGraphData(prev => {
      const newNodes = [...prev.nodes]
      const nodeMap = new Map(prev.nodes.map(n => [n.id, n]))
      const nameMap = new Map(prev.nodes.map(n => [n.name.toLowerCase(), n.id]))
      const idMapping: Record<string, string> = {}

      newData.nodes.forEach(node => {
        const lowerName = node.name.toLowerCase()
        let canonicalId = SEMANTIC_GROUPS[lowerName]
        let existingId = canonicalId && nodeMap.has(canonicalId) ? canonicalId : (nodeMap.has(node.id) ? node.id : nameMap.get(lowerName))

        if (!existingId) {
          for (const [existingName, id] of nameMap.entries()) {
            if (getSimilarity(lowerName, existingName) > 0.85) { existingId = id; break }
          }
        }

        if (existingId) {
          idMapping[node.id] = existingId
          const existingNode = nodeMap.get(existingId)
          if (existingNode && node.description && (!existingNode.description || node.description.length > existingNode.description.length)) {
            existingNode.description = node.description
          }
        } else {
          newNodes.push(node)
          nodeMap.set(node.id, node)
          nameMap.set(lowerName, node.id)
          idMapping[node.id] = node.id
        }
      })

      const existingLinks = new Set(prev.links.map(l => `${l.source}-${l.target}-${l.relation}`))
      const newLinks = [...prev.links]

      newData.links.forEach(link => {
        const sourceId = idMapping[link.source] || link.source
        const targetId = idMapping[link.target] || link.target
        if (sourceId === targetId) return
        const linkKey = `${sourceId}-${targetId}-${link.relation}`
        if (!existingLinks.has(linkKey) && nodeMap.has(sourceId) && nodeMap.has(targetId)) {
          newLinks.push({ ...link, source: sourceId, target: targetId })
          existingLinks.add(linkKey)
        }
      })

      return { nodes: newNodes, links: newLinks }
    })
  }, [])

  const presetPacks = useMemo(() => {
    const nodes = presetLibrary?.nodes || []
    const byPrefix = (prefix: string) => nodes.filter(n => String(n.id).startsWith(prefix)).map(n => n.id)

    const pantheonNodes = nodes
      .filter(n => String(n.id).startsWith('pantheon_'))
      .sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id)))

    const pantheonPacks = pantheonNodes.map(n => ({
      id: `pantheon:${n.id}`,
      title: String(n.name || n.id),
      roots: [String(n.id)],
    }))

    return [
      ...pantheonPacks,
      { id: 'elements', title: lang === 'ru' ? 'Стихии' : 'Elements', roots: byPrefix('element_') },
      { id: 'planets', title: lang === 'ru' ? 'Планеты' : 'Planets', roots: byPrefix('planet_') },
      { id: 'minerals', title: lang === 'ru' ? 'Минералы' : 'Minerals', roots: byPrefix('mineral_') },
      { id: 'offerings', title: lang === 'ru' ? 'Подношения' : 'Offerings', roots: byPrefix('offering_') },
    ]
  }, [lang, presetLibrary])

  const presetRootCandidates = useMemo(() => {
    const q = presetRootQuery.trim().toLowerCase()
    const nodes = presetLibrary?.nodes || []
    const scored = nodes.map(n => {
      const id = String(n.id)
      const name = String(n.name || '')
      const tags = Array.isArray((n as any).tags) ? ((n as any).tags as string[]) : []
      const aliases = Array.isArray((n as any).aliases) ? ((n as any).aliases as string[]) : []
      const hay = [id, name, ...tags, ...aliases].join(' ').toLowerCase()
      const score = q
        ? (hay.includes(q) ? (name.toLowerCase().startsWith(q) || id.startsWith(q) ? 2 : 1) : 0)
        : (id.startsWith('pantheon_') || id.startsWith('element_') || id.startsWith('planet_') ? 1 : 0)
      return { n, score }
    })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score || String(a.n.id).localeCompare(String(b.n.id)))
      .slice(0, 24)
      .map(x => x.n)
    return scored
  }, [presetLibrary?.nodes, presetRootQuery])

  const presetPreview = useMemo<GraphData | null>(() => {
    if (!presetLibrary) return null

    const packRoots = presetPacks
      .filter(p => selectedPresetPacks.has(p.id))
      .flatMap(p => p.roots)
      .filter(Boolean)
    const roots = [...new Set([...packRoots, ...selectedPresetRoots])].filter(Boolean)

    if (roots.length === 0) return { nodes: [], links: [] }

    const nodeById = new Map(presetLibrary.nodes.map(n => [n.id, n]))
    const neighbors = new Map<string, Set<string>>()
    const addEdge = (a: string, b: string) => {
      const sa = neighbors.get(a) || new Set<string>()
      sa.add(b)
      neighbors.set(a, sa)
    }

    presetLibrary.links.forEach(l => {
      const s = String(l.source)
      const t = String(l.target)
      if (!nodeById.has(s) || !nodeById.has(t)) return
      addEdge(s, t)
      addEdge(t, s)
    })

    const depth = Math.max(0, Math.min(4, Math.floor(presetDepth)))
    const keep = new Set<string>()
    const normalizedRoots = roots.filter(r => nodeById.has(r))
    const queue: Array<{ id: string; d: number }> = normalizedRoots.map(r => ({ id: r, d: 0 }))

    normalizedRoots.forEach(r => keep.add(r))

    while (queue.length) {
      const cur = queue.shift()!
      if (cur.d >= depth) continue
      const adj = neighbors.get(cur.id)
      if (!adj) continue
      for (const nb of adj) {
        if (keep.has(nb)) continue
        keep.add(nb)
        queue.push({ id: nb, d: cur.d + 1 })
      }
    }

    const nodes = presetLibrary.nodes.filter(n => keep.has(n.id))
    const keepSet = new Set(nodes.map(n => n.id))
    const links = presetLibrary.links
      .map(l => ({ ...l, source: String(l.source), target: String(l.target) } as any))
      .filter(l => keepSet.has(String(l.source)) && keepSet.has(String(l.target)))

    return { nodes: nodes as any, links: links as any }
  }, [presetDepth, presetLibrary, presetPacks, selectedPresetPacks])

  const applyPresetPreview = useCallback(() => {
    if (!presetPreview) return
    if (presetPreview.nodes.length === 0) return

    if (presetMode === 'replace') {
      setGraphData(presetPreview)
      pushWebHistory({
        kind: 'preset_import',
        summary: lang === 'ru'
          ? `Пресеты: заменено узлов ${presetPreview.nodes.length}, связей ${presetPreview.links.length}`
          : `Presets: replaced nodes ${presetPreview.nodes.length}, links ${presetPreview.links.length}`,
      })
    } else {
      mergeGraphData(presetPreview)
      pushWebHistory({
        kind: 'preset_import',
        summary: lang === 'ru'
          ? `Пресеты: добавлено/объединено узлов ${presetPreview.nodes.length}, связей ${presetPreview.links.length}`
          : `Presets: merged nodes ${presetPreview.nodes.length}, links ${presetPreview.links.length}`,
      })
    }

    setSuccessMsg(lang === 'ru'
      ? `Импорт пресета: узлы ${presetPreview.nodes.length}, связи ${presetPreview.links.length}`
      : `Preset imported: nodes ${presetPreview.nodes.length}, links ${presetPreview.links.length}`)
    setPresetModalOpen(false)
  }, [lang, mergeGraphData, presetMode, presetPreview, pushWebHistory])

  const manualLinkCandidates = useMemo(() => {
    if (!selectedNode) return []
    const q = manualLinkTargetQuery.trim().toLowerCase()
    const nodes = graphData.nodes.filter(n => n.id !== selectedNode.id)
    const scored = nodes.map(n => {
      const id = String(n.id)
      const name = String(n.name || '')
      const tags = Array.isArray((n as any).tags) ? ((n as any).tags as string[]) : []
      const aliases = Array.isArray((n as any).aliases) ? ((n as any).aliases as string[]) : []
      const hay = [id, name, ...tags, ...aliases].join(' ').toLowerCase()
      const score = q ? (hay.includes(q) ? (name.toLowerCase().startsWith(q) || id.startsWith(q) ? 2 : 1) : 0) : 0
      return { n, score }
    })
      .filter(x => (q ? x.score > 0 : true))
      .sort((a, b) => b.score - a.score || String(a.n.name).localeCompare(String(b.n.name)))
      .slice(0, 20)
      .map(x => x.n)
    return scored
  }, [graphData.nodes, manualLinkTargetQuery, selectedNode])

  const applyManualLink = useCallback(() => {
    if (!selectedNode || !manualLinkTargetId) return
    const sourceId = selectedNode.id
    const targetId = manualLinkTargetId
    if (sourceId === targetId) return

    setGraphData(prev => {
      const exists = prev.links.some(l =>
        (String(l.source) === sourceId && String(l.target) === targetId && l.relation === manualLinkRelation) ||
        (String(l.source) === targetId && String(l.target) === sourceId && l.relation === manualLinkRelation)
      )
      if (exists) return prev
      const nextLinks = [...prev.links, { source: sourceId, target: targetId, relation: manualLinkRelation, strength: manualLinkStrength } as any]
      return { ...prev, links: nextLinks }
    })

    const targetName = graphData.nodes.find(n => n.id === manualLinkTargetId)?.name || manualLinkTargetId
    pushWebHistory({
      kind: 'merge',
      summary: lang === 'ru'
        ? `Связь вручную: ${selectedNode.name} → ${targetName} (${manualLinkRelation})`
        : `Manual link: ${selectedNode.name} → ${targetName} (${manualLinkRelation})`,
    })
    setSuccessMsg(lang === 'ru' ? 'Связь добавлена' : 'Link added')
    setManualLinkOpen(false)
  }, [graphData.nodes, lang, manualLinkRelation, manualLinkStrength, manualLinkTargetId, pushWebHistory, selectedNode])

  const runExtract = useCallback(async (attempt: WeaveAttempt) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await extractGraph(attempt.input, lang as 'en' | 'ru', attempt.ritualMode, attempt.ritualName, graphData.nodes)
      mergeGraphData(data)
      const rawPoints = getKnowledgeWeavePoints(data.nodes.length, data.links.length, attempt.ritualMode)
      const { pointsEarned, progression } = grantProgressionPoints(rawPoints, 'knowledge')
      syncProgressionToDb(user.id, progression)
      setSuccessMsg(t.xpEarned.replace('{xp}', pointsEarned.toString()))
      pushWebHistory({
        kind: 'weave',
        summary: lang === 'ru'
          ? `Соткано: узлы +${data.nodes.length}, связи +${data.links.length}`
          : `Weaved: nodes +${data.nodes.length}, links +${data.links.length}`,
      })
      setInputText('')
      setRitualNameInput('')
      setIsRitualMode(false)
    } catch (err) {
      console.error(err)
      const reason = err instanceof Error ? err.message : String(err ?? '')
      const useLocal = (import.meta.env.VITE_LOCAL_FALLBACK === '1') || /timeout|network|failed to fetch|circuit breaker open|missing api key/i.test(reason)
      if (useLocal) {
        try {
          const data = await extractGraphLocally(attempt.input, attempt.ritualMode, attempt.ritualName, graphData.nodes)
          mergeGraphData(data)
          const rawPoints = getKnowledgeWeavePoints(data.nodes.length, data.links.length, attempt.ritualMode)
          const { pointsEarned, progression } = grantProgressionPoints(rawPoints, 'knowledge')
          syncProgressionToDb(user.id, progression)
          setSuccessMsg(t.xpEarned.replace('{xp}', pointsEarned.toString()))
          pushWebHistory({
            kind: 'weave',
            summary: lang === 'ru'
              ? `Соткано (локально): узлы +${data.nodes.length}, связи +${data.links.length}`
              : `Weaved (local): nodes +${data.nodes.length}, links +${data.links.length}`,
          })
          setError(null)
        } catch {
          setError(mapAiErrorMessage(reason, lang as 'en' | 'ru', 'knowledge', t.error))
        }
      } else {
        setError(mapAiErrorMessage(reason, lang as 'en' | 'ru', 'knowledge', t.error))
      }
    } finally {
      setIsLoading(false)
    }
  }, [graphData.nodes, lang, mergeGraphData, pushWebHistory, t.error, t.xpEarned, user.id])

  const getRitualPreviewTags = useCallback((text: string) => {
    const normalizedInput = text.toLowerCase()
    const tagsFromGraph = graphData.nodes
      .map(node => node.name.trim())
      .filter(name => name.length >= 3 && normalizedInput.includes(name.toLowerCase()))

    const tokenFreq = new Map<string, number>()
    text
      .toLowerCase()
      .split(/[^a-zA-Zа-яА-ЯёЁ0-9_-]+/)
      .filter(token => token.length >= 4 && !stopwords.has(token))
      .forEach(token => tokenFreq.set(token, (tokenFreq.get(token) ?? 0) + 1))

    const topTokens = [...tokenFreq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([token]) => token)

    return [...new Set([...tagsFromGraph, ...topTokens])].slice(0, 12)
  }, [graphData.nodes, stopwords])

  const handleConfirmRitualPreview = async () => {
    if (!pendingRitualAttempt || isLoading) return
    const attempt = pendingRitualAttempt
    setShowRitualPreview(false)
    setPendingRitualAttempt(null)
    await runExtract(attempt)
  }

  const handleCancelRitualPreview = () => {
    if (isLoading) return
    setShowRitualPreview(false)
    setPendingRitualAttempt(null)
  }

  const handleExtract = async () => {
    if (!inputText.trim()) return
    const attempt: WeaveAttempt = {
      input: inputText,
      ritualMode: isRitualMode,
      ritualName: ritualNameInput,
    }
    setLastAttempt(attempt)
    if (attempt.ritualMode) {
      setPendingRitualAttempt(attempt)
      setRitualPreviewTags(getRitualPreviewTags(attempt.input))
      setShowRitualPreview(true)
      return
    }
    await runExtract(attempt)
  }

  const handleRetryLastAttempt = async () => {
    if (!lastAttempt || isLoading) return
    await runExtract(lastAttempt)
  }

  const handleSaveSigil = (sigilData: { name: string; imageUrl: string; description: string }) => {
    if (!selectedNode) return
    const newSigilId = `sigil_${Date.now()}`
    const newSigilNode: Node = {
      id: newSigilId,
      name: sigilData.name,
      type: 'sigil',
      description: sigilData.description,
      image_url: sigilData.imageUrl,
      linked_entity_id: selectedNode.id,
      tags: ['generated', 'sigil']
    }

    setGraphData(prev => {
      const nodes = [...prev.nodes, newSigilNode]
      // Update source node reference
      const updatedNodes = nodes.map(n => n.id === selectedNode.id ? { ...n, sigil_id: newSigilId } : n)
      
      const links = [
        ...prev.links,
        { source: selectedNode.id, target: newSigilId, relation: 'symbol_of', strength: 'strong' } as Link
      ]
      
      return { nodes: updatedNodes, links }
    })

    setShowSigilGenerator(false)
    setSuccessMsg(lang === 'ru' ? "Сигил создан и вплетен в паутину!" : "Sigil created and woven into the web!")
    
    // Trigger sync
    setTimeout(() => {
      if (user?.id) pushToRemote(user.id, graphData)
    }, 500)
  }

  const handleDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(graphData, null, 2))
    const a = document.createElement('a')
    a.setAttribute("href", dataStr)
    a.setAttribute("download", "magical_web.json")
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const handleExportCSV = () => {
    const nodeRows = [["id", "name", "type"], ...graphData.nodes.map(n => [n.id, n.name, n.type])]
    const linkRows = [["source", "target", "relation"], ...graphData.links.map(l => [l.source, l.target, l.relation])]
    const csvContent = "NODES\n" + nodeRows.map(r => r.join(",")).join("\n") + "\n\nLINKS\n" + linkRows.map(r => r.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.setAttribute("href", url)
    a.setAttribute("download", "magical_web.csv")
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleExportPNG = () => {
    const svg = document.getElementById('main-graph-svg') as unknown as SVGSVGElement | null
    if (!svg) return
    const serializer = new XMLSerializer()
    const svgBlob = new Blob([serializer.serializeToString(svg)], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = svg.clientWidth * 2
      canvas.height = svg.clientHeight * 2
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#0a0502'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const a = document.createElement('a')
        a.href = canvas.toDataURL('image/png')
        a.download = 'magical_web.png'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  const handleImportJsons = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    let processedCount = 0
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string)
          if (data.nodes && data.links) {
            mergeGraphData(data)
            processedCount++
            if (processedCount === files.length) {
              setSuccessMsg(t.importSuccess.replace('{count}', processedCount.toString()))
            }
          }
        } catch (err) { console.error("Failed to parse JSON:", err) }
      }
      reader.readAsText(file)
    })
  }

  const handleResetWeb = () => {
    if (window.confirm(t.resetConfirm)) {
      setGraphData({ nodes: [], links: [] })
      setSelectedNode(null)
      setSelectedLink(null)
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const reorganizeGraph = useCallback(() => {
    setIsLoading(true)
    setTimeout(() => {
      setGraphData(prev => {
        const nodes = [...prev.nodes]
        const links = [...prev.links]
        const idMapping: Record<string, string> = {}
        const canonicalNodes: Node[] = []
        const processed = new Set<string>()

        nodes.forEach(node => {
          if (processed.has(node.id)) return
          const lowerName = node.name.toLowerCase()
          const semanticId = SEMANTIC_GROUPS[lowerName]
          const group = nodes.filter(other => {
            if (processed.has(other.id)) return false
            if (node.id === other.id) return true
            const otherLower = other.name.toLowerCase()
            if (lowerName === otherLower) return true
            if (semanticId && SEMANTIC_GROUPS[otherLower] === semanticId) return true
            return getSimilarity(lowerName, otherLower) > 0.85
          })
          const canonical = group.reduce((best, curr) => {
            return (curr.description?.length || 0) > (best.description?.length || 0) ? curr : best
          }, group[0])
          canonicalNodes.push(canonical)
          group.forEach(n => { idMapping[n.id] = canonical.id; processed.add(n.id) })
        })

        const newLinks: Link[] = []
        const linkKeys = new Set<string>()
        links.forEach(link => {
          const sourceId = idMapping[link.source as string] || (typeof link.source === 'object' ? idMapping[(link.source as any).id] : link.source)
          const targetId = idMapping[link.target as string] || (typeof link.target === 'object' ? idMapping[(link.target as any).id] : link.target)
          if (!sourceId || !targetId || sourceId === targetId) return
          const key = `${sourceId}-${targetId}-${link.relation}`
          if (!linkKeys.has(key)) {
            newLinks.push({ ...link, source: sourceId, target: targetId })
            linkKeys.add(key)
          }
        })

        const mergedCount = nodes.length - canonicalNodes.length
        setSuccessMsg(t.updateSuccess.replace('{count}', mergedCount.toString()))
        return { nodes: canonicalNodes, links: newLinks }
      })
      setIsLoading(false)
    }, 100)
  }, [t])

  const handleClear = () => {
    if (window.confirm(t.clearConfirm)) {
      setGraphData({ nodes: [], links: [] })
      setSelectedNode(null)
      setSelectedLink(null)
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const handleExportRitual = (ritual: Node) => {
    const ritualLinks = graphData.links.filter(l => l.source === ritual.id || l.target === ritual.id)
    const linkedNodeIds = new Set([ritual.id, ...ritualLinks.map(l => l.source === ritual.id ? l.target : l.source)])
    const exportData = { nodes: graphData.nodes.filter(n => linkedNodeIds.has(n.id as string)), links: ritualLinks }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2))
    const a = document.createElement('a')
    a.setAttribute("href", dataStr)
    a.setAttribute("download", `ritual_${ritual.id}.json`)
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const toggleType = (type: string) => {
    const next = new Set(visibleTypes)
    if (next.has(type)) next.delete(type)
    else next.add(type)
    setVisibleTypes(next)
  }

  const toggleFilter = (set: Set<string>, val: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set)
    if (next.has(val)) next.delete(val)
    else next.add(val)
    setter(next)
  }

  const pantheonOptions = useMemo(() => {
    return [...new Set(graphData.nodes.map(n => n.pantheon).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b))
  }, [graphData.nodes])

  const planetOptions = useMemo(() => {
    return [...new Set(graphData.nodes.map(n => (n as any).planet).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b))
  }, [graphData.nodes])

  const elementOptions = useMemo(() => {
    return [...new Set(graphData.nodes.map(n => (n as any).element).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b))
  }, [graphData.nodes])

  const offeringOptions = useMemo(() => {
    const out: string[] = []
    graphData.nodes.forEach(n => {
      const arr = (n as any).offerings
      if (Array.isArray(arr)) arr.forEach((x: any) => { if (x) out.push(String(x)) })
    })
    return [...new Set(out)].sort((a, b) => a.localeCompare(b))
  }, [graphData.nodes])

  const toggleExtendedValue = useCallback((
    current: Set<string>,
    setter: (s: Set<string>) => void,
    value: string,
    options: string[]
  ) => {
    const next = new Set(current)
    if (value === '*') {
      if (next.has('*')) setter(new Set())
      else setter(new Set(['*']))
      return
    }

    if (next.has('*')) {
      setter(new Set([value]))
      return
    }

    if (next.has(value)) next.delete(value)
    else next.add(value)

    setter(next)
  }, [])

  const handleSuggestConnections = async () => {
    if (!selectedNode) return
    setIsLoading(true)
    try {
      const suggestions = suggestConnectionsLocal(selectedNode, graphData.nodes, graphData.links, lang as 'en'|'ru')
      if (suggestions.length > 0) {
        setGraphData(prev => {
          const newLinks = [...prev.links]
          let added = 0
          suggestions.forEach(s => {
            const exists = newLinks.some(l => 
              (l.source === selectedNode.id && l.target === s.targetId) ||
              (l.source === s.targetId && l.target === selectedNode.id)
            )
            if (!exists) {
              newLinks.push({ 
                source: selectedNode.id, 
                target: s.targetId, 
                relation: s.relation as any,
                strength: s.strength as any 
              })
              added++
            }
          })
          setSuccessMsg(lang === 'ru' ? `Добавлено связей: ${added}` : `Added links: ${added}`)
          return { ...prev, links: newLinks }
        })
      } else {
        setSuccessMsg(lang === 'ru' ? 'Новых связей не найдено' : 'No new connections found')
      }
    } catch (e) {
      console.error(e)
      setError(lang === 'ru' ? 'Не удалось предложить связи' : 'Failed to suggest connections')
    } finally {
      setIsLoading(false)
    }
  }

  const colors: Record<string, string> = {
    deity: "text-rose-400 border-rose-500/30 bg-rose-500/10",
    spirit: "text-purple-400 border-purple-500/30 bg-purple-500/10",
    ritual: "text-blue-400 border-blue-500/30 bg-blue-500/10",
    symbol: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
    concept: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    place: "text-orange-400 border-orange-500/30 bg-orange-500/10",
    creature: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
    artifact: "text-violet-400 border-violet-500/30 bg-violet-500/10",
    spell: "text-pink-400 border-pink-500/30 bg-pink-500/10",
    sigil: "text-teal-400 border-teal-500/30 bg-teal-500/10",
    epithet: "text-amber-200 border-amber-300/30 bg-amber-500/10",
  }

  const handleNodeClick = useCallback((node: Node) => {
    setSelectedNode(node)
    setSelectedLink(null)
    setMythData(null)
    setWikiData(null)
    setWikiError(null)
    setWikiOpen(false)
    setLinkScanOpen(false)
    setLinkScanReport(null)
    setLinkScanHighlightNodes(new Set())
    setLinkScanHighlightLinks(new Set())
    setShowSigilGenerator(false) // Close sigil generator if open
  }, [])

  const handleLinkClick = useCallback((link: Link) => {
    setSelectedLink(link)
    setSelectedNode(null)
    setLinkScanOpen(false)
    setLinkScanReport(null)
    setLinkScanHighlightNodes(new Set())
    setLinkScanHighlightLinks(new Set())
  }, [])

  const activeVisibleTypes = useMemo(() => {
    if (showRitualsOnly) return new Set(['ritual'])
    return visibleTypes
  }, [visibleTypes, showRitualsOnly])

  const nodeNameById = useMemo(() => {
    return new Map(graphData.nodes.map(node => [node.id, node.name]))
  }, [graphData.nodes])

  const getLinkEndpointLabel = useCallback((endpoint: string | Node) => {
    if (typeof endpoint === 'object' && endpoint?.name) return endpoint.name
    return nodeNameById.get(endpoint as string) ?? (endpoint as string)
  }, [nodeNameById])

  const suggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (q.length < 2) return []
    const scored = graphData.nodes.map(n => {
      const text = [
        n.name,
        n.type,
        n.description || '',
        ...(Array.isArray((n as any).aliases) ? ((n as any).aliases as string[]) : []),
        ...(Array.isArray((n as any).tags) ? ((n as any).tags as string[]) : []),
      ].join(' ').toLowerCase()
      const hit = text.includes(q)
      const score = hit ? (n.name.toLowerCase().startsWith(q) ? 2 : 1) : 0
      return { n, score }
    }).filter(x => x.score > 0).sort((a,b)=>b.score-a.score).slice(0,8).map(x=>x.n)
    return scored
  }, [searchQuery, graphData.nodes])

  const saveNodeEdits = useCallback(() => {
    if (!selectedNode) return
    const id = selectedNode.id
    const tags = draftTags.split(',').map(s=>s.trim()).filter(Boolean)
    const aliases = draftAliases.split(',').map(s=>s.trim()).filter(Boolean)
    setGraphData(prev => {
      const nodes = prev.nodes.map(n => n.id === id ? {
        ...n,
        name: draftName,
        type: draftType as any,
        description: draftDesc || undefined,
        tags,
        aliases,
        sigil_id: draftSigilId || undefined,
        image_url: draftImageUrl || (n.type === 'sigil' ? (n as any).image_url : undefined),
      } : n)
      let links = [...prev.links]
      const updated = nodes.find(n => n.id === id)!
      if (updated.type === 'sigil' && (updated as any).linked_entity_id) {
        const targetId = (updated as any).linked_entity_id as string
        if (nodes.find(x=>x.id===targetId)) {
          const key = `${id}-${targetId}-associated_with`
          const has = links.some(l => `${l.source}-${l.target}-${l.relation}` === key)
          if (!has) links.push({ source: id, target: targetId, relation: 'associated_with' })
        }
      }
      if (updated.type !== 'sigil' && updated.sigil_id) {
        const sig = nodes.find(n => n.id === updated.sigil_id && n.type === 'sigil')
        if (sig) {
          const key = `${sig.id}-${updated.id}-associated_with`
          const has = links.some(l => `${l.source}-${l.target}-${l.relation}` === key)
          if (!has) links.push({ source: sig.id, target: updated.id, relation: 'associated_with' })
        }
      }
      return { nodes, links }
    })
    setEditing(false)
    setSelectedNode(prev => prev ? { ...prev, name: draftName, type: draftType as any, description: draftDesc || undefined, tags: draftTags.split(',').map(s=>s.trim()).filter(Boolean), aliases: draftAliases.split(',').map(s=>s.trim()).filter(Boolean), sigil_id: draftSigilId || undefined, image_url: draftImageUrl || undefined } as any : prev)
    pushWebHistory({
      kind: 'edit',
      summary: lang === 'ru' ? `Изменён узел: ${draftName}` : `Node edited: ${draftName}`,
    })
  }, [selectedNode, draftName, draftType, draftDesc, draftTags, draftAliases, draftSigilId, draftImageUrl, lang, pushWebHistory])

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNode) return
    const ok = window.confirm(lang === 'ru' ? 'Удалить узел и все связанные связи?' : 'Delete this node and all its links?')
    if (!ok) return
    const id = selectedNode.id
    setGraphData(prev => ({
      nodes: prev.nodes.filter(n => n.id !== id),
      links: prev.links.filter(l => l.source !== id && l.target !== id),
    }))
    setSelectedNode(null)
    setSelectedLink(null)
    setEditing(false)
    pushWebHistory({
      kind: 'delete',
      summary: lang === 'ru' ? `Удалён узел: ${selectedNode.name}` : `Node deleted: ${selectedNode.name}`,
    })
  }, [lang, pushWebHistory, selectedNode])

  const applyWikiToSelectedNode = useCallback(() => {
    if (!selectedNode || !wikiData) return
    setGraphData(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === selectedNode.id ? { ...n, description: wikiData.extract } as any : n),
    }))
    setSelectedNode(prev => (prev && prev.id === selectedNode.id ? { ...prev, description: wikiData.extract } as any : prev))
    pushWebHistory({
      kind: 'edit',
      summary: lang === 'ru' ? `Обновлено описание из Wikipedia: ${selectedNode.name}` : `Description updated from Wikipedia: ${selectedNode.name}`,
    })
  }, [lang, pushWebHistory, selectedNode, wikiData])

  const runLinkScan = useCallback(() => {
    if (!selectedNode) return
    const id = selectedNode.id
    const nodeById = new Map(graphData.nodes.map(n => [n.id, n]))
    const related = graphData.links
      .filter(l => String(l.source) === id || String(l.target) === id)
      .map(l => ({ ...l, source: String(l.source), target: String(l.target) }))

    const outgoing = related.filter(l => l.source === id)
    const incoming = related.filter(l => l.target === id)

    const relationCount = new Map<Link['relation'], number>()
    const strengthCount = new Map<string, number>()
    const toRank = (s?: string) => {
      if (s === 'personal') return 4
      if (s === 'strong') return 3
      if (s === 'medium') return 2
      if (s === 'weak') return 1
      return 2
    }

    const strongest: Array<{ otherId: string; otherName: string; direction: 'out' | 'in'; relation: Link['relation']; strength?: string }> = []
    const weakest: Array<{ otherId: string; otherName: string; direction: 'out' | 'in'; relation: Link['relation']; strength?: string }> = []

    related.forEach(l => {
      const relation = l.relation as Link['relation']
      relationCount.set(relation, (relationCount.get(relation) || 0) + 1)
      const strength = (l as any).strength || 'medium'
      strengthCount.set(strength, (strengthCount.get(strength) || 0) + 1)
      const otherId = l.source === id ? l.target : l.source
      const otherName = nodeById.get(otherId)?.name || otherId
      const direction: 'out' | 'in' = l.source === id ? 'out' : 'in'
      const record = { otherId, otherName, direction, relation, strength }
      if (toRank(strength) >= 3) strongest.push(record)
      if (toRank(strength) <= 1) weakest.push(record)
    })

    strongest.sort((a, b) => toRank(b.strength) - toRank(a.strength))
    weakest.sort((a, b) => toRank(a.strength) - toRank(b.strength))

    const highlightNodes = new Set<string>([id])
    const highlightLinks = new Set<string>()
    related.forEach(l => {
      highlightNodes.add(l.source)
      highlightNodes.add(l.target)
      highlightLinks.add(`${l.source}-${l.target}-${l.relation}`)
    })

    setLinkScanReport({
      nodeId: id,
      outgoing: outgoing.length,
      incoming: incoming.length,
      byRelation: [...relationCount.entries()].map(([relation, count]) => ({ relation, count })).sort((a, b) => b.count - a.count),
      byStrength: [...strengthCount.entries()].map(([strength, count]) => ({ strength, count })).sort((a, b) => b.count - a.count),
      strongest: strongest.slice(0, 8),
      weakest: weakest.slice(0, 8),
    })
    setLinkScanHighlightNodes(highlightNodes)
    setLinkScanHighlightLinks(highlightLinks)
    setLinkScanOpen(true)
  }, [graphData.links, graphData.nodes, selectedNode])

  const ritualDetails = useMemo(() => {
    if (!selectedNode || selectedNode.type !== 'ritual') {
      return { relatedNodes: [] as Node[], relatedLinks: [] as Link[] }
    }

    const nodeById = new Map(graphData.nodes.map(node => [node.id, node]))
    const relatedLinks = graphData.links.filter(link => link.source === selectedNode.id || link.target === selectedNode.id)

    const relatedNodes: Node[] = []
    const seenNodeIds = new Set<string>()

    relatedLinks.forEach(link => {
      const relatedId = link.source === selectedNode.id ? link.target : link.source
      if (seenNodeIds.has(relatedId)) return
      const relatedNode = nodeById.get(relatedId)
      if (!relatedNode) return
      seenNodeIds.add(relatedId)
      relatedNodes.push(relatedNode)
    })

    return { relatedNodes, relatedLinks }
  }, [graphData.links, graphData.nodes, selectedNode])

  const wikiVirtual = useMemo(() => {
    const lineHeight = 18
    const viewportHeight = 520
    const overscan = 24
    const startIndex = Math.max(0, Math.floor(wikiScrollTop / lineHeight) - overscan)
    const endIndex = Math.min(wikiLines.length, startIndex + Math.ceil(viewportHeight / lineHeight) + overscan * 2)
    const topPad = startIndex * lineHeight
    const bottomPad = Math.max(0, (wikiLines.length - endIndex) * lineHeight)
    const slice = wikiLines.slice(startIndex, endIndex)
    return { lineHeight, viewportHeight, startIndex, endIndex, topPad, bottomPad, slice, total: wikiLines.length }
  }, [wikiLines, wikiScrollTop])

  return (
    <>
      {/* Myth Review Modal */}
      <AnimatePresence>
        {scanResult && (
          <MythReviewUI 
            result={scanResult} 
            onClose={() => setScanResult(null)} 
            onSave={handleMythSave} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {aiHelpOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="w-full max-w-3xl bg-[hsl(var(--sidebar))] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-foreground">{lang === 'ru' ? 'Помощь ИИ' : 'AI Help'}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {lang === 'ru' ? 'Выберите связи, которые добавить в паутину.' : 'Select links to add to the web.'}
                  </div>
                </div>
                <button onClick={() => setAiHelpOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {aiHelpSuggestions.map((s) => {
                  const key = `${s.sourceId}|${s.targetId}|${s.relation}`
                  const src = graphData.nodes.find(n => n.id === s.sourceId)?.name || s.sourceId
                  const tgt = graphData.nodes.find(n => n.id === s.targetId)?.name || s.targetId
                  return (
                    <label key={key} className="flex items-start gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aiHelpSelected.has(key)}
                        onChange={(e) => {
                          setAiHelpSelected(prev => {
                            const next = new Set(prev)
                            if (e.target.checked) next.add(key)
                            else next.delete(key)
                            return next
                          })
                        }}
                        className="mt-1 accent-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm text-foreground truncate">{src} → {tgt}</div>
                          <div className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-blue-500/25 bg-blue-500/10 text-blue-300 shrink-0">
                            {getRelationLabel(s.relation, lang as 'en' | 'ru')}
                          </div>
                        </div>
                        {s.reason ? (
                          <div className="text-[11px] text-muted-foreground mt-1 leading-snug">
                            {s.reason}
                          </div>
                        ) : null}
                      </div>
                    </label>
                  )
                })}
                {aiHelpSuggestions.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground text-sm italic">
                    {lang === 'ru' ? 'Нет предложений.' : 'No suggestions.'}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-white/10 flex justify-end gap-2">
                <button
                  onClick={() => setAiHelpOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-muted-foreground hover:bg-white/10 transition-colors"
                >
                  {lang === 'ru' ? 'Отмена' : 'Cancel'}
                </button>
                <button
                  onClick={applyAiHelp}
                  className="px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30 text-sm font-bold text-blue-200 hover:bg-blue-500/30 transition-colors"
                >
                  {lang === 'ru' ? 'Добавить выбранное' : 'Apply selected'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {wikiOpen && wikiData && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="w-full max-w-4xl bg-[hsl(var(--sidebar))] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-foreground truncate">
                    {lang === 'ru' ? 'Wikipedia: ' : 'Wikipedia: '}{wikiData.title}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {lang === 'ru'
                      ? 'Текст добавляется в описание сущности (Details). В граф он не попадёт, пока вы не добавите связи.'
                      : 'This text is for entity details (Description). It won’t change the graph unless you add links.'}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={wikiData.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[11px] font-bold tracking-wider text-foreground/80 hover:bg-white/10 transition-colors"
                  >
                    {lang === 'ru' ? 'Открыть' : 'Open'}
                  </a>
                  <button onClick={() => setWikiOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div className="p-3 border-b border-white/10 flex items-center justify-between gap-2">
                <div className="text-[11px] text-muted-foreground">
                  {lang === 'ru' ? `Строки: ${wikiVirtual.total}` : `Lines: ${wikiVirtual.total}`}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => wikiScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                  >
                    {lang === 'ru' ? 'Вверх' : 'Top'}
                  </button>
                  <button
                    onClick={() => {
                      const el = wikiScrollRef.current
                      if (!el) return
                      el.scrollTo({ top: Math.max(0, el.scrollTop - wikiVirtual.viewportHeight), behavior: 'smooth' })
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                  >
                    {lang === 'ru' ? 'Стр.↑' : 'Pg↑'}
                  </button>
                  <button
                    onClick={() => {
                      const el = wikiScrollRef.current
                      if (!el) return
                      el.scrollTo({ top: el.scrollTop + wikiVirtual.viewportHeight, behavior: 'smooth' })
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                  >
                    {lang === 'ru' ? 'Стр.↓' : 'Pg↓'}
                  </button>
                  <button
                    onClick={() => wikiScrollRef.current?.scrollTo({ top: wikiVirtual.total * wikiVirtual.lineHeight, behavior: 'smooth' })}
                    className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                  >
                    {lang === 'ru' ? 'Вниз' : 'Bottom'}
                  </button>
                </div>
              </div>

              <div
                ref={wikiScrollRef}
                onScroll={(e) => setWikiScrollTop((e.target as HTMLDivElement).scrollTop)}
                className="flex-1 overflow-y-auto px-4 py-3"
                style={{ scrollbarWidth: 'thin' }}
              >
                <div style={{ height: wikiVirtual.topPad }} />
                <div className="space-y-0.5">
                  {wikiVirtual.slice.map((line, idx) => (
                    <div key={wikiVirtual.startIndex + idx} className="text-[12px] leading-[18px] text-foreground/85 whitespace-pre-wrap break-words">
                      {line}
                    </div>
                  ))}
                </div>
                <div style={{ height: wikiVirtual.bottomPad }} />
              </div>

              <div className="p-4 border-t border-white/10 flex justify-end gap-2">
                <button
                  onClick={() => setWikiOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-muted-foreground hover:bg-white/10 transition-colors"
                >
                  {lang === 'ru' ? 'Закрыть' : 'Close'}
                </button>
                <button
                  onClick={() => {
                    applyWikiToSelectedNode()
                    setWikiOpen(false)
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-sm font-bold text-indigo-200 hover:bg-indigo-500/30 transition-colors"
                >
                  {lang === 'ru' ? 'Вставить в описание' : 'Apply to description'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {linkScanOpen && linkScanReport && selectedNode && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="w-full max-w-3xl bg-[hsl(var(--sidebar))] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-foreground">{lang === 'ru' ? 'Скан связей' : 'Link scan'}</div>
                  <div className="text-[11px] text-muted-foreground">{selectedNode.name}</div>
                </div>
                <button
                  onClick={() => {
                    setLinkScanOpen(false)
                    setLinkScanHighlightNodes(new Set())
                    setLinkScanHighlightLinks(new Set())
                  }}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: 'thin' }}>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl border border-white/10 bg-white/5">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{lang === 'ru' ? 'Исходящие' : 'Outgoing'}</div>
                    <div className="text-xl font-light text-foreground">{linkScanReport.outgoing}</div>
                  </div>
                  <div className="p-3 rounded-xl border border-white/10 bg-white/5">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{lang === 'ru' ? 'Входящие' : 'Incoming'}</div>
                    <div className="text-xl font-light text-foreground">{linkScanReport.incoming}</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-white/10 bg-white/5">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">{lang === 'ru' ? 'По типу связи' : 'By relation'}</div>
                  <div className="flex flex-wrap gap-2">
                    {linkScanReport.byRelation.map(r => (
                      <div key={r.relation} className="px-2 py-1 rounded-lg border border-white/10 bg-black/20 text-[11px] text-foreground/80">
                        {getRelationLabel(r.relation, lang as 'en' | 'ru')} · {r.count}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-white/10 bg-white/5">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">{lang === 'ru' ? 'По силе' : 'By strength'}</div>
                  <div className="flex flex-wrap gap-2">
                    {linkScanReport.byStrength.map(s => (
                      <div key={s.strength} className="px-2 py-1 rounded-lg border border-white/10 bg-black/20 text-[11px] text-foreground/80">
                        {s.strength} · {s.count}
                      </div>
                    ))}
                  </div>
                </div>

                {linkScanReport.strongest.length > 0 && (
                  <div className="p-3 rounded-xl border border-white/10 bg-white/5">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">{lang === 'ru' ? 'Сильные связи' : 'Strong links'}</div>
                    <div className="space-y-2">
                      {linkScanReport.strongest.map((x, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2 text-[12px]">
                          <div className="text-foreground/85 truncate">{x.direction === 'out' ? '→' : '←'} {x.otherName}</div>
                          <div className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-300 shrink-0">
                            {getRelationLabel(x.relation, lang as 'en' | 'ru')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {linkScanReport.weakest.length > 0 && (
                  <div className="p-3 rounded-xl border border-white/10 bg-white/5">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">{lang === 'ru' ? 'Слабые связи' : 'Weak links'}</div>
                    <div className="space-y-2">
                      {linkScanReport.weakest.map((x, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2 text-[12px]">
                          <div className="text-foreground/85 truncate">{x.direction === 'out' ? '→' : '←'} {x.otherName}</div>
                          <div className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-amber-500/25 bg-amber-500/10 text-amber-300 shrink-0">
                            {getRelationLabel(x.relation, lang as 'en' | 'ru')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-white/10 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setLinkScanOpen(false)
                    setLinkScanHighlightNodes(new Set())
                    setLinkScanHighlightLinks(new Set())
                  }}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-muted-foreground hover:bg-white/10 transition-colors"
                >
                  {lang === 'ru' ? 'Закрыть' : 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {manualLinkOpen && selectedNode && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="w-full max-w-3xl bg-[hsl(var(--sidebar))] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-foreground">{lang === 'ru' ? 'Создать связь' : 'Create link'}</div>
                  <div className="text-[11px] text-muted-foreground">{selectedNode.name}</div>
                </div>
                <button onClick={() => setManualLinkOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: 'thin' }}>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl border border-white/10 bg-white/5">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">{lang === 'ru' ? 'Тип связи' : 'Relation'}</div>
                    <select
                      value={manualLinkRelation}
                      onChange={(e) => setManualLinkRelation(normalizeRelation(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-foreground"
                    >
                      <option value="associated_with">associated_with</option>
                      <option value="controls">controls</option>
                      <option value="appears_in">appears_in</option>
                      <option value="teaches">teaches</option>
                      <option value="symbol_of">symbol_of</option>
                    </select>
                  </div>
                  <div className="p-3 rounded-xl border border-white/10 bg-white/5">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">{lang === 'ru' ? 'Сила' : 'Strength'}</div>
                    <select
                      value={manualLinkStrength}
                      onChange={(e) => setManualLinkStrength((e.target.value as any) || 'medium')}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-foreground"
                    >
                      <option value="weak">weak</option>
                      <option value="medium">medium</option>
                      <option value="strong">strong</option>
                      <option value="personal">personal</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-white/10 bg-white/5 space-y-2">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{lang === 'ru' ? 'Цель' : 'Target'}</div>
                  <input
                    value={manualLinkTargetQuery}
                    onChange={(e) => setManualLinkTargetQuery(e.target.value)}
                    placeholder={lang === 'ru' ? 'Поиск узла…' : 'Search node…'}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary/50 transition-colors text-foreground placeholder:text-muted-foreground"
                  />
                  {manualLinkTargetId && (
                    <div className="text-[11px] text-muted-foreground">
                      {lang === 'ru' ? 'Выбрано: ' : 'Selected: '}
                      <span className="text-foreground">
                        {graphData.nodes.find(n => n.id === manualLinkTargetId)?.name || manualLinkTargetId}
                      </span>
                    </div>
                  )}
                  <div className="space-y-1">
                    {manualLinkCandidates.map(n => {
                      const checked = manualLinkTargetId === n.id
                      return (
                        <button
                          key={n.id}
                          onClick={() => setManualLinkTargetId(n.id)}
                          className={`w-full text-left px-3 py-2 rounded-xl border transition-colors ${
                            checked
                              ? 'border-primary/30 bg-primary/10 text-foreground'
                              : 'border-white/10 bg-black/20 text-foreground/80 hover:bg-white/10'
                          }`}
                          title={n.id}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-sm truncate">{n.name}</div>
                              <div className="text-[11px] text-muted-foreground truncate">{n.id}</div>
                            </div>
                            <div className={`w-4 h-4 rounded border ${checked ? 'bg-primary border-primary' : 'bg-transparent border-white/20'}`} />
                          </div>
                        </button>
                      )
                    })}
                    {manualLinkCandidates.length === 0 && (
                      <div className="text-[11px] text-muted-foreground/70 italic">
                        {lang === 'ru' ? 'Ничего не найдено.' : 'No matches.'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-white/10 flex justify-end gap-2">
                <button
                  onClick={() => setManualLinkOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-muted-foreground hover:bg-white/10 transition-colors"
                >
                  {lang === 'ru' ? 'Отмена' : 'Cancel'}
                </button>
                <button
                  onClick={applyManualLink}
                  disabled={!manualLinkTargetId}
                  className="px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-sm font-bold text-emerald-200 hover:bg-emerald-500/25 transition-colors disabled:opacity-40"
                >
                  {lang === 'ru' ? 'Добавить связь' : 'Add link'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {presetModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="w-full max-w-3xl bg-[hsl(var(--sidebar))] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-foreground">{lang === 'ru' ? 'Библиотека пресетов' : 'Preset library'}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {lang === 'ru'
                      ? 'Выберите набор и автозаполните паутину. Можно добавлять или заменить текущую паутину.'
                      : 'Pick a pack and auto-fill your web. You can merge or replace.'}
                  </div>
                </div>
                <button onClick={() => setPresetModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: 'thin' }}>
                {presetLibraryError && (
                  <div className="p-3 rounded-xl border border-red-500/25 bg-red-500/10 text-red-200 text-sm">
                    {presetLibraryError}
                  </div>
                )}

                <div className="p-3 rounded-xl border border-white/10 bg-white/5">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">
                    {lang === 'ru' ? 'Наборы' : 'Packs'}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {presetPacks.map(p => {
                      const disabled = !presetLibrary || p.roots.length === 0
                      const checked = selectedPresetPacks.has(p.id)
                      return (
                        <button
                          key={p.id}
                          disabled={disabled}
                          onClick={() => {
                            setSelectedPresetPacks(prev => {
                              const next = new Set(prev)
                              if (next.has(p.id)) next.delete(p.id)
                              else next.add(p.id)
                              return next
                            })
                          }}
                          className={`p-3 rounded-xl border text-left transition-colors ${
                            disabled
                              ? 'border-white/10 bg-white/5 text-muted-foreground/40 opacity-60 cursor-not-allowed'
                              : checked
                                ? 'border-primary/30 bg-primary/10 text-foreground hover:bg-primary/15'
                                : 'border-white/10 bg-black/20 text-foreground/80 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-medium truncate">{p.title}</div>
                            <div className={`w-4 h-4 rounded border ${checked ? 'bg-primary border-primary' : 'bg-transparent border-white/20'}`} />
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-1">
                            {lang === 'ru'
                              ? `Корней: ${p.roots.length}`
                              : `Roots: ${p.roots.length}`}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-white/10 bg-white/5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                      {lang === 'ru' ? 'Корни (точечно)' : 'Roots (manual)'}
                    </div>
                    <button
                      onClick={() => setSelectedPresetRoots(new Set())}
                      className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] uppercase tracking-wider font-bold text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                    >
                      {lang === 'ru' ? 'Очистить' : 'Clear'}
                    </button>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {lang === 'ru'
                      ? 'Наборы добавляют корни автоматически. Здесь можно выбрать конкретный узел (например Zeus) и импортировать только его подграф.'
                      : 'Packs add roots automatically. Here you can pick a specific node and import only its subgraph.'}
                  </div>

                  <input
                    value={presetRootQuery}
                    onChange={(e) => setPresetRootQuery(e.target.value)}
                    placeholder={lang === 'ru' ? 'Поиск по id/имени/тегам…' : 'Search by id/name/tags…'}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary/50 transition-colors text-foreground placeholder:text-muted-foreground"
                  />

                  {selectedPresetRoots.size > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {[...selectedPresetRoots].slice(0, 24).map(id => {
                        const n = presetLibrary?.nodes.find(x => x.id === id)
                        return (
                          <button
                            key={id}
                            onClick={() => {
                              setSelectedPresetRoots(prev => {
                                const next = new Set(prev)
                                next.delete(id)
                                return next
                              })
                            }}
                            className="px-2 py-1 rounded-lg border border-primary/25 bg-primary/10 text-[11px] text-primary hover:bg-primary/15 transition-colors"
                            title={id}
                          >
                            {n?.name || id}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  <div className="space-y-1">
                    {presetRootCandidates.length === 0 ? (
                      <div className="text-[11px] text-muted-foreground/70 italic">
                        {lang === 'ru' ? 'Ничего не найдено.' : 'No matches.'}
                      </div>
                    ) : (
                      presetRootCandidates.map(n => {
                        const checked = selectedPresetRoots.has(n.id)
                        return (
                          <button
                            key={n.id}
                            onClick={() => {
                              setSelectedPresetRoots(prev => {
                                const next = new Set(prev)
                                if (next.has(n.id)) next.delete(n.id)
                                else next.add(n.id)
                                return next
                              })
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl border transition-colors ${
                              checked
                                ? 'border-primary/30 bg-primary/10 text-foreground'
                                : 'border-white/10 bg-black/20 text-foreground/80 hover:bg-white/10'
                            }`}
                            title={n.id}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-sm truncate">{n.name}</div>
                                <div className="text-[11px] text-muted-foreground truncate">{n.id}</div>
                              </div>
                              <div className={`w-4 h-4 rounded border ${checked ? 'bg-primary border-primary' : 'bg-transparent border-white/20'}`} />
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-white/10 bg-white/5 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                      {lang === 'ru' ? 'Режим импорта' : 'Import mode'}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPresetMode('merge')}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                          presetMode === 'merge' ? 'bg-blue-500/20 border-blue-500/30 text-blue-200' : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'
                        }`}
                      >
                        {lang === 'ru' ? 'Добавить' : 'Merge'}
                      </button>
                      <button
                        onClick={() => setPresetMode('replace')}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                          presetMode === 'replace' ? 'bg-amber-500/15 border-amber-500/25 text-amber-200' : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'
                        }`}
                      >
                        {lang === 'ru' ? 'Заменить' : 'Replace'}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-[9px] text-muted-foreground uppercase tracking-widest font-bold">
                      <span>{lang === 'ru' ? 'Глубина связей' : 'Link depth'}</span>
                      <span className="text-primary">{presetDepth}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="3"
                      step="1"
                      value={presetDepth}
                      onChange={(e) => setPresetDepth(parseInt(e.target.value, 10))}
                      className="w-full accent-primary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="text-[9px] text-muted-foreground/70">
                      {lang === 'ru'
                        ? '0 = только выбранные корни; 1–3 = добавить связанные узлы из набора.'
                        : '0 = only roots; 1–3 = include linked nodes from the pack.'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl border border-white/10 bg-black/20">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{lang === 'ru' ? 'Предпросмотр: узлы' : 'Preview: nodes'}</div>
                      <div className="text-xl font-light text-foreground">{presetPreview?.nodes.length ?? 0}</div>
                    </div>
                    <div className="p-3 rounded-xl border border-white/10 bg-black/20">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{lang === 'ru' ? 'Предпросмотр: связи' : 'Preview: links'}</div>
                      <div className="text-xl font-light text-foreground">{presetPreview?.links.length ?? 0}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-white/10 flex justify-end gap-2">
                <button
                  onClick={() => setPresetModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-muted-foreground hover:bg-white/10 transition-colors"
                >
                  {lang === 'ru' ? 'Отмена' : 'Cancel'}
                </button>
                <button
                  onClick={applyPresetPreview}
                  disabled={!presetPreview || presetPreview.nodes.length === 0}
                  className="px-4 py-2 rounded-xl bg-primary/20 border border-primary/30 text-sm font-bold text-primary hover:bg-primary/30 transition-colors disabled:opacity-40"
                >
                  {lang === 'ru' ? 'Импортировать' : 'Import'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Guest mode: если нет user.id, показываем ограниченный UI */}
      {!user || !user.id ? (
        <div className="flex flex-col items-center justify-center h-full w-full p-8">
          <h2 className="text-xl font-bold mb-4">Гостевой режим</h2>
          <p className="mb-4">Вы не авторизованы. Для полного доступа к паутине знаний войдите через Google.</p>
          <button
            className="px-4 py-2 bg-primary text-white rounded-lg"
            onClick={() => window.location.href = 'https://esoterica-os.supabase.co/auth/v1/authorize?provider=google&redirect_to=' + encodeURIComponent(window.location.origin)}
          >Войти через Google</button>
          <div className="mt-8 text-sm text-gray-500">В гостевом режиме доступна только визуализация, редактирование и синхронизация отключены.</div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4 h-full w-full overflow-y-auto lg:overflow-hidden p-1">
          {/* Left Column: Controls */}
          <div className={`${isExpanded ? 'hidden' : 'flex'} flex-col gap-4 w-full lg:w-[360px] shrink-0 overflow-y-auto pr-1`} style={{ scrollbarWidth: 'thin' }}>
            {/* Error Message Toast */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-bold flex items-center gap-2"
                >
                  <Info className="w-4 h-4" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  <SpiderWebIcon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs font-mono uppercase tracking-widest text-primary/70">{t.subtitle}</span>
              </div>
              <button
                onClick={() => setShowGuide(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary transition-colors hover:bg-primary/20"
              >
                <Info className="w-3 h-3" />
                {lang === 'ru' ? 'Как работает' : 'How it works'}
              </button>
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:border-primary/50 transition-colors text-foreground placeholder:text-muted-foreground"
              />
              {suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-[hsl(var(--sidebar))] border border-white/10 rounded-lg shadow-xl z-20 max-h-48 overflow-auto">
                  {suggestions.map(s => (
                    <button
                      key={s.id}
                      onClick={() => { setSelectedNode(s); setSelectedLink(null) }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-white/10 border-b border-white/5 last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-foreground">{s.name}</span>
                        <span className={`ml-2 px-1.5 py-0.5 rounded border text-[10px] uppercase tracking-wider ${colors[s.type]}`}>{getTypeLabel(s.type)}</span>
                      </div>
                      {s.description && <div className="text-[11px] text-muted-foreground/80 truncate">{s.description}</div>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filters + Sync Button */}
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Filter className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{t.filters}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { 
                      setVisibleTypes(new Set(ALL_TYPES)); 
                      setActivePantheons(new Set(['*'])); 
                      setActivePlanets(new Set(['*'])); 
                      setActiveElements(new Set(['*'])); 
                      setActiveOfferings(new Set(['*']));
                      setShowRitualsOnly(false) 
                    }}
                    className="px-1 py-[2px] rounded-md text-[8px] leading-none uppercase tracking-wider font-bold transition-colors bg-white/10 text-muted-foreground hover:text-foreground border border-white/15 whitespace-nowrap"
                  >
                    {lang === 'ru' ? 'Сброс (Все вкл)' : 'Reset (All On)'}
                  </button>
                  <button
                    onClick={() => { 
                      setVisibleTypes(new Set()); 
                      setActivePantheons(new Set()); 
                      setActivePlanets(new Set()); 
                      setActiveElements(new Set()); 
                      setActiveOfferings(new Set());
                      setShowRitualsOnly(false) 
                    }}
                    className="px-1 py-[2px] rounded-md text-[8px] leading-none uppercase tracking-wider font-bold transition-colors bg-white/5 text-muted-foreground hover:text-red-400 border border-white/10 whitespace-nowrap"
                  >
                    {lang === 'ru' ? 'Выкл все' : 'All Off'}
                  </button>
                  <button
                    onClick={() => setShowRitualsOnly(!showRitualsOnly)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] uppercase tracking-wider font-bold transition-colors ${showRitualsOnly ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-muted-foreground border border-white/10'}`}
                  >
                    <Activity className="w-2.5 h-2.5" />
                    {t.ritualLayer}
                  </button>
                </div>
              </div>
              
              {/* Type Filters */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {ALL_TYPES.map(type => (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    disabled={showRitualsOnly}
                    className={`px-2 py-0.5 rounded-lg text-[9px] uppercase tracking-wider font-bold border transition-all ${activeVisibleTypes.has(type) ? colors[type] : 'bg-white/5 text-muted-foreground/40 border-white/5 opacity-40'}`}
                  >
                    {getTypeLabel(type)}
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-white/5 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {[
                    { title: lang === 'ru' ? t.pantheons : 'Pantheons', set: activePantheons, setter: setActivePantheons, color: 'text-rose-400 border-rose-500/30', options: pantheonOptions },
                    { title: lang === 'ru' ? t.planetary : 'Planetary', set: activePlanets, setter: setActivePlanets, color: 'text-purple-400 border-purple-500/30', options: planetOptions },
                    { title: lang === 'ru' ? t.elements : 'Elements', set: activeElements, setter: setActiveElements, color: 'text-orange-400 border-orange-500/30', options: elementOptions },
                    { title: lang === 'ru' ? t.offerings : 'Offerings', set: activeOfferings, setter: setActiveOfferings, color: 'text-emerald-400 border-emerald-500/30', options: offeringOptions }
                  ].map(group => (
                    <button 
                      key={group.title}
                      onClick={() => {
                        const isActive = group.set.size > 0
                        if (isActive) group.setter(new Set())
                        else group.setter(new Set(['*']))
                      }}
                      className={`px-2 py-0.5 rounded-lg text-[9px] uppercase tracking-wider font-bold border transition-all flex items-center gap-1.5 ${group.set.size > 0 ? `bg-white/10 ${group.color}` : 'bg-white/5 border-white/5 text-muted-foreground/40'}`}
                    >
                      <span>{group.title}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${group.set.size > 0 ? 'bg-current' : 'bg-white/20'}`} />
                    </button>
                  ))}
                </div>

                {activePantheons.size > 0 && pantheonOptions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => toggleExtendedValue(activePantheons, setActivePantheons, '*', pantheonOptions)}
                      className={`px-2 py-0.5 rounded-lg text-[9px] uppercase tracking-wider font-bold border transition-all ${activePantheons.has('*') ? 'bg-rose-500/15 border-rose-500/25 text-rose-300' : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'}`}
                    >
                      {lang === 'ru' ? 'Все' : 'All'}
                    </button>
                    {pantheonOptions.map(p => (
                      <button
                        key={p}
                        onClick={() => toggleExtendedValue(activePantheons, setActivePantheons, p, pantheonOptions)}
                        className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border transition-all ${activePantheons.has('*') || activePantheons.has(p) ? 'bg-rose-500/10 border-rose-500/20 text-rose-200' : 'bg-white/5 border-white/10 text-muted-foreground/50 hover:bg-white/10 hover:text-muted-foreground'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}

                {activePlanets.size > 0 && planetOptions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => toggleExtendedValue(activePlanets, setActivePlanets, '*', planetOptions)}
                      className={`px-2 py-0.5 rounded-lg text-[9px] uppercase tracking-wider font-bold border transition-all ${activePlanets.has('*') ? 'bg-purple-500/15 border-purple-500/25 text-purple-300' : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'}`}
                    >
                      {lang === 'ru' ? 'Все' : 'All'}
                    </button>
                    {planetOptions.map(p => (
                      <button
                        key={p}
                        onClick={() => toggleExtendedValue(activePlanets, setActivePlanets, p, planetOptions)}
                        className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border transition-all ${activePlanets.has('*') || activePlanets.has(p) ? 'bg-purple-500/10 border-purple-500/20 text-purple-200' : 'bg-white/5 border-white/10 text-muted-foreground/50 hover:bg-white/10 hover:text-muted-foreground'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}

                {activeElements.size > 0 && elementOptions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => toggleExtendedValue(activeElements, setActiveElements, '*', elementOptions)}
                      className={`px-2 py-0.5 rounded-lg text-[9px] uppercase tracking-wider font-bold border transition-all ${activeElements.has('*') ? 'bg-orange-500/15 border-orange-500/25 text-orange-300' : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'}`}
                    >
                      {lang === 'ru' ? 'Все' : 'All'}
                    </button>
                    {elementOptions.map(p => (
                      <button
                        key={p}
                        onClick={() => toggleExtendedValue(activeElements, setActiveElements, p, elementOptions)}
                        className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border transition-all ${activeElements.has('*') || activeElements.has(p) ? 'bg-orange-500/10 border-orange-500/20 text-orange-200' : 'bg-white/5 border-white/10 text-muted-foreground/50 hover:bg-white/10 hover:text-muted-foreground'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}

                {activeOfferings.size > 0 && offeringOptions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => toggleExtendedValue(activeOfferings, setActiveOfferings, '*', offeringOptions)}
                      className={`px-2 py-0.5 rounded-lg text-[9px] uppercase tracking-wider font-bold border transition-all ${activeOfferings.has('*') ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-300' : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'}`}
                    >
                      {lang === 'ru' ? 'Все' : 'All'}
                    </button>
                    {offeringOptions.map(p => (
                      <button
                        key={p}
                        onClick={() => toggleExtendedValue(activeOfferings, setActiveOfferings, p, offeringOptions)}
                        className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border transition-all ${activeOfferings.has('*') || activeOfferings.has(p) ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200' : 'bg-white/5 border-white/10 text-muted-foreground/50 hover:bg-white/10 hover:text-muted-foreground'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Visualization Settings */}
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
              <button onClick={() => setShowVizSettings(!showVizSettings)} className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-primary/70" />
                  <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{t.vizSettings}</span>
                </div>
                <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${showVizSettings ? 'rotate-180' : ''}`} />
              </button>
              {showVizSettings && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="pt-3 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{t.powerFlows}</span>
                    <button onClick={() => setShowFlows(!showFlows)} className={`w-9 h-5 rounded-full transition-all relative ${showFlows ? 'bg-primary' : 'bg-white/10'}`}>
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${showFlows ? 'left-5' : 'left-1'}`} />
                    </button>
                  </div>
                  {showFlows && (
                    <>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-[9px] text-muted-foreground uppercase tracking-widest font-bold">
                          <span>{t.flowSpeed}</span>
                          <span className="text-primary">{flowSpeed.toFixed(1)}x</span>
                        </div>
                        <input type="range" min="0.1" max="3" step="0.1" value={flowSpeed}
                          onChange={(e) => setFlowSpeed(parseFloat(e.target.value))}
                          className="w-full accent-primary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-[9px] text-muted-foreground uppercase tracking-widest font-bold">
                          <span>{t.flowIntensity}</span>
                          <span className="text-primary">{flowIntensity.toFixed(1)}x</span>
                        </div>
                        <input type="range" min="0.1" max="2" step="0.1" value={flowIntensity}
                          onChange={(e) => setFlowIntensity(parseFloat(e.target.value))}
                          className="w-full accent-primary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{t.hideWeak}</span>
                        <button onClick={() => setHideWeakFlows(!hideWeakFlows)} className={`w-9 h-5 rounded-full transition-all relative ${hideWeakFlows ? 'bg-primary' : 'bg-white/10'}`}>
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${hideWeakFlows ? 'left-5' : 'left-1'}`} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                          {lang === 'ru' ? 'Подсветка фильтров' : 'Filter badges'}
                        </span>
                        <button onClick={() => setShowFilterBadges(!showFilterBadges)} className={`w-9 h-5 rounded-full transition-all relative ${showFilterBadges ? 'bg-primary' : 'bg-white/10'}`}>
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${showFilterBadges ? 'left-5' : 'left-1'}`} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                          {lang === 'ru' ? 'Подписи' : 'Labels'}
                        </span>
                        <select
                          value={labelMode}
                          onChange={(e) => setLabelMode((e.target.value === 'all' ? 'all' : 'important') as any)}
                          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-foreground"
                        >
                          <option value="important">{lang === 'ru' ? 'Важные' : 'Important'}</option>
                          <option value="all">{lang === 'ru' ? 'Все' : 'All'}</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-[9px] text-muted-foreground uppercase tracking-widest font-bold">
                          <span>{lang === 'ru' ? 'Лимит узлов' : 'Node limit'}</span>
                          <span className="text-primary">{maxRenderNodes}</span>
                        </div>
                        <input
                          type="range"
                          min="300"
                          max="4000"
                          step="100"
                          value={maxRenderNodes}
                          onChange={(e) => setMaxRenderNodes(parseInt(e.target.value, 10))}
                          className="w-full accent-primary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="text-[9px] text-muted-foreground/70">
                          {lang === 'ru'
                            ? 'При больших графах отображается подмножество (выделенное + ближайшие + влиятельные).'
                            : 'Large graphs render a subset (highlighted + neighbors + influential).'}
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </div>

            {/* Text Input */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setIsRitualMode(!isRitualMode)}
                className={`self-start flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${isRitualMode ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground'}`}
              >
                <Activity className="w-3 h-3" />
                {t.markAsRitual}
              </button>
              {isRitualMode && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
                  <input
                    type="text"
                    value={ritualNameInput}
                    onChange={(e) => setRitualNameInput(e.target.value)}
                    placeholder={t.ritualName}
                    className="w-full bg-purple-500/5 border border-purple-500/20 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-purple-500/50 transition-colors text-purple-200 placeholder:text-purple-400/40 mb-1"
                  />
                </motion.div>
              )}
              <div className="relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleExtract() }}
                  placeholder={t.inputPlaceholder}
                  rows={8}
                  className={`w-full min-h-[190px] bg-white/5 border rounded-2xl p-4 text-sm resize-y focus:outline-none transition-colors placeholder:text-muted-foreground/50 text-foreground ${isRitualMode ? 'border-purple-500/30 focus:border-purple-500/50' : 'border-white/10 focus:border-primary/50'}`}
                />
                <div className="absolute bottom-3 right-3 z-50 pointer-events-auto">
                  <button
                    type="button"
                    onClick={handleExtract}
                    onMouseDown={(e) => { e.stopPropagation() }}
                    disabled={isLoading || !inputText.trim()}
                    className={`flex items-center gap-1.5 font-medium px-4 py-2 rounded-xl transition-all shadow-lg text-sm touch-manipulation ${isRitualMode ? 'bg-purple-500 hover:bg-purple-600 text-white' : 'bg-primary hover:bg-primary/90 text-primary-foreground'} disabled:opacity-30 disabled:cursor-not-allowed`}
                    onTouchEnd={(e) => { e.preventDefault(); if (!isLoading && inputText.trim()) handleExtract() }}
                  >
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    {t.weaveBtn}
                  </button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center gap-1.5 mb-1">
                  <Database className="w-3 h-3 text-emerald-500" />
                  <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-500/70">{t.nodes}</span>
                </div>
                <div className="text-lg font-light text-foreground">{graphData.nodes.length}</div>
              </div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center gap-1.5 mb-1">
                  <Share2 className="w-3 h-3 text-blue-500" />
                  <span className="text-[9px] uppercase tracking-wider font-bold text-blue-500/70">{t.links}</span>
                </div>
                <div className="text-lg font-light text-foreground">{graphData.links.length}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-1.5">
              <button onClick={handleDownload} disabled={graphData.nodes.length === 0}
                className="flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-30 text-foreground/80 py-2 rounded-xl transition-all text-[10px] uppercase tracking-wider font-bold">
                <FileJson className="w-3 h-3" /> JSON
              </button>
              <button onClick={handleExportCSV} disabled={graphData.nodes.length === 0}
                className="flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-30 text-foreground/80 py-2 rounded-xl transition-all text-[10px] uppercase tracking-wider font-bold">
                <FileSpreadsheet className="w-3 h-3" /> CSV
              </button>
              <button onClick={handleExportPNG} disabled={graphData.nodes.length === 0}
                className="flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-30 text-foreground/80 py-2 rounded-xl transition-all text-[10px] uppercase tracking-wider font-bold">
                <ImageIcon className="w-3 h-3" /> PNG
              </button>
              <label className="flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer text-foreground/80 py-2 rounded-xl transition-all text-[10px] uppercase tracking-wider font-bold">
                <Upload className="w-3 h-3" /> {lang === 'ru' ? 'Импорт' : 'Import'}
                <input type="file" multiple accept=".json" onChange={handleImportJsons} className="hidden" />
              </label>
              <button onClick={reorganizeGraph} disabled={graphData.nodes.length === 0 || isLoading}
                className="flex items-center justify-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 disabled:opacity-30 text-emerald-400 py-2 rounded-xl transition-all text-[10px] uppercase tracking-wider font-bold">
                {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Layers className="w-3 h-3" />}
                {lang === 'ru' ? 'Реорг.' : 'Reorg.'}
              </button>
              <button onClick={() => setShowAnalytics(!showAnalytics)}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all text-[10px] uppercase tracking-wider font-bold border ${showAnalytics ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-white/5 border-white/10 text-foreground/60 hover:bg-white/10'}`}>
                <Activity className="w-3 h-3" />
                {lang === 'ru' ? 'Аналит.' : 'Analytics'}
              </button>
            </div>

            <button
              onClick={() => setPresetModalOpen(true)}
              className="w-full mt-2 flex items-center justify-center gap-1.5 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/25 text-purple-200 py-2 rounded-xl transition-all text-[10px] uppercase tracking-wider font-bold"
            >
              <Tag className="w-3 h-3" />
              {lang === 'ru' ? 'Пресеты' : 'Presets'}
            </button>

            <button
              onClick={runAiHelp}
              disabled={aiHelpLoading || graphData.nodes.length === 0}
              className="w-full mt-2 flex items-center justify-center gap-1.5 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/25 text-blue-300 py-2 rounded-xl transition-all text-[10px] uppercase tracking-wider font-bold disabled:opacity-30"
            >
              {aiHelpLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              {lang === 'ru' ? 'Помощь ИИ' : 'AI Help'}
            </button>
            {aiHelpError && (
              <div className="mt-2 text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-2">
                {aiHelpError}
              </div>
            )}

            <div className="mt-2 p-3 bg-white/5 border border-white/10 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                  {lang === 'ru' ? 'История паутины' : 'Web history'}
                </div>
                <button
                  onClick={() => {
                    setWebHistory([])
                    try {
                      localStorage.removeItem(HISTORY_KEY)
                    } catch {}
                  }}
                  className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] uppercase tracking-wider font-bold text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                >
                  {lang === 'ru' ? 'Очистить' : 'Clear'}
                </button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                {webHistory.slice(0, 12).map(ev => (
                  <div key={ev.id} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[11px] text-foreground/80 leading-snug">{ev.summary}</div>
                      <div className="text-[9px] font-mono text-white/30 shrink-0">
                        {new Date(ev.date).toLocaleDateString()} {new Date(ev.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                {webHistory.length === 0 && (
                  <div className="text-[11px] text-white/30 italic">
                    {lang === 'ru' ? 'Пока нет событий.' : 'No events yet.'}
                  </div>
                )}
              </div>
            </div>

            {/* Sync button near Reset */}
            <button
              onClick={async () => {
                setIsLoading(true);
                setError(null);
                try {
                  const synced = await syncGraph(user.id);
                  setGraphData(synced);
                  setSuccessMsg(lang === 'ru' ? 'Паутина синхронизирована!' : 'Web synchronized!');
                } catch (err) {
                  setError(lang === 'ru' ? 'Ошибка синхронизации!' : 'Sync error!');
                } finally {
                  setIsLoading(false);
                }
              }}
              className="w-full mt-2 flex items-center justify-center gap-1.5 bg-green-500/15 hover:bg-green-500/25 border border-green-500/25 text-green-600 py-2 rounded-xl transition-all text-[10px] uppercase tracking-wider font-bold disabled:opacity-30"
              disabled={isLoading}
            >
              <Database className="w-3 h-3" />
              {lang === 'ru' ? 'Синхронизировать паутину' : 'Sync Web'}
            </button>

            <button onClick={handleResetWeb}
              className="w-full flex items-center justify-center gap-2 bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 text-destructive py-2 rounded-xl transition-all text-xs font-medium">
              <Trash2 className="w-3.5 h-3.5" />
              {t.resetWeb}
            </button>

            <footer className="text-[9px] text-muted-foreground/40 flex items-center gap-3 border-t border-white/5 pt-3 mt-auto">
              <div className="flex items-center gap-1"><Info className="w-2.5 h-2.5" /><span>OpenRouter AI</span></div>
              <span>Arachna v1.0</span>
            </footer>
          </div>
          {/* Right Column: Graph */}
          <div className="flex-1 relative flex min-h-[400px] lg:min-h-0">
            <div className="flex-1 relative w-full min-h-[400px] lg:h-full">
              {/* Expand toggle */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`absolute top-3 ${showAnalytics ? 'right-[320px]' : 'right-3'} z-40 p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-muted-foreground hover:text-foreground transition-all`}
                title={isExpanded ? t.shrink : t.expand}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {graphData.nodes.length > 0 ? (
                <>
                  <GraphVisualization
                    data={graphData}
                    onNodeClick={handleNodeClick}
                    onLinkClick={handleLinkClick}
                    lang={lang as 'en' | 'ru'}
                    searchQuery={searchQuery}
                    visibleTypes={activeVisibleTypes}
                    activePantheons={activePantheons}
                    activePlanets={activePlanets}
                    activeElements={activeElements}
                    activeOfferings={activeOfferings}
                    selectedNodeId={selectedNode?.id}
                    externalHighlightNodeIds={linkScanOpen ? linkScanHighlightNodes : undefined}
                    externalHighlightLinkIds={linkScanOpen ? linkScanHighlightLinks : undefined}
                    showFlows={showFlows}
                    flowSpeed={flowSpeed}
                    flowIntensity={flowIntensity}
                    flowThickness={flowThickness}
                    hideWeakFlows={hideWeakFlows}
                    isExpanded={isExpanded}
                    showFilterBadges={showFilterBadges}
                    maxRenderNodes={maxRenderNodes}
                    labelMode={labelMode}
                  />

                  {/* Analytics panel */}
                  <AnimatePresence>
                    {showAnalytics && (
                      <motion.div
                        initial={{ x: 340, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 340, opacity: 0 }}
                        className="absolute top-0 right-0 bottom-0 w-full max-w-[300px] z-30"
                      >
                        <AnalyticsPanel data={graphData} lang={lang as 'en' | 'ru'} onNodeSelect={(node) => { setSelectedNode(node); setSelectedLink(null) }} />
                        <button onClick={() => setShowAnalytics(false)}
                          className="absolute top-3 right-3 p-1.5 bg-black/40 hover:bg-black/60 rounded-full text-muted-foreground hover:text-foreground transition-colors z-40">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Sigil Generator Modal */}
                  <AnimatePresence>
                    {showSigilGenerator && selectedNode && (
                      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="w-full max-w-md bg-[hsl(var(--sidebar))] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                        >
                          <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5">
                            <h3 className="text-sm font-bold uppercase tracking-wider">{t.genSigil}</h3>
                            <button onClick={() => setShowSigilGenerator(false)} className="p-1 hover:bg-white/10 rounded-full text-muted-foreground hover:text-foreground">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <SigilGenerator 
                            sourceNode={selectedNode} 
                            onClose={() => setShowSigilGenerator(false)} 
                            onSave={handleSaveSigil} 
                          />
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>

                  {/* Node detail panel */}
                  <AnimatePresence mode="wait">
                    {selectedNode && !showSigilGenerator && (
                      <>
                        {selectedNode.type === 'ritual' && (
                          <motion.div 
                            key="ritual-backdrop"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedNode(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
                        )}
                        <motion.div
                          key="entity-details-panel"
                          initial={selectedNode.type === 'ritual' ? { opacity: 0, scale: 0.9, y: 20 } : { x: 280, opacity: 0 }}
                          animate={selectedNode.type === 'ritual' ? { opacity: 1, scale: 1, y: 0 } : { x: 0, opacity: 1 }}
                          exit={selectedNode.type === 'ritual' ? { opacity: 0, scale: 0.9, y: 20 } : { x: 280, opacity: 0 }}
                          drag={!isMobile}
                          dragMomentum={false}
                          dragElastic={0.05}
                          className={`${selectedNode.type === 'ritual'
                            ? 'fixed left-0 right-0 mx-auto top-6 bottom-6 w-[calc(100vw-1rem)] sm:w-[90%] max-w-[480px] max-h-[calc(100vh-3rem)] overflow-y-auto z-50'
                            : 'fixed inset-x-2 top-16 max-h-[72vh] overflow-y-auto z-50 sm:inset-x-auto sm:top-4 sm:right-4 sm:w-[340px] sm:max-w-[calc(100vw-1rem)]'
                          } bg-[hsl(var(--sidebar))]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl`}
                        >
                          <div className="p-5">
                            <div className="sticky top-0 z-10 -mx-5 px-5 py-3 flex items-center justify-between bg-[hsl(var(--sidebar))]/95 backdrop-blur border-b border-white/10 mb-4 select-none ${!isMobile ? 'cursor-move' : ''}">
                              <div className="flex items-center gap-2">
                                <Fingerprint className="w-3.5 h-3.5 text-primary" />
                                <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">{t.entityDetails}</span>
                              </div>
                              <button onClick={() => setSelectedNode(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-foreground">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="space-y-4">
                              <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Tag className="w-2.5 h-2.5 text-muted-foreground/50" />
                                  <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground/50">{t.name}</span>
                                </div>
                                <h3 className="text-lg font-cinzel font-light text-foreground">{selectedNode.name}</h3>
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Layers className="w-2.5 h-2.5 text-muted-foreground/50" />
                                  <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground/50">{t.type}</span>
                                </div>
                                <div className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] font-medium uppercase tracking-wider ${colors[selectedNode.type]}`}>
                                  {getTypeLabel(selectedNode.type)}
                                </div>
                              </div>

                              {(selectedNode.pantheon || selectedNode.planet || selectedNode.element || (selectedNode.offerings && selectedNode.offerings.length > 0)) && (
                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                                   {selectedNode.pantheon && <div><span className="text-[9px] text-muted-foreground/50 uppercase font-bold">Pantheon</span><div className="text-xs">{selectedNode.pantheon}</div></div>}
                                   {selectedNode.planet && <div><span className="text-[9px] text-muted-foreground/50 uppercase font-bold">Planet</span><div className="text-xs">{selectedNode.planet}</div></div>}
                                   {selectedNode.element && <div><span className="text-[9px] text-muted-foreground/50 uppercase font-bold">Element</span><div className="text-xs">{selectedNode.element}</div></div>}
                                   {selectedNode.offerings && selectedNode.offerings.length > 0 && <div className="col-span-2"><span className="text-[9px] text-muted-foreground/50 uppercase font-bold">Offerings</span><div className="text-xs">{selectedNode.offerings.join(', ')}</div></div>}
                                </div>
                              )}

                              {(selectedNode.type === 'sigil' && selectedNode.image_url) && (
                                <div className="pt-3 border-t border-white/5 flex justify-center">
                                   <img src={selectedNode.image_url} alt="Sigil" className="w-32 h-32 object-contain border border-white/10 rounded-lg bg-black/20 p-2" />
                                </div>
                              )}

                              {selectedNode.description && (
                                <div className="pt-3 border-t border-white/5">
                                  <div className="flex items-center gap-1.5 mb-2">
                                    <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                                    <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground/50">{t.ritualText}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap break-words">{selectedNode.description}</p>
                                </div>
                              )}
                              
                              {/* Mythology Section */}
                              {!editing && (selectedNode.type === 'deity' || selectedNode.type === 'spirit' || selectedNode.type === 'creature') && (
                                <div className="pt-2 border-t border-white/5 space-y-2">
                                   <div className="flex gap-2">
                                    {!mythData && (
                                       <button 
                                        onClick={fetchMythData} 
                                         disabled={loadingMyth}
                                        className="flex-1 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                                        title={lang === 'ru' ? 'Быстрый поиск: краткая выжимка из мифологических источников; при недоступности — дипсик' : 'Quick Lookup: concise myth summary; falls back to DeepSeek if needed'}
                                       >
                                         {loadingMyth ? <Loader2 className="w-3 h-3 animate-spin"/> : <Search className="w-3 h-3"/>}
                                         {lang === 'ru' ? 'Быстрый поиск' : 'Quick Lookup'}
                                       </button>
                                     )}
                                     <button 
                                       onClick={() => handleMythScan(selectedNode)}
                                       disabled={isScanningMyth}
                                      className="flex-1 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                                      title={lang === 'ru' ? 'AI-сканирование: глубокий анализ связей; фолбэк на дипсик' : 'AI Scan: deep relation extraction; DeepSeek used as fallback'}
                                     >
                                       {isScanningMyth ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                                       {lang === 'ru' ? 'AI Сканирование' : 'Find in Myths'}
                                     </button>
                                   </div>
                                   {(mythData || wikiData || wikiLoading || wikiError) && (
                                 <div className="bg-indigo-500/10 rounded-xl p-3 border border-indigo-500/20 space-y-2 animate-fade-in max-h-56 overflow-y-auto">
                                       <div className="flex justify-between items-start">
                                         <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                                           {lang === 'ru' ? 'Найдено в мифах' : 'Mythology Data'}
                                         </div>
                                         <button onClick={() => { setMythData(null); setWikiData(null); setWikiError(null) }} className="text-muted-foreground hover:text-foreground"><X className="w-3 h-3"/></button>
                                       </div>
                                       {mythData?.name && <div className="text-xs text-indigo-100 font-medium">{mythData.name}</div>}
                                       {mythData?.pantheon && <div className="text-[10px] text-indigo-200">Pantheon: {mythData.pantheon}</div>}
                                       {mythData?.domain && <div className="text-[10px] text-indigo-200">Domain: {mythData.domain}</div>}
                                       {mythData?.description && <div className="text-[10px] text-muted-foreground">{mythData.description}</div>}
                                       <div className="text-[9px] text-indigo-200/80">
                                         {lang === 'ru'
                                           ? 'Подсказка: это добавляется в детали сущности (описание), а не напрямую в граф.'
                                           : 'Note: this fills entity details (description), not the graph directly.'}
                                       </div>
                                       {wikiLoading && (
                                         <div className="text-[10px] text-indigo-200 flex items-center gap-2">
                                           <Loader2 className="w-3 h-3 animate-spin" />
                                           {lang === 'ru' ? 'Загружаю полный текст Wikipedia…' : 'Loading full Wikipedia text…'}
                                         </div>
                                       )}
                                       {wikiError && <div className="text-[10px] text-red-300">{wikiError}</div>}
                                       {wikiData && (
                                         <button
                                           onClick={() => setWikiOpen(true)}
                                           className="w-full py-1 rounded bg-white/10 hover:bg-white/15 text-indigo-100 text-[10px] font-bold uppercase"
                                         >
                                           {lang === 'ru' ? 'Открыть Wikipedia (полный текст)' : 'Open Wikipedia (full text)'}
                                         </button>
                                       )}
                                       <button 
                                         onClick={mergeMythData}
                                         className="w-full py-1 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-[10px] font-bold uppercase"
                                         disabled={!mythData}
                                       >
                                         {lang === 'ru' ? 'Объединить данные' : 'Merge Data'}
                                       </button>
                                     </div>
                                   )}
                                </div>
                              )}

                              <div className="flex gap-2">
                                <button onClick={() => setEditing(true)} className="px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/30 text-primary text-[11px] font-bold tracking-wider">{lang==='ru'?'Редактировать':'Edit'}</button>
                                <button onClick={handleSuggestConnections} disabled={isLoading} className="px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[11px] font-bold tracking-wider flex items-center gap-1 disabled:opacity-50">
                                  {isLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                                  {lang === 'ru' ? t.suggestLinks : 'Suggest Links'}
                                </button>
                                <button onClick={() => { setManualLinkTargetId(null); setManualLinkTargetQuery(''); setManualLinkRelation('associated_with'); setManualLinkStrength('medium'); setManualLinkOpen(true) }} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-bold tracking-wider flex items-center gap-1">
                                  <LinkIcon className="w-3 h-3"/>
                                  {lang === 'ru' ? 'Связать' : 'Link'}
                                </button>
                                <button onClick={runLinkScan} className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-300 text-[11px] font-bold tracking-wider flex items-center gap-1">
                                  <LinkIcon className="w-3 h-3"/>
                                  {lang === 'ru' ? 'Скан связи' : 'Scan links'}
                                </button>
                                <button onClick={() => setShowSigilGenerator(true)} className="px-3 py-1.5 rounded-lg bg-teal-500/20 border border-teal-500/30 text-teal-400 text-[11px] font-bold tracking-wider flex items-center gap-1">
                                  <ImageIcon className="w-3 h-3"/>
                                  {lang === 'ru' ? t.genSigil : 'Gen Sigil'}
                                </button>
                                {editing && (
                                  <>
                                    <button onClick={saveNodeEdits} className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold tracking-wider">{lang==='ru'?'Сохранить':'Save'}</button>
                                    <button onClick={() => setEditing(false)} className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-[11px] font-bold tracking-wider text-muted-foreground">{lang==='ru'?'Отмена':'Cancel'}</button>
                                    <button onClick={deleteSelectedNode} className="px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-[11px] font-bold tracking-wider">{lang==='ru'?'Удалить':'Delete'}</button>
                                  </>
                                )}
                              </div>
                              {editing && (
                                <div className="space-y-3 pt-3">
                                  <div>
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60">{t.name}</span>
                                    <input value={draftName} onChange={e=>setDraftName(e.target.value)} className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm" />
                                  </div>
                                  <div>
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60">{t.type}</span>
                                    <select value={draftType} onChange={e=>setDraftType(e.target.value)} className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm">
                                      {ALL_TYPES.map(tp=>(<option key={tp} value={tp}>{getTypeLabel(tp)}</option>))}
                                    </select>
                                  </div>
                                  <div>
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60">{lang==='ru'?'Описание':'Description'}</span>
                                    <textarea value={draftDesc} onChange={e=>setDraftDesc(e.target.value)} rows={3} className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm" />
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60">Tags</span>
                                      <input value={draftTags} onChange={e=>setDraftTags(e.target.value)} placeholder="tag1, tag2" className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm" />
                                    </div>
                                    <div>
                                      <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60">Aliases</span>
                                      <input value={draftAliases} onChange={e=>setDraftAliases(e.target.value)} placeholder="alias1, alias2" className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm" />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60">Sigil ID</span>
                                      <input value={draftSigilId} onChange={e=>setDraftSigilId(e.target.value)} className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm" />
                                    </div>
                                    <div>
                                      <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60">Image URL</span>
                                      <input value={draftImageUrl} onChange={e=>setDraftImageUrl(e.target.value)} className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm" />
                                    </div>
                                  </div>
                                </div>
                              )}
                              {selectedNode.type !== 'sigil' && (selectedNode as any).sigil_id && (
                                <div className="pt-3 border-t border-white/5">
                                  <div className="flex items-center gap-1.5 mb-2">
                                    <ImageIcon className="w-3 h-3 text-teal-400" />
                                    <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground/60">Sigil</span>
                                  </div>
                                  {(() => {
                                    const s = graphData.nodes.find(n => n.id === (selectedNode as any).sigil_id)
                                    if (!s) return null
                                    return (
                                      <div className="flex items-center gap-2">
                                        {(s as any).image_url && <img src={(s as any).image_url} alt={s.name} className="w-12 h-12 rounded object-cover border border-white/10" />}
                                        <div className="text-sm text-foreground">{s.name}</div>
                                      </div>
                                    )
                                  })()}
                                </div>
                              )}
                              {selectedNode.type === 'ritual' && (
                                <div className="pt-3 border-t border-white/5 space-y-3">
                                  <div>
                                    <div className="flex items-center gap-1.5 mb-2">
                                      <Tag className="w-2.5 h-2.5 text-primary/80" />
                                      <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground/60">{t.ritualTags}</span>
                                    </div>
                                    {ritualDetails.relatedNodes.length > 0 ? (
                                      <div className="flex flex-wrap gap-1.5">
                                        {ritualDetails.relatedNodes.map((node) => (
                                          <button
                                            key={node.id}
                                            onClick={() => { setSelectedNode(node); setSelectedLink(null) }}
                                            className={`px-2 py-0.5 rounded-full border text-[9px] font-medium uppercase tracking-wider transition-colors hover:bg-white/10 ${colors[node.type]}`}
                                          >
                                            {node.name}
                                          </button>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-muted-foreground/70">{t.noRitualTags}</p>
                                    )}
                                  </div>

                                  <div>
                                    <div className="flex items-center gap-1.5 mb-2">
                                      <LinkIcon className="w-2.5 h-2.5 text-blue-400" />
                                      <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground/60">{t.activeLinks}</span>
                                    </div>
                                    {ritualDetails.relatedLinks.length > 0 ? (
                                      <div className="space-y-1.5">
                                        {ritualDetails.relatedLinks.map((link, idx) => {
                                          const linkedId = link.source === selectedNode.id ? link.target : link.source
                                          const linkedNode = graphData.nodes.find(node => node.id === linkedId)
                                          if (!linkedNode) return null
                                          return (
                                            <button
                                              key={`${link.source}-${link.target}-${link.relation}-${idx}`}
                                              onClick={() => { setSelectedLink(link); setSelectedNode(null) }}
                                              className="w-full text-left p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                                            >
                                              <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs text-foreground truncate">{linkedNode.name}</span>
                                                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-primary/20 bg-primary/10 text-primary/80 shrink-0">{getRelationLabel(link.relation, lang as 'en' | 'ru')}</span>
                                              </div>
                                            </button>
                                          )
                                        })}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-muted-foreground/70">{t.noActiveLinks}</p>
                                    )}
                                  </div>
                                </div>
                              )}
                              {selectedNode.type === 'ritual' && (
                                <button onClick={() => handleExportRitual(selectedNode)}
                                  className="w-full flex items-center justify-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 py-2 rounded-xl transition-all text-xs font-medium mt-2">
                                  <Download className="w-3 h-3" />
                                  {t.exportRitual}
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>

                  {/* Link detail panel */}
                  <AnimatePresence>
                    {selectedLink && !selectedNode && (
                      <motion.div
                        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
                        className="fixed inset-x-2 bottom-3 z-50 bg-[hsl(var(--sidebar))]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-2xl sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:bottom-4 sm:w-full sm:max-w-[340px]"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <LinkIcon className="w-3 h-3 text-primary" />
                            <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">{t.relation}</span>
                          </div>
                          <button onClick={() => setSelectedLink(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-foreground">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-foreground font-medium truncate">{getLinkEndpointLabel(selectedLink.source as string | Node)}</span>
                          <span className="text-primary/60 text-[10px] px-2 py-0.5 bg-primary/10 rounded-full border border-primary/20 shrink-0">{getRelationLabel(selectedLink.relation, lang as 'en' | 'ru')}</span>
                          <span className="text-foreground font-medium truncate">{getLinkEndpointLabel(selectedLink.target as string | Node)}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-white/[0.02] rounded-2xl border border-white/10 border-dashed p-4">
                  <Sparkles className="w-10 h-10 text-primary/20 mb-3" />
                  {syncNotice ? (
                    <p className="text-muted-foreground/70 text-sm text-center">{syncNotice}</p>
                  ) : (
                    <p className="text-muted-foreground/50 text-sm text-center max-w-[260px]">
                      {lang === 'ru' ? 'Введите описание, чтобы начать плести знание' : 'Enter a description to start weaving knowledge'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

        {/* Status toasts (top-right) */}
        <div className="fixed top-3 right-3 z-[80] space-y-2 pointer-events-none">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="pointer-events-auto max-w-xs px-3 py-2 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-[11px] leading-tight shadow-2xl backdrop-blur"
              >
                <div className="flex items-center gap-2">
                  <X className="w-3 h-3 shrink-0" />
                  <span className="truncate">{error}</span>
                  {lastAttempt && (
                    <button
                      onClick={handleRetryLastAttempt}
                      disabled={isLoading}
                      className="ml-2 inline-flex shrink-0 items-center gap-1 rounded-md border border-destructive/40 bg-destructive/10 px-2 py-[2px] text-[10px] font-bold uppercase tracking-wider text-destructive hover:bg-destructive/20 disabled:opacity-50"
                    >
                      <RotateCcw className="w-3 h-3" />
                      {lang === 'ru' ? 'Повторить' : 'Retry'}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="pointer-events-auto max-w-xs px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-[11px] leading-tight shadow-2xl backdrop-blur"
              >
                {successMsg}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

    <AnimatePresence>
      {showRitualPreview && pendingRitualAttempt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm p-3 sm:p-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="mx-auto mt-6 sm:mt-10 w-full max-w-2xl bg-[hsl(var(--sidebar))]/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h3 className="text-sm sm:text-base font-semibold text-foreground">{t.ritualPreviewTitle}</h3>
              <button
                type="button"
                onClick={handleCancelRitualPreview}
                className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-4 py-3 space-y-3 max-h-[70vh] overflow-y-auto">
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{t.ritualPreviewHint}</p>

              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">{t.ritualText}</p>
                <p className="text-sm text-foreground whitespace-pre-wrap break-words leading-relaxed">{pendingRitualAttempt.input}</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">{t.ritualPreviewTags}</p>
                {ritualPreviewTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {ritualPreviewTags.map(tagName => (
                      <span
                        key={tagName}
                        className="px-2.5 py-1 rounded-full text-xs bg-primary/15 text-primary border border-primary/20"
                      >
                        {tagName}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">{t.ritualPreviewEmptyTags}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-white/10 bg-black/20">
              <button
                type="button"
                onClick={handleCancelRitualPreview}
                className="px-3 py-2 rounded-lg border border-white/15 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              >
                {t.ritualPreviewCancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmRitualPreview}
                disabled={isLoading}
                className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {t.ritualPreviewConfirm}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    <KnowledgeWebGuideModal
      open={showGuide}
      lang={(lang === 'ru' ? 'ru' : 'en')}
      onClose={() => setShowGuide(false)}
    />
    </>
  )
}
