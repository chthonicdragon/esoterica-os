import fs from 'node:fs'
import path from 'node:path'

function clampText(text, maxChars) {
  const s = String(text || '').trim()
  if (s.length <= maxChars) return s
  return `${s.slice(0, maxChars - 1)}…`
}

function main() {
  const inputPath = process.argv[2] || path.resolve(process.cwd(), 'presets_out', 'knowledge_web_import.json')
  const outPath = process.argv[3] || path.resolve(process.cwd(), 'public', 'presets', 'knowledge_web_library.json')

  const raw = fs.readFileSync(inputPath, 'utf8')
  const graph = JSON.parse(raw)
  if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.links)) {
    throw new Error('Input must be GraphData {nodes, links}')
  }

  const nodes = graph.nodes.map((n) => ({
    id: n.id,
    name: n.name,
    type: n.type,
    description: n.description ? clampText(n.description, 4000) : undefined,
    tags: Array.isArray(n.tags) ? n.tags : undefined,
    aliases: Array.isArray(n.aliases) ? n.aliases : undefined,
    pantheon: n.pantheon,
    planet: n.planet,
    element: n.element,
    offerings: Array.isArray(n.offerings) ? n.offerings : undefined,
  }))

  const links = graph.links.map((l) => ({
    source: String(l.source),
    target: String(l.target),
    relation: l.relation,
    strength: l.strength,
  }))

  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify({ nodes, links }, null, 2), 'utf8')
  process.stdout.write(`OK\noutPath=${outPath}\n`)
}

main()

