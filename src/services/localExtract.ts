import type { GraphData, Node } from './openRouterService'

const STOP = new Set([
  'the','and','for','with','from','that','this','into','your','you','are','was','were',
  'of','not','but','also','then','than','into','onto','over','under',
  'из','для','что','это','как','при','или','они','она','он','мы','вы','эти','тоже','ещё','есть','над','под','через','про','надо','без','подо','между','около'
])

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9а-яё\s_-]/gi, '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 48)
}

function pickTokens(text: string, limit = 10): string[] {
  const freq = new Map<string, number>()
  const clean = text.replace(/\s+/g, ' ').trim()
  text
    .toLowerCase()
    .split(/[^a-zA-Zа-яА-ЯёЁ0-9_-]+/)
    .filter(t => t.length >= 4 && !STOP.has(t) && !/^\d+$/.test(t))
    .forEach(t => freq.set(t, (freq.get(t) ?? 0) + 1))
  const topSingles = [...freq.entries()].sort((a,b)=>b[1]-a[1]).slice(0, Math.max(4, Math.floor(limit*0.6))).map(([t])=>t)

  const words = clean
    .toLowerCase()
    .split(/[^a-zA-Zа-яА-ЯёЁ0-9_-]+/)
    .filter(w => w.length >= 3 && !STOP.has(w))
  const biFreq = new Map<string, number>()
  for (let i = 0; i < words.length - 1; i++) {
    const a = words[i]
    const b = words[i+1]
    if (!a || !b) continue
    if (a.length < 3 || b.length < 3) continue
    const key = `${a} ${b}`
    biFreq.set(key, (biFreq.get(key) ?? 0) + 1)
  }
  const topBigrams = [...biFreq.entries()].sort((a,b)=>b[1]-a[1]).slice(0, Math.max(2, Math.floor(limit*0.4))).map(([p])=>p)

  const merged: string[] = []
  const seen = new Set<string>()
  for (const t of [...topBigrams, ...topSingles]) {
    const id = slugify(t)
    if (!id || seen.has(id)) continue
    seen.add(id)
    merged.push(t)
    if (merged.length >= limit) break
  }
  return merged
}

export async function extractGraphLocally(
  text: string,
  isRitual: boolean,
  ritualName?: string,
  existingNodes: Node[] = []
): Promise<GraphData> {
  const tokens = pickTokens(text, isRitual ? 12 : 8)
  const existByName = new Map(existingNodes.map(n => [n.name.toLowerCase(), n]))
  const nodes: Node[] = []
  const links: { source: string; target: string; relation: 'associated_with'|'controls'|'appears_in'|'teaches'|'symbol_of' }[] = []

  for (const t of tokens) {
    const found = existByName.get(t)
    if (found) {
      nodes.push(found)
    } else {
      const id = slugify(t)
      if (!id) continue
      if (nodes.find(n => n.id === id)) continue
      nodes.push({ id, name: t, type: 'concept' })
    }
  }

  if (isRitual) {
    const rid = slugify(`ritual_${ritualName || 'Ritual'}`)
    const ritual: Node = { id: rid, name: ritualName?.trim() || 'Ritual', type: 'ritual', description: text.trim() }
    const ids = new Set(nodes.map(n => n.id))
    const finalNodes = ids.has(ritual.id) ? nodes : [...nodes, ritual]
    for (const n of nodes) {
      if (n.id !== ritual.id) links.push({ source: n.id, target: ritual.id, relation: 'appears_in' })
    }
    return { nodes: finalNodes, links }
  }

  for (let i = 0; i < Math.min(6, nodes.length - 1); i++) {
    const a = nodes[i]
    const b = nodes[i + 1]
    if (a && b && a.id !== b.id) links.push({ source: a.id, target: b.id, relation: 'associated_with' })
  }

  return { nodes, links }
}
