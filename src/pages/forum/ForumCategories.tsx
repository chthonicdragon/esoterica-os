import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useLang } from '../../contexts/LanguageContext'
import { useAudio } from '../../contexts/AudioContext'
import { useForumAdmin } from '../../hooks/useForumAdmin'
import { useForumStorage } from '../../hooks/useForumStorage'
import type { ForumCategory, ForumView } from '../../types/forum'
import toast from 'react-hot-toast'

interface Props {
  user: { id: string; email: string; displayName?: string }
  onNavigate: (to: ForumView, params?: { categoryId?: string; topicId?: string }) => void
}

export function ForumCategories({ user, onNavigate }: Props) {
  const { lang } = useLang()
  const { playUiSound } = useAudio()
  const { isForumAdmin: adminStatus, loading: adminLoading } = useForumAdmin(user.id)
  const { addCategory: addLocalCategory, getCategories: getLocalCategories } = useForumStorage()
  
  const [isForumAdmin, setIsForumAdmin] = useState(false)
  const [categories, setCategories] = useState<ForumCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingLocalStorage, setUsingLocalStorage] = useState(false)
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryIcon, setNewCategoryIcon] = useState('📚')

  // Обновляем админский статус когда он меняется
  useEffect(() => {
    console.log('🔄 Admin status hook triggered:', { adminStatus, adminLoading })
    if (!adminLoading) {
      setIsForumAdmin(adminStatus)
      if (adminStatus) {
        console.log('✅ User is Forum Admin')
        toast.success(lang === 'ru' ? '👑 Вы администратор форума' : '👑 You are forum admin', {
          position: 'top-right',
          duration: 2000,
        })
      }
    }
  }, [adminStatus, adminLoading, lang])

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    try {
      setError(null)
      setUsingLocalStorage(false)
      // Загружаем категории из Supabase
      try {
        const { data: raw, error: sbError } = await supabase
          .from('forumCategories')
          .select('*')
          .order('sortOrder', { ascending: true })
        if (sbError) throw sbError
        setCategories(raw as ForumCategory[])
      } catch (blinkError: any) {
        console.warn('⚠️ Blink error:', blinkError?.status, blinkError?.message)
        
        if (blinkError?.status === 403 || blinkError?.statusCode === 403) {
          console.log('📱 Switching to localStorage (Blink access denied)')
          setUsingLocalStorage(true)
          setError(lang === 'ru' 
            ? '📱 Используется локальное хранилище (браузер). Категории хранятся в памяти браузера.'
            : '📱 Using local storage (browser). Categories are stored in browser memory.')
          
          const localCats = getLocalCategories()
          console.log('📋 Local categories:', localCats)
          setCategories(localCats as ForumCategory[])
        } else {
          throw blinkError
        }
      }
    } catch (e: any) {
      console.error('❌ Failed to load categories', e)
      setUsingLocalStorage(true)
      const localCats = getLocalCategories()
      setCategories(localCats as ForumCategory[])
      
      if (localCats.length === 0) {
        setError(lang === 'ru' 
          ? '📋 Категорий нет. Создайте первую как администратор'
          : '📋 No categories. Create the first one as admin')
      }
    } finally {
      setLoading(false)
    }
  }

  async function createCategory() {
    if (!newCategoryName.trim()) {
      toast.error(lang === 'ru' ? '⚠️ Введите название категории' : '⚠️ Enter category name')
      return
    }
    
    try {
      console.log('📝 Creating category:', { name: newCategoryName, icon: newCategoryIcon, userId: user.id })
      
      const categoryData = {
        name: newCategoryName,
        nameEn: newCategoryName,
        nameRu: newCategoryName,
        icon: newCategoryIcon,
        sortOrder: categories.length,
        topicCount: 0,
        postCount: 0,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      try {
        // Пытаемся создать в Blink
        const newCat = await blink.db.forumCategories.create(categoryData) as ForumCategory
        console.log('✅ Category created in Blink:', newCat)
        
        setCategories([...categories, newCat])
        setNewCategoryName('')
        setNewCategoryIcon('📚')
        setShowCreateCategory(false)
        setError(null)
        
        toast.success(lang === 'ru' ? '✅ Категория создана!' : '✅ Category created!')
      } catch (blinkError: any) {
        // Если ошибка с Blink - создаем локально
        console.warn('⚠️ Blink create error:', blinkError?.status, blinkError?.message)
        
        if (blinkError?.status === 403 || blinkError?.statusCode === 403) {
          console.log('📱 Creating category in localStorage instead')
          setUsingLocalStorage(true)
          
          const newCat = addLocalCategory(categoryData)
          console.log('✅ Category created in localStorage:', newCat)
          
          setCategories([...categories, newCat])
          setNewCategoryName('')
          setNewCategoryIcon('📚')
          setShowCreateCategory(false)
          setError(lang === 'ru' 
            ? '📱 Категория сохранена в браузере (локальное хранилище)'
            : '📱 Category saved in browser (local storage)')
          
          toast.success(lang === 'ru' ? '✅ Категория создана локально!' : '✅ Category created locally!')
        } else {
          throw blinkError
        }
      }
      
      // Перезагрузим список категорий для синхронизации
      setTimeout(() => {
        loadCategories()
      }, 500)
    } catch (e: any) {
      console.error('❌ Error creating category:', e)
      console.error('Error details:', { status: e?.status, statusCode: e?.statusCode, message: e?.message, error: e })
      
      let errorMsg = e?.message || (lang === 'ru' ? 'Неизвестная ошибка' : 'Unknown error')
      toast.error(lang === 'ru' ? `❌ Ошибка: ${errorMsg}` : `❌ Error: ${errorMsg}`)
    }
  }

  const handleCategoryClick = (categoryId: string) => {
    playUiSound('click')
    onNavigate('category', { categoryId })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-8 h-8 rounded-full border border-primary/30 animate-spin" />
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="p-4 max-w-3xl mx-auto">
        <div className="text-center py-12 space-y-6">
          {/* Show status message */}
          {error && (
            <p className="text-primary/80 text-sm">{error}</p>
          )}
          
          {!error && usingLocalStorage && (
            <p className="text-primary/80 text-sm">
              {lang === 'ru' 
                ? '📱 Категорий еще нет. Используется локальное хранилище браузера'
                : '📱 No categories yet. Using browser local storage'}
            </p>
          )}
          
          {!error && !usingLocalStorage && (
            <p className="text-muted-foreground text-sm">
              {lang === 'ru' 
                ? '📋 Категорий еще нет'
                : '📋 No categories yet'}
            </p>
          )}
          
          {/* Admin instructions */}
          {isForumAdmin && error?.includes('🔒') && (
            <div className="bg-primary/5 border border-primary/30 rounded-xl p-4 space-y-3 max-w-lg mx-auto">
              <h3 className="font-bold text-sm text-foreground">
                {lang === 'ru' ? '📖 Как открыть доступ:' : '📖 How to enable access:'}
              </h3>
              <ol className="text-xs text-left space-y-2 text-muted-foreground">
                <li>1. {lang === 'ru' ? 'Откройте ' : 'Open '}<a href="https://console.blink.new" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Blink Console</a></li>
                <li>2. {lang === 'ru' ? 'Проект → Database → Tables' : 'Project → Database → Tables'}</li>
                <li>3. {lang === 'ru' ? 'Найдите forum_categories' : 'Find forum_categories'}</li>
                <li>4. {lang === 'ru' ? 'Security → Public Access: ON (Read)' : 'Security → Public Access: ON (Read)'}</li>
                <li>5. {lang === 'ru' ? 'Сохраните и вернитесь в приложение' : 'Save and return to app'}</li>
              </ol>
            </div>
          )}
          
          {/* Create Button - Always show for admins */}
          {isForumAdmin && (
            <button
              onClick={() => {
                console.log('🎯 Opening create category form...')
                setShowCreateCategory(true)
              }}
              className="bg-primary text-primary-foreground rounded-xl px-6 py-3 font-medium hover:bg-primary/90 transition-colors inline-block"
            >
              {lang === 'ru' ? '➕ Создать первую категорию' : '➕ Create First Category'}
            </button>
          )}
          
          {!isForumAdmin && (
            <p className="text-muted-foreground text-sm">
              {lang === 'ru' 
                ? '👤 Только администраторы могут создавать категории'
                : '👤 Only administrators can create categories'}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-cinzel font-bold gradient-text mb-1">
          {lang === 'ru' ? 'Форум Esoterica' : 'Esoterica Forum'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {lang === 'ru'
            ? 'Сообщество практиков личной трансформации'
            : 'Community of personal transformation practitioners'}
        </p>
      </div>

      {/* Local Storage Mode Indicator */}
      {usingLocalStorage && (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
          <span className="text-xl">📱</span>
          <span className="text-sm text-amber-600 dark:text-amber-400">
            {lang === 'ru' 
              ? 'Локальное хранилище: форум работает в режиме браузера'
              : 'Local Mode: Forum runs in browser storage'}
          </span>
        </div>
      )}

      {/* Categories */}
      <div className="space-y-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryClick(cat.id)}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
              {cat.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                {lang === 'ru' ? (cat.nameRu || cat.name) : (cat.nameEn || cat.name)}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5 truncate">
                {lang === 'ru' ? (cat.descriptionRu || '') : (cat.descriptionEn || '')}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0 text-right">
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{cat.topicCount}</span>{' '}
                {lang === 'ru' ? 'тем' : 'topics'}
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{cat.postCount}</span>{' '}
                {lang === 'ru' ? 'сообщ.' : 'posts'}
              </div>
            </div>
            <svg className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>

      {/* Admin Create Button */}
      {isForumAdmin && (
        <div className="mt-4 flex gap-2 justify-center">
          <button
            onClick={() => setShowCreateCategory(true)}
            className="bg-primary/15 border border-primary/40 text-primary rounded-xl px-4 py-2 text-xs font-medium hover:bg-primary/25 transition-colors"
          >
            👑 {lang === 'ru' ? 'Создать категорию' : 'Create Category'}
          </button>
        </div>
      )}

      {/* Create Category Modal */}
      {showCreateCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 rounded-2xl">
          <div className="bg-card border border-border/40 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold font-cinzel text-foreground">
              {lang === 'ru' ? 'Новая категория' : 'New Category'}
            </h3>
            
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">{lang === 'ru' ? 'Название' : 'Name'}</label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder={lang === 'ru' ? 'Название категории...' : 'Category name...'}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">{lang === 'ru' ? 'Иконка' : 'Icon'}</label>
              <div className="grid grid-cols-5 gap-2">
                {['📚', '💬', '🔮', '✨', '🌙', '⭐', '📖', '🎭', '🔥', '💎'].map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setNewCategoryIcon(icon)}
                    className={`p-3 rounded-lg border text-xl transition-colors ${
                      newCategoryIcon === icon
                        ? 'bg-primary/20 border-primary/40'
                        : 'bg-white/5 border-border/40 hover:border-primary/20'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={createCategory}
                disabled={!newCategoryName.trim()}
                className="flex-1 bg-primary text-primary-foreground rounded-xl py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {lang === 'ru' ? 'Создать' : 'Create'}
              </button>
              <button
                onClick={() => {
                  setShowCreateCategory(false)
                  setNewCategoryName('')
                  setNewCategoryIcon('📚')
                }}
                className="flex-1 bg-muted text-muted-foreground rounded-xl py-2 text-sm font-medium hover:bg-muted/80 transition-colors"
              >
                {lang === 'ru' ? 'Отмена' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-border/30 flex items-center justify-around text-center">
        <div>
          <div className="text-lg font-bold text-primary font-cinzel">
            {categories.reduce((a, c) => a + c.topicCount, 0)}
          </div>
          <div className="text-xs text-muted-foreground">{lang === 'ru' ? 'Темы' : 'Topics'}</div>
        </div>
        <div className="w-px h-8 bg-border/30" />
        <div>
          <div className="text-lg font-bold text-primary font-cinzel">
            {categories.reduce((a, c) => a + c.postCount, 0)}
          </div>
          <div className="text-xs text-muted-foreground">{lang === 'ru' ? 'Сообщения' : 'Posts'}</div>
        </div>
        <div className="w-px h-8 bg-border/30" />
        <div>
          <div className="text-lg font-bold text-[hsl(var(--neon))] font-cinzel">
            {categories.length}
          </div>
          <div className="text-xs text-muted-foreground">{lang === 'ru' ? 'Категории' : 'Categories'}</div>
        </div>
      </div>
    </div>
  )
}
