import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import { useLang } from '../../contexts/LanguageContext'
import { useAudio } from '../../contexts/AudioContext'
import type { ForumCategory, ForumView } from '../../types/forum'
import { STATIC_CATEGORIES } from './forumData'

interface Props {
  user: { id: string; email?: string; displayName?: string }
  onNavigate: (to: ForumView, params?: { categoryId?: string; topicId?: string }) => void
}

export function ForumCategories({ onNavigate }: Props) {
  const { lang } = useLang()
  const { playUiSound } = useAudio()
  const { data: categories = STATIC_CATEGORIES, isLoading: loading } = useQuery({
    queryKey: ['forum-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forum_categories')
        .select('*')
        .order('sortOrder', { ascending: true })
      if (error) throw error
      return (data || []) as ForumCategory[]
    },
    placeholderData: STATIC_CATEGORIES,
  })

  const handleCategoryClick = (categoryId: string) => {
    playUiSound('click')
    onNavigate('category', { categoryId })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-8 h-8 rounded-full border border-primary/30 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-cinzel font-bold gradient-text mb-1">
          {lang === 'ru' ? 'Форум Esoterica' : 'Esoterica Forum'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {lang === 'ru'
            ? 'Сообщество практиков личной трансформации'
            : 'Community of personal transformation practitioners'}
        </p>
      </div>

      {/* Categories */}
      <div className="space-y-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryClick(cat.id)}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
              {cat.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                {lang === 'ru' ? cat.nameRu : cat.nameEn}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5 truncate">
                {lang === 'ru' ? cat.descriptionRu : cat.descriptionEn}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0 text-right">
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{cat.topicCount}</span>{' '}
                {lang === 'ru' ? 'тем' : 'topics'}
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{cat.postCount}</span>{' '}
                {lang === 'ru' ? 'сообщ.' : 'posts'}
              </div>
            </div>
            <svg className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-border/30 flex items-center justify-around text-center">
        <div>
          <div className="text-lg font-bold text-primary font-cinzel">
            {categories.reduce((a, c) => a + c.topicCount, 0)}
          </div>
          <div className="text-xs text-muted-foreground">{lang === 'ru' ? 'Темы' : 'Topics'}</div>
        </div>
        <div className="w-px h-8 bg-border/30" />
        <div>
          <div className="text-lg font-bold text-primary font-cinzel">
            {categories.reduce((a, c) => a + c.postCount, 0)}
          </div>
          <div className="text-xs text-muted-foreground">{lang === 'ru' ? 'Сообщения' : 'Posts'}</div>
        </div>
        <div className="w-px h-8 bg-border/30" />
        <div>
          <div className="text-lg font-bold text-[hsl(var(--neon))] font-cinzel">
            {categories.length}
          </div>
          <div className="text-xs text-muted-foreground">{lang === 'ru' ? 'Категории' : 'Categories'}</div>
        </div>
      </div>
    </div>
  )
}
