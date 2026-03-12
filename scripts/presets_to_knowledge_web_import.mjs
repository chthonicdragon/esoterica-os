import fs from 'node:fs'
import path from 'node:path'

function isAsciiLowerSnakeCase(id) {
  return /^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(id)
}

function clampText(text, maxChars) {
  const s = String(text || '').trim()
  if (s.length <= maxChars) return s
  return `${s.slice(0, maxChars - 1)}…`
}

function dedupe(arr) {
  return [...new Set(arr)]
}

function inferNodeType(preset) {
  const cats = new Set((preset.categories || []).map(x => String(x).toLowerCase()))
  const id = String(preset.id || '')

  if (/(^|_)god(_|$)/.test(id) || /^greek_god_/.test(id) || /^slav_god_/.test(id) || /^egypt_god_/.test(id)) return 'deity'
  if (cats.has('божество')) return 'deity'
  if (cats.has('дух')) return 'spirit'
  if (cats.has('существо')) return 'creature'
  if (cats.has('артефакт')) return 'artifact'
  if (cats.has('заклинание')) return 'spell'
  if (cats.has('сигил') || cats.has('сигилл')) return 'sigil'
  if (cats.has('эпитет')) return 'epithet'
  if (cats.has('символ')) return 'symbol'
  if (cats.has('ритуал')) return 'ritual'
  if (cats.has('концепт')) return 'concept'

  if (id.startsWith('planet_')) return 'place'
  if (id.startsWith('mineral_')) return 'artifact'
  if (id.startsWith('offering_')) return 'concept'
  if (id.startsWith('pantheon_')) return 'concept'
  if (id.startsWith('element_')) return 'concept'

  return 'concept'
}

function main() {
  const inputPath = process.argv[2] || path.resolve(process.cwd(), 'presets_out', 'import-ready.json')
  const outPath = process.argv[3] || path.resolve(process.cwd(), 'presets_out', 'knowledge_web_import.json')

  const raw = fs.readFileSync(inputPath, 'utf8')
  const presets = JSON.parse(raw)
  if (!Array.isArray(presets)) throw new Error('Input must be an array of presets')

  const presetsById = new Map()
  presets.forEach(p => presetsById.set(String(p.id), p))

  const nodes = []
  const links = []
  const linkKeys = new Set()

  for (const preset of presets) {
    const id = String(preset.id || '').trim()
    if (!id) continue
    if (!isAsciiLowerSnakeCase(id)) throw new Error(`Invalid preset id: ${id}`)

    const name = String(preset.name || id).trim()
    const type = inferNodeType(preset)
    const synonyms = Array.isArray(preset.synonyms) ? preset.synonyms.map(x => String(x)).filter(Boolean) : []
    const tags = dedupe([
      ...(Array.isArray(preset.tags) ? preset.tags.map(x => String(x)).filter(Boolean) : []),
      ...(Array.isArray(preset.categories) ? preset.categories.map(x => String(x)).filter(Boolean) : []),
      'preset',
    ])

    const long = String(preset.long_description || '').trim()
    const short = String(preset.short_description || '').trim()
    const desc = clampText(long || short, 15000)

    const linkIds = Array.isArray(preset.links) ? preset.links.map(x => String(x)).filter(Boolean) : []
    const pantheonLink = linkIds.find(x => x.startsWith('pantheon_'))
    const planetLink = linkIds.find(x => x.startsWith('planet_'))
    const elementLink = linkIds.find(x => x.startsWith('element_'))
    const offeringLinks = linkIds.filter(x => x.startsWith('offering_'))

    const pantheon = pantheonLink && presetsById.get(pantheonLink)?.name ? String(presetsById.get(pantheonLink).name) : undefined
    const planet = planetLink && presetsById.get(planetLink)?.name ? String(presetsById.get(planetLink).name) : undefined
    const element = elementLink && presetsById.get(elementLink)?.name ? String(presetsById.get(elementLink).name) : undefined
    const offerings = offeringLinks
      .map(oid => presetsById.get(oid)?.name)
      .filter(Boolean)
      .map(String)

    const node = {
      id,
      name,
      type,
      description: desc || undefined,
      tags: tags.length ? tags : undefined,
      aliases: synonyms.length ? synonyms : undefined,
      pantheon: pantheon || undefined,
      planet: planet || undefined,
      element: element || undefined,
      offerings: offerings.length ? offerings : undefined,
    }
    nodes.push(node)
  }

  for (const preset of presets) {
    const source = String(preset.id || '').trim()
    if (!source) continue
    const linkIds = Array.isArray(preset.links) ? preset.links.map(x => String(x)).filter(Boolean) : []
    for (const target of linkIds) {
      if (!presetsById.has(target)) continue
      if (source === target) continue
      const relation = 'associated_with'
      const key = `${source}|${target}|${relation}`
      if (linkKeys.has(key)) continue
      linkKeys.add(key)
      links.push({
        source,
        target,
        relation,
        strength: 'medium',
      })
    }
  }

  const graph = { nodes, links }
  fs.writeFileSync(outPath, JSON.stringify(graph, null, 2), 'utf8')
  process.stdout.write(`OK\noutPath=${outPath}\nnodes=${nodes.length}\nlinks=${links.length}\n`)
}

main()
