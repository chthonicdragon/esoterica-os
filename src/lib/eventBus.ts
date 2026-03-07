/**
 * Typed EventBus for cross-feature communication.
 *
 * Instead of features directly importing each other, they publish/subscribe
 * to domain events. This decouples the Knowledge Graph, Ritual Tracker,
 * Journal, Forum, Altar, and AI Mentor features.
 *
 * Usage:
 *   eventBus.emit('ritual:completed', { userId, title, duration, ... })
 *   eventBus.on('ritual:completed', handler)
 */

export interface AppEvents {
  /** A ritual was completed (altar session or manual log) */
  'ritual:completed': {
    userId: string
    title: string
    description: string
    durationMinutes?: number
    mode?: string
    pointsEarned: number
  }
  /** A journal entry was saved */
  'journal:saved': {
    userId: string
    title: string
    content: string
    type: string
    entryId: string
  }
  /** A sigil was created */
  'sigil:created': {
    userId: string
    intention: string
    charged: boolean
  }
  /** Knowledge Graph was updated (new nodes merged) */
  'knowledge:updated': {
    userId: string
    addedNodes: number
    source: string
  }
  /** A forum post was created */
  'forum:post-created': {
    userId: string
    topicId: string
    content: string
  }
  /** XP was granted to the user */
  'progression:xp-granted': {
    source: string
    pointsEarned: number
    totalPoints: number
    level: number
  }
  /** An achievement was unlocked */
  'achievement:unlocked': {
    achievementId: string
    title: string
    titleRu: string
  }
}

type EventName = keyof AppEvents
type Handler<T> = (payload: T) => void

class EventBus {
  private handlers = new Map<string, Set<Handler<any>>>()

  on<E extends EventName>(event: E, handler: Handler<AppEvents[E]>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler)
    return () => this.off(event, handler)
  }

  off<E extends EventName>(event: E, handler: Handler<AppEvents[E]>): void {
    this.handlers.get(event)?.delete(handler)
  }

  emit<E extends EventName>(event: E, payload: AppEvents[E]): void {
    this.handlers.get(event)?.forEach(handler => {
      try {
        handler(payload)
      } catch (err) {
        console.warn(`[EventBus] Error in handler for "${event}":`, err)
      }
    })
  }
}

/** Singleton event bus for the entire app */
export const eventBus = new EventBus()
