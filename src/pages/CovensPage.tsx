import React, { useEffect, useMemo, useState } from 'react'
import { useLang } from '../contexts/LanguageContext'
import { supabase } from '../lib/supabaseClient'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '../components/ui/sheet'
import toast from 'react-hot-toast'

interface CovensPageProps {
  user: { id: string; email?: string; displayName?: string }
}

interface CovenMember {
  id?: string
  coven_id: string
  user_id: string
  role: string
  user_name?: string | null
  email?: string | null
  created_at?: string
}

interface Coven {
  id: string
  name: string
  description: string | null
  is_public: boolean
  created_by: string
  leader_id?: string | null
  created_at?: string
  coven_members?: CovenMember[]
}

export default function CovensPage({ user }: CovensPageProps) {
  const { lang } = useLang()

  const [covens, setCovens] = useState<Coven[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [newCovenName, setNewCovenName] = useState('')
  const [newCovenDescription, setNewCovenDescription] = useState('')
  const [newCovenIsPublic, setNewCovenIsPublic] = useState(true)

  const [showPublicOnly, setShowPublicOnly] = useState(false)

  const [selectedCoven, setSelectedCoven] = useState<Coven | null>(null)
  const [showDetailsSheet, setShowDetailsSheet] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState<CovenMember[]>([])
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [membershipLoading, setMembershipLoading] = useState(false)
  const [transferTargetId, setTransferTargetId] = useState('')
  const [transferLoading, setTransferLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchCovens = async (silent = false) => {
    if (silent) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      let query = supabase
        .from('covens')
        .select('*, coven_members(user_id, role, coven_id)')
        .order('created_at', { ascending: false })

      if (showPublicOnly) {
        query = query.eq('is_public', true)
      }

      const { data, error } = await query

      if (error) throw error
      setCovens((data as Coven[]) || [])
    } catch (e) {
      console.error('Error fetching covens:', e)
      toast.error(lang === 'ru' ? 'Ошибка при загрузке ковенов' : 'Failed to fetch covens')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchCovens()
  }, [showPublicOnly])

  const fetchCovenMembers = async (covenId: string) => {
    setDetailsLoading(true)
    try {
      const { data, error } = await supabase
        .from('coven_members')
        .select(`
          *,
          profiles!inner(
            full_name,
            email
          )
        `)
        .eq('coven_id', covenId)
        .order('created_at', { ascending: true })

      if (error) throw error

      const members = ((data as any[]) || []).map((member) => ({
        ...member,
        user_name: member.profiles?.full_name ?? null,
        email: member.profiles?.email ?? null,
      }))

      setSelectedMembers(members)
    } catch (e) {
      console.error('Error fetching coven members:', e)
      setSelectedMembers([])
      toast.error(lang === 'ru' ? 'Ошибка при загрузке участников' : 'Failed to load members')
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleOpenCoven = async (coven: Coven) => {
    setSelectedCoven(coven)
    setShowDetailsSheet(true)
    setTransferTargetId('')
    await fetchCovenMembers(coven.id)
  }

  const handleCreateCoven = async () => {
    if (!newCovenName.trim()) {
      toast.error(lang === 'ru' ? 'Название ковена не может быть пустым' : 'Coven name cannot be empty')
      return
    }

    try {
      const { data: covenData, error: covenError } = await supabase
        .from('covens')
        .insert({
          name: newCovenName.trim(),
          description: newCovenDescription.trim() || null,
          is_public: newCovenIsPublic,
          created_by: user.id,
          leader_id: user.id,
        })
        .select()
        .single()

      if (covenError) throw covenError
      if (!covenData) throw new Error('Coven creation returned no data')

      const { error: memberError } = await supabase
        .from('coven_members')
        .insert({
          coven_id: covenData.id,
          user_id: user.id,
          role: 'leader',
        })

      if (memberError) throw memberError

      toast.success(
        lang === 'ru'
          ? `Ковен "${newCovenName}" создан`
          : `Coven "${newCovenName}" created`
      )

      setShowCreateSheet(false)
      setNewCovenName('')
      setNewCovenDescription('')
      setNewCovenIsPublic(true)

      await fetchCovens(true)

      const created = {
        ...(covenData as Coven),
        coven_members: [{ coven_id: covenData.id, user_id: user.id, role: 'leader' }],
      }

      setSelectedCoven(created)
      setSelectedMembers([{
        coven_id: covenData.id,
        user_id: user.id,
        role: 'leader',
        user_name: user.displayName ?? null,
        email: user.email ?? null,
      }])
      setShowDetailsSheet(true)
    } catch (error) {
      console.error('Error creating coven:', error)
      toast.error(lang === 'ru' ? 'Ошибка при создании ковена' : 'Failed to create coven')
    }
  }

  const isSelectedMember = useMemo(() => {
    return selectedMembers.some((m) => m.user_id === user.id)
  }, [selectedMembers, user.id])

  const isSelectedLeader = useMemo(() => {
    return selectedMembers.some((m) => m.user_id === user.id && m.role === 'leader')
  }, [selectedMembers, user.id])

  const canDeleteSelectedCoven = useMemo(() => {
    if (!selectedCoven) return false
    return selectedCoven.created_by === user.id || selectedCoven.leader_id === user.id || isSelectedLeader
  }, [selectedCoven, user.id, isSelectedLeader])

  const handleJoinCoven = async () => {
    if (!selectedCoven) return
    if (isSelectedMember) return

    setMembershipLoading(true)
    try {
      const { error } = await supabase.from('coven_members').insert({
        coven_id: selectedCoven.id,
        user_id: user.id,
        role: 'member',
      })

      if (error) throw error

      toast.success(lang === 'ru' ? 'Вы вступили в ковен' : 'You joined the coven')

      await fetchCovenMembers(selectedCoven.id)
      await fetchCovens(true)
    } catch (e) {
      console.error('Error joining coven:', e)
      toast.error(lang === 'ru' ? 'Не удалось вступить в ковен' : 'Failed to join coven')
    } finally {
      setMembershipLoading(false)
    }
  }

  const handleTransferLeadership = async () => {
    if (!selectedCoven || !transferTargetId) return

    if (transferTargetId === user.id) {
      toast.error(lang === 'ru' ? 'Нельзя передать лидерство самому себе' : 'Cannot transfer leadership to yourself')
      return
    }

    setTransferLoading(true)
    try {
      const targetMember = selectedMembers.find((m) => m.user_id === transferTargetId)

      if (!targetMember) {
        toast.error(lang === 'ru' ? 'Пользователь не состоит в ковене' : 'User is not a member of this coven')
        return
      }

      const { error: demoteError } = await supabase
        .from('coven_members')
        .update({ role: 'member' })
        .eq('coven_id', selectedCoven.id)
        .eq('user_id', user.id)

      if (demoteError) throw demoteError

      const { error: promoteError } = await supabase
        .from('coven_members')
        .update({ role: 'leader' })
        .eq('coven_id', selectedCoven.id)
        .eq('user_id', transferTargetId)

      if (promoteError) throw promoteError

      const { error: covenUpdateError } = await supabase
        .from('covens')
        .update({ leader_id: transferTargetId })
        .eq('id', selectedCoven.id)

      if (covenUpdateError) {
        console.warn('leader_id update skipped/failed:', covenUpdateError)
      }

      toast.success(lang === 'ru' ? 'Лидерство передано' : 'Leadership transferred')

      setSelectedCoven((prev) => (prev ? { ...prev, leader_id: transferTargetId } : prev))
      setTransferTargetId('')
      await fetchCovenMembers(selectedCoven.id)
      await fetchCovens(true)
    } catch (e) {
      console.error('Error transferring leadership:', e)
      toast.error(lang === 'ru' ? 'Не удалось передать лидерство' : 'Failed to transfer leadership')
    } finally {
      setTransferLoading(false)
    }
  }

  const handleLeaveCoven = async () => {
    if (!selectedCoven) return
    if (!isSelectedMember) return

    if (isSelectedLeader) {
      toast.error(
        lang === 'ru'
          ? 'Лидер не может покинуть ковен, не передав управление'
          : 'Leader cannot leave the coven without transferring ownership'
      )
      return
    }

    setMembershipLoading(true)
    try {
      const { error } = await supabase
        .from('coven_members')
        .delete()
        .eq('coven_id', selectedCoven.id)
        .eq('user_id', user.id)

      if (error) throw error

      toast.success(lang === 'ru' ? 'Вы покинули ковен' : 'You left the coven')

      await fetchCovenMembers(selectedCoven.id)
      await fetchCovens(true)
    } catch (e) {
      console.error('Error leaving coven:', e)
      toast.error(lang === 'ru' ? 'Не удалось покинуть ковен' : 'Failed to leave coven')
    } finally {
      setMembershipLoading(false)
    }
  }

  const handleDeleteCoven = async () => {
    if (!selectedCoven) return

    const confirm = window.confirm(
      lang === 'ru'
        ? 'Удалить ковен? Это действие нельзя отменить.'
        : 'Delete this coven? This action cannot be undone.'
    )

    if (!confirm) return

    setDeleteLoading(true)
    try {
      const { error } = await supabase
        .from('covens')
        .delete()
        .eq('id', selectedCoven.id)

      if (error) throw error

      toast.success(lang === 'ru' ? 'Ковен удалён' : 'Coven deleted')
      setShowDetailsSheet(false)
      setSelectedCoven(null)
      setSelectedMembers([])
      await fetchCovens(true)
    } catch (e) {
      console.error('Error deleting coven:', e)
      toast.error(lang === 'ru' ? 'Ошибка удаления' : 'Delete failed')
    } finally {
      setDeleteLoading(false)
    }
  }

  const memberCountLabel = (count: number) =>
    lang === 'ru' ? `${count} участников` : `${count} members`

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center mb-4">
        <div>
          <h1 className="text-2xl font-cinzel font-bold gradient-text">
            {lang === 'ru' ? 'Ковены' : 'Covens'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {lang === 'ru'
              ? 'Найдите или создайте свое сообщество практикующих.'
              : 'Find or create your community of practitioners.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowPublicOnly((v) => !v)}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              showPublicOnly
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-background border-border text-muted-foreground'
            }`}
          >
            {showPublicOnly
              ? lang === 'ru'
                ? 'Публичные'
                : 'Public Only'
              : lang === 'ru'
                ? 'Все ковены'
                : 'All Covens'}
          </button>

          <button
            onClick={() => fetchCovens(true)}
            className="px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          >
            {refreshing
              ? lang === 'ru'
                ? 'Обновление...'
                : 'Refreshing...'
              : lang === 'ru'
                ? 'Обновить'
                : 'Refresh'}
          </button>

          <button
            onClick={() => setShowCreateSheet(true)}
            className="px-4 py-2 rounded-lg bg-primary/15 border border-primary/30 text-primary font-medium hover:bg-primary/25 transition-all hover:scale-105"
          >
            + {lang === 'ru' ? 'Создать ковен' : 'Create Coven'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 rounded-full border border-primary/30 border-t-primary animate-spin" />
        </div>
      ) : covens.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {covens.map((coven) => {
            const count = coven.coven_members?.length || 0
            const isOwner = coven.created_by === user.id

            return (
              <button
                key={coven.id}
                type="button"
                onClick={() => handleOpenCoven(coven)}
                className="text-left border border-border/40 rounded-lg p-4 bg-white/[0.03] hover:bg-primary/5 hover:border-primary/30 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-bold font-cinzel text-primary line-clamp-1">
                    {coven.name}
                  </h2>
                  {isOwner && (
                    <span className="text-[10px] uppercase font-bold text-primary/80 border border-primary/30 rounded-full px-2 py-0.5">
                      {lang === 'ru' ? 'Ваш' : 'Yours'}
                    </span>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mt-1 min-h-[40px] overflow-hidden line-clamp-2">
                  {coven.description || (lang === 'ru' ? 'Без описания' : 'No description')}
                </p>

                <div className="text-xs text-muted-foreground mt-3 flex items-center justify-between">
                  <span>{memberCountLabel(count)}</span>
                  <span
                    className={`uppercase text-[10px] font-bold ${
                      coven.is_public ? 'text-green-400' : 'text-amber-400'
                    }`}
                  >
                    {coven.is_public
                      ? lang === 'ru'
                        ? 'Публичный'
                        : 'Public'
                      : lang === 'ru'
                        ? 'Частный'
                        : 'Private'}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="text-center text-muted-foreground p-10 border border-dashed border-border/40 rounded-xl">
          {lang === 'ru' ? 'Ковены не найдены.' : 'No covens found.'}
        </div>
      )}

      <Sheet open={showCreateSheet} onOpenChange={setShowCreateSheet}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{lang === 'ru' ? 'Создать новый ковен' : 'Create a New Coven'}</SheetTitle>
            <SheetDescription>
              {lang === 'ru'
                ? 'Создайте свое собственное пространство для практик и общения.'
                : 'Create your own space for practice and communication.'}
            </SheetDescription>
          </SheetHeader>

          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm font-medium">
                {lang === 'ru' ? 'Название ковена' : 'Coven Name'}
              </label>
              <input
                type="text"
                value={newCovenName}
                onChange={(e) => setNewCovenName(e.target.value)}
                className="w-full mt-1 p-2 rounded-md bg-white/5 border border-border/40 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                {lang === 'ru' ? 'Описание' : 'Description'}
              </label>
              <textarea
                value={newCovenDescription}
                onChange={(e) => setNewCovenDescription(e.target.value)}
                className="w-full mt-1 p-2 rounded-md bg-white/5 border border-border/40 h-24 focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                {lang === 'ru' ? 'Публичный ковен' : 'Public Coven'}
              </label>
              <input
                type="checkbox"
                checked={newCovenIsPublic}
                onChange={(e) => setNewCovenIsPublic(e.target.checked)}
                className="h-4 w-4 rounded text-primary focus:ring-primary"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              {lang === 'ru'
                ? 'Публичные ковены видны всем и открыты для вступления. В частные ковены можно вступить только по приглашению.'
                : 'Public covens are visible to everyone and open to join. Private covens are invite-only.'}
            </p>
          </div>

          <SheetFooter>
            <SheetClose asChild>
              <button className="px-4 py-2 rounded-lg bg-secondary text-muted-foreground">
                {lang === 'ru' ? 'Отмена' : 'Cancel'}
              </button>
            </SheetClose>

            <button
              onClick={handleCreateCoven}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground"
            >
              {lang === 'ru' ? 'Создать' : 'Create'}
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet
        open={showDetailsSheet}
        onOpenChange={(open) => {
          setShowDetailsSheet(open)
          if (!open) {
            setSelectedCoven(null)
            setSelectedMembers([])
          }
        }}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {selectedCoven?.name || (lang === 'ru' ? 'Ковен' : 'Coven')}
            </SheetTitle>
            <SheetDescription>
              {lang === 'ru'
                ? 'Информация о ковене и его участниках.'
                : 'Coven information and members.'}
            </SheetDescription>
          </SheetHeader>

          {selectedCoven && (
            <div className="py-4 space-y-5">
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {lang === 'ru' ? 'Описание' : 'Description'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedCoven.description || (lang === 'ru' ? 'Без описания' : 'No description')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border/40 bg-white/[0.03] p-3">
                  <p className="text-[11px] text-muted-foreground uppercase mb-1">
                    {lang === 'ru' ? 'Тип' : 'Type'}
                  </p>
                  <p className={selectedCoven.is_public ? 'text-green-400 text-sm font-medium' : 'text-amber-400 text-sm font-medium'}>
                    {selectedCoven.is_public
                      ? lang === 'ru'
                        ? 'Публичный'
                        : 'Public'
                      : lang === 'ru'
                        ? 'Частный'
                        : 'Private'}
                  </p>
                </div>

                <div className="rounded-lg border border-border/40 bg-white/[0.03] p-3">
                  <p className="text-[11px] text-muted-foreground uppercase mb-1">
                    {lang === 'ru' ? 'Участники' : 'Members'}
                  </p>
                  <p className="text-sm font-medium">{selectedMembers.length}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {lang === 'ru' ? 'Состав ковена' : 'Coven Members'}
                </p>

                {detailsLoading ? (
                  <div className="flex items-center justify-center h-24">
                    <div className="w-6 h-6 rounded-full border border-primary/30 border-t-primary animate-spin" />
                  </div>
                ) : selectedMembers.length ? (
                  <div className="space-y-2">
                    {selectedMembers.map((member, index) => (
                      <div
                        key={`${member.user_id}-${index}`}
                        className="flex items-center justify-between rounded-lg border border-border/40 bg-white/[0.03] px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-foreground truncate">
                            {member.user_id === user.id
                              ? lang === 'ru'
                                ? 'Вы'
                                : 'You'
                              : member.user_name || member.email || member.user_id}
                          </p>
                          {(member.user_name || member.email) && member.user_id !== user.id && (
                            <p className="text-[11px] text-muted-foreground truncate">
                              {member.email || member.user_id}
                            </p>
                          )}
                        </div>
                        <span className="text-[11px] uppercase text-primary font-medium">
                          {member.role === 'leader'
                            ? lang === 'ru'
                              ? 'Лидер'
                              : 'Leader'
                            : lang === 'ru'
                              ? 'Участник'
                              : 'Member'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {lang === 'ru' ? 'Участники не найдены.' : 'No members found.'}
                  </p>
                )}
              </div>

              <div className="pt-2">
                {isSelectedMember ? (
                  isSelectedLeader ? (
                    <div className="space-y-3">
                      <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">
                        {lang === 'ru'
                          ? 'Вы лидер этого ковена.'
                          : 'You are the leader of this coven.'}
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground">
                          {lang === 'ru' ? 'Передать лидерство' : 'Transfer leadership'}
                        </label>
                        <select
                          value={transferTargetId}
                          onChange={(e) => setTransferTargetId(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-border/40 text-sm"
                        >
                          <option value="">
                            {lang === 'ru' ? 'Выберите участника' : 'Select a member'}
                          </option>
                          {selectedMembers
                            .filter((member) => member.user_id !== user.id)
                            .map((member) => (
                              <option key={member.user_id} value={member.user_id}>
                                {member.user_name || member.email || member.user_id}
                              </option>
                            ))}
                        </select>

                        <button
                          onClick={handleTransferLeadership}
                          disabled={transferLoading || !transferTargetId}
                          className="w-full px-4 py-2 rounded-lg border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                        >
                          {transferLoading
                            ? lang === 'ru'
                              ? 'Передача...'
                              : 'Transferring...'
                            : lang === 'ru'
                              ? 'Передать лидерство'
                              : 'Transfer Leadership'}
                        </button>
                      </div>

                      {canDeleteSelectedCoven && (
                        <button
                          onClick={handleDeleteCoven}
                          disabled={deleteLoading}
                          className="w-full px-4 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-colors disabled:opacity-60"
                        >
                          {deleteLoading
                            ? lang === 'ru'
                              ? 'Удаление...'
                              : 'Deleting...'
                            : lang === 'ru'
                              ? 'Удалить ковен'
                              : 'Delete Coven'}
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={handleLeaveCoven}
                      disabled={membershipLoading}
                      className="w-full px-4 py-2 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-colors disabled:opacity-60"
                    >
                      {membershipLoading
                        ? lang === 'ru'
                          ? 'Обработка...'
                          : 'Processing...'
                        : lang === 'ru'
                          ? 'Покинуть ковен'
                          : 'Leave Coven'}
                    </button>
                  )
                ) : (
                  <button
                    onClick={handleJoinCoven}
                    disabled={membershipLoading || !selectedCoven.is_public}
                    className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {!selectedCoven.is_public
                      ? lang === 'ru'
                        ? 'Частный ковен'
                        : 'Private Coven'
                      : membershipLoading
                        ? lang === 'ru'
                          ? 'Обработка...'
                          : 'Processing...'
                        : lang === 'ru'
                          ? 'Вступить'
                          : 'Join Coven'}
                  </button>
                )}
              </div>
            </div>
          )}

          <SheetFooter>
            <SheetClose asChild>
              <button className="px-4 py-2 rounded-lg bg-secondary text-muted-foreground">
                {lang === 'ru' ? 'Закрыть' : 'Close'}
              </button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
