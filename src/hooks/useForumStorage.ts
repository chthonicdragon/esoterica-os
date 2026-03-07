import { useState, useEffect } from 'react'

interface ForumStorage {
  categories: any[]
  topics: any[]
  posts: any[]
  notifications: any[]
}

const FORUM_STORAGE_KEY = 'forum_data_local'

export function useForumStorage() {
  const [data, setData] = useState<ForumStorage>({
    categories: [],
    topics: [],
    posts: [],
    notifications: [],
  })

  useEffect(() => {
    loadData()
  }, [])

  function loadData() {
    try {
      const stored = localStorage.getItem(FORUM_STORAGE_KEY)
      if (stored) {
        setData(JSON.parse(stored))
        console.log('✅ Forum data loaded from localStorage')
      } else {
        console.log('📝 No forum data in localStorage, using defaults')
      }
    } catch (e) {
      console.error('❌ Error loading forum data:', e)
    }
  }

  function saveData(newData: ForumStorage) {
    try {
      localStorage.setItem(FORUM_STORAGE_KEY, JSON.stringify(newData))
      setData(newData)
      console.log('💾 Forum data saved to localStorage')
    } catch (e) {
      console.error('❌ Error saving forum data:', e)
    }
  }

  function addCategory(category: any) {
    const newData = {
      ...data,
      categories: [...data.categories, { ...category, id: Date.now().toString() }],
    }
    saveData(newData)
    return newData.categories[newData.categories.length - 1]
  }

  function addTopic(categoryId: string, topic: any) {
    const newData = {
      ...data,
      topics: [...data.topics, { ...topic, id: Date.now().toString(), categoryId }],
      categories: data.categories.map(cat =>
        cat.id === categoryId ? { ...cat, topicCount: (cat.topicCount || 0) + 1 } : cat
      ),
    }
    saveData(newData)
    return newData.topics[newData.topics.length - 1]
  }

  function addPost(topicId: string, post: any) {
    const topic = data.topics.find(t => t.id === topicId)
    const newData = {
      ...data,
      posts: [...data.posts, { ...post, id: Date.now().toString(), topicId }],
      topics: data.topics.map(t =>
        t.id === topicId ? { ...t, replyCount: (t.replyCount || 0) + 1 } : t
      ),
      categories: data.categories.map(cat =>
        cat.id === topic?.categoryId ? { ...cat, postCount: (cat.postCount || 0) + 1 } : cat
      ),
    }
    saveData(newData)
    return newData.posts[newData.posts.length - 1]
  }

  function getCategories() {
    return data.categories
  }

  function getTopics(categoryId: string) {
    return data.topics.filter(t => t.categoryId === categoryId)
  }

  function getPosts(topicId: string) {
    return data.posts.filter(p => p.topicId === topicId)
  }

  function deleteCategory(categoryId: string) {
    const newData = {
      ...data,
      categories: data.categories.filter(c => c.id !== categoryId),
      topics: data.topics.filter(t => t.categoryId !== categoryId),
    }
    saveData(newData)
  }

  function clearAllData() {
    localStorage.removeItem(FORUM_STORAGE_KEY)
    setData({ categories: [], topics: [], posts: [], notifications: [] })
    console.log('🗑️ All forum data cleared')
  }

  return {
    data,
    addCategory,
    addTopic,
    addPost,
    getCategories,
    getTopics,
    getPosts,
    deleteCategory,
    clearAllData,
  }
}
