import type { ForumCategory } from '../../types/forum'

/**
 * Static forum categories — the forum_categories DB table lacks a user_id column,
 * so RLS owner-mode blocks all reads. Categories are system config data that rarely
 * changes, so we define them statically. Live topic/post counts are fetched from
 * forum_topics / forum_posts tables which DO have user_id.
 */
export const STATIC_CATEGORIES: ForumCategory[] = [
  { id: 'cat_announcements', nameEn: 'Announcements', nameRu: 'Объявления', descriptionEn: 'Platform news and updates', descriptionRu: 'Новости платформы', icon: '📢', sortOrder: 0, topicCount: 0, postCount: 0, createdAt: '' },
  { id: 'cat_general', nameEn: 'General Discussion', nameRu: 'Общее обсуждение', descriptionEn: 'Talk about anything esoteric', descriptionRu: 'Обсуждайте всё эзотерическое', icon: '🌟', sortOrder: 1, topicCount: 0, postCount: 0, createdAt: '' },
  { id: 'cat_rituals', nameEn: 'Rituals & Practices', nameRu: 'Ритуалы и практики', descriptionEn: 'Share your ritual experiences', descriptionRu: 'Поделитесь своим ритуальным опытом', icon: '🕯️', sortOrder: 2, topicCount: 0, postCount: 0, createdAt: '' },
  { id: 'cat_altars', nameEn: 'Altars & Sacred Spaces', nameRu: 'Алтари и сакральные пространства', descriptionEn: 'Show your digital and physical altars', descriptionRu: 'Покажите свои алтари', icon: '⛩️', sortOrder: 3, topicCount: 0, postCount: 0, createdAt: '' },
  { id: 'cat_dreams', nameEn: 'Dream Interpretation', nameRu: 'Толкование снов', descriptionEn: 'Share and interpret dreams', descriptionRu: 'Делитесь и толкуйте сны', icon: '🌙', sortOrder: 4, topicCount: 0, postCount: 0, createdAt: '' },
  { id: 'cat_sigils', nameEn: 'Sigil Magic', nameRu: 'Сигильная магия', descriptionEn: 'Discuss sigil creation and charging', descriptionRu: 'Обсуждайте создание и зарядку сигилов', icon: '✨', sortOrder: 5, topicCount: 0, postCount: 0, createdAt: '' },
  { id: 'cat_psychology', nameEn: 'Psychology & Archetypes', nameRu: 'Психология и архетипы', descriptionEn: 'Explore psychological dimensions', descriptionRu: 'Исследуйте психологические измерения', icon: '🧠', sortOrder: 6, topicCount: 0, postCount: 0, createdAt: '' },
]

export function getStaticCategory(id: string): ForumCategory | null {
  return STATIC_CATEGORIES.find(c => c.id === id) || null
}
