export type ImageGenerationStyle = 'dark_ritual' | 'surreal_dream' | 'divine_portrait'

const DEFAULT_MODEL_ID = 'stabilityai/stable-diffusion-2'
const CACHE_PREFIX = 'esoterica_img_gen_'

const STYLE_PROMPTS: Record<ImageGenerationStyle, string> = {
  dark_ritual: "Epic mystical portrait, candles, dark ritual atmosphere, sacred symbols, fantasy style, cinematic lighting, soft shadows, 8k resolution",
  surreal_dream: "Dream scene, surreal lighting, ethereal atmosphere, cinematic composition, mystical, floating elements, soft colors, masterpiece",
  divine_portrait: "Divine spiritual portrait, glowing aura, ethereal light, majesty, sacred geometry, cinematic, hyperrealistic, detailed"
}

export const ImageGenerationService = {
  async generateImage(text: string, style: ImageGenerationStyle): Promise<string | null> {
    const cacheKey = `${CACHE_PREFIX}${style}_${text.slice(0, 50)}_${text.length}`
    
    // 1. Check Local Cache
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      return cached
    }

    try {
      // 2. Prepare Prompt
      const basePrompt = STYLE_PROMPTS[style]
      const fullPrompt = `${basePrompt}, ${text}`

      // 3. Call Hugging Face API
      const apiKey = (import.meta as any).env.VITE_HF_API_KEY
      
      if (!apiKey) {
        console.warn('Hugging Face API key not found (VITE_HF_API_KEY). Image generation skipped.')
        return null
      }

      const modelId = ((import.meta as any).env.VITE_HF_IMAGE_MODEL as string | undefined)?.trim() || DEFAULT_MODEL_ID
      const endpoints = [
        `https://router.huggingface.co/hf-inference/models/${modelId}`,
        `https://api-inference.huggingface.co/models/${modelId}`,
      ]
      let response: Response | null = null
      let lastError: unknown = null

      for (const url of endpoints) {
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ inputs: fullPrompt }),
          })

          if (res.ok) {
            response = res
            break
          }

          if (res.status === 404) {
            lastError = new Error(`HF API Error: ${res.status} ${res.statusText}`)
            continue
          }

          let errText = ''
          try {
            const ct = res.headers.get('content-type') || ''
            if (ct.includes('application/json')) {
              const data = await res.json().catch(() => null)
              errText = data?.error || JSON.stringify(data)
            } else {
              errText = await res.text()
            }
          } catch {}
          lastError = new Error(`HF API Error: ${res.status} ${res.statusText}${errText ? ` — ${errText}` : ''}`)
          continue
        } catch (e) {
          lastError = e
          continue
        }
      }

      if (!response) {
        throw lastError || new Error('HF API Error: request failed')
      }

      const blob = await response.blob()
      
      // Convert blob to base64 for storage/display
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })

      // 4. Cache Result
      try {
        localStorage.setItem(cacheKey, base64)
      } catch (e) {
        console.warn('Failed to cache generated image (quota exceeded?)', e)
      }

      return base64
    } catch (error) {
      console.error('Image generation failed:', error)
      return null
    }
  }
}
