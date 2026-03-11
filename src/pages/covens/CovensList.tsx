import React, { useEffect, useState } from 'react'
import { covensService } from '../../services/covensService'
import type { Coven, CovensView } from '../../types/covens'
import { useLang } from '../../contexts/LanguageContext'
import { Globe, Lock, Users, Clock, ChevronRight, Loader2, AlertCircle } from 'lucide-react'

interface CovensListProps {
  user: { id: string; email?: string; displayName?: string }
  onNavigate: (view: CovensView, covenId?: string) => void
  filter: 'all' | 'mine' | 'public'
  onFilterChange: (f: 'all' | 'mine' | 'public') => void
}

export function CovensList({ user, onNavigate, filter, onFilterChange }: CovensListProps) {
  const { lang } = useLang()
  const [covens, setCovens] = useState<Coven[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    covensService
      .listCovens(filter === 'public')
      .then((data) => {
        const filtered =
          filter === 'mine' ? data.filter((c) => c.leader_id === user.id) : data
        setCovens(filtered)
      })
      .catch((e) => setError(e.message ?? 'Error loading covens'))
      .finally(() => setLoading(false))
  }, [filter, user.id])

  const FILTERS: { key: 'all' | 'mine' | 'public'; en: string; ru: string }[] = [
    { key: 'all', en: 'All', ru: 'Все' },
    { key: 'public', en: 'Public', ru: 'Публичные' },
    { key: 'mine', en: 'My Covens', ru: 'Мои ковены' },
  ]

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-5 pt-4 pb-2 flex gap-2 flex-shrink-0">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => onFilterChange(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f.key
                ? 'bg-primary text-white shadow-[0_0_10px_hsl(var(--primary)/0.4)]'
                : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground'
            }`}
          >
            {lang === 'ru' ? f.ru : f.en}
          </button>
        ))}
      </div>

      <div className="px-5 py-4 space-y-3">
        {loading && (
          <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">{lang === 'ru' ? 'Загрузка...' : 'Loading...'}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {!loading && !error && covens.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <Users className="w-12 h-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              {lang === 'ru' ? 'Ковенов пока нет' : 'No covens yet'}
            </p>
            <button
              onClick={() => onNavigate('create')}
              className="mt-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs hover:bg-primary/20 transition-colors"
            >
              {lang === 'ru' ? 'Создать первый ковен' : 'Create the first coven'}
            </button>
          </div>
        )}

        {!loading && !error && covens.map((coven) => (
          <button
            key={coven.id}
            onClick={() => onNavigate('detail', coven.id)}
            className="w-full text-left p-4 rounded-xl bg-white/[0.03] border border-border/40 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {coven.is_public
                    ? <Globe className="w-3.5 h-3.5 text-primary/70 flex-shrink-0" />
                    : <Lock className="w-3.5 h-3.5 text-muted-foreground/70 flex-shrink-0" />}
                  <span className="font-semibold text-sm text-foreground truncate">{coven.name}</span>
                  {coven.leader_id === user.id && (
                    <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                      {lang === 'ru' ? 'Лидер' : 'Leader'}
                    </span>
                  )}
                </div>
                {coven.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {coven.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {coven.leader_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(coven.created_at).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US')}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
