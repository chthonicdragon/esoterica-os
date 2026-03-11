import React, { useEffect, useRef, useState } from 'react'
import { useUser } from '../../contexts/UserContext'
import { useLang } from '../../contexts/LanguageContext'
import { covenBoardService, CovenPost } from '../../services/covenBoardService'
import { Send, Trash2, Loader2, MessageSquare } from 'lucide-react'
import { cn } from '../../lib/utils'
import toast from 'react-hot-toast'

interface CovenBoardProps {
  covenId: string
  isMember: boolean
  leaderId: string
}

function timeAgo(dateStr: string, lang: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return lang === 'ru' ? 'только что' : 'just now'
  if (diff < 3600) return lang === 'ru' ? `${Math.floor(diff / 60)} мин. назад` : `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return lang === 'ru' ? `${Math.floor(diff / 3600)} ч. назад` : `${Math.floor(diff / 3600)}h ago`
  return lang === 'ru' ? `${Math.floor(diff / 86400)} дн. назад` : `${Math.floor(diff / 86400)}d ago`
}

export function CovenBoard({ covenId, isMember, leaderId }: CovenBoardProps) {
  const { user } = useUser()
  const { lang } = useLang()
  const [posts, setPosts] = useState<CovenPost[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    loadPosts()
  }, [covenId])

  const loadPosts = async () => {
    setLoading(true)
    try {
      const data = await covenBoardService.getPosts(covenId)
      setPosts(data)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!user || !content.trim()) return
    setSending(true)
    try {
      const post = await covenBoardService.createPost({
        coven_id: covenId,
        user_id: user.id,
        display_name: user.displayName || user.email || lang === 'ru' ? 'Аноним' : 'Anonymous',
        avatar_url: user.avatarUrl || null,
        content: content.trim(),
      })
      setPosts(prev => [post, ...prev])
      setContent('')
    } catch {
      toast.error(lang === 'ru' ? 'Ошибка отправки' : 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (postId: string) => {
    setDeletingId(postId)
    try {
      await covenBoardService.deletePost(postId)
      setPosts(prev => prev.filter(p => p.id !== postId))
    } catch {
      toast.error(lang === 'ru' ? 'Ошибка удаления' : 'Failed to delete')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* New post */}
      {isMember && user && (
        <div className="rounded-xl border border-border/50 bg-white/[0.02] p-4 space-y-3">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSend()
            }}
            placeholder={lang === 'ru' ? 'Написать сообщение на доске ковена...' : 'Write a message on the coven board...'}
            rows={3}
            maxLength={1000}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 resize-none outline-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground/40">{content.length}/1000</span>
            <button
              onClick={handleSend}
              disabled={sending || !content.trim()}
              className={cn(
                'flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all',
                content.trim()
                  ? 'bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30'
                  : 'bg-white/5 border border-border/30 text-muted-foreground cursor-not-allowed'
              )}
            >
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {lang === 'ru' ? 'Отправить' : 'Post'}
            </button>
          </div>
        </div>
      )}

      {/* Posts list */}
      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">{lang === 'ru' ? 'Загрузка...' : 'Loading...'}</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <MessageSquare className="w-10 h-10 opacity-20" />
          <p className="text-sm">{lang === 'ru' ? 'На доске пока нет сообщений' : 'No messages on the board yet'}</p>
          {isMember && (
            <p className="text-xs opacity-60">{lang === 'ru' ? 'Будьте первым!' : 'Be the first!'}</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => {
            const isOwn = user?.id === post.user_id
            const isLeader = user?.id === leaderId
            const canDelete = isOwn || isLeader
            return (
              <div key={post.id} className="flex gap-3 group">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-border/40">
                  {post.avatar_url ? (
                    <img src={post.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/60 to-primary flex items-center justify-center text-xs font-bold text-white">
                      {post.display_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-foreground/90">{post.display_name}</span>
                    <span className="text-[10px] text-muted-foreground/50">{timeAgo(post.created_at, lang)}</span>
                  </div>
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap break-words">{post.content}</p>
                </div>
                {canDelete && (
                  <button
                    onClick={() => handleDelete(post.id)}
                    disabled={deletingId === post.id}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex-shrink-0"
                  >
                    {deletingId === post.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
