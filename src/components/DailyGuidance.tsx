import React, { useState, useEffect } from 'react'
import { useLang } from '../contexts/LanguageContext'
import { AstrologyService, NumerologyService, TranslationService, type Horoscope } from '../services/magicalDataService'
import { Sparkles, Star, Calendar, RefreshCw, Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const ZODIAC_SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
]

const ZODIAC_SIGNS_EASTERN = [
  'rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake',
  'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig'
]

export function DailyGuidance() {
  const { t, lang } = useLang()
  const [sign, setSign] = useState('')
  const [easternSign, setEasternSign] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [horoscope, setHoroscope] = useState<Horoscope | null>(null)
  const [numerology, setNumerology] = useState<{ lifePath: number, personalYear: number, energy: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Load profile
  useEffect(() => {
    const savedSign = localStorage.getItem('esoterica_user_sign')
    const savedEastern = localStorage.getItem('esoterica_eastern_zodiac_' + (localStorage.getItem('supabase.auth.token') ? JSON.parse(localStorage.getItem('supabase.auth.token')!).currentSession?.user?.id : ''))
    // Fallback: try to find any eastern zodiac key
    const anyEasternKey = Object.keys(localStorage).find(k => k.startsWith('esoterica_eastern_zodiac_'))
    
    const savedDate = localStorage.getItem('esoterica_user_birthdate')
    if (savedSign) setSign(savedSign)
    if (savedDate) setBirthDate(savedDate)
    
    const easternVal = savedEastern || (anyEasternKey ? localStorage.getItem(anyEasternKey) : '')
    if (easternVal) setEasternSign(easternVal)
    
    if (savedSign && savedDate) {
      fetchData(savedSign, savedDate)
    } else {
      setIsEditing(true)
    }
  }, [])

  const fetchData = async (s: string, d: string) => {
    setLoading(true)
    try {
      // 1. Numerology
      const lifePath = NumerologyService.calculateLifePath(d)
      const personalYear = NumerologyService.calculatePersonalYear(d)
      const energy = NumerologyService.getDailyEnergy(lifePath)
      setNumerology({ lifePath, personalYear, energy })

      // 2. Astrology
      const astro = await AstrologyService.getDailyHoroscope(s)
      setHoroscope(astro)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    if (sign && birthDate) {
      localStorage.setItem('esoterica_user_sign', sign)
      localStorage.setItem('esoterica_user_birthdate', birthDate)
      
      // Save eastern zodiac
      const userId = localStorage.getItem('supabase.auth.token') ? JSON.parse(localStorage.getItem('supabase.auth.token')!).currentSession?.user?.id : 'guest'
      if (userId && easternSign) {
        localStorage.setItem(`esoterica_eastern_zodiac_${userId}`, easternSign)
      }
      
      setIsEditing(false)
      fetchData(sign, birthDate)
    }
  }

  if (loading && !horoscope) {
    return <div className="p-4 text-center text-xs text-muted-foreground animate-pulse">{lang === 'ru' ? 'Загрузка космических данных...' : 'Loading cosmic data...'}</div>
  }

  if (isEditing) {
    return (
      <div className="rounded-2xl bg-card border border-primary/20 p-5 space-y-4 animate-fade-in">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">{lang === 'ru' ? 'Настройка профиля' : 'Profile Setup'}</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase">{lang === 'ru' ? 'Знак Зодиака' : 'Zodiac Sign'}</label>
            <select 
              value={sign} 
              onChange={e => setSign(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/50"
            >
              <option value="">Select...</option>
              {ZODIAC_SIGNS.map(z => (
                <option key={z} value={z}>{TranslationService.translate(z, lang)}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase">{lang === 'ru' ? 'Дата Рождения' : 'Birth Date'}</label>
            <input 
              type="date" 
              value={birthDate}
              onChange={e => setBirthDate(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/50"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-[10px] text-muted-foreground uppercase">{lang === 'ru' ? 'Восточный Знак' : 'Eastern Zodiac'}</label>
            <select 
              value={easternSign} 
              onChange={e => setEasternSign(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/50"
            >
              <option value="">{lang === 'ru' ? 'Не выбрано' : 'Not selected'}</option>
              {ZODIAC_SIGNS_EASTERN.map(z => (
                <option key={z} value={z}>{z.charAt(0).toUpperCase() + z.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={!sign || !birthDate}
          className="w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
        >
          {lang === 'ru' ? 'Сохранить и получить прогноз' : 'Save & Get Forecast'}
        </button>
      </div>
    )
  }

  return (
    <div className="relative rounded-2xl bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-white/10 p-5 overflow-hidden group">
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setIsEditing(true)} className="p-1.5 hover:bg-white/10 rounded-lg text-muted-foreground">
          <Settings className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Astrology Column */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-indigo-300">
            <Star className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-widest">{lang === 'ru' ? 'Астрология' : 'Astrology'}</h4>
          </div>
          
          {horoscope ? (
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-lg font-serif text-indigo-100 capitalize">
                  {TranslationService.translate(sign, lang)}
                  {easternSign && <span className="text-sm text-indigo-300 ml-2">({easternSign})</span>}
                </span>
                <span className="text-[10px] text-indigo-400">{horoscope.date_range}</span>
              </div>
              
              <p className="text-xs text-indigo-200/80 leading-relaxed italic">
                "{horoscope.description}"
              </p>
              
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge label={lang === 'ru' ? 'Настроение' : 'Mood'} value={horoscope.mood} color="bg-blue-500/20 text-blue-300" />
                <Badge label={lang === 'ru' ? 'Число' : 'Lucky #'} value={horoscope.lucky_number} color="bg-amber-500/20 text-amber-300" />
                <Badge label={lang === 'ru' ? 'Цвет' : 'Color'} value={horoscope.color} color="bg-pink-500/20 text-pink-300" />
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">No data available</div>
          )}
        </div>

        {/* Numerology Column */}
        <div className="space-y-3 md:border-l md:border-white/10 md:pl-6">
          <div className="flex items-center gap-2 text-purple-300">
            <Calendar className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-widest">{lang === 'ru' ? 'Нумерология' : 'Numerology'}</h4>
          </div>

          {numerology && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-purple-500/5 rounded-xl p-3 border border-purple-500/10">
                <div className="text-[10px] text-purple-400 uppercase">{lang === 'ru' ? 'Число Судьбы' : 'Life Path'}</div>
                <div className="text-2xl font-bold text-purple-100">{numerology.lifePath}</div>
              </div>
              <div className="bg-purple-500/5 rounded-xl p-3 border border-purple-500/10">
                <div className="text-[10px] text-purple-400 uppercase">{lang === 'ru' ? 'Личный Год' : 'Personal Year'}</div>
                <div className="text-2xl font-bold text-purple-100">{numerology.personalYear}</div>
              </div>
              <div className="col-span-2 bg-purple-500/5 rounded-xl p-3 border border-purple-500/10">
                <div className="text-[10px] text-purple-400 uppercase mb-1">{lang === 'ru' ? 'Энергия дня' : 'Daily Energy'}</div>
                <div className="text-sm text-purple-100 font-medium">{numerology.energy}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Badge({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <span className={`px-2 py-1 rounded-md text-[10px] font-medium border border-white/5 ${color}`}>
      <span className="opacity-70 mr-1">{label}:</span>
      {value}
    </span>
  )
}
