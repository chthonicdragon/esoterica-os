import React, { useEffect, useState, useCallback } from 'react'
import { useLang } from '../../contexts/LanguageContext'
import { covensService } from '../../services/covensService'
import type { Coven, CovensView } from '../../types/covens'
import { CovensList } from './CovensList'
import { CovenDetail } from './CovenDetail'
import { CovenCreate } from './CovenCreate'
import { Users, Plus, Globe, Lock, ArrowLeft } from 'lucide-react'

interface CovensPageProps {
  user: { id: string; email?: string; displayName?: string }
}

export function CovensPage({ user }: CovensPageProps) {
  const { lang } = useLang()
  const [view, setView] = useState<CovensView>('list')
  const [selectedCovenId, setSelectedCovenId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'mine' | 'public'>('all')

  const navigateTo = useCallback((v: CovensView, covenId?: string) => {
    setView(v)
    if (covenId !== undefined) setSelectedCovenId(covenId)
  }, [])

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <header className="flex items-center gap-3 px-5 py-4 border-b border-border/40 bg-background/60 backdrop-blur-sm flex-shrink-0">
        {view !== 'list' && (
          <button
            onClick={() => navigateTo('list')}
            className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <Users className="w-5 h-5 text-primary flex-shrink-0" />
        <div>
          <h1 className="text-base font-bold font-cinzel tracking-wider text-foreground">
            {lang === 'ru' ? 'Ковены' : 'Covens'}
          </h1>
          <p className="text-xs text-muted-foreground">
            {lang === 'ru' ? 'Магические объединения' : 'Magical circles'}
          </p>
        </div>
        {view === 'list' && (
          <button
            onClick={() => navigateTo('create')}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {lang === 'ru' ? 'Создать ковен' : 'Create Coven'}
          </button>
        )}
      </header>

      {view === 'list' && (
        <CovensList user={user} onNavigate={navigateTo} filter={filter} onFilterChange={setFilter} />
      )}
      {view === 'create' && (
        <CovenCreate
          user={user}
          onSuccess={(id) => navigateTo('detail', id)}
          onCancel={() => navigateTo('list')}
        />
      )}
      {view === 'detail' && selectedCovenId && (
        <CovenDetail
          user={user}
          covenId={selectedCovenId}
          onBack={() => navigateTo('list')}
          onDeleted={() => navigateTo('list')}
        />
      )}
    </div>
  )
}
