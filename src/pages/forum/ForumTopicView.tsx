import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useLang } from '../../contexts/LanguageContext'
import { useAudio } from '../../contexts/AudioContext'
import { useForumStorage } from '../../hooks/useForumStorage'
import type { ForumPost, ForumTopic, ForumView } from '../../types/forum'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

interface Props {
  user: { id: string; email: string; displayName?: string }
  topicId: string
  onNavigate: (to: ForumView, params?: { categoryId?: string; topicId?: string }) => void
}

export function ForumTopicView({ user, topicId, onNavigate }: Props) {
  const { lang } = useLang()
  const { playUiSound } = useAudio()
  const { getPosts: getLocalPosts, addPost: addLocalPost } = useForumStorage()
  const [topic, setTopic] = useState<ForumTopic | null>(null)
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [loading, setLoading] = useState(true)
  const [usingLocalStorage, setUsingLocalStorage] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editingPost, setEditingPost] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reportingPost, setReportingPost] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState('')
  const replyRef = useRef<HTMLTextAreaElement>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      try {
        // Use Supabase
        const { data: rawTopic, error: topicError } = await supabase
          .from('forumTopics')
          .select('*')
          .eq('id', topicId)
          .single()
        if (topicError) throw topicError
        setTopic(rawTopic as ForumTopic)
        setUsingLocalStorage(false)

        // Get posts from Supabase
        const { data: rawPosts, error: postsError } = await supabase
          .from('forumPosts')
          .select('*')
          .eq('topicId', topicId)
          .eq('isDeleted', 0)
          .order('createdAt', { ascending: true })
          .limit(100)
        if (postsError) throw postsError

        // Enrich posts with author info + likes
        const enriched = await Promise.all(
          (rawPosts as ForumPost[]).map(async (post) => {
            try {
              const { data: profile } = await supabase
                .from('userProfiles')
                .select('displayName, initiationLevel, archetype')
                .eq('userId', post.userId)
                .maybeSingle()
              const { data: likedByMe } = await supabase
                .from('forumLikes')
                .select('id')
                .eq('postId', post.id)
                .eq('userId', user.id)
                .maybeSingle()
              return {
                ...post,
                authorName: profile?.displayName || post.userId.slice(0, 8),
                authorLevel: profile?.initiationLevel || 1,
                authorArchetype: profile?.archetype || 'seeker',
                isLikedByMe: !!likedByMe,
              }
            } catch {
              return { ...post, authorName: post.userId.slice(0, 8), authorLevel: 1, authorArchetype: 'seeker', isLikedByMe: false }
            }
          })
        )
        setPosts(enriched)

        // Increment view count in Supabase
        await supabase.from('forumTopics').update({
          viewCount: (rawTopic as any).viewCount + 1
        }).eq('id', topicId)
      } catch (blinkError: any) {
        // Fallback to localStorage
        if (blinkError?.status === 403 || blinkError?.statusCode === 403) {
          console.log('📱 Loading posts from localStorage')
          setUsingLocalStorage(true)
          
          // Note: In localStorage mode, we don't have topic object, but we can load posts
          const localPosts = getLocalPosts(topicId)
          setPosts(localPosts as ForumPost[])
          setTopic(null) // No topic data in localStorage
        } else {
          throw blinkError
        }
      }
    } catch (e) {
      console.error('❌ Failed to load topic', e)
      // Final fallback
      const localPosts = getLocalPosts(topicId)
      setPosts(localPosts as ForumPost[])
      setUsingLocalStorage(true)
    } finally {
      setLoading(false)
    }
  }, [topicId, user.id, getLocalPosts])

  useEffect(() => { loadData() }, [loadData])

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || submitting) return
    // Basic anti-spam: max 500 chars, min 3 chars
    if (replyContent.trim().length < 3) {
      toast.error(lang === 'ru' ? 'Сообщение слишком короткое' : 'Message too short')
      return
    }
    if (replyContent.length > 2000) {
      toast.error(lang === 'ru' ? 'Сообщение слишком длинное (макс 2000)' : 'Message too long (max 2000)')
      return
    }
    setSubmitting(true)
    try {
      const newPost = {
        id: `post_${Date.now()}`,
        topicId,
        userId: user.id,
        parentId: replyingTo || undefined,
        content: replyContent.trim(),
        likeCount: 0,
        isDeleted: 0,
        isEdited: 0,
        createdAt: new Date().toISOString(),
      }
      
      try {
        // Use Supabase
        await supabase.from('forumPosts').insert([newPost])
        // Update topic reply count + last post
        await supabase.from('forumTopics').update({
          replyCount: posts.length,
          lastPostAt: new Date().toISOString(),
          lastPostUserId: user.id,
          updatedAt: new Date().toISOString(),
        }).eq('id', topicId)
        // Notify original topic author if different user
        if (replyingTo) {
          const parentPost = posts.find(p => p.id === replyingTo)
          if (parentPost && parentPost.userId !== user.id) {
            await supabase.from('forumNotifications').insert([
              {
                id: `notif_${Date.now()}`,
                userId: parentPost.userId,
                type: 'reply',
                postId: newPost.id,
                topicId,
                fromUserId: user.id,
                isRead: 0,
                createdAt: new Date().toISOString(),
              }
            ])
          }
        }

        playUiSound('success')
        toast.success(lang === 'ru' ? '✅ Ответ опубликован' : '✅ Reply posted')
      } catch (blinkError: any) {
        // Fallback to localStorage
        if (blinkError?.status === 403 || blinkError?.statusCode === 403) {
          console.log('📱 Creating post in localStorage')
          
          addLocalPost(topicId, newPost)
          playUiSound('success')
          toast.success(lang === 'ru' ? '✅ Ответ опубликован локально' : '✅ Reply posted locally')
        } else {
          throw blinkError
        }
      }

      setReplyContent('')
      setReplyingTo(null)
      await loadData()
    } catch (e) {
      console.error(e)
      toast.error(lang === 'ru' ? '❌ Ошибка публикации' : '❌ Failed to post')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLike = async (post: ForumPost) => {
    playUiSound('click')
    try {
      if (post.isLikedByMe) {
        // Remove like in Supabase
        const { data: likes } = await supabase
          .from('forumLikes')
          .select('id')
          .eq('postId', post.id)
          .eq('userId', user.id)
        if (likes && likes.length > 0) {
          await supabase.from('forumLikes').delete().eq('id', likes[0].id)
          await supabase.from('forumPosts').update({ likeCount: Math.max(0, post.likeCount - 1) }).eq('id', post.id)
        }
      } else {
        await supabase.from('forumLikes').insert([
          {
            id: `like_${Date.now()}`,
            postId: post.id,
            userId: user.id,
            createdAt: new Date().toISOString(),
          }
        ])
        await supabase.from('forumPosts').update({ likeCount: post.likeCount + 1 }).eq('id', post.id)
        // Notify post author
        if (post.userId !== user.id) {
          await supabase.from('forumNotifications').insert([
            {
              id: `notif_like_${Date.now()}`,
              userId: post.userId,
              type: 'like',
              postId: post.id,
              topicId,
              fromUserId: user.id,
              isRead: 0,
              createdAt: new Date().toISOString(),
            }
          ])
        }
      }
      setPosts(ps => ps.map(p =>
        p.id === post.id ? { ...p, likeCount: post.isLikedByMe ? p.likeCount - 1 : p.likeCount + 1, isLikedByMe: !p.isLikedByMe } : p
      ))
    } catch (e) {
      console.error('Like failed', e)
    }
  }

  const handleEdit = async (postId: string) => {
    if (!editContent.trim() || editContent.length > 2000) return
    try {
      await supabase.from('forumPosts').update({
        content: editContent.trim(),
        isEdited: 1,
        editedAt: new Date().toISOString(),
      }).eq('id', postId)
      setPosts(ps => ps.map(p => p.id === postId ? { ...p, content: editContent.trim(), isEdited: 1 } : p))
      setEditingPost(null)
      playUiSound('success')
      toast.success(lang === 'ru' ? 'Изменено' : 'Updated')
    } catch (e) {
      toast.error(lang === 'ru' ? 'Ошибка' : 'Error')
    }
  }

  const handleDelete = async (postId: string) => {
    if (!confirm(lang === 'ru' ? 'Удалить сообщение?' : 'Delete this post?')) return
    try {
      await supabase.from('forumPosts').update({ isDeleted: 1 }).eq('id', postId)
      setPosts(ps => ps.filter(p => p.id !== postId))
      playUiSound('click')
      toast.success(lang === 'ru' ? 'Удалено' : 'Deleted')
    } catch (e) {
      toast.error(lang === 'ru' ? 'Ошибка' : 'Error')
    }
  }

  const handleReport = async () => {
    if (!reportingPost || !reportReason.trim()) return
    try {
      await supabase.from('forumReports').insert([
        {
          id: `report_${Date.now()}`,
          postId: reportingPost,
          userId: user.id,
          reason: reportReason.trim(),
          status: 'pending',
          createdAt: new Date().toISOString(),
        }
      ])
      setReportingPost(null)
      setReportReason('')
      toast.success(lang === 'ru' ? 'Жалоба отправлена' : 'Report submitted')
    } catch (e) {
      toast.error(lang === 'ru' ? 'Ошибка' : 'Error')
    }
  }

  const startReply = (postId: string) => {
    setReplyingTo(postId)
    setTimeout(() => replyRef.current?.focus(), 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-8 h-8 rounded-full border border-primary/30 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Topic header */}
      {topic && (
        <div className="px-4 pt-4 pb-3 border-b border-border/30">
          <h1 className="text-lg font-cinzel font-bold text-foreground leading-tight">{topic.title}</h1>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            <span>{posts.length} {lang === 'ru' ? 'сообщений' : 'posts'}</span>
            <span>·</span>
            <span>{topic.viewCount} {lang === 'ru' ? 'просмотров' : 'views'}</span>
            {Number(topic.isLocked) > 0 && (
              <>
                <span>·</span>
                <span className="text-destructive">🔒 {lang === 'ru' ? 'Заблокирована' : 'Locked'}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Local Storage Mode Indicator */}
      {usingLocalStorage && (
        <div className="mx-4 mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
          <span className="text-xl">📱</span>
          <span className="text-sm text-amber-600 dark:text-amber-400">
            {lang === 'ru' 
              ? 'Локальное хранилище: сообщения работают в режиме браузера'
              : 'Local Mode: Posts run in browser storage'}
          </span>
        </div>
      )}

      {/* Posts */}
      <div className="divide-y divide-border/20">
        {posts.map((post, idx) => (
          <PostCard
            key={post.id}
            post={post}
            isFirst={idx === 0}
            currentUserId={user.id}
            lang={lang}
            editingPost={editingPost}
            editContent={editContent}
            reportingPost={reportingPost}
            reportReason={reportReason}
            onLike={() => handleLike(post)}
            onReply={() => startReply(post.id)}
            onEditStart={() => { setEditingPost(post.id); setEditContent(post.content) }}
            onEditSave={() => handleEdit(post.id)}
            onEditCancel={() => setEditingPost(null)}
            onEditChange={setEditContent}
            onDelete={() => handleDelete(post.id)}
            onReportStart={() => setReportingPost(post.id)}
            onReportCancel={() => setReportingPost(null)}
            onReportReasonChange={setReportReason}
            onReportSubmit={handleReport}
          />
        ))}
      </div>

      {/* Reply form */}
      {!topic || Number(topic.isLocked) === 0 ? (
        <div className="p-4 border-t border-border/30 bg-background/40">
          {replyingTo && (
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span>↩ {lang === 'ru' ? 'Ответ на сообщение' : 'Replying to post'}</span>
              <button onClick={() => setReplyingTo(null)} className="text-primary hover:underline">
                {lang === 'ru' ? 'Отмена' : 'Cancel'}
              </button>
            </div>
          )}
          <textarea
            ref={replyRef}
            value={replyContent}
            onChange={e => setReplyContent(e.target.value)}
            placeholder={lang === 'ru' ? 'Написать ответ... (мин 3, макс 2000 символов)' : 'Write a reply... (min 3, max 2000 chars)'}
            className="w-full bg-white/[0.04] border border-border/40 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground/50 min-h-[100px]"
            rows={4}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">{replyContent.length}/2000</span>
            <button
              onClick={handleSubmitReply}
              disabled={submitting || !replyContent.trim()}
              className="px-5 py-2 rounded-xl bg-primary/15 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? '...' : lang === 'ru' ? 'Отправить' : 'Post Reply'}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 text-center text-sm text-muted-foreground border-t border-border/30">
          🔒 {lang === 'ru' ? 'Тема закрыта для ответов' : 'Topic is locked'}
        </div>
      )}
    </div>
  )
}

interface PostCardProps {
  post: ForumPost
  isFirst: boolean
  currentUserId: string
  lang: 'en' | 'ru'
  editingPost: string | null
  editContent: string
  reportingPost: string | null
  reportReason: string
  onLike: () => void
  onReply: () => void
  onEditStart: () => void
  onEditSave: () => void
  onEditCancel: () => void
  onEditChange: (v: string) => void
  onDelete: () => void
  onReportStart: () => void
  onReportCancel: () => void
  onReportReasonChange: (v: string) => void
  onReportSubmit: () => void
}

function PostCard({
  post, isFirst, currentUserId, lang,
  editingPost, editContent, reportingPost, reportReason,
  onLike, onReply, onEditStart, onEditSave, onEditCancel, onEditChange,
  onDelete, onReportStart, onReportCancel, onReportReasonChange, onReportSubmit
}: PostCardProps) {
  const isOwn = post.userId === currentUserId
  const isEditing = editingPost === post.id
  const isReporting = reportingPost === post.id

  const levelLabel = LEVEL_LABELS[String(post.authorLevel || 1)] || 'Seeker'
  const archetypeIcon = ARCHETYPE_ICONS[post.authorArchetype || 'seeker'] || '✨'

  return (
    <div className={`p-4 ${isFirst ? 'bg-primary/[0.02]' : ''}`}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center text-base">
            {archetypeIcon}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap mb-2">
            <span className="font-medium text-sm text-foreground">{post.authorName}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {levelLabel}
            </span>
            <span className="text-xs text-muted-foreground ml-auto">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              {Number(post.isEdited) > 0 && (
                <span className="ml-1 text-muted-foreground/60">
                  ({lang === 'ru' ? 'изм.' : 'edited'})
                </span>
              )}
            </span>
          </div>

          {isEditing ? (
            <div>
              <textarea
                value={editContent}
                onChange={e => onEditChange(e.target.value)}
                className="w-full bg-white/[0.04] border border-border/40 rounded-lg p-2 text-sm resize-none focus:outline-none focus:border-primary/50 text-foreground min-h-[80px]"
                rows={3}
              />
              <div className="flex gap-2 mt-2">
                <button onClick={onEditSave} className="px-3 py-1 rounded-lg bg-primary/15 text-primary text-xs hover:bg-primary/25">
                  {lang === 'ru' ? 'Сохранить' : 'Save'}
                </button>
                <button onClick={onEditCancel} className="px-3 py-1 rounded-lg bg-white/5 text-muted-foreground text-xs hover:text-foreground">
                  {lang === 'ru' ? 'Отмена' : 'Cancel'}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed break-words">
              {post.content}
            </p>
          )}

          {post.imageUrl && !isEditing && (
            <img
              src={post.imageUrl}
              alt="Post attachment"
              className="mt-2 rounded-lg max-h-64 object-cover border border-border/30"
            />
          )}

          {/* Report form */}
          {isReporting && (
            <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <p className="text-xs text-muted-foreground mb-2">
                {lang === 'ru' ? 'Причина жалобы:' : 'Report reason:'}
              </p>
              <textarea
                value={reportReason}
                onChange={e => onReportReasonChange(e.target.value)}
                placeholder={lang === 'ru' ? 'Опишите нарушение...' : 'Describe the issue...'}
                className="w-full bg-white/[0.04] border border-border/40 rounded p-2 text-xs text-foreground resize-none min-h-[60px]"
                rows={2}
              />
              <div className="flex gap-2 mt-2">
                <button onClick={onReportSubmit} className="px-3 py-1 rounded bg-destructive/20 text-destructive text-xs hover:bg-destructive/30">
                  {lang === 'ru' ? 'Отправить' : 'Submit'}
                </button>
                <button onClick={onReportCancel} className="px-3 py-1 rounded bg-white/5 text-xs text-muted-foreground">
                  {lang === 'ru' ? 'Отмена' : 'Cancel'}
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={onLike}
              className={`flex items-center gap-1 text-xs transition-colors ${post.isLikedByMe ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <span>{post.isLikedByMe ? '❤️' : '🤍'}</span>
              <span>{post.likeCount}</span>
            </button>
            <button
              onClick={onReply}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>↩</span>
              <span>{lang === 'ru' ? 'Ответить' : 'Reply'}</span>
            </button>
            {isOwn && !isEditing && (
              <>
                <button onClick={onEditStart} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  ✏️ {lang === 'ru' ? 'Изм.' : 'Edit'}
                </button>
                <button onClick={onDelete} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
                  🗑️ {lang === 'ru' ? 'Удалить' : 'Delete'}
                </button>
              </>
            )}
            {!isOwn && !isReporting && (
              <button onClick={onReportStart} className="ml-auto text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                ⚑
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const LEVEL_LABELS: Record<string, string> = {
  '1': 'Seeker', '2': 'Initiate', '3': 'Adept', '4': 'Mystic', '5': 'Sage'
}
const ARCHETYPE_ICONS: Record<string, string> = {
  seeker: '🔍', mage: '🔮', healer: '🌿', warrior: '⚔️', hermit: '🕯️', eclectic: '✨', hecate: '🌙', hermes: '☿', morrigan: '🦅', odin: '⚡', lilith: '🌹'
}
