import React, { useState, useEffect } from 'react'
import { useLang } from '../../contexts/LanguageContext'
import { useAudio } from '../../contexts/AudioContext'
import {
  LayoutDashboard, FlameKindling, Bot, Moon, Sparkles,
  BookOpen, ShoppingBag, Settings, LogOut, Hexagon, MessageSquare, Eye, Activity
} from 'lucide-react'
import { SpiderWebIcon } from '../icons/SpiderWebIcon'
import { cn } from '../../lib/utils'
import { auth } from '../../lib/platformClient'
import { getUnreadNotificationCount } from '../../pages/forum/ForumNotifications'

type Page = 'dashboard' | 'altars' | 'ai-mentor' | 'ritual-tracker' | 'sigil-lab' | 'divination' | 'journal' | 'forum' | 'marketplace' | 'settings' | 'knowledge-graph' | 'chakra-intelligence'

interface SidebarProps {
  currentPage: Page
  onNavigate: (page: Page) => void
  userId?: string
}

export function Sidebar({ currentPage, onNavigate, userId }: SidebarProps) {
  const { t } = useLang()
  const { playUiSound } = useAudio()
  const [forumBadge, setForumBadge] = useState(0)

  useEffect(() => {
    if (!userId) return
    getUnreadNotificationCount(userId).then(setForumBadge)
    const interval = setInterval(() => {
      getUnreadNotificationCount(userId).then(setForumBadge)
    }, 30000)
    return () => clearInterval(interval)
  }, [userId])

  // Clear badge when visiting forum
  useEffect(() => {
    if (currentPage === 'forum') setForumBadge(0)
  }, [currentPage])

  const navItems = [
    { id: 'dashboard' as Page, icon: LayoutDashboard, label: t.dashboard },
    { id: 'altars' as Page, icon: FlameKindling, label: t.altars },
    { id: 'knowledge-graph' as Page, icon: SpiderWebIcon, label: (t as any).knowledgeGraph || 'Knowledge Graph' },
    { id: 'ai-mentor' as Page, icon: Bot, label: t.aiMentor },
    { id: 'ritual-tracker' as Page, icon: Moon, label: t.ritualTracker },
    { id: 'chakra-intelligence' as Page, icon: Activity, label: t.chakras },
    { id: 'sigil-lab' as Page, icon: Sparkles, label: t.sigilLab },
    { id: 'divination' as Page, icon: Eye, label: (t as any).divination || 'Oracle' },
    { id: 'journal' as Page, icon: BookOpen, label: t.journal },
    { id: 'forum' as Page, icon: MessageSquare, label: (t as any).forum || 'Forum', badge: forumBadge },
    { id: 'marketplace' as Page, icon: ShoppingBag, label: t.marketplace },
  ]

  const handleNavigate = (id: Page) => {
    onNavigate(id)
    playUiSound('click')
  }

  return (
    <aside className="w-64 h-screen flex flex-col bg-[hsl(var(--sidebar))] border-r border-[hsl(var(--sidebar-border))] transition-all duration-300">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-[hsl(var(--sidebar-border))]">
        <div className="relative">
          <Hexagon className="w-8 h-8 text-primary" strokeWidth={1.5} />
          <Sparkles className="w-3 h-3 text-[hsl(var(--neon))] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div>
          <div className="text-sm font-bold tracking-widest text-primary font-cinzel">ESOTERICA</div>
          <div className="text-[10px] text-muted-foreground tracking-widest uppercase">OS</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-0.5">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => handleNavigate(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200',
                  currentPage === item.id
                    ? 'bg-primary/15 text-primary border border-primary/30 shadow-[0_0_12px_hsl(var(--primary)/0.2)]'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                )}
              >
                <item.icon className={cn('w-4 h-4', currentPage === item.id ? 'text-primary' : '')} />
                <span>{item.label}</span>
                <div className="ml-auto flex items-center gap-1">
                  {(item as any).badge > 0 && (
                    <span className="min-w-[16px] h-4 px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                      {(item as any).badge > 9 ? '9+' : (item as any).badge}
                    </span>
                  )}
                  {currentPage === item.id && !(item as any).badge && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary))]" />
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom */}
      <div className="border-t border-[hsl(var(--sidebar-border))] p-2 space-y-0.5">
        <button
          onClick={() => handleNavigate('settings')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200',
            currentPage === 'settings'
              ? 'bg-primary/15 text-primary border border-primary/30'
              : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
          )}
        >
          <Settings className="w-4 h-4" />
          <span>{t.settings}</span>
        </button>
        <button
          onClick={() => { auth.logout(); playUiSound('click') }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}

