import fs from 'node:fs'
import path from 'node:path'

function stripJsonComments(input) {
  let out = ''
  let i = 0
  let inString = false
  let stringQuote = '"'
  let escaped = false

  while (i < input.length) {
    const ch = input[i]
    const next = input[i + 1]

    if (inString) {
      out += ch
      if (escaped) {
        escaped = false
      } else if (ch === '\\') {
        escaped = true
      } else if (ch === stringQuote) {
        inString = false
      }
      i += 1
      continue
    }

    if (ch === '"' || ch === "'") {
      inString = true
      stringQuote = ch
      out += ch
      i += 1
      continue
    }

    if (ch === '/' && next === '/') {
      i += 2
      while (i < input.length && input[i] !== '\n') i += 1
      continue
    }

    if (ch === '/' && next === '*') {
      i += 2
      while (i < input.length) {
        if (input[i] === '*' && input[i + 1] === '/') {
          i += 2
          break
        }
        i += 1
      }
      continue
    }

    out += ch
    i += 1
  }

  return out
}

function removeTrailingCommas(jsonText) {
  let prev = jsonText
  while (true) {
    const next = prev.replace(/,\s*([}\]])/g, '$1')
    if (next === prev) return next
    prev = next
  }
}

function matchClosingBrace(text, startIndex) {
  let depth = 0
  let inString = false
  let escaped = false

  for (let i = startIndex; i < text.length; i++) {
    const ch = text[i]
    if (inString) {
      if (escaped) {
        escaped = false
      } else if (ch === '\\') {
        escaped = true
      } else if (ch === '"') {
        inString = false
      }
      continue
    }

    if (ch === '"') {
      inString = true
      continue
    }

    if (ch === '{') depth += 1
    if (ch === '}') {
      depth -= 1
      if (depth === 0) return i
    }
  }
  return -1
}

function salvagePresetObjectsFromText(cleanedText) {
  const results = []
  const seenRanges = new Set()
  const idRe = /"id"\s*:/g

  let match
  while ((match = idRe.exec(cleanedText))) {
    const idIdx = match.index
    const start = cleanedText.lastIndexOf('{', idIdx)
    if (start === -1) continue
    const end = matchClosingBrace(cleanedText, start)
    if (end === -1) continue
    const key = `${start}:${end}`
    if (seenRanges.has(key)) continue
    seenRanges.add(key)
    const candidate = cleanedText.slice(start, end + 1)
    try {
      const parsed = JSON.parse(removeTrailingCommas(candidate))
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.id) {
        results.push(parsed)
      }
    } catch {}
  }

  return results
}

function isAsciiLowerSnakeCase(id) {
  return /^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(id)
}

function slugifyAsciiLowerSnakeCase(text) {
  const ascii = String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
  return ascii || `preset_${Date.now().toString(36)}`
}

function wordCount(text) {
  return String(text).trim().split(/\s+/).filter(Boolean).length
}

function clampWords(text, maxWords) {
  const words = String(text).trim().split(/\s+/).filter(Boolean)
  if (words.length <= maxWords) return String(text).trim()
  return `${words.slice(0, maxWords).join(' ')}…`
}

function normalizePreset(raw) {
  const p = { ...raw }
  p.id = String(p.id || '').trim()
  p.name = String(p.name || '').trim()
  p.synonyms = Array.isArray(p.synonyms) ? p.synonyms.map(x => String(x)).filter(Boolean) : []
  p.categories = Array.isArray(p.categories) ? p.categories.map(x => String(x)).filter(Boolean) : []
  p.attributes = p.attributes && typeof p.attributes === 'object' ? p.attributes : {}
  p.short_description = String(p.short_description || '').trim()
  p.long_description = String(p.long_description || '').trim()
  p.links = Array.isArray(p.links) ? p.links.map(x => String(x)).filter(Boolean) : []
  p.tags = Array.isArray(p.tags) ? p.tags.map(x => String(x)).filter(Boolean) : []
  p.example_usage = String(p.example_usage || '').trim()

  if (!isAsciiLowerSnakeCase(p.id)) {
    p.id = slugifyAsciiLowerSnakeCase(p.id)
  }
  if (wordCount(p.long_description) > 200) {
    p.long_description = clampWords(p.long_description, 200)
  }
  return p
}

function dedupe(arr) {
  return [...new Set(arr)]
}

function scoreLink(fromPreset, toPreset) {
  let score = 0
  if (!toPreset) return -1000
  const fromCats = new Set(fromPreset.categories || [])
  const toCats = new Set(toPreset.categories || [])
  for (const c of fromCats) if (toCats.has(c)) score += 3
  if (String(toPreset.id).split('_')[0] === String(fromPreset.id).split('_')[0]) score += 1
  return score
}

function normalizeLinks(presetsById, preset) {
  const links = dedupe((preset.links || []).filter(id => presetsById.has(id)))
  if (links.length <= 6) return links
  return links
    .map(id => ({ id, score: scoreLink(preset, presetsById.get(id)) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(x => x.id)
}

function buildPreset({ id, name, categories, synonyms = [], attributes = {}, short_description, long_description, links = [], tags = [], example_usage }) {
  const preset = normalizePreset({
    id,
    name,
    categories,
    synonyms,
    attributes,
    short_description,
    long_description,
    links,
    tags,
    example_usage,
  })
  if (!preset.short_description) {
    preset.short_description = preset.long_description ? clampWords(preset.long_description, 20) : name
  }
  if (!preset.long_description) preset.long_description = preset.short_description
  preset.long_description = clampWords(preset.long_description, 200)
  return preset
}

function titleFromId(id) {
  const suffix = String(id).replace(/^(pantheon|planet|element|mineral|offering)_/, '').replace(/_/g, ' ').trim()
  if (!suffix) return id
  const cap = suffix.charAt(0).toUpperCase() + suffix.slice(1)
  return cap
}

function ensureMissingReferencePresets(basePresets) {
  const byId = new Map(basePresets.map(p => [p.id, p]))
  const referenced = new Set()
  basePresets.forEach(p => (p.links || []).forEach(l => referenced.add(String(l))))

  const created = []
  for (const ref of referenced) {
    if (byId.has(ref)) continue
    if (!/^(pantheon|planet|element|mineral|offering)_/.test(ref)) continue

    let name = titleFromId(ref)
    let categories = ['concept']
    let short_description = `Автосозданный узел: ${name}.`
    let long_description = `Узел создан автоматически, потому что на него есть ссылки в пресетах. Заполни описание и атрибуты при необходимости. [Unverified: содержимое зависит от источников].`

    if (ref.startsWith('pantheon_')) {
      categories = ['пантеон', 'мифология']
      if (/egypt/i.test(ref)) name = 'Египетский пантеон'
      else if (/slavic|slav/i.test(ref)) name = 'Славянский пантеон'
      short_description = 'Пантеон как культурный слой для группировки божеств.'
      long_description = 'Пантеон используется как слой группировки и навигации по божествам, ритуалам и символам. [Unverified: состав и детали зависят от источника].'
    }
    if (ref.startsWith('element_')) {
      categories = ['стихия', 'природа']
      short_description = 'Стихийный узел для соответствий и практик.'
      long_description = 'Стихия используется как узел соответствий (ритуалы, символы, практики). [Unverified: трактовки зависят от традиции].'
    }
    if (ref.startsWith('planet_')) {
      categories = ['планета', 'астрология']
      short_description = 'Планетарный узел для соответствий и практик.'
      long_description = 'Планета используется как узел соответствий (качества, ритуалы, материалы). [Unverified: соответствия зависят от традиции].'
    }
    if (ref.startsWith('mineral_')) {
      categories = ['минерал']
      short_description = 'Материал/минерал для соответствий и практик.'
      long_description = 'Минерал используется как узел соответствий для амулетов, ритуалов и символики. [Unverified: соответствия зависят от традиции].'
    }
    if (ref.startsWith('offering_')) {
      categories = ['подношение']
      short_description = 'Подношение как практический ритуальный элемент.'
      long_description = 'Подношение используется как универсальный элемент ритуальной практики и связи с божествами/духами. [Unverified: формы и смысл зависят от контекста].'
    }

    const stub = buildPreset({
      id: ref,
      name,
      categories,
      short_description,
      long_description,
      links: [],
      tags: ['auto_stub'],
      example_usage: short_description,
    })
    byId.set(stub.id, stub)
    created.push(stub)
  }

  return created.length ? [...basePresets, ...created] : basePresets
}

function addLink(presetsById, rationales, fromId, toId, why) {
  const from = presetsById.get(fromId)
  const to = presetsById.get(toId)
  if (!from || !to) return
  from.links = dedupe([...(from.links || []), toId]).slice(0, 6)
  rationales.push({ fromId, toId, why })
}

function ensurePreset(presetsById, addedIds, candidate) {
  if (presetsById.has(candidate.id)) return candidate.id
  presetsById.set(candidate.id, candidate)
  addedIds.push(candidate.id)
  return candidate.id
}

function genMicrosForBase(base) {
  const id = base.id
  if (id === 'pantheon_greek') {
    return [
      {
        id: 'deity_zeus',
        name: 'Зевс',
        categories: ['божество', 'пантеон'],
        tags: ['греческий_пантеон'],
        short_description: 'Верховный бог в древнегреческой традиции.',
        long_description: 'Зевс — центральная фигура олимпийского пантеона и удобный узел для связей власти, закона и небесных символов. Используй как якорь для архетипов управления, порядка и санкции. [Unverified: детали локальных культов и эпитетов зависят от источника].',
        links: ['pantheon_greek'],
        example_usage: 'Связать с символами грома, закона и ритуалами клятв.',
      },
      {
        id: 'deity_athena',
        name: 'Афина',
        categories: ['божество', 'пантеон'],
        tags: ['греческий_пантеон'],
        short_description: 'Божество мудрости, ремёсел и стратегии.',
        long_description: 'Афина полезна как узел знаний, ремесла и стратегического мышления. В паутине может связывать практики обучения, ремесленные артефакты и ритуалы ясности. [Unverified: конкретные соответствия подношений зависят от традиции].',
        links: ['pantheon_greek'],
        example_usage: 'Использовать как точку для связей «знание → дисциплина → результат».',
      },
      {
        id: 'offering_wine',
        name: 'Вино (подношение)',
        categories: ['подношение'],
        tags: ['либaция'],
        short_description: 'Частое ритуальное подношение в виде возлияния.',
        long_description: 'Вино часто используется как символическое подношение и акт «возлияния» в ритуальной практике. В паутине это универсальный узел для ритуалов обращения, благодарности и усиления связи. [Unverified: исторические детали обряда различаются по эпохам и культурам].',
        links: [],
        example_usage: 'Связать с ритуалами возлияния, божествами и праздниками.',
      },
      {
        id: 'ritual_libation',
        name: 'Возлияние (ритуал)',
        categories: ['ритуал'],
        tags: ['подношение'],
        short_description: 'Ритуальная практика возлияния напитка как дара.',
        long_description: 'Возлияние — простой ритуальный паттерн: посвятить часть напитка как символический дар и закрепить намерение. В паутине связывай его с подношениями, божествами и целями работы. [Unverified: исторические формы возлияния зависят от контекста].',
        links: [],
        example_usage: 'Использовать как типовой ритуал для разных пантеонов и намерений.',
      },
      {
        id: 'symbol_thunderbolt',
        name: 'Молния (символ)',
        categories: ['символ'],
        tags: ['сила', 'небо'],
        short_description: 'Символ внезапной силы, приказа и изменения.',
        long_description: 'Молния — символ резкой трансформации, наказания, власти и мгновенного «озарения». В паутине связывай с ритуалами силы, защитой и архетипами управления. [Unverified: конкретные культурные привязки зависят от традиции].',
        links: [],
        example_usage: 'Добавлять как знак быстрого действия или санкции.',
      },
    ]
  }

  if (id === 'planet_mars') {
    return [
      {
        id: 'mineral_iron',
        name: 'Железо (минерал/металл)',
        categories: ['минерал'],
        tags: ['металл'],
        short_description: 'Металл, часто связываемый с практиками силы и защиты.',
        long_description: 'Железо в магических системах нередко связывают с темами силы, защиты и воли. В паутине это удобный узел для «практик действия» и предметов-талисманов. [Unverified: традиционные соответствия Марсу зависят от школы].',
        links: ['planet_mars'],
        example_usage: 'Связать с ритуалами смелости, защитными символами и амулетами.',
      },
      {
        id: 'archetype_warrior',
        name: 'Архетип воина',
        categories: ['концепт'],
        tags: ['воля', 'действие'],
        short_description: 'Архетип решительности, силы и прямого действия.',
        long_description: 'Архетип воина описывает режимы действия: решительность, дисциплина и способность «идти на конфликт ради цели». В паутине связывай с планетарными узлами, ритуалами воли и символами защиты. [Unverified: психологические трактовки зависят от школы].',
        links: ['planet_mars'],
        example_usage: 'Использовать для связей между мотивацией, ритуалом и результатом.',
      },
      {
        id: 'ritual_courage_rite',
        name: 'Обряд смелости (ритуал)',
        categories: ['ритуал'],
        tags: ['воля'],
        short_description: 'Шаблонный обряд для укрепления решимости.',
        long_description: 'Обряд смелости — это удобный шаблон: сформулировать страх, обозначить цель, закрепить действие и завершить символическим актом. В паутине может связать «Марс → железо → действие». [Unverified: конкретные практики зависят от традиции].',
        links: ['planet_mars'],
        example_usage: 'Привязать к узлам цели, препятствия и действия.',
      },
    ]
  }

  if (id === 'element_fire') {
    return [
      {
        id: 'symbol_candle',
        name: 'Свеча (символ)',
        categories: ['символ'],
        tags: ['огонь'],
        short_description: 'Базовый ритуальный символ огня и намерения.',
        long_description: 'Свеча — практичный символ огня: свет, фокус, очищение и «прожигание» намерения. В паутине связывай со стихией огня, ритуалами очищения и подношениями. [Unverified: конкретные цвета и соответствия зависят от традиции].',
        links: ['element_fire'],
        example_usage: 'Привязать к ритуалам очищения и практикам концентрации.',
      },
      {
        id: 'offering_incense',
        name: 'Благовония (подношение)',
        categories: ['подношение'],
        tags: ['очищение'],
        short_description: 'Подношение через дым и аромат, часто используемое в ритуалах.',
        long_description: 'Благовония и ароматический дым часто используются как символическое подношение и способ «очищения пространства». В паутине это универсальный узел между стихиями, ритуалами и духами. [Unverified: исторические соответствия конкретных смол зависят от региона].',
        links: ['element_fire'],
        example_usage: 'Связать с очисткой, обращениями и защитными практиками.',
      },
      {
        id: 'ritual_fire_purification',
        name: 'Огненное очищение (ритуал)',
        categories: ['ритуал'],
        tags: ['очищение', 'огонь'],
        short_description: 'Шаблон ритуала очистки через символический огонь.',
        long_description: 'Огненное очищение — это набор действий: подготовка, символическое «сжигание» лишнего, закрепление нового состояния. В паутине связывай с огнем, благовониями и концептами трансформации. [Unverified: техника зависит от традиции и безопасности].',
        links: ['element_fire'],
        example_usage: 'Использовать при переходе между этапами и закрытии циклов.',
      },
    ]
  }

  const baseSlug = slugifyAsciiLowerSnakeCase(id.replace(/^(pantheon|planet|element|mineral|offering)_/, ''))
  return [
    {
      id: `ritual_${baseSlug}_focus`,
      name: `Фокусный ритуал: ${base.name}`,
      categories: ['ритуал'],
      tags: ['шаблон'],
      short_description: 'Шаблонный ритуал для работы с этим узлом.',
      long_description: 'Шаблон: определить цель, выбрать символ/подношение, выполнить действие и зафиксировать результат. Связывай с этим узлом, чтобы формализовать практику. [Unverified: конкретная форма зависит от традиции].',
      links: [id],
      example_usage: 'Связать с подношениями и символами выбранного слоя.',
    },
    {
      id: `epithet_${baseSlug}_marker`,
      name: `Эпитет: ${base.name}`,
      categories: ['эпитет'],
      tags: ['язык'],
      short_description: 'Эпитет-метка для унификации описаний и поиска.',
      long_description: 'Эпитет помогает закрепить роль узла в системе и облегчает поиск связей в паутине. Используй его как текстовую метку и как «семантический якорь». [Unverified: конкретные исторические эпитеты требуют источника].',
      links: [id],
      example_usage: 'Добавлять к узлам как тег и привязку к архетипу.',
    },
  ]
}

function main() {
  const inputPath = process.argv[2] || 'C:\\\\Users\\\\Даниил\\\\Downloads\\\\v\\\\presets_expanded_full.json.txt'
  const outDir = process.argv[3] || path.resolve(process.cwd(), 'presets_out')

  const raw = fs.readFileSync(inputPath, 'utf8')
  const cleaned = removeTrailingCommas(stripJsonComments(raw))
  let parsed
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    parsed = salvagePresetObjectsFromText(cleaned)
  }
  if (!Array.isArray(parsed)) throw new Error('Input must be an array of presets')
  if (parsed.length === 0) throw new Error('Input contains no readable presets (failed to recover)')

  const basePresets = ensureMissingReferencePresets(parsed.map(normalizePreset).filter(p => p.id && p.name))

  const presetsById = new Map()
  basePresets.forEach(p => {
    if (!presetsById.has(p.id)) presetsById.set(p.id, p)
  })

  const addedIds = []
  const rationales = []

  const isBase = (p) => /^(pantheon|planet|element|mineral|offering)_/.test(p.id)
  const baseTargets = basePresets.filter(isBase)

  for (const base of baseTargets) {
    const micros = genMicrosForBase(base)
    const resolvedMicroIds = []
    for (const m of micros) {
      const preset = buildPreset({
        ...m,
        links: dedupe([...(m.links || []), base.id]).slice(0, 6),
      })
      const microId = ensurePreset(presetsById, addedIds, preset)
      resolvedMicroIds.push(microId)
      addLink(presetsById, rationales, microId, base.id, `Микроузел относится к базовому пресету «${base.name}» и уточняет слой практики.`)
    }

    const baseLinkWhy = base.id.startsWith('pantheon_')
      ? 'Связи помогают развернуть культурный слой через ключевые узлы (божества, подношения, ритуалы, символы).'
      : base.id.startsWith('planet_')
        ? 'Связи помогают раскрыть планетарный слой через материалы, архетипы и типовые практики.'
        : base.id.startsWith('element_')
          ? 'Связи раскрывают стихию через практические символы, подношения и базовые ритуальные паттерны.'
          : 'Связи добавляют типовые практики и метки вокруг узла.'

    resolvedMicroIds.slice(0, 6).forEach(mid => {
      addLink(presetsById, rationales, base.id, mid, baseLinkWhy)
    })

    if (base.id === 'pantheon_greek') {
      addLink(presetsById, rationales, 'ritual_libation', 'offering_wine', 'Возлияние обычно использует напиток как подношение; связь упрощает навигацию «ритуал → подношение».')
      addLink(presetsById, rationales, 'deity_zeus', 'symbol_thunderbolt', 'Символ «молния» часто используется как знак силы и власти в рамках греческого слоя. [Unverified: детали трактовки зависят от школы].')
    }
    if (base.id === 'planet_mars') {
      addLink(presetsById, rationales, 'planet_mars', 'archetype_warrior', 'Архетип «воин» — удобная интерпретационная связка для планетарной темы действия. [Unverified: это психологическая модель].')
    }
  }

  for (const [id, preset] of presetsById.entries()) {
    preset.links = normalizeLinks(presetsById, preset)
    if (wordCount(preset.long_description) > 200) preset.long_description = clampWords(preset.long_description, 200)
    if (!preset.short_description) preset.short_description = clampWords(preset.long_description || preset.name, 20)
    if (!preset.example_usage) preset.example_usage = preset.short_description
    if (!Array.isArray(preset.categories)) preset.categories = []
    preset.categories = preset.categories.map(String).filter(Boolean)
    preset.tags = Array.isArray(preset.tags) ? preset.tags.map(String).filter(Boolean) : []
    preset.synonyms = Array.isArray(preset.synonyms) ? preset.synonyms.map(String).filter(Boolean) : []
  }

  const allPresets = [...presetsById.values()].sort((a, b) => a.id.localeCompare(b.id))

  const invalidIds = allPresets.filter(p => !isAsciiLowerSnakeCase(p.id)).map(p => p.id)
  if (invalidIds.length) {
    throw new Error(`Invalid ids (must be ASCII lower_snake_case): ${invalidIds.join(', ')}`)
  }

  const missingLinks = []
  for (const p of allPresets) {
    for (const l of p.links) if (!presetsById.has(l)) missingLinks.push(`${p.id} -> ${l}`)
    if (p.links.length > 6) throw new Error(`Too many links for ${p.id}`)
    if (wordCount(p.long_description) > 200) throw new Error(`long_description too long for ${p.id}`)
  }
  if (missingLinks.length) throw new Error(`Found missing links: ${missingLinks.slice(0, 20).join('; ')}`)

  const compact = allPresets.map(p => ({
    id: p.id,
    name: p.name,
    categories: p.categories,
    short_description: p.short_description,
    links: p.links,
  }))

  const uniqueRationales = new Map()
  rationales.forEach(r => {
    const key = `${r.fromId}|${r.toId}`
    if (!uniqueRationales.has(key)) uniqueRationales.set(key, r.why)
  })

  const reportLines = []
  reportLines.push('# Presets Expansion Report')
  reportLines.push('')
  reportLines.push(`- Входной файл: ${inputPath}`)
  reportLines.push(`- Итого пресетов: ${allPresets.length}`)
  reportLines.push(`- Добавлено пресетов: ${addedIds.length}`)
  reportLines.push(`- Добавлено автосвязей: ${uniqueRationales.size}`)
  reportLines.push('')
  reportLines.push('## Добавленные ID')
  reportLines.push('')
  addedIds.sort().forEach(id => reportLines.push(`- ${id}`))
  reportLines.push('')
  reportLines.push('## Rationale (автосвязи)')
  reportLines.push('')
  ;[...uniqueRationales.entries()].sort((a, b) => a[0].localeCompare(b[0])).forEach(([key, why]) => {
    const [fromId, toId] = key.split('|')
    reportLines.push(`- ${fromId} → ${toId}: ${why}`)
  })

  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, 'import-ready.json'), JSON.stringify(allPresets, null, 2), 'utf8')
  fs.writeFileSync(path.join(outDir, 'compact.json'), JSON.stringify(compact, null, 2), 'utf8')
  fs.writeFileSync(path.join(outDir, 'report.md'), reportLines.join('\n'), 'utf8')

  process.stdout.write(`OK\noutDir=${outDir}\n`)
}

main()
