import { useState, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Send, Database, Share2, Info, Loader2, X,
  Fingerprint, Tag, Layers, Download, Trash2, Search,
  Filter, Eye, EyeOff, Link as LinkIcon, Activity,
  FileJson, FileSpreadsheet, Image as ImageIcon, Upload,
  Zap, ChevronDown, Maximize2, Minimize2, RotateCcw
} from 'lucide-react'
import { extractGraph, GraphData, Node, Link, suggestConnections } from '../services/openRouterService'
import { extractGraphLocally } from '../services/localExtract'
import GraphVisualization from '../components/GraphVisualization'
import AnalyticsPanel from '../components/AnalyticsPanel'
import { SigilGenerator } from '../components/SigilGenerator'
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
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [selectedLink, setSelectedLink] = useState<Link | null>(null)
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

  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [visibleTypes, setVisibleTypes] = useState<Set<string>>(new Set(ALL_TYPES))
  const [activePantheons, setActivePantheons] = useState<Set<string>>(new Set())
  const [activePlanets, setActivePlanets] = useState<Set<string>>(new Set())
  const [activeElements, setActiveElements] = useState<Set<string>>(new Set())
  const [activeOfferings, setActiveOfferings] = useState<Set<string>>(new Set())
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
  
  // AI Myth Scan
  const [isScanningMyth, setIsScanningMyth] = useState(false)
  const [scanResult, setScanResult] = useState<MythScanResult | null>(null)

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
        addNode(ep.name, 'epithet', { // 'epithet' is not in ALL_TYPES, will default to generic or need type update. Let's use 'concept' or 'symbol' and add meta
          meaning: ep.meaning, 
          epithetType: ep.type, 
          confidence: ep.confidence,
          description: `${ep.type}: ${ep.meaning}`
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
    }
    
    setScanResult(null)
  }

  const fetchMythData = async () => {
    if (!selectedNode) return
    setLoadingMyth(true)
    setError(null)
    try {
      const data = await MythologyService.getEntityInfo(selectedNode.name)
      setMythData(data)
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
    }
  }

  const mergeMythData = () => {
    if (!selectedNode || !mythData) return
    setGraphData(prev => {
      const nodes = prev.nodes.map(n => n.id === selectedNode.id ? {
        ...n,
        pantheon: n.pantheon || mythData.pantheon,
        description: n.description || mythData.description,
        tags: [...(n.tags || []), ...(mythData.domain ? mythData.domain.split(',').map(s=>s.trim()) : [])]
      } : n)
      return { ...prev, nodes }
    })
    setMythData(null) // Hide after merge
    setSuccessMsg(lang === 'ru' ? 'Данные из мифов добавлены!' : 'Myth data merged!')
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
  }, [graphData.nodes, lang, mergeGraphData, t.error, t.xpEarned, user.id])

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

  const handleSuggestConnections = async () => {
    if (!selectedNode) return
    setIsLoading(true)
    try {
      const suggestions = await suggestConnections(selectedNode, graphData.nodes, lang as 'en'|'ru')
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
          setSuccessMsg(`Added ${added} suggested connections`)
          return { ...prev, links: newLinks }
        })
      } else {
        setSuccessMsg("No new connections found")
      }
    } catch (e) {
      console.error(e)
      setError("Failed to suggest connections")
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
    setMythData(null) // Reset on new selection
    setShowSigilGenerator(false) // Close sigil generator if open
  }, [])

  const handleLinkClick = useCallback((link: Link) => {
    setSelectedLink(link)
    setSelectedNode(null)
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
  }, [selectedNode, draftName, draftType, draftDesc, draftTags, draftAliases, draftSigilId, draftImageUrl])

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
                      setActivePantheons(new Set()); 
                      setActivePlanets(new Set()); 
                      setActiveElements(new Set()); 
                      setActiveOfferings(new Set());
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

              {/* Extended Filters (Inline) */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                {[
                  { title: lang === 'ru' ? t.pantheons : 'Pantheons', set: activePantheons, setter: setActivePantheons, color: 'text-rose-400 border-rose-500/30' },
                  { title: lang === 'ru' ? t.planetary : 'Planetary', set: activePlanets, setter: setActivePlanets, color: 'text-purple-400 border-purple-500/30' },
                  { title: lang === 'ru' ? t.elements : 'Elements', set: activeElements, setter: setActiveElements, color: 'text-orange-400 border-orange-500/30' },
                  { title: lang === 'ru' ? t.offerings : 'Offerings', set: activeOfferings, setter: setActiveOfferings, color: 'text-emerald-400 border-emerald-500/30' }
                ].map(group => (
                  <button 
                    key={group.title}
                    onClick={() => {
                      const isActive = group.set.size > 0
                      if (isActive) group.setter(new Set())
                      else group.setter(new Set(['ALL']))
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[9px] uppercase tracking-wider font-bold border transition-all flex items-center gap-1.5 ${group.set.size > 0 ? `bg-white/10 ${group.color}` : 'bg-white/5 border-white/5 text-muted-foreground/40'}`}
                  >
                    <span>{group.title}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${group.set.size > 0 ? 'bg-current' : 'bg-white/20'}`} />
                  </button>
                ))}
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
                    showFlows={showFlows}
                    flowSpeed={flowSpeed}
                    flowIntensity={flowIntensity}
                    flowThickness={flowThickness}
                    hideWeakFlows={hideWeakFlows}
                    isExpanded={isExpanded}
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
                          className={`${selectedNode.type === 'ritual'
                            ? 'fixed left-0 right-0 mx-auto top-6 bottom-6 w-[calc(100vw-1rem)] sm:w-[90%] max-w-[480px] max-h-[calc(100vh-3rem)] overflow-y-auto z-50'
                            : 'fixed inset-x-2 top-16 max-h-[72vh] overflow-y-auto z-50 sm:inset-x-auto sm:top-4 sm:right-4 sm:w-[340px] sm:max-w-[calc(100vw-1rem)]'
                          } bg-[hsl(var(--sidebar))]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl`}
                        >
                          <div className="p-5">
                            <div className="sticky top-0 z-10 -mx-5 px-5 py-3 flex items-center justify-between bg-[hsl(var(--sidebar))]/95 backdrop-blur border-b border-white/10 mb-4">
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
                                       >
                                         {loadingMyth ? <Loader2 className="w-3 h-3 animate-spin"/> : <Search className="w-3 h-3"/>}
                                         {lang === 'ru' ? 'Быстрый поиск' : 'Quick Lookup'}
                                       </button>
                                     )}
                                     <button 
                                       onClick={() => handleMythScan(selectedNode)}
                                       disabled={isScanningMyth}
                                       className="flex-1 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                                     >
                                       {isScanningMyth ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                                       {lang === 'ru' ? 'AI Сканирование' : 'Find in Myths'}
                                     </button>
                                   </div>
                                   {mythData && (
                                     <div className="bg-indigo-500/10 rounded-xl p-3 border border-indigo-500/20 space-y-2 animate-fade-in">
                                       <div className="flex justify-between items-start">
                                         <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                                           {lang === 'ru' ? 'Найдено в мифах' : 'Mythology Data'}
                                         </div>
                                         <button onClick={() => setMythData(null)} className="text-muted-foreground hover:text-foreground"><X className="w-3 h-3"/></button>
                                       </div>
                                       <div className="text-xs text-indigo-100 font-medium">{mythData.name}</div>
                                       {mythData.pantheon && <div className="text-[10px] text-indigo-200">Pantheon: {mythData.pantheon}</div>}
                                       {mythData.domain && <div className="text-[10px] text-indigo-200">Domain: {mythData.domain}</div>}
                                       {mythData.description && <div className="text-[10px] text-muted-foreground line-clamp-3">{mythData.description}</div>}
                                       <button 
                                         onClick={mergeMythData}
                                         className="w-full py-1 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-[10px] font-bold uppercase"
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
                                <button onClick={() => setShowSigilGenerator(true)} className="px-3 py-1.5 rounded-lg bg-teal-500/20 border border-teal-500/30 text-teal-400 text-[11px] font-bold tracking-wider flex items-center gap-1">
                                  <ImageIcon className="w-3 h-3"/>
                                  {lang === 'ru' ? t.genSigil : 'Gen Sigil'}
                                </button>
                                {editing && (
                                  <>
                                    <button onClick={saveNodeEdits} className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold tracking-wider">{lang==='ru'?'Сохранить':'Save'}</button>
                                    <button onClick={() => setEditing(false)} className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-[11px] font-bold tracking-wider text-muted-foreground">{lang==='ru'?'Отмена':'Cancel'}</button>
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
