export interface ForumCategory {
  id: string
  nameEn: string
  nameRu: string
  descriptionEn?: string
  descriptionRu?: string
  icon: string
  sortOrder: number
  topicCount: number
  postCount: number
  createdAt: string
}

export interface ForumTopic {
  id: string
  categoryId: string
  userId: string
  title: string
  isPinned: number
  isLocked: number
  viewCount: number
  replyCount: number
  lastPostAt?: string
  lastPostUserId?: string
  createdAt: string
  updatedAt: string
  // Joined
  authorName?: string
  lastPosterName?: string
}

export interface ForumPost {
  id: string
  topicId: string
  userId: string
  parentId?: string
  content: string
  imageUrl?: string
  likeCount: number
  isDeleted: number
  isEdited: number
  editedAt?: string
  createdAt: string
  // Joined
  authorName?: string
  authorLevel?: number
  authorArchetype?: string
  isLikedByMe?: boolean
}

export interface ForumLike {
  id: string
  postId: string
  userId: string
  createdAt: string
}

export interface ForumReport {
  id: string
  postId: string
  userId: string
  reason: string
  status: string
  createdAt: string
}

export interface ForumNotification {
  id: string
  userId: string
  type: 'reply' | 'like' | 'mention'
  postId?: string
  topicId?: string
  fromUserId?: string
  isRead: number
  createdAt: string
  // Joined
  fromUserName?: string
  topicTitle?: string
}

export type ForumView = 'categories' | 'category' | 'topic' | 'new-topic' | 'search'
