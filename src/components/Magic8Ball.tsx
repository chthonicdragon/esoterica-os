
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Save, HelpCircle } from 'lucide-react';
import { Node } from '../services/openRouterService';

interface Magic8BallProps {
  entity?: Node;
  onSave?: (prediction: string, entityId?: string) => void;
  lang?: 'en' | 'ru';
}

// Fallback answers if API fails
const FALLBACK_ANSWERS = {
  en: [
    "It is certain.", "It is decidedly so.", "Without a doubt.", "Yes definitely.",
    "You may rely on it.", "As I see it, yes.", "Most likely.", "Outlook good.",
    "Yes.", "Signs point to yes.", "Reply hazy, try again.", "Ask again later.",
    "Better not tell you now.", "Cannot predict now.", "Concentrate and ask again.",
    "Don't count on it.", "My reply is no.", "My sources say no.",
    "Outlook not so good.", "Very doubtful."
  ],
  ru: [
    "Бесспорно.", "Предрешено.", "Никаких сомнений.", "Определённо да.",
    "Можешь быть уверен в этом.", "Мне кажется — да.", "Вероятнее всего.", "Хорошие перспективы.",
    "Знаки говорят — да.", "Да.", "Пока не ясно, попробуй снова.", "Спроси позже.",
    "Лучше не рассказывать.", "Сейчас нельзя предсказать.", "Сконцентрируйся и спроси опять.",
    "Даже не думай.", "Мой ответ — нет.", "По моим данным — нет.",
    "Перспективы не очень.", "Весьма сомнительно."
  ]
};

// Map elements/planets to colors
const ATTRIBUTE_COLORS: Record<string, string> = {
  Fire: '#ef4444', Water: '#3b82f6', Air: '#fbbf24', Earth: '#10b981', Spirit: '#a855f7',
  Sun: '#fbbf24', Moon: '#e2e8f0', Mars: '#ef4444', Venus: '#f472b6',
  Mercury: '#60a5fa', Jupiter: '#8b5cf6', Saturn: '#64748b',
  default: '#14b8a6' // Teal
};

export const Magic8Ball: React.FC<Magic8BallProps> = ({ entity, onSave, lang = 'en' }) => {
  const [shaking, setShaking] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Determine visual style based on entity
  const glowColor = entity?.element 
    ? ATTRIBUTE_COLORS[entity.element] 
    : (entity?.planet ? ATTRIBUTE_COLORS[entity.planet] : ATTRIBUTE_COLORS.default);
    
  const attributes = [entity?.pantheon, entity?.planet, entity?.element].filter(Boolean).join(' • ');

  const shakeBall = async () => {
    if (loading || shaking) return;
    
    setShaking(true);
    setLoading(true);
    setAnswer(null);

    // Minimum animation time
    await new Promise(r => setTimeout(r, 1500));

    try {
      // Use fallback answers with localization
      const answers = FALLBACK_ANSWERS[lang] || FALLBACK_ANSWERS.en;
      const randomAnswer = answers[Math.floor(Math.random() * answers.length)];
      setAnswer(randomAnswer);
    } catch (e) {
      const answers = FALLBACK_ANSWERS[lang] || FALLBACK_ANSWERS.en;
      setAnswer(answers[Math.floor(Math.random() * answers.length)]);
    } finally {
      setShaking(false);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* 8-Ball Container */}
      <div className="relative w-64 h-64 sm:w-80 sm:h-80 group cursor-pointer" onClick={shakeBall}>
        
        {/* Outer Glow (Dynamic) */}
        <div 
          className="absolute -inset-4 rounded-full blur-xl transition-all duration-1000 opacity-40 group-hover:opacity-60"
          style={{ backgroundColor: glowColor || '#14b8a6' }}
        />

        {/* The Ball */}
        <motion.div
          animate={shaking ? { 
            x: [0, -5, 5, -5, 5, 0],
            y: [0, -5, 5, -5, 5, 0],
            rotate: [0, -5, 5, -5, 5, 0]
          } : {}}
          transition={{ duration: 0.5, repeat: shaking ? Infinity : 0 }}
          className="relative w-full h-full rounded-full bg-black shadow-[inset_-10px_-10px_20px_rgba(255,255,255,0.1),0_10px_20px_rgba(0,0,0,0.5)] flex items-center justify-center overflow-hidden border-4 border-white/5"
          style={{
            background: 'radial-gradient(circle at 30% 30%, #333, #000 60%)'
          }}
        >
          {/* Inner Window */}
          <div className="w-1/2 h-1/2 rounded-full bg-[#111] shadow-[inset_0_0_10px_#000] flex items-center justify-center border border-white/10 relative overflow-hidden">
            
            {/* Liquid Effect */}
            <div className="absolute inset-0 bg-blue-900/20 animate-pulse" />

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-blue-400"
                >
                  <Sparkles className="w-8 h-8 animate-spin" />
                </motion.div>
              ) : answer ? (
                <motion.div
                  key="answer"
                  initial={{ opacity: 0, scale: 0.5, rotateX: -90 }}
                  animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                  className="text-center p-4"
                >
                  {/* Triangle Shape */}
                  <div className="text-blue-100 text-xs sm:text-sm font-bold tracking-wider leading-tight drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]">
                    {answer}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-white/10 text-6xl font-bold font-serif select-none"
                >
                  8
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Orbiting Particles (Mini-web) */}
        {entity && (
          <div className="absolute inset-0 pointer-events-none animate-[spin_10s_linear_infinite]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-2 h-2 rounded-full" style={{ backgroundColor: glowColor }} />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 w-2 h-2 rounded-full" style={{ backgroundColor: glowColor }} />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-2 h-2 rounded-full" style={{ backgroundColor: glowColor }} />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 w-2 h-2 rounded-full" style={{ backgroundColor: glowColor }} />
          </div>
        )}
      </div>

      {/* Info & Controls */}
      <div className="flex flex-col items-center gap-2">
        {entity ? (
          <div className="text-center">
            <h3 className="text-lg font-bold text-foreground">{entity.name}</h3>
            {attributes && <p className="text-xs text-muted-foreground uppercase tracking-widest">{attributes}</p>}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground italic flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            {lang === 'ru' ? 'Выберите сущность, чтобы канализировать её силу' : 'Select an entity to channel specific power'}
          </div>
        )}

        {answer && onSave && (
          <div className="group relative">
            <button
              onClick={() => onSave(answer, entity?.id)}
              className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition-all text-xs font-bold uppercase tracking-wider"
            >
              <Save className="w-4 h-4" />
              {lang === 'ru' ? 'Сохранить Пророчество' : 'Save Prophecy'}
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 p-2 bg-black/90 border border-white/10 rounded-lg text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center">
              {lang === 'ru' 
                ? 'Сохраняет ответ в паутину как ритуал и начисляет опыт.' 
                : 'Saves the answer to the web as a ritual and grants XP.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
