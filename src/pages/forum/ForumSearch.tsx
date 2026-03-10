import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { db } from '../../lib/platformClient'
import { useLang } from '../../contexts/LanguageContext'
import { useAudio } from '../../contexts/AudioContext'
import type { ForumPost, ForumTopic, ForumView } from '../../types/forum'
import { formatDistanceToNow } from 'date-fns'

interface Props {
  user: { id: string; email?: string; displayName?: string }
  initialQuery?: string
  onNavigate: (to: ForumView, params?: { categoryId?: string; topicId?: string }) => void
}

interface SearchResult {
  topic: ForumTopic
  post: ForumPost
  excerpt: string
}

export function ForumSearch({ onNavigate, initialQuery = '' }: Props) {
  const { lang } = useLang()
  const { playUiSound } = useAudio()
  const [query, setQuery] = useState(initialQuery)
  const [searched, setSearched] = useState(false)

  const searchMutation = useMutation({
    mutationFn: async (q: string) => {
      const allPosts = await db.forumPosts.list({
        where: { isDeleted: { eq: '0' } },
        limit: 200,
      })

      const lowerQ = q.toLowerCase()
      const matchingPosts = (allPosts as unknown as ForumPost[])
        .filter(p => p.content.toLowerCase().includes(lowerQ))
        .slice(0, 20)

      const allTopics = await db.forumTopics.list({ limit: 200 })
      const matchingTopicIds = new Set<string>(
        (allTopics as unknown as ForumTopic[])
          .filter(t => t.title.toLowerCase().includes(lowerQ))
          .map(t => t.id)
      )

      const combined: SearchResult[] = []
      const seenTopics = new Set<string>()

      for (const post of matchingPosts) {
        if (!seenTopics.has(post.topicId)) {
          const topic = (allTopics as unknown as ForumTopic[]).find(t => t.id === post.topicId)
          if (topic) {
            seenTopics.add(post.topicId)
            const idx = post.content.toLowerCase().indexOf(lowerQ)
            const excerpt = post.content.slice(Math.max(0, idx - 50), idx + 100)
            combined.push({ topic, post, excerpt })
          }
        }
      }

      for (const topicId of matchingTopicIds) {
        if (!seenTopics.has(topicId)) {
          const topic = (allTopics as unknown as ForumTopic[]).find(t => t.id === topicId)
          if (topic) {
            seenTopics.add(topicId)
            combined.push({ topic, post: { id: '', topicId, content: '', userId: '', likeCount: 0, isDeleted: 0, isEdited: 0, createdAt: topic.createdAt } as ForumPost, excerpt: '' })
          }
        }
      }

      return combined
    },
  })

  const handleSearch = async (q: string) => {
    if (!q.trim() || q.trim().length < 2) return
    setSearched(true)
    try {
      await searchMutation.mutateAsync(q)
    } catch (e) {
      console.error('Search failed', e)
    }
  }

  useEffect(() => {
    if (initialQuery) {
      void handleSearch(initialQuery)
    }
  }, [initialQuery])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      playUiSound('click')
      void handleSearch(query)
    }
  }

  const highlightText = (text: string, q: string) => {
    if (!q.trim()) return text
    const idx = text.toLowerCase().indexOf(q.toLowerCase())
    if (idx === -1) return text
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-primary/30 text-primary rounded px-0.5">{text.slice(idx, idx + q.length)}</mark>
        {text.slice(idx + q.length)}
      </>
    )
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-cinzel font-bold text-foreground mb-3">
          {lang === 'ru' ? 'Поиск по форуму' : 'Forum Search'}
        </h1>

        {/* Search input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={lang === 'ru' ? 'Поиск по ключевым словам...' : 'Search by keywords...'}
            className="flex-1 bg-white/[0.04] border border-border/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground/50 transition-colors"
            autoFocus
          />
          <button
            onClick={() => { playUiSound('click'); void handleSearch(query) }}
            disabled={searchMutation.isPending || !query.trim()}
            className="px-5 py-2.5 rounded-xl bg-primary/15 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/25 disabled:opacity-50 transition-all"
          >
            {searchMutation.isPending ? '...' : lang === 'ru' ? 'Найти' : 'Search'}
          </button>
        </div>
      </div>

      {/* Results */}
      {searched && !searchMutation.isPending && (
        <div>
          <p className="text-xs text-muted-foreground mb-3">
            {(searchMutation.data || []).length === 0
              ? lang === 'ru' ? 'Ничего не найдено' : 'No results found'
              : lang === 'ru' ? `Найдено: ${(searchMutation.data || []).length} тем` : `Found: ${(searchMutation.data || []).length} topics`
            }
          </p>

          <div className="space-y-2">
            {(searchMutation.data || []).map((result, i) => (
              <button
                key={i}
                onClick={() => { playUiSound('click'); onNavigate('topic', { topicId: result.topic.id }) }}
                className="w-full text-left p-4 rounded-xl bg-white/[0.03] border border-border/40 hover:border-primary/30 hover:bg-primary/5 transition-all"
              >
                <div className="font-medium text-sm text-foreground group-hover:text-primary mb-1">
                  {highlightText(result.topic.title, query)}
                </div>
                {result.excerpt && (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    ...{highlightText(result.excerpt, query)}...
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <span>{result.topic.replyCount} {lang === 'ru' ? 'ответов' : 'replies'}</span>
                  <span>·</span>
                  <span>{formatDistanceToNow(new Date(result.topic.createdAt), { addSuffix: true })}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {!searched && (
        <div className="text-center py-12 text-muted-foreground">
          <div className="text-4xl mb-3 opacity-40">🔍</div>
          <p className="text-sm">
            {lang === 'ru' ? 'Введите запрос и нажмите Enter' : 'Type a query and press Enter'}
          </p>
        </div>
      )}
    </div>
  )
}

