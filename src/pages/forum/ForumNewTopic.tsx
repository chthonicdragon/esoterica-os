import { useState } from 'react'
import { blink } from '../../blink/client'
import { useLang } from '../../contexts/LanguageContext'
import { useAudio } from '../../contexts/AudioContext'
import type { ForumView } from '../../types/forum'
import toast from 'react-hot-toast'

interface Props {
  user: { id: string; email: string; displayName?: string }
  categoryId: string
  onNavigate: (to: ForumView, params?: { categoryId?: string; topicId?: string }) => void
  onSuccess: (topicId: string) => void
}

export function ForumNewTopic({ user, categoryId, onNavigate, onSuccess }: Props) {
  const { lang } = useLang()
  const { playUiSound } = useAudio()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    // Validation
    if (title.trim().length < 5) {
      toast.error(lang === 'ru' ? 'Заголовок слишком короткий (мин 5 символов)' : 'Title too short (min 5 chars)')
      return
    }
    if (title.length > 200) {
      toast.error(lang === 'ru' ? 'Заголовок слишком длинный (макс 200)' : 'Title too long (max 200)')
      return
    }
    if (content.trim().length < 10) {
      toast.error(lang === 'ru' ? 'Сообщение слишком короткое (мин 10 символов)' : 'Content too short (min 10 chars)')
      return
    }
    if (content.length > 5000) {
      toast.error(lang === 'ru' ? 'Сообщение слишком длинное (макс 5000)' : 'Content too long (max 5000)')
      return
    }

    setSubmitting(true)
    try {
      const topicId = `topic_${Date.now()}`
      const postId = `post_${Date.now()}`
      const now = new Date().toISOString()

      // Create topic
      await blink.db.forumTopics.create({
        id: topicId,
        categoryId,
        userId: user.id,
        title: title.trim(),
        isPinned: 0,
        isLocked: 0,
        viewCount: 0,
        replyCount: 0,
        lastPostAt: now,
        lastPostUserId: user.id,
        createdAt: now,
        updatedAt: now,
      })

      // Create first post
      await blink.db.forumPosts.create({
        id: postId,
        topicId,
        userId: user.id,
        content: content.trim(),
        likeCount: 0,
        isDeleted: 0,
        isEdited: 0,
        createdAt: now,
      })

      // Update category counts
      const cat = await blink.db.forumCategories.get(categoryId).catch(() => null)
      if (cat) {
        await blink.db.forumCategories.update(categoryId, {
          topicCount: (cat as any).topicCount + 1,
          postCount: (cat as any).postCount + 1,
        }).catch(() => {})
      }

      playUiSound('success')
      toast.success(lang === 'ru' ? 'Тема создана!' : 'Topic created!')
      onSuccess(topicId)
    } catch (e) {
      console.error(e)
      toast.error(lang === 'ru' ? 'Ошибка создания темы' : 'Failed to create topic')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-cinzel font-bold text-foreground">
          {lang === 'ru' ? 'Новая тема' : 'New Topic'}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          {lang === 'ru' ? 'Начните обсуждение в сообществе' : 'Start a discussion with the community'}
        </p>
      </div>

      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
            {lang === 'ru' ? 'Заголовок темы *' : 'Topic Title *'}
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={lang === 'ru' ? 'Введите заголовок (5–200 символов)' : 'Enter title (5–200 chars)'}
            maxLength={200}
            className="w-full bg-white/[0.04] border border-border/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground/50 transition-colors"
          />
          <div className="text-right text-xs text-muted-foreground mt-1">{title.length}/200</div>
        </div>

        {/* Content */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
            {lang === 'ru' ? 'Сообщение *' : 'Content *'}
          </label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={lang === 'ru' ? 'Напишите ваше сообщение... (мин 10, макс 5000 символов)' : 'Write your message... (min 10, max 5000 chars)'}
            maxLength={5000}
            rows={8}
            className="w-full bg-white/[0.04] border border-border/40 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground/50 transition-colors"
          />
          <div className="text-right text-xs text-muted-foreground mt-1">{content.length}/5000</div>
        </div>

        {/* Tips */}
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs text-muted-foreground">
          <p className="font-medium text-primary mb-1">
            💡 {lang === 'ru' ? 'Советы' : 'Tips'}
          </p>
          <ul className="space-y-0.5 list-disc list-inside">
            <li>{lang === 'ru' ? 'Будьте конкретны в заголовке' : 'Be specific in your title'}</li>
            <li>{lang === 'ru' ? 'Уважайте других участников' : 'Respect other members'}</li>
            <li>{lang === 'ru' ? 'Не спамьте и не рекламируйте' : 'No spam or advertising'}</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => { playUiSound('click'); onNavigate('category', { categoryId }) }}
            className="flex-1 px-4 py-3 rounded-xl border border-border/40 text-sm text-muted-foreground hover:text-foreground hover:border-border/60 transition-all"
          >
            {lang === 'ru' ? 'Отмена' : 'Cancel'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || !content.trim()}
            className="flex-1 px-4 py-3 rounded-xl bg-primary/15 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? '...' : lang === 'ru' ? 'Создать тему' : 'Create Topic'}
          </button>
        </div>
      </div>
    </div>
  )
}
