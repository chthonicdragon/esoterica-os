import React from 'react'
import { useLang } from '../contexts/LanguageContext'
import { ShoppingBag, Lock, Star } from 'lucide-react'

const MARKETPLACE_ITEMS = [
  { id: 1, title: 'Hecate Ritual Bundle', titleRu: 'Ритуальный набор Гекаты', type: 'template', price: 'Free', emoji: '🌙', author: 'TheMysticPath', rating: 4.8 },
  { id: 2, title: 'Nordic Rune Sigil Set', titleRu: 'Скандинавский набор рунных сигил', type: 'sigils', price: '$4.99', emoji: '⚡', author: 'NordicMage', rating: 4.9 },
  { id: 3, title: 'Slavic Deity Altar Pack', titleRu: 'Алтарный набор Славянских богов', type: 'altar', price: '$2.99', emoji: '🌿', author: 'VelesWorker', rating: 4.7 },
  { id: 4, title: 'Shadow Work Journal Templates', titleRu: 'Шаблоны для работы с тенью', type: 'journal', price: 'Free', emoji: '🖤', author: 'ShadowHealer', rating: 4.6 },
  { id: 5, title: 'AI Dream Decoder Pro', titleRu: 'Профессиональный декодер снов', type: 'ai', price: '$9.99', emoji: '🌌', author: 'DreamWeaver', rating: 4.9, premium: true },
  { id: 6, title: 'Chaos Magick Sigil Generator', titleRu: 'Генератор сигил хаос-магии', type: 'sigils', price: '$3.99', emoji: '🔮', author: 'ChaosAdept', rating: 4.5 },
]

export function Marketplace() {
  const { t, lang } = useLang()

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-[hsl(280,70%,15%)] to-[hsl(var(--neon)/0.05)] border border-primary/20 p-6">
        <div className="flex items-center gap-3 mb-2">
          <ShoppingBag className="w-6 h-6 text-primary" />
          <h2 className="text-lg font-bold font-cinzel text-foreground">
            {lang === 'ru' ? 'Маркетплейс' : 'Creator Marketplace'}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {lang === 'ru'
            ? 'Ритуальные шаблоны, сигилы и священные активы от практикующих из всего мира.'
            : 'Ritual templates, sigils, and sacred assets from practitioners worldwide.'}
        </p>
        <div className="flex gap-2 flex-wrap">
          {['All', 'Templates', 'Sigils', 'Altars', 'AI Tools'].map(cat => (
            <button key={cat} className="px-3 py-1.5 rounded-full text-xs bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors">
              {lang === 'ru' ? ({ All: 'Все', Templates: 'Шаблоны', Sigils: 'Сигилы', Altars: 'Алтари', 'AI Tools': 'ИИ Инструменты' }[cat] || cat) : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Coming Soon banner */}
      <div className="rounded-xl bg-[hsl(var(--neon)/0.05)] border border-[hsl(var(--neon)/0.2)] p-4 flex items-center gap-3">
        <Lock className="w-5 h-5 text-[hsl(var(--neon))]" />
        <div>
          <p className="text-sm font-medium text-foreground">
            {lang === 'ru' ? 'Маркетплейс — скоро' : 'Marketplace — Coming Soon'}
          </p>
          <p className="text-xs text-muted-foreground">
            {lang === 'ru' ? 'Полная торговая площадка откроется в Q2 2025. Предпросмотр доступен.' : 'Full marketplace opens Q2 2025. Preview available now.'}
          </p>
        </div>
      </div>

      {/* Item grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MARKETPLACE_ITEMS.map(item => (
          <div key={item.id} className="rounded-2xl bg-card border border-border/40 p-4 hover:border-primary/30 transition-all group">
            <div className="flex items-start justify-between mb-3">
              <span className="text-3xl">{item.emoji}</span>
              {item.premium && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400">
                  Premium
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              {lang === 'ru' ? item.titleRu : item.title}
            </h3>
            <p className="text-xs text-muted-foreground mb-3">by {item.author}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-xs text-muted-foreground">{item.rating}</span>
              </div>
              <button className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs hover:bg-primary/20 transition-colors">
                {item.price === 'Free' ? (lang === 'ru' ? 'Бесплатно' : 'Free') : item.price}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
