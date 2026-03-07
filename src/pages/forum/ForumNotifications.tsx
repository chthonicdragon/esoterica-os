import { useState, useEffect } from 'react'
import { blink } from '../../blink/client'
import { useLang } from '../../contexts/LanguageContext'
import type { ForumNotification } from '../../types/forum'
import { formatDistanceToNow } from 'date-fns'

interface Props {
  userId: string
  onClose: () => void
  onNavigateToTopic: (topicId: string) => void
}

export function ForumNotifications({ userId, onClose, onNavigateToTopic }: Props) {
  const { lang } = useLang()
  const [notifications, setNotifications] = useState<ForumNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifications()
  }, [userId])

  async function loadNotifications() {
    try {
      const raw = await blink.db.forumNotifications.list({
        where: { userId: { eq: userId } },
        orderBy: { createdAt: 'desc' },
        limit: 30,
      })

      // Enrich with sender names
      const enriched = await Promise.all(
        (raw as unknown as ForumNotification[]).map(async (n) => {
          try {
            if (n.fromUserId) {
              const profiles = await blink.db.userProfiles.list({ where: { userId: { eq: n.fromUserId } }, limit: 1 })
              const p = (profiles as any[])[0]
              return { ...n, fromUserName: p?.displayName || n.fromUserId.slice(0, 8) }
            }
            return n
          } catch {
            return n
          }
        })
      )
      setNotifications(enriched)

      // Mark all as read
      const unread = enriched.filter(n => Number(n.isRead) === 0)
      await Promise.all(
        unread.map(n => blink.db.forumNotifications.update(n.id, { isRead: 1 }).catch(() => {}))
      )
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const getNotifText = (n: ForumNotification) => {
    const name = n.fromUserName || lang === 'ru' ? 'Кто-то' : 'Someone'
    if (n.type === 'reply') {
      return lang === 'ru' ? `${name} ответил(а) на ваше сообщение` : `${name} replied to your post`
    }
    if (n.type === 'like') {
      return lang === 'ru' ? `${name} поставил(а) лайк вашему сообщению` : `${name} liked your post`
    }
    return lang === 'ru' ? 'Новое уведомление' : 'New notification'
  }

  const getNotifIcon = (type: string) => {
    if (type === 'reply') return '↩'
    if (type === 'like') return '❤️'
    return '🔔'
  }

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-[hsl(var(--sidebar))] border border-border/40 rounded-2xl shadow-xl z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
        <span className="text-sm font-cinzel font-bold text-foreground">
          {lang === 'ru' ? 'Уведомления' : 'Notifications'}
        </span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
      </div>

      <div className="max-h-72 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <div className="w-5 h-5 rounded-full border border-primary/30 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <div className="text-2xl mb-2 opacity-40">🔔</div>
            <p>{lang === 'ru' ? 'Нет уведомлений' : 'No notifications'}</p>
          </div>
        ) : (
          notifications.map(n => (
            <button
              key={n.id}
              onClick={() => {
                if (n.topicId) onNavigateToTopic(n.topicId)
                onClose()
              }}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-border/20 last:border-0 ${Number(n.isRead) === 0 ? 'bg-primary/5' : ''}`}
            >
              <span className="text-base flex-shrink-0 mt-0.5">{getNotifIcon(n.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground leading-relaxed">{getNotifText(n)}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </p>
              </div>
              {Number(n.isRead) === 0 && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  )
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const raw = await blink.db.forumNotifications.list({
      where: { userId: { eq: userId }, isRead: { eq: '0' } },
      limit: 99,
    })
    return (raw as any[]).length
  } catch {
    return 0
  }
}
