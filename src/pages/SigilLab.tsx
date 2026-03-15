import React, { useState, useEffect, useRef } from 'react'
import { useLang } from '../contexts/LanguageContext'
import { useAudio } from '../contexts/AudioContext'
import { db } from '../lib/platformClient'
import { generateSigilSVG } from '../utils/sigilGenerator'
import { Sparkles, Download, Zap, Trash2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '../lib/utils'
import { grantProgressionPoints, syncProgressionToDb } from '../altar/altarStore'
import { extractAndMerge } from '../services/knowledgeGraphBridge'
import { drawSigil } from '../utils/sigilGeneration'
import { Search, Dice5, Info } from 'lucide-react'
import { MythologyService, type MythologyEntity } from '../services/magicalDataService'

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

const PANTHEONS = ['Greek', 'Goetia', 'Egyptian', 'Norse', 'Chaos', 'Folk']
const PLANETS = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon']
const ELEMENTS = ['Fire', 'Water', 'Air', 'Earth', 'Spirit']
const OFFERINGS = ['incense', 'wine', 'blood', 'honey', 'coins', 'candles']

export default function SigilLab({ user }: SigilLabProps) {
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
  
  const [generationMode, setGenerationMode] = useState<'classic' | 'procedural'>('procedural')
  
  // Advanced attributes
  const [selectedPantheon, setSelectedPantheon] = useState('')
  const [selectedPlanet, setSelectedPlanet] = useState('')
  const [selectedElement, setSelectedElement] = useState('')
  const [selectedOffering, setSelectedOffering] = useState('')
  const [manualAttributes, setManualAttributes] = useState('')
  const [seedOffset, setSeedOffset] = useState(0)
  const [forceUpdate, setForceUpdate] = useState(0)

  // Auto-extraction state
  const [isAutoMode, setIsAutoMode] = useState(true)
  const [detectedAttributes, setDetectedAttributes] = useState<string[]>([])
  const [entitySearch, setEntitySearch] = useState('')
  const [showEntitySuggestions, setShowEntitySuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<{name: string, id?: string, pantheon?: string, planet?: string, element?: string, offerings?: string[]}[]>([])
  const [availableAttributes, setAvailableAttributes] = useState<{
    pantheons: string[], planets: string[], elements: string[], offerings: string[]
  }>({ pantheons: [], planets: [], elements: [], offerings: [] })
  
  // Graph integration state
  const [connectedNodes, setConnectedNodes] = useState<string[]>([])
  const [activeConnectedNodes, setActiveConnectedNodes] = useState<string[]>([])
  
  // Mythology Info
  const [mythInfo, setMythInfo] = useState<MythologyEntity | null>(null)

  useEffect(() => { loadSigils() }, [user.id])
  useEffect(() => () => { if (chargeInterval.current) clearInterval(chargeInterval.current) }, [])
  
  // Reset seed only when intention/entity/context changes, NOT when manually regenerating
  useEffect(() => {
    setSeedOffset(0)
  }, [intention, entitySearch, activeConnectedNodes.length])

  // Re-generate when parameters change (Live Preview)
  useEffect(() => {
    if (currentSigil || generationMode === 'procedural') {
      generateSigil()
    }
  }, [seedOffset, selectedElement, selectedPlanet, selectedPantheon, selectedOffering, activeConnectedNodes, generationMode])

  // Load attributes from graph
  useEffect(() => {
    const savedGraph = localStorage.getItem('esoteric_knowledge_web_v1')
    if (savedGraph) {
      try {
        const graph = JSON.parse(savedGraph)
        if (graph.nodes) {
          const pantheons = new Set<string>()
          const planets = new Set<string>()
          const elements = new Set<string>()
          const offerings = new Set<string>()
          
          graph.nodes.forEach((n: any) => {
             if (n.pantheon) pantheons.add(n.pantheon)
             if (n.planet) planets.add(n.planet)
             if (n.element) elements.add(n.element)
             if (n.offerings) n.offerings.forEach((o: string) => offerings.add(o))
          })
          
          setAvailableAttributes({
            pantheons: Array.from(pantheons),
            planets: Array.from(planets),
            elements: Array.from(elements),
            offerings: Array.from(offerings)
          })
        }
      } catch (e) {}
    }
  }, [])

  // Real entity search from graph data
  useEffect(() => {
    if (entitySearch.length > 1) {
       const savedGraph = localStorage.getItem('esoteric_knowledge_web_v1')
       if (savedGraph) {
         try {
           const graph = JSON.parse(savedGraph)
           if (graph.nodes) {
             const matches = graph.nodes
               .filter((n: any) => n.name.toLowerCase().includes(entitySearch.toLowerCase()))
               .slice(0, 5)
               .map((n: any) => ({
                 name: n.name,
                 id: n.id,
                 pantheon: n.pantheon,
                 planet: n.planet,
                 element: n.element,
                 offerings: n.offerings
               }))
             setSuggestions(matches)
             setShowEntitySuggestions(true)
           }
         } catch (e) { console.error('Error parsing graph for autocomplete', e) }
       }
    } else {
      setShowEntitySuggestions(false)
    }
  }, [entitySearch])

  const selectEntity = (entity: any) => {
    setEntitySearch(entity.name)
    setIntention(entity.name)
    setSelectedPantheon(entity.pantheon || '')
    setSelectedPlanet(entity.planet || '')
    setSelectedElement(entity.element || '')
    if (entity.offerings && entity.offerings.length > 0) {
      setSelectedOffering(entity.offerings[0])
    }
    setShowEntitySuggestions(false)
    setIsAutoMode(true)
    
    // Fetch mythology info
    MythologyService.getEntityInfo(entity.name).then(info => {
      if (info) setMythInfo(info)
      else setMythInfo(null)
    })
    
    // Find connected nodes
    try {
      const savedGraph = localStorage.getItem('esoteric_knowledge_web_v1')
      if (savedGraph) {
         const graph = JSON.parse(savedGraph)
         if (graph.links && graph.nodes) {
           const entityId = entity.id || entity.name
           const links = graph.links.filter((l: any) => 
             l.source === entityId || l.target === entityId || 
             l.source === entity.name || l.target === entity.name
           )
           
           const connectedIds = new Set<string>()
           links.forEach((l: any) => {
             const targetId = (l.source === entityId || l.source === entity.name) ? l.target : l.source
             connectedIds.add(targetId)
           })
           
           const nodes = graph.nodes
             .filter((n: any) => connectedIds.has(n.id) || connectedIds.has(n.name))
             .map((n: any) => n.name)
             // Also include raw IDs if not found in nodes (for simple string nodes)
             .concat(Array.from(connectedIds).filter(id => !graph.nodes.find((n:any) => n.id === id || n.name === id)))
             
           setConnectedNodes(Array.from(new Set(nodes)) as string[])
           setActiveConnectedNodes([])
         }
      }
    } catch (e) { console.error('Error finding connected nodes', e) }
  }

  const selectRandomEntity = () => {
     const savedGraph = localStorage.getItem('esoteric_knowledge_web_v1')
     if (savedGraph) {
       try {
         const graph = JSON.parse(savedGraph)
         if (graph.nodes && graph.nodes.length > 0) {
           const randomNode = graph.nodes[Math.floor(Math.random() * graph.nodes.length)]
           selectEntity(randomNode)
         }
       } catch (e) {}
     }
  }

  async function loadSigils() {
    const data = await db.sigils.list({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      limit: 20,
    }) as Sigil[]
    setSigils(data)
  }

  function generateSigil() {
    const targetIntention = intention || entitySearch
    if (!targetIntention.trim()) return
    
    // In procedural mode, only play sound if manual interaction (seed change or initial)
    // to avoid spamming sound during typing/live update
    if (seedOffset > 0 || !currentSigil) playUiSound('click')
    
    setGenerating(true)
    setChargeLevel(0)
    setCharging(false)
    
    setTimeout(() => {
      let svg = ''
      
      if (generationMode === 'classic') {
         svg = generateSigilSVG(targetIntention)
      } else {
        // Procedural
        const canvas = document.createElement('canvas')
        canvas.width = 300
        canvas.height = 300
        
        // Combine intention with active connected nodes for the seed/shape
        const combinedName = [targetIntention, ...activeConnectedNodes].join(' + ')
        
        drawSigil(canvas, {
          name: combinedName,
          type: 'sigil',
          element: selectedElement,
          planet: selectedPlanet,
          seedOffset: seedOffset
        })
        const dataUrl = canvas.toDataURL('image/png')
        svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><image href="${dataUrl}" width="300" height="300" /></svg>`
      }
      
      setCurrentSigil(svg)
      setCurrentIntention(targetIntention)
      setGenerating(false)
      // Sound only on completion if not live-updating rapidly
      // playUiSound('success') 
    }, 50)
  }
  
  // Re-generate when parameters change (Live Preview for attributes)
  // MOVED UP to keep logic together
  
  async function saveSigil() {
    if (!currentSigil || !currentIntention) return
    playUiSound('click')
    try {
      const sigil = await db.sigils.create({
        userId: user.id,
        intention: currentIntention,
        svgData: currentSigil,
        isCharged: Number(chargeLevel >= 100) ? 1 : 0,
        chargedAt: chargeLevel >= 100 ? new Date().toISOString() : null,
        createdAt: new Date().toISOString(),
      }) as Sigil
      setSigils(prev => [sigil, ...prev])

      // Grant XP for sigil creation (+ bonus if charged)
      const xpAmount = chargeLevel >= 100 ? 12 : 8
      const { pointsEarned, progression } = grantProgressionPoints(xpAmount, 'altar')
      syncProgressionToDb(user.id, progression)
      toast.success(
        lang === 'ru'
          ? `Сигил сохранён (+${pointsEarned} XP)`
          : `Sigil saved (+${pointsEarned} XP)`
      )

      // Background: extract intention into Knowledge Graph
      const attributes = [selectedPantheon, selectedPlanet, selectedElement, selectedOffering, manualAttributes].filter(Boolean).join(', ')
      const fullText = `Sigil intention: ${currentIntention}. Attributes: ${attributes}`
      
      extractAndMerge(
        fullText,
        lang as 'en' | 'ru',
        'sigil',
        user.id
      ).then(result => {
        if (result && result.added > 0) {
          toast.success(
            lang === 'ru'
              ? `🕸 Паутина: +${result.added} из сигила`
              : `🕸 Web: +${result.added} from sigil`,
            { duration: 2500 }
          )
        }
      })
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
          // Grant bonus XP for completing the charge
          const { pointsEarned, progression } = grantProgressionPoints(5, 'altar')
          syncProgressionToDb(user.id, progression)
          toast.success(
            lang === 'ru'
              ? `${t.sigilCharged} ✨ (+${pointsEarned} XP)`
              : `${t.sigilCharged} ✨ (+${pointsEarned} XP)`
          )
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
    await db.sigils.delete(id)
    setSigils(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <h2 className="text-lg font-bold font-cinzel text-foreground">{t.sigilLabTitle}</h2>

      {/* Generator */}
      <div className="rounded-2xl bg-card border border-primary/20 p-5 space-y-4">
        
        {/* Mode Selector */}
        <div className="flex justify-end mb-2">
           <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
             <button 
               onClick={() => setGenerationMode('classic')}
               className={`px-3 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider transition-all ${generationMode === 'classic' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
             >
               {lang === 'ru' ? 'Классический' : 'Classic'}
             </button>
             <button 
               onClick={() => setGenerationMode('procedural')}
               className={`px-3 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider transition-all ${generationMode === 'procedural' ? 'bg-teal-500 text-white' : 'text-muted-foreground hover:text-foreground'}`}
             >
               {lang === 'ru' ? 'Процедурный' : 'Procedural'}
             </button>
           </div>
        </div>

        {/* Entity Selector (Procedural Mode) */}
        {generationMode === 'procedural' && (
          <div className="relative z-10">
            <div className="flex gap-2 mb-2">
              <Search className="w-4 h-4 text-muted-foreground mt-2.5" />
              <div className="flex-1 relative">
                <input
                  value={entitySearch}
                  onChange={e => setEntitySearch(e.target.value)}
                  placeholder={lang === 'ru' ? 'Выберите сущность (например, Hecate)...' : 'Select entity (e.g. Hecate)...'}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm outline-none focus:border-primary/50"
                />
                {showEntitySuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-20">
                    {suggestions.map(s => (
                      <button
                        key={s.name}
                        onClick={() => selectEntity(s)}
                        className="w-full text-left px-4 py-2 hover:bg-primary/10 text-xs flex justify-between items-center"
                      >
                        <span className="font-bold">{s.name}</span>
                        <span className="text-[10px] text-muted-foreground">{s.pantheon} • {s.planet}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Connected Nodes Chips */}
            {connectedNodes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 mb-3 px-1 animate-fade-in">
                <div className="w-full text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                   <span>{lang === 'ru' ? 'Связанные символы:' : 'Connected symbols:'}</span>
                   <span className="text-[9px] opacity-70">({lang === 'ru' ? 'нажмите, чтобы добавить' : 'click to add'})</span>
                </div>
                {connectedNodes.map(node => (
                  <button
                    key={node}
                    onClick={() => {
                      setActiveConnectedNodes(prev => 
                        prev.includes(node) ? prev.filter(n => n !== node) : [...prev, node]
                      )
                    }}
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] border transition-all",
                      activeConnectedNodes.includes(node)
                        ? "bg-teal-500/20 border-teal-500/40 text-teal-300"
                        : "bg-background border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground"
                    )}
                  >
                    {node}
                    {activeConnectedNodes.includes(node) && <span className="ml-1 text-[8px]">×</span>}
                  </button>
                ))}
              </div>
            )}

            {/* Mythology Info Card */}
            {mythInfo && (
              <div className="mt-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl flex gap-3 animate-fade-in">
                <Info className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-purple-200">{mythInfo.name}</span>
                    {mythInfo.pantheon && <span className="text-[10px] text-purple-400/80 uppercase tracking-wide">{mythInfo.pantheon}</span>}
                  </div>
                  {mythInfo.domain && <div className="text-[10px] text-purple-300 italic">{mythInfo.domain}</div>}
                  {mythInfo.description && (
                    <div className="text-[10px] text-muted-foreground leading-relaxed line-clamp-3">
                      {mythInfo.description}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          {generationMode === 'classic' && (
          <input
            value={intention}
            onChange={e => setIntention(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && generateSigil()}
            placeholder={t.enterIntention}
            className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50"
          />
          )}
          
          {generationMode === 'procedural' && (
            <div className="flex-1 flex items-center px-4 text-sm text-muted-foreground italic border border-transparent">
               {entitySearch ? `Generating sigil for ${entitySearch}` : 'Select an entity above'}
            </div>
          )}

          <button
            onClick={generateSigil}
            disabled={!intention.trim() || generating}
            className="px-5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {generating ? t.generating : (lang === 'ru' ? 'Предпросмотр' : 'Preview')}
          </button>
        </div>

        {/* Filters / Attributes (Only show in Procedural Mode) */}
        {generationMode === 'procedural' && (
          <div className="space-y-3 animate-fade-in">
             {/* Auto-Detection Info Panel */}
             <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-3 flex flex-col gap-2">
               <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  <span className="text-xs font-bold text-teal-200 uppercase tracking-wider">
                    {lang === 'ru' ? 'Автоматический анализ' : 'Auto Analysis'}
                  </span>
               </div>
               
               <div className="text-xs text-muted-foreground/80 pl-6">
                 {lang === 'ru' 
                   ? 'Система автоматически подберет атрибуты (Планета, Стихия) на основе введенной сущности или намерения.' 
                   : 'System automatically detects attributes (Planet, Element) based on entity or intention.'}
               </div>

               {/* Detected Attributes Display */}
               {(selectedPantheon || selectedPlanet || selectedElement) && (
                 <div className="flex flex-wrap gap-2 pl-6 mt-1">
                    {selectedPantheon && <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] uppercase font-bold">{selectedPantheon}</span>}
                    {selectedPlanet && <span className="px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] uppercase font-bold">{selectedPlanet}</span>}
                    {selectedElement && <span className="px-2 py-0.5 rounded bg-orange-500/20 border border-orange-500/30 text-orange-300 text-[10px] uppercase font-bold">{selectedElement}</span>}
                 </div>
               )}
               
               {!isAutoMode && (
                 <button onClick={() => setIsAutoMode(true)} className="ml-auto text-[10px] underline opacity-50 hover:opacity-100 text-teal-400">
                   {lang === 'ru' ? 'Скрыть настройки' : 'Hide manual settings'}
                 </button>
               )}
             </div>

             {/* Manual Overrides (Hidden by default in Auto Mode) */}
             {!isAutoMode && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 animate-fade-in pt-2 border-t border-white/5">
                  <select value={selectedPantheon} onChange={e => setSelectedPantheon(e.target.value)} className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-primary/50">
                    <option value="">{lang === 'ru' ? 'Пантеон' : 'Pantheon'}</option>
                    {PANTHEONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <select value={selectedPlanet} onChange={e => setSelectedPlanet(e.target.value)} className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-primary/50">
                    <option value="">{lang === 'ru' ? 'Планета' : 'Planet'}</option>
                    {PLANETS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <select value={selectedElement} onChange={e => setSelectedElement(e.target.value)} className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-primary/50">
                    <option value="">{lang === 'ru' ? 'Стихия' : 'Element'}</option>
                    {ELEMENTS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                  <select value={selectedOffering} onChange={e => setSelectedOffering(e.target.value)} className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-primary/50">
                    <option value="">{lang === 'ru' ? 'Подношение' : 'Offering'}</option>
                    {OFFERINGS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
             )}
             
             {isAutoMode && (
               <div className="flex justify-center">
                 <button onClick={() => setIsAutoMode(false)} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors underline">
                   {lang === 'ru' ? 'Настроить атрибуты вручную' : 'Configure attributes manually'}
                 </button>
               </div>
             )}
          </div>
        )}

        {/* Sigil canvas */}
        {currentSigil && (
          <div className="space-y-4 animate-fade-in">
            <div className="relative flex justify-center group">
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
              <button onClick={() => setSeedOffset(s => s + 1)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-muted-foreground text-sm transition-colors">
                <RefreshCw className="w-4 h-4" />
                {lang === 'ru' ? 'Вариант' : 'Regenerate'}
              </button>
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
