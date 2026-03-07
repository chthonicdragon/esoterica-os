import type { Link } from '../services/openRouterService'

type Lang = 'en' | 'ru'
type Relation = Link['relation']

const RELATION_LABELS: Record<Relation, { en: string; ru: string }> = {
  associated_with: { en: 'Associated With', ru: 'Связано с' },
  controls: { en: 'Controls', ru: 'Управляет' },
  appears_in: { en: 'Appears In', ru: 'Появляется в' },
  teaches: { en: 'Teaches', ru: 'Обучает' },
  symbol_of: { en: 'Symbol Of', ru: 'Символ' },
}

export function getRelationLabel(relation: string, lang: Lang): string {
  const labels = RELATION_LABELS[relation as Relation]
  if (!labels) return relation
  return lang === 'ru' ? labels.ru : labels.en
}
