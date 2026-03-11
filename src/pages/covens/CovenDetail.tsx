import React, { useEffect, useState, useCallback } from 'react'
import { covensService } from '../../services/covensService'
import type { Coven, CovenMember, CovenJoinRequest } from '../../types/covens'
import { useLang } from '../../contexts/LanguageContext'
import {
  Globe, Lock, Users, Clock, Crown, UserMinus, CheckCircle, XCircle,
  Loader2, AlertCircle, Edit2, Trash2, Send, UserPlus, X
} from 'lucide-react'

interface CovenDetailProps {
  user: { id: string; email?: string; displayName?: string }
  covenId: string
  onBack: () => void
  onDeleted: () => void
}

type Tab = 'info' | 'members' | 'requests'

export function CovenDetail({ user, covenId, onBack, onDeleted }: CovenDetailProps) {
  const { lang } = useLang()
  const [coven, setCoven] = useState<Coven | null>(null)
  const [members, setMembers] = useState<CovenMember[]>([])
  const [requests, setRequests] = useState<CovenJoinRequest[]>([])
  const [myRequest, setMyRequest] = useState<CovenJoinRequest | null>(null)
  const [isMember, setIsMember] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('info')
  const [joinMessage, setJoinMessage] = useState('')
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editPublic, setEditPublic] = useState(true)

  const displayName = user.displayName || user.email?.split('@')[0] || 'Unknown'
  const isLeader = coven?.leader_id === user.id

  const refresh = useCallback(async () => {
    try {
      const [c, m, mr, req] = await Promise.all([
        covensService.getCoven(covenId),
        covensService.getMembers(covenId),
        covensService.getUserJoinRequest(covenId, user.id),
        isLeader ? covensService.getJoinRequests(covenId, 'pending') : Promise.resolve([]),
      ])
      setCoven(c)
      setMembers(m)
      setMyRequest(mr)
      if (isLeader) setRequests(req)
      setIsMember(m.some((mem) => mem.user_id === user.id))
    } catch (e: any) {
      setError(e.message ?? 'Failed to load coven')
    }
  }, [covenId, user.id, isLeader])

  useEffect(() => {
    setLoading(true)
    setError(null)
    covensService.getCoven(covenId).then(async (c) => {
      setCoven(c)
      if (!c) return
      const isLdr = c.leader_id === user.id
      const [m, mr, req] = await Promise.all([
        covensService.getMembers(covenId),
        covensService.getUserJoinRequest(covenId, user.id),
        isLdr ? covensService.getJoinRequests(covenId, 'pending') : Promise.resolve([]),
      ])
      setMembers(m)
      setMyRequest(mr)
      if (isLdr) setRequests(req)
      setIsMember(m.some((mem) => mem.user_id === user.id))
    }).catch((e) => setError(e.message ?? 'Error')).finally(() => setLoading(false))
  }, [covenId, user.id])

  const handleJoin = async () => {
    setActionLoading('join')
    try {
      const req = await covensService.submitJoinRequest({
        coven_id: covenId,
        user_id: user.id,
        display_name: displayName,
        message: joinMessage.trim() || undefined,
      })
      setMyRequest(req)
      setShowJoinForm(false)
      setJoinMessage('')
    } catch (e: any) {
      setError(e.message ?? 'Failed to send request')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelRequest = async () => {
    if (!myRequest) return
    setActionLoading('cancel')
    try {
      await covensService.cancelJoinRequest(myRequest.id)
      setMyRequest(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleApprove = async (req: CovenJoinRequest) => {
    setActionLoading(req.id)
    try {
      await covensService.approveRequest(req)
      setRequests((prev) => prev.filter((r) => r.id !== req.id))
      await covensService.getMembers(covenId).then(setMembers)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (reqId: string) => {
    setActionLoading(reqId)
    try {
      await covensService.rejectRequest(reqId)
      setRequests((prev) => prev.filter((r) => r.id !== reqId))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    setActionLoading(memberId)
    try {
      await covensService.removeMember(memberId)
      setMembers((prev) => prev.filter((m) => m.id !== memberId))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleSaveEdit = async () => {
    if (!coven) return
    setActionLoading('edit')
    try {
      await covensService.updateCoven(coven.id, {
        name: editName.trim(),
        description: editDesc.trim(),
        is_public: editPublic,
      })
      setCoven({ ...coven, name: editName.trim(), description: editDesc.trim(), is_public: editPublic })
      setEditMode(false)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async () => {
    if (!coven) return
    const confirm = window.confirm(
      lang === 'ru'
        ? `Удалить ковен "${coven.name}"? Это действие необратимо.`
        : `Delete coven "${coven.name}"? This cannot be undone.`
    )
    if (!confirm) return
    setActionLoading('delete')
    try {
      await covensService.deleteCoven(coven.id)
      onDeleted()
    } catch (e: any) {
      setError(e.message)
      setActionLoading(null)
    }
  }

  const startEdit = () => {
    if (!coven) return
    setEditName(coven.name)
    setEditDesc(coven.description ?? '')
    setEditPublic(coven.is_public)
    setEditMode(true)
  }

  const inputCls = 'w-full px-3 py-2 rounded-lg bg-white/5 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors'
  const TABS: { key: Tab; en: string; ru: string }[] = [
    { key: 'info', en: 'Info', ru: 'Инфо' },
    { key: 'members', en: `Members (${members.length})`, ru: `Участники (${members.length})` },
    ...(isLeader ? [{ key: 'requests' as Tab, en: `Requests (${requests.length})`, ru: `Заявки (${requests.length})` }] : []),
  ]

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">{lang === 'ru' ? 'Загрузка...' : 'Loading...'}</span>
      </div>
    )
  }

  if (!coven) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        {lang === 'ru' ? 'Ковен не найден' : 'Coven not found'}
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {error && (
        <div className="mx-5 mt-3 flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <div className="flex gap-2 px-5 pt-4 pb-0 border-b border-border/40 flex-shrink-0">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {lang === 'ru' ? t.ru : t.en}
          </button>
        ))}
        {isLeader && (
          <div className="ml-auto flex items-center gap-1.5 pb-2">
            <button
              onClick={startEdit}
              className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
              title={lang === 'ru' ? 'Редактировать' : 'Edit'}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDelete}
              disabled={actionLoading === 'delete'}
              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title={lang === 'ru' ? 'Удалить ковен' : 'Delete coven'}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {tab === 'info' && (
          <div className="max-w-lg space-y-4">
            {editMode ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wide">{lang === 'ru' ? 'Название' : 'Name'}</label>
                  <input className={inputCls} value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={80} />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wide">{lang === 'ru' ? 'Описание' : 'Description'}</label>
                  <textarea className={`${inputCls} resize-none h-28`} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} maxLength={500} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[true, false].map((pub) => (
                    <button
                      key={String(pub)}
                      type="button"
                      onClick={() => setEditPublic(pub)}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-sm transition-all ${
                        editPublic === pub
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border/40 bg-white/5 text-muted-foreground hover:border-primary/30'
                      }`}
                    >
                      {pub ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      <span className="text-xs">{pub ? (lang === 'ru' ? 'Публичный' : 'Public') : (lang === 'ru' ? 'Скрытый' : 'Private')}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditMode(false)}
                    className="flex-1 py-2 rounded-xl border border-border/50 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {lang === 'ru' ? 'Отмена' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={actionLoading === 'edit' || !editName.trim()}
                    className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
                  >
                    {actionLoading === 'edit' && <Loader2 className="w-4 h-4 animate-spin" />}
                    {lang === 'ru' ? 'Сохранить' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-border/40">
                  <div className="flex items-center gap-2 mb-2">
                    {coven.is_public
                      ? <Globe className="w-4 h-4 text-primary/70" />
                      : <Lock className="w-4 h-4 text-muted-foreground/70" />}
                    <h2 className="text-lg font-bold font-cinzel text-foreground">{coven.name}</h2>
                  </div>
                  {coven.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{coven.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-border/40">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Crown className="w-3.5 h-3.5 text-primary/70" />
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">{lang === 'ru' ? 'Лидер' : 'Leader'}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{coven.leader_name}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-border/40">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Clock className="w-3.5 h-3.5 text-primary/70" />
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">{lang === 'ru' ? 'Создан' : 'Created'}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(coven.created_at).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US')}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-border/40">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Users className="w-3.5 h-3.5 text-primary/70" />
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">{lang === 'ru' ? 'Участники' : 'Members'}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{members.length}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-border/40">
                    <div className="flex items-center gap-1.5 mb-1">
                      {coven.is_public ? <Globe className="w-3.5 h-3.5 text-primary/70" /> : <Lock className="w-3.5 h-3.5 text-muted-foreground/70" />}
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">{lang === 'ru' ? 'Доступ' : 'Access'}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {coven.is_public ? (lang === 'ru' ? 'Публичный' : 'Public') : (lang === 'ru' ? 'Скрытый' : 'Private')}
                    </p>
                  </div>
                </div>

                {!isLeader && !isMember && (
                  <div className="pt-2">
                    {myRequest?.status === 'pending' ? (
                      <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
                        <div>
                          <p className="text-sm text-primary font-medium">{lang === 'ru' ? 'Заявка отправлена' : 'Request sent'}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{lang === 'ru' ? 'Ожидает одобрения лидера' : 'Awaiting leader approval'}</p>
                        </div>
                        <button
                          onClick={handleCancelRequest}
                          disabled={actionLoading === 'cancel'}
                          className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                        >
                          {actionLoading === 'cancel' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                          {lang === 'ru' ? 'Отозвать' : 'Withdraw'}
                        </button>
                      </div>
                    ) : myRequest?.status === 'rejected' ? (
                      <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                        {lang === 'ru' ? 'Заявка отклонена' : 'Request was rejected'}
                      </div>
                    ) : showJoinForm ? (
                      <div className="space-y-3 p-4 rounded-xl bg-white/[0.03] border border-border/40">
                        <p className="text-sm font-medium text-foreground">{lang === 'ru' ? 'Вступить в ковен' : 'Join this coven'}</p>
                        <textarea
                          className={`${inputCls} resize-none h-20`}
                          placeholder={lang === 'ru' ? 'Сообщение лидеру (необязательно)...' : 'Message to the leader (optional)...'}
                          value={joinMessage}
                          onChange={(e) => setJoinMessage(e.target.value)}
                          maxLength={300}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowJoinForm(false)}
                            className="flex-1 py-2 rounded-lg border border-border/50 text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {lang === 'ru' ? 'Отмена' : 'Cancel'}
                          </button>
                          <button
                            onClick={handleJoin}
                            disabled={actionLoading === 'join'}
                            className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
                          >
                            {actionLoading === 'join' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            {lang === 'ru' ? 'Отправить' : 'Send'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowJoinForm(true)}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 text-sm font-medium transition-colors"
                      >
                        <UserPlus className="w-4 h-4" />
                        {lang === 'ru' ? 'Подать заявку на вступление' : 'Apply to join'}
                      </button>
                    )}
                  </div>
                )}

                {isMember && !isLeader && (
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-sm text-primary flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {lang === 'ru' ? 'Вы участник этого ковена' : 'You are a member of this coven'}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === 'members' && (
          <div className="max-w-lg space-y-2">
            {members.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                {lang === 'ru' ? 'Участников пока нет' : 'No members yet'}
              </div>
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-border/40"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                    {member.display_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{member.display_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {member.role === 'leader'
                        ? (lang === 'ru' ? 'Лидер' : 'Leader')
                        : (lang === 'ru' ? 'Участник' : 'Member')}
                      {' · '}
                      {new Date(member.joined_at).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US')}
                    </p>
                  </div>
                  {member.role === 'leader' && <Crown className="w-4 h-4 text-primary/70 flex-shrink-0" />}
                  {isLeader && member.role !== 'leader' && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={actionLoading === member.id}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title={lang === 'ru' ? 'Исключить' : 'Remove'}
                    >
                      {actionLoading === member.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <UserMinus className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'requests' && isLeader && (
          <div className="max-w-lg space-y-3">
            {requests.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                {lang === 'ru' ? 'Заявок пока нет' : 'No pending requests'}
              </div>
            ) : (
              requests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-xl bg-white/[0.03] border border-border/40"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{req.display_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(req.requested_at).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(req)}
                        disabled={actionLoading === req.id}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 text-xs font-medium transition-colors"
                      >
                        {actionLoading === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        {lang === 'ru' ? 'Принять' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        disabled={actionLoading === req.id}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive/20 text-xs font-medium transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        {lang === 'ru' ? 'Отклонить' : 'Reject'}
                      </button>
                    </div>
                  </div>
                  {req.message && (
                    <p className="text-xs text-muted-foreground bg-white/5 rounded-lg p-2.5 italic">
                      "{req.message}"
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
