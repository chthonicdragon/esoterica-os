import React, { useState, useEffect } from 'react'
import { useLang } from '../contexts/LanguageContext'
import { supabase } from '../lib/supabaseClient'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '../components/ui/sheet'
import toast from 'react-hot-toast'

interface CovensPageProps {
  user: { id: string; email?: string; displayName?: string }
}

export default function CovensPage({ user }: CovensPageProps) {
  const { lang } = useLang()
  const [covens, setCovens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [newCovenName, setNewCovenName] = useState('')
  const [newCovenDescription, setNewCovenDescription] = useState('')
  const [newCovenIsPublic, setNewCovenIsPublic] = useState(true)

  const handleCreateCoven = async () => {
    if (!newCovenName.trim()) {
      toast.error(lang === 'ru' ? 'Название ковена не может быть пустым' : 'Coven name cannot be empty')
      return
    }

    try {
      // 1. Создаем ковен
      const { data: covenData, error: covenError } = await supabase
        .from('covens')
        .insert({
          name: newCovenName,
          description: newCovenDescription,
          is_public: newCovenIsPublic,
          created_by: user.id,
        })
        .select()
        .single()

      if (covenError) throw covenError
      if (!covenData) throw new Error('Coven creation returned no data')

      // 2. Добавляем создателя как участника (и лидера)
      const { error: memberError } = await supabase
        .from('coven_members')
        .insert({
          coven_id: covenData.id,
          user_id: user.id,
          role: 'leader',
        })

      if (memberError) throw memberError

      toast.success(lang === 'ru' ? `Ковен "${newCovenName}" создан` : `Coven "${newCovenName}" created`)
      setShowCreateSheet(false)
      setNewCovenName('')
      setNewCovenDescription('')
      // Обновляем список ковенов
      setCovens(prev => [covenData, ...prev])

    } catch (error) {
      console.error("Error creating coven:", error)
      toast.error(lang === 'ru' ? 'Ошибка при создании ковена' : 'Failed to create coven')
    }
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-cinzel font-bold gradient-text">
            {lang === 'ru' ? 'Ковены' : 'Covens'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {lang === 'ru' ? 'Найдите или создайте свое сообщество практикующих.' : 'Find or create your community of practitioners.'}
          </p>
        </div>
        <button 
          onClick={() => setShowCreateSheet(true)}
          className="px-4 py-2 rounded-lg bg-primary/15 border border-primary/30 text-primary font-medium hover:bg-primary/25 transition-all hover:scale-105"
        >
          + {lang === 'ru' ? 'Создать ковен' : 'Create Coven'}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 rounded-full border border-primary/30 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {covens.map((coven) => (
            <div key={coven.id} className="border border-border/40 rounded-lg p-4 bg-white/[0.03] hover:bg-primary/5 transition-colors cursor-pointer">
              <h2 className="text-lg font-bold font-cinzel text-primary">{coven.name}</h2>
              <p className="text-sm text-muted-foreground mt-1 h-10 overflow-hidden">{coven.description}</p>
              <div className="text-xs text-muted-foreground mt-3 flex items-center justify-between">
                <span>{coven.members[0]?.count || 0} {lang === 'ru' ? 'участников' : 'members'}</span>
                <span className={`uppercase text-[10px] font-bold ${coven.is_public ? 'text-green-400' : 'text-amber-400'}`}>
                  {coven.is_public ? (lang === 'ru' ? 'Публичный' : 'Public') : (lang === 'ru' ? 'Частный' : 'Private')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet open={showCreateSheet} onOpenChange={setShowCreateSheet}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{lang === 'ru' ? 'Создать новый ковен' : 'Create a New Coven'}</SheetTitle>
            <SheetDescription>
              {lang === 'ru' ? 'Создайте свое собственное пространство для практик и общения.' : 'Create your own space for practice and communication.'}
            </SheetDescription>
          </SheetHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm font-medium">{lang === 'ru' ? 'Название ковена' : 'Coven Name'}</label>
              <input 
                type="text"
                value={newCovenName}
                onChange={(e) => setNewCovenName(e.target.value)}
                className="w-full mt-1 p-2 rounded-md bg-white/5 border border-border/40 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium">{lang === 'ru' ? 'Описание' : 'Description'}</label>
              <textarea 
                value={newCovenDescription}
                onChange={(e) => setNewCovenDescription(e.target.value)}
                className="w-full mt-1 p-2 rounded-md bg-white/5 border border-border/40 h-24 focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">{lang === 'ru' ? 'Публичный ковен' : 'Public Coven'}</label>
              <input 
                type="checkbox" 
                checked={newCovenIsPublic}
                onChange={(e) => setNewCovenIsPublic(e.target.checked)}
                className="h-4 w-4 rounded text-primary focus:ring-primary"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {lang === 'ru' ? 'Публичные ковены видны всем и открыты для вступления. В частные ковены можно вступить только по приглашению.' : 'Public covens are visible to everyone and open to join. Private covens are invite-only.'}
            </p>
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <button className="px-4 py-2 rounded-lg bg-secondary text-muted-foreground">{lang === 'ru' ? 'Отмена' : 'Cancel'}</button>
            </SheetClose>
                        <button onClick={handleCreateCoven} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground">{lang === 'ru' ? 'Создать' : 'Create'}</button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
