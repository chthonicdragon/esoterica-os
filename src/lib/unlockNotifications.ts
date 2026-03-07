import { ALTAR_BASES, CATALOG, CATEGORY_LABELS } from '../altar/catalog'
import { loadLocalState } from '../altar/altarStore'

export type UnlockNotificationType = 'feature' | 'item' | 'base'

export interface UnlockNotification {
  id: string
  key: string
  type: UnlockNotificationType
  title: string
  titleRu: string
  preview: string
  previewRu: string
  createdAt: string
  read: boolean
}

interface UnlockNotificationState {
  initialized: boolean
  seenFeatures: string[]
  seenItems: string[]
  seenBases: string[]
  seenAnnouncements: string[]
  notifications: UnlockNotification[]
}

const STORAGE_PREFIX = 'esoterica_unlock_notifications_v1_'
const UPDATE_EVENT = 'esoterica-notifications-updated'

function getStorageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`
}

function defaultState(): UnlockNotificationState {
  return {
    initialized: false,
    seenFeatures: [],
    seenItems: [],
    seenBases: [],
    seenAnnouncements: [],
    notifications: [],
  }
}

function readState(userId: string): UnlockNotificationState {
  try {
    const raw = localStorage.getItem(getStorageKey(userId))
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as Partial<UnlockNotificationState>
    return {
      initialized: Boolean(parsed.initialized),
      seenFeatures: Array.isArray(parsed.seenFeatures) ? parsed.seenFeatures : [],
      seenItems: Array.isArray(parsed.seenItems) ? parsed.seenItems : [],
      seenBases: Array.isArray(parsed.seenBases) ? parsed.seenBases : [],
      seenAnnouncements: Array.isArray(parsed.seenAnnouncements) ? parsed.seenAnnouncements : [],
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
    }
  } catch {
    return defaultState()
  }
}

function writeState(userId: string, state: UnlockNotificationState) {
  localStorage.setItem(getStorageKey(userId), JSON.stringify(state))
  window.dispatchEvent(new Event(UPDATE_EVENT))
}

function createNotification(
  key: string,
  type: UnlockNotificationType,
  title: string,
  titleRu: string,
  preview: string,
  previewRu: string,
): UnlockNotification {
  return {
    id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    key,
    type,
    title,
    titleRu,
    preview,
    previewRu,
    createdAt: new Date().toISOString(),
    read: false,
  }
}

function pushUniqueNotification(state: UnlockNotificationState, notification: UnlockNotification): boolean {
  if (state.notifications.some(n => n.key === notification.key)) return false
  state.notifications.unshift(notification)
  return true
}

export function getUnlockNotifications(userId: string): UnlockNotification[] {
  return readState(userId).notifications
}

export function getUnlockUnreadCount(userId: string): number {
  return readState(userId).notifications.filter(n => !n.read).length
}

export function markAllUnlockNotificationsRead(userId: string): void {
  const state = readState(userId)
  let changed = false
  state.notifications = state.notifications.map(n => {
    if (n.read) return n
    changed = true
    return { ...n, read: true }
  })
  if (changed) writeState(userId, state)
}

export function clearUnlockNotifications(userId: string): void {
  const state = readState(userId)
  if (state.notifications.length === 0) return
  state.notifications = []
  writeState(userId, state)
}

export function registerFeatureOpened(
  userId: string,
  featureKey: string,
  title: string,
  titleRu: string,
): void {
  const state = readState(userId)
  if (state.seenFeatures.includes(featureKey)) return

  state.seenFeatures.push(featureKey)
  pushUniqueNotification(
    state,
    createNotification(
      `feature:${featureKey}`,
      'feature',
      title,
      titleRu,
      'New feature opened in your profile.',
      'Новая функция открыта в вашем профиле.',
    ),
  )

  writeState(userId, state)
}

export function registerGlobalAnnouncement(
  userId: string,
  announcementId: string,
  title: string,
  titleRu: string,
  preview: string,
  previewRu: string,
): void {
  const state = readState(userId)
  if (state.seenAnnouncements.includes(announcementId)) return

  state.seenAnnouncements.push(announcementId)
  pushUniqueNotification(
    state,
    createNotification(
      `announcement:${announcementId}`,
      'feature',
      title,
      titleRu,
      preview,
      previewRu,
    ),
  )

  writeState(userId, state)
}

export function syncAltarUnlockNotifications(userId: string): void {
  const state = readState(userId)
  const local = loadLocalState()
  const level = local.progression.level

  const unlockedItems = CATALOG.filter(item => item.unlockLevel <= level)
  const unlockedBases = ALTAR_BASES.filter(base => base.unlockLevel <= level)

  if (!state.initialized) {
    state.initialized = true
    state.seenItems = unlockedItems.map(item => item.id)
    state.seenBases = unlockedBases.map(base => base.id)
    writeState(userId, state)
    return
  }

  let changed = false

  unlockedItems.forEach(item => {
    if (state.seenItems.includes(item.id)) return
    state.seenItems.push(item.id)
    const category = CATEGORY_LABELS[item.category]
    const categoryEn = category?.en || 'Objects'
    const categoryRu = category?.ru || 'Объекты'
    const added = pushUniqueNotification(
      state,
      createNotification(
        `item:${item.id}`,
        'item',
        item.label,
        item.labelRu,
        `Unlocked in ${categoryEn}.`,
        `Открыто в разделе ${categoryRu}.`,
      ),
    )
    if (added) changed = true
  })

  unlockedBases.forEach(base => {
    if (state.seenBases.includes(base.id)) return
    state.seenBases.push(base.id)
    const added = pushUniqueNotification(
      state,
      createNotification(
        `base:${base.id}`,
        'base',
        base.label,
        base.labelRu,
        `New altar base unlocked (Lv ${base.unlockLevel}).`,
        `Новая база алтаря открыта (ур. ${base.unlockLevel}).`,
      ),
    )
    if (added) changed = true
  })

  if (changed) {
    writeState(userId, state)
  } else {
    // Keep seen arrays persisted even when no new cards were added.
    localStorage.setItem(getStorageKey(userId), JSON.stringify(state))
  }
}

export const unlockNotificationsEvent = UPDATE_EVENT
