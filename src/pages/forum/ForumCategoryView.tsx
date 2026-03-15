import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import { useLang } from '../../contexts/LanguageContext'
import { useAudio } from '../../contexts/AudioContext'
import type { ForumCategory, ForumTopic, ForumView } from '../../types/forum'
import { getStaticCategory } from './forumData'
import { formatDistanceToNow } from 'date-fns'

interface Props {
  user: { id: string; email?: string; displayName?: string }
  categoryId: string
  onNavigate: (to: ForumView, params?: { categoryId?: string; topicId?: string }) => void
}

export function ForumCategoryView({ user, categoryId, onNavigate }: Props) {
  const { lang } = useLang()
  const { playUiSound } = useAudio()
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 20

  useEffect(() => {
    setPage(0)
  }, [categoryId])

  const { data, isLoading: loading } = useQuery({
    queryKey: ['forum-category', categoryId, page],
    queryFn: async () => {
      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      const [catRes, topicsRes] = await Promise.all([
        supabase
          .from('forum_categories')
          .select('*')
          .eq('id', categoryId)
          .maybeSingle(),
        supabase
          .from('forumTopics')
          .select('*')
          .eq('categoryId', categoryId)
          .order('createdAt', { ascending: false })
          .range(from, to),
      ])

      const rawTopics = (topicsRes.data || []) as unknown as ForumTopic[]
      const category = (catRes.data as unknown as ForumCategory) || getStaticCategory(categoryId)

      const topics = await Promise.all(
        rawTopics.map(async (topic) => {
          try {
            const { data: p } = await supabase
              .from('userProfiles')
              .select('displayName')
              .eq('userId', topic.userId)
              .maybeSingle()
            return {
              ...topic,
              authorName: p?.displayName || topic.userId?.slice(0, 8),
            }
          } catch {
            return { ...topic, authorName: topic.userId?.slice(0, 8) }
          }
        })
      )

      return { category, topics }
    },
  })

  const category = data?.category ?? null
  const topics = data?.topics ?? []

  // Track view
  useEffect(() => {
    // increment view on category if needed
  }, [categoryId])

  const handleTopicClick = (topicId: string) => {
    playUiSound('click')
    onNavigate('topic', { topicId })
  }

  const handleNewTopic = () => {
    playUiSound('success')
    onNavigate('new-topic', { categoryId })
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
      {/* Category header */}
      {category && (
        <div className="mb-5 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
            {category.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-cinzel font-bold text-foreground">
              {lang === 'ru' ? category.nameRu : category.nameEn}
            </h1>
            <p className="text-xs text-muted-foreground">
              {lang === 'ru' ? category.descriptionRu : category.descriptionEn}
            </p>
          </div>
          <button
            onClick={handleNewTopic}
            className="flex-shrink-0 px-3 py-2 rounded-lg bg-primary/15 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/25 transition-all hover:scale-105"
          >
            + {lang === 'ru' ? 'Новая тема' : 'New Topic'}
          </button>
        </div>
      )}

      {/* Topics list */}
      {topics.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3 opacity-50">📭</div>
          <p className="text-muted-foreground text-sm">
            {lang === 'ru' ? 'Тем пока нет. Начните обсуждение!' : 'No topics yet. Start the discussion!'}
          </p>
          <button
            onClick={handleNewTopic}
            className="mt-4 px-6 py-2 rounded-xl bg-primary/15 border border-primary/30 text-primary text-sm hover:bg-primary/25 transition-all"
          >
            {lang === 'ru' ? 'Создать первую тему' : 'Create first topic'}
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          {topics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => handleTopicClick(topic.id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-border/40 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 text-left group"
            >
              {/* Pinned / locked indicator */}
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/5 text-sm">
                {Number(topic.isPinned) > 0 ? '📌' : Number(topic.isLocked) > 0 ? '🔒' : '💬'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors truncate">
                  {Number(topic.isPinned) > 0 && (
                    <span className="text-[10px] text-primary mr-1.5 uppercase tracking-wider">
                      {lang === 'ru' ? 'закреп' : 'pinned'}
                    </span>
                  )}
                  {topic.title}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <span>{topic.authorName}</span>
                  <span>·</span>
                  <span>{formatDistanceToNow(new Date(topic.createdAt), { addSuffix: true })}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground flex-shrink-0">
                <span className="font-medium text-foreground">{topic.replyCount}</span>
                <span>{lang === 'ru' ? 'ответов' : 'replies'}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {topics.length >= PAGE_SIZE && (
        <div className="flex justify-center gap-2 mt-4">
          {page > 0 && (
            <button
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-border/40 text-xs text-muted-foreground hover:text-foreground"
            >
              ← {lang === 'ru' ? 'Назад' : 'Prev'}
            </button>
          )}
          <button
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-border/40 text-xs text-muted-foreground hover:text-foreground"
          >
            {lang === 'ru' ? 'Вперёд' : 'Next'} →
          </button>
        </div>
      )}
    </div>
  )
}
