import { useState, useCallback } from 'react'
import { useLang } from '../../contexts/LanguageContext'
import { useAudio } from '../../contexts/AudioContext'
import { ForumCategories } from './ForumCategories'
import { ForumCategoryView } from './ForumCategoryView'
import { ForumTopicView } from './ForumTopicView'
import { ForumNewTopic } from './ForumNewTopic'
import { ForumSearch } from './ForumSearch'
import type { ForumView } from '../../types/forum'

interface ForumPageProps {
  user: { id: string; email: string; displayName?: string }
}

export function ForumPage({ user }: ForumPageProps) {
  const { lang } = useLang()
  const { playUiSound } = useAudio()
  const [view, setView] = useState<ForumView>('categories')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const navigate = useCallback((to: ForumView, params?: { categoryId?: string; topicId?: string }) => {
    playUiSound('click')
    setView(to)
    if (params?.categoryId) setSelectedCategoryId(params.categoryId)
    if (params?.topicId) setSelectedTopicId(params.topicId)
  }, [playUiSound])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Breadcrumb + Search bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-background/60 backdrop-blur-sm flex-shrink-0">
        <Breadcrumb view={view} lang={lang} onNavigate={navigate} />
        <div className="ml-auto">
          <button
            onClick={() => navigate('search')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs transition-colors"
          >
            <SearchIcon />
            <span className="hidden sm:inline">{lang === 'ru' ? 'Поиск' : 'Search'}</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {view === 'categories' && (
          <ForumCategories user={user} onNavigate={navigate} />
        )}
        {view === 'category' && selectedCategoryId && (
          <ForumCategoryView
            user={user}
            categoryId={selectedCategoryId}
            onNavigate={navigate}
          />
        )}
        {view === 'topic' && selectedTopicId && (
          <ForumTopicView
            user={user}
            topicId={selectedTopicId}
            onNavigate={navigate}
          />
        )}
        {view === 'new-topic' && selectedCategoryId && (
          <ForumNewTopic
            user={user}
            categoryId={selectedCategoryId}
            onNavigate={navigate}
            onSuccess={(topicId) => navigate('topic', { topicId })}
          />
        )}
        {view === 'search' && (
          <ForumSearch
            user={user}
            initialQuery={searchQuery}
            onNavigate={navigate}
          />
        )}
      </div>
    </div>
  )
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  )
}

interface BreadcrumbProps {
  view: ForumView
  lang: 'en' | 'ru'
  onNavigate: (to: ForumView, params?: { categoryId?: string; topicId?: string }) => void
}

function Breadcrumb({ view, lang, onNavigate }: BreadcrumbProps) {
  const crumbs: { label: string; action?: () => void }[] = [
    {
      label: lang === 'ru' ? 'Форум' : 'Forum',
      action: view !== 'categories' ? () => onNavigate('categories') : undefined,
    }
  ]
  if (view === 'category' || view === 'topic' || view === 'new-topic') {
    crumbs.push({ label: lang === 'ru' ? 'Категория' : 'Category' })
  }
  if (view === 'topic') {
    crumbs.push({ label: lang === 'ru' ? 'Тема' : 'Topic' })
  }
  if (view === 'new-topic') {
    crumbs.push({ label: lang === 'ru' ? 'Новая тема' : 'New Topic' })
  }
  if (view === 'search') {
    crumbs.push({ label: lang === 'ru' ? 'Поиск' : 'Search' })
  }

  return (
    <nav className="flex items-center gap-1 text-xs text-muted-foreground font-cinzel tracking-wide">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-border/60">›</span>}
          {crumb.action ? (
            <button onClick={crumb.action} className="hover:text-primary transition-colors">
              {crumb.label}
            </button>
          ) : (
            <span className="text-foreground">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
