import React, { useEffect, useState } from 'react'

type Lang = 'en' | 'ru'

interface Coords {
  lat: number
  lng: number
}

interface WeatherData {
  temperature: number
  humidity: number
  wind: number
  code: number
  condition: string
}

function mapWeatherCode(code: number): string {
  if (code === 0) return 'Clear'
  if ([1, 2, 3].includes(code)) return 'Partly cloudy'
  if ([45, 48].includes(code)) return 'Fog'
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle'
  if ([61, 63, 65, 66, 67].includes(code)) return 'Rain'
  if ([71, 73, 75, 77].includes(code)) return 'Snow'
  if ([80, 81, 82].includes(code)) return 'Rain showers'
  if ([95, 96, 99].includes(code)) return 'Thunderstorm'
  return 'Unknown'
}

function ritualAdvice(data: WeatherData, lang: Lang): string {
  const cond = data.condition.toLowerCase()
  if (cond.includes('clear') || cond.includes('sun')) {
    return lang === 'ru'
      ? '🌞 Сегодня хорошая погода для ритуала на природе'
      : '🌞 Great weather today for an outdoor ritual'
  }
  if (cond.includes('thunder') || cond.includes('storm')) {
    return lang === 'ru'
      ? '🌩 Сегодня лучше избегать ритуалов на улице'
      : '🌩 Better avoid outdoor rituals today'
  }
  if (cond.includes('rain')) {
    return lang === 'ru'
      ? '🌧 Идёт дождь — лучше планировать практику в помещении'
      : '🌧 Rainy — plan your practice indoors'
  }
  if (cond.includes('snow')) {
    return lang === 'ru'
      ? '❄ Холод и снег — выбирайте безопасное место или комнату'
      : '❄ Cold and snow — choose a safe spot or stay indoors'
  }
  if (data.wind >= 10) {
    return lang === 'ru'
      ? '💨 Сильный ветер — будьте осторожны со свечами и дымом'
      : '💨 Strong wind — take care with candles and smoke'
  }
  return lang === 'ru'
    ? '🌤 Погода нейтральная — адаптируйте ритуал под условия'
    : '🌤 Neutral weather — adapt your ritual to conditions'
}

export function WeatherRitualsBanner({ coords, lang }: { coords: Coords; lang: Lang }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<WeatherData | null>(null)

  useEffect(() => {
    let mounted = true
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`
        const res = await fetch(url)
        if (!res.ok) throw new Error('weather_fetch_failed')
        const json = await res.json()
        const code = Number(json?.current?.weather_code ?? NaN)
        const condition = mapWeatherCode(code)
        const pack: WeatherData = {
          temperature: Number(json?.current?.temperature_2m ?? 0),
          humidity: Number(json?.current?.relative_humidity_2m ?? 0),
          wind: Number(json?.current?.wind_speed_10m ?? 0),
          code: isNaN(code) ? -1 : code,
          condition,
        }
        if (mounted) setData(pack)
      } catch (e) {
        if (mounted) setError(lang === 'ru' ? 'Не удалось получить погоду' : 'Failed to load weather')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => {
      mounted = false
    }
  }, [coords.lat, coords.lng, lang])

  if (loading) {
    return (
      <div className="rounded-2xl bg-card border border-border/40 p-4">
        <p className="text-xs text-muted-foreground">{lang === 'ru' ? 'Загрузка погоды…' : 'Loading weather…'}</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl bg-card border border-border/40 p-4">
        <p className="text-xs text-muted-foreground">{error || (lang === 'ru' ? 'Нет данных о погоде' : 'No weather data')}</p>
      </div>
    )
  }

  const msg = ritualAdvice(data, lang)
  const header = lang === 'ru' ? 'Погодные условия для ритуала' : 'Ritual Weather Conditions'
  const condLine = lang === 'ru'
    ? `Погода: ${data.condition}, ${Math.round(data.temperature)}°C • влажность ${Math.round(data.humidity)}% • ветер ${Math.round(data.wind)} м/с`
    : `Weather: ${data.condition}, ${Math.round(data.temperature)}°C • humidity ${Math.round(data.humidity)}% • wind ${Math.round(data.wind)} m/s`

  return (
    <div className="rounded-2xl bg-gradient-to-r from-amber-900/30 to-indigo-900/30 border border-primary/20 p-5">
      <p className="text-xs text-muted-foreground mb-1">{header}</p>
      <p className="text-sm font-semibold text-foreground">{msg}</p>
      <p className="text-[11px] text-muted-foreground mt-1">{condLine}</p>
    </div>
  )
}
