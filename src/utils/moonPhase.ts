export type MoonPhase =
  | 'new'
  | 'waxingCrescent'
  | 'firstQuarter'
  | 'waxingGibbous'
  | 'full'
  | 'waningGibbous'
  | 'lastQuarter'
  | 'waningCrescent'

export function getMoonPhase(date: Date = new Date()): MoonPhase {
  const knownNewMoon = new Date('2000-01-06T18:14:00Z')
  const synodicMonth = 29.53058867

  const diffDays = (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24)
  const normalizedDays = ((diffDays % synodicMonth) + synodicMonth) % synodicMonth

  if (normalizedDays < 1.85) return 'new'
  if (normalizedDays < 7.38) return 'waxingCrescent'
  if (normalizedDays < 9.22) return 'firstQuarter'
  if (normalizedDays < 14.77) return 'waxingGibbous'
  if (normalizedDays < 16.61) return 'full'
  if (normalizedDays < 22.15) return 'waningGibbous'
  if (normalizedDays < 23.99) return 'lastQuarter'
  return 'waningCrescent'
}

export const moonEmoji: Record<MoonPhase, string> = {
  new: '🌑',
  waxingCrescent: '🌒',
  firstQuarter: '🌓',
  waxingGibbous: '🌔',
  full: '🌕',
  waningGibbous: '🌖',
  lastQuarter: '🌗',
  waningCrescent: '🌘',
}

export const moonEnergy: Record<MoonPhase, string> = {
  new: 'New beginnings, intentions, planting seeds',
  waxingCrescent: 'Building momentum, taking action',
  firstQuarter: 'Overcoming challenges, making decisions',
  waxingGibbous: 'Refining, adjusting, trust the process',
  full: 'Manifestation, culmination, gratitude, release',
  waningGibbous: 'Sharing, gratitude, distributing',
  lastQuarter: 'Releasing, forgiveness, letting go',
  waningCrescent: 'Rest, reflection, surrender',
}

export const moonEnergyRu: Record<MoonPhase, string> = {
  new: 'Новые начинания, намерения, посев семян',
  waxingCrescent: 'Нарастание импульса, действие',
  firstQuarter: 'Преодоление препятствий, принятие решений',
  waxingGibbous: 'Уточнение, корректировка, доверие процессу',
  full: 'Проявление, кульминация, благодарность, отпускание',
  waningGibbous: 'Sharing, благодарность, распределение',
  lastQuarter: 'Освобождение, прощение, отпускание',
  waningCrescent: 'Отдых, размышление, смирение',
}
