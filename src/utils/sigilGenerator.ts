// Sigil generator using the letter-reduction method
// Letters are mapped to number positions, then drawn as connected lines

const LETTER_MAP: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
  S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8,
}

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'i',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
  х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}

// 9-position magic square layout (3x3)
const POSITIONS: [number, number][] = [
  [1, 1], [2, 1], [3, 1],
  [1, 2], [2, 2], [3, 2],
  [1, 3], [2, 3], [3, 3],
]

function intentionToNumbers(text: string): number[] {
  const normalized = normalizeIntentionText(text)
  const cleaned = normalized.toUpperCase().replace(/[^A-Z]/g, '')
  const unique: number[] = []
  const seen = new Set<number>()
  for (const ch of cleaned) {
    const n = LETTER_MAP[ch]
    if (n && !seen.has(n)) {
      seen.add(n)
      unique.push(n)
    }
  }
  return unique
}

function normalizeIntentionText(text: string): string {
  let transliterated = ''
  for (const ch of text.toLowerCase()) {
    transliterated += CYRILLIC_TO_LATIN[ch] ?? ch
  }

  // Strip combining marks so accented latin characters are handled consistently.
  return transliterated.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
}

export function generateSigilSVG(intention: string, size = 300): string {
  const numbers = intentionToNumbers(intention)
  if (numbers.length < 2) {
    // Fallback: minimal mandala
    return generateMandalaSVG(intention, size)
  }

  const padding = 40
  const cellSize = (size - padding * 2) / 3
  const offset = cellSize / 2

  const points = numbers.map(n => {
    const [gx, gy] = POSITIONS[n - 1]
    return {
      x: padding + (gx - 1) * cellSize + offset,
      y: padding + (gy - 1) * cellSize + offset,
    }
  })

  // Build path
  const pathParts = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
  const linePath = pathParts.join(' ')

  // Start circle
  const start = points[0]
  const end = points[points.length - 1]

  // Generate unique hue from intention
  const hue = (intention.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 37) % 360

  return `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <radialGradient id="bg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="hsl(${hue}, 40%, 12%)"/>
      <stop offset="100%" stop-color="hsl(${hue}, 20%, 5%)"/>
    </radialGradient>
    <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="hsl(${hue}, 80%, 70%)"/>
      <stop offset="100%" stop-color="hsl(${(hue + 60) % 360}, 80%, 70%)"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)" rx="8"/>
  <!-- Outer circle -->
  <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 8}" fill="none" stroke="hsl(${hue}, 40%, 30%)" stroke-width="1" opacity="0.5"/>
  <!-- Inner geometry -->
  <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 24}" fill="none" stroke="hsl(${hue}, 30%, 25%)" stroke-width="0.5" stroke-dasharray="4,4" opacity="0.4"/>
  <!-- Main sigil path -->
  <path d="${linePath}" fill="none" stroke="url(#line-grad)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)" opacity="0.9"/>
  <!-- Start marker -->
  <circle cx="${start.x}" cy="${start.y}" r="5" fill="hsl(${hue}, 80%, 70%)" filter="url(#glow)"/>
  <!-- End marker (double circle = terminus) -->
  <circle cx="${end.x}" cy="${end.y}" r="6" fill="none" stroke="hsl(${hue}, 80%, 70%)" stroke-width="2" filter="url(#glow)"/>
  <circle cx="${end.x}" cy="${end.y}" r="3" fill="hsl(${hue}, 80%, 70%)" filter="url(#glow)"/>
</svg>`
}

function generateMandalaSVG(intention: string, size: number): string {
  const hue = (intention.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 37) % 360
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 20
  const spokes = 8

  let paths = ''
  for (let i = 0; i < spokes; i++) {
    const angle = (i / spokes) * Math.PI * 2
    const x = cx + Math.cos(angle) * r * 0.7
    const y = cy + Math.sin(angle) * r * 0.7
    paths += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="url(#line-grad)" stroke-width="1.5" opacity="0.7"/>`
    paths += `<circle cx="${x}" cy="${y}" r="3" fill="hsl(${hue}, 80%, 70%)"/>`
  }

  return `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="hsl(${hue}, 40%, 12%)"/>
      <stop offset="100%" stop-color="hsl(${hue}, 20%, 5%)"/>
    </radialGradient>
    <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="hsl(${hue}, 80%, 70%)"/>
      <stop offset="100%" stop-color="hsl(${(hue + 60) % 360}, 80%, 70%)"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)" rx="8"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="hsl(${hue}, 40%, 30%)" stroke-width="1" opacity="0.5"/>
  ${paths}
  <circle cx="${cx}" cy="${cy}" r="8" fill="hsl(${hue}, 80%, 70%)" filter="url(#glow)"/>
</svg>`
}
