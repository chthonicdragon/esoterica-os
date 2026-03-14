import { supabase } from './supabaseClient'

const SIGNED_TTL_SECONDS = 60 * 60
const CACHE_TTL_MS = 50 * 60 * 1000
const cache = new Map<string, { url: string; expiresAt: number }>()

function toBucketPath(modelUrl: string): string | null {
  if (modelUrl.startsWith('/models/')) {
    return decodeURIComponent(modelUrl.replace('/models/', ''))
  }
  const publicMarker = '/storage/v1/object/public/models/'
  const signedMarker = '/storage/v1/object/sign/models/'
  if (modelUrl.includes(publicMarker)) {
    const raw = modelUrl.split(publicMarker)[1] || ''
    return decodeURIComponent(raw.split('?')[0])
  }
  if (modelUrl.includes(signedMarker)) {
    const raw = modelUrl.split(signedMarker)[1] || ''
    return decodeURIComponent(raw.split('?')[0])
  }
  return null
}

export async function resolveModelUrl(modelUrl: string): Promise<string> {
  const path = toBucketPath(modelUrl)
  if (!path) return modelUrl

  const cached = cache.get(path)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url
  }

  const { data, error } = await supabase.storage.from('models').createSignedUrl(path, SIGNED_TTL_SECONDS)
  if (error || !data?.signedUrl) {
    return modelUrl
  }

  cache.set(path, { url: data.signedUrl, expiresAt: Date.now() + CACHE_TTL_MS })
  return data.signedUrl
}
