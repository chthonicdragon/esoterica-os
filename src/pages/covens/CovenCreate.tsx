import React, { useState } from 'react'
import { covensService } from '../../services/covensService'
import { useLang } from '../../contexts/LanguageContext'
import { Globe, Lock, Loader2 } from 'lucide-react'

interface CovenCreateProps {
  user: { id: string; email?: string; displayName?: string }
  onSuccess: (covenId: string) => void
  onCancel: () => void
}

export function CovenCreate({ user, onSuccess, onCancel }: CovenCreateProps) {
  const { lang } = useLang()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const leaderName = user.displayName || user.email?.split('@')[0] || 'Unknown'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const coven = await covensService.createCoven({
        name: name.trim(),
        description: description.trim(),
        is_public: isPublic,
        leader_id: user.id,
        leader_name: leaderName,
      })
      await covensService.addMember({
        coven_id: coven.id,
        user_id: user.id,
        display_name: leaderName,
        role: 'leader',
      })
      onSuccess(coven.id)
    } catch (e: any) {
      setError(e.message ?? 'Failed to create coven')
    } finally {
      setLoading(false)
    }
  }

  const label = 'block text-xs font-medium text-muted-foreground mb-1.5 tracking-wide uppercase'
  const input = 'w-full px-3 py-2.5 rounded-lg bg-white/5 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors'

  return (
    <div className="flex-1 overflow-y-auto px-5 py-6">
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-5">
        <div>
          <label className={label}>{lang === 'ru' ? 'Название ковена *' : 'Coven Name *'}</label>
          <input
            className={input}
            placeholder={lang === 'ru' ? 'Введите название...' : 'Enter coven name...'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            required
            autoFocus
          />
        </div>

        <div>
          <label className={label}>{lang === 'ru' ? 'Описание' : 'Description'}</label>
          <textarea
            className={`${input} resize-none h-28`}
            placeholder={lang === 'ru' ? 'Расскажите о вашем ковене...' : 'Tell about your coven...'}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
          />
        </div>

        <div>
          <label className={label}>{lang === 'ru' ? 'Видимость' : 'Visibility'}</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsPublic(true)}
              className={`flex items-center gap-2.5 p-3 rounded-xl border text-sm transition-all ${
                isPublic
                  ? 'border-primary bg-primary/10 text-primary shadow-[0_0_12px_hsl(var(--primary)/0.2)]'
                  : 'border-border/40 bg-white/5 text-muted-foreground hover:border-primary/30'
              }`}
            >
              <Globe className="w-4 h-4 flex-shrink-0" />
              <div className="text-left">
                <div className="font-medium text-xs">{lang === 'ru' ? 'Публичный' : 'Public'}</div>
                <div className="text-[10px] opacity-70">{lang === 'ru' ? 'Виден всем' : 'Visible to all'}</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setIsPublic(false)}
              className={`flex items-center gap-2.5 p-3 rounded-xl border text-sm transition-all ${
                !isPublic
                  ? 'border-primary bg-primary/10 text-primary shadow-[0_0_12px_hsl(var(--primary)/0.2)]'
                  : 'border-border/40 bg-white/5 text-muted-foreground hover:border-primary/30'
              }`}
            >
              <Lock className="w-4 h-4 flex-shrink-0" />
              <div className="text-left">
                <div className="font-medium text-xs">{lang === 'ru' ? 'Скрытый' : 'Private'}</div>
                <div className="text-[10px] opacity-70">{lang === 'ru' ? 'Только участники' : 'Members only'}</div>
              </div>
            </button>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
          <span className="text-primary font-medium">{lang === 'ru' ? 'Лидер:' : 'Leader:'}</span>{' '}
          {leaderName}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-border/50 text-sm text-muted-foreground hover:text-foreground hover:border-border transition-colors"
          >
            {lang === 'ru' ? 'Отмена' : 'Cancel'}
          </button>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {lang === 'ru' ? 'Создать ковен' : 'Create Coven'}
          </button>
        </div>
      </form>
    </div>
  )
}
