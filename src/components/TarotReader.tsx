
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw } from 'lucide-react';
import { TAROT_DECK, TarotCardData } from '../data/tarotData';
import { TAROT_LONG } from '../data/tarotLong';

interface TarotReaderProps {
  lang?: 'en' | 'ru';
}

type DrawnCard = TarotCardData & { reversed?: boolean }

export const TarotReader: React.FC<TarotReaderProps> = ({ lang = 'en' }) => {
  const [cards, setCards] = useState<DrawnCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailed, setDetailed] = useState(true);

  const drawCards = async (count: number) => {
    setLoading(true);
    setCards([]); // Clear previous
    
    // Simulate network delay for effect
    await new Promise(r => setTimeout(r, 800));
    
    // Shuffle local deck
    const shuffled = [...TAROT_DECK].sort(() => 0.5 - Math.random()).slice(0, count);
    // Randomly mark some cards as reversed
    const withOrientation: DrawnCard[] = shuffled.map(c => ({ ...c, reversed: Math.random() < 0.5 }));
    setCards(withOrientation);
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-4xl mx-auto">
      
      <div className="flex gap-4">
        <button
          onClick={() => drawCards(1)}
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 transition-all font-bold uppercase tracking-wider text-xs flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          {lang === 'ru' ? 'Одна карта' : 'Draw One Card'}
        </button>
        <button
          onClick={() => drawCards(3)}
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-300 hover:bg-blue-500/30 transition-all font-bold uppercase tracking-wider text-xs flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {lang === 'ru' ? 'Три карты' : 'Draw Three Cards'}
        </button>
        <div className="ml-2 inline-flex rounded-xl border border-white/10 overflow-hidden">
          <button
            onClick={() => setDetailed(false)}
            className={`px-3 py-3 text-xs font-bold uppercase tracking-wider ${!detailed ? 'bg-white/10 text-foreground' : 'text-muted-foreground'}`}
          >
            {lang === 'ru' ? 'Ключи' : 'Keys'}
          </button>
          <button
            onClick={() => setDetailed(true)}
            className={`px-3 py-3 text-xs font-bold uppercase tracking-wider ${detailed ? 'bg-white/10 text-foreground' : 'text-muted-foreground'}`}
          >
            {lang === 'ru' ? 'Толкование' : 'Reading'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-6 min-h-[300px]">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center w-full h-64"
            >
              <Sparkles className="w-12 h-12 text-purple-400 animate-spin" />
            </motion.div>
          ) : (
            cards.map((card, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20, rotateY: 90 }}
                animate={{ opacity: 1, y: 0, rotateY: 0 }}
                transition={{ delay: index * 0.2, duration: 0.5 }}
                className="relative w-64 bg-[#1a1b26] border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col group hover:border-purple-500/50 transition-colors"
              >
                <div className="h-80 bg-black flex items-center justify-center relative overflow-hidden">
                   {card.image ? (
                     <img
                       src={card.image}
                       alt={card.nameEn}
                       className={`w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity ${card.reversed ? 'rotate-180' : ''}`}
                     />
                   ) : (
                     <div className="absolute inset-0 bg-[url('/tarot-pattern.png')] opacity-10 bg-repeat" />
                   )}
                   <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                     <div className="text-xl font-serif text-purple-100 font-bold">
                       {lang === 'ru' ? card.nameRu : card.nameEn}
                     </div>
                      {card.reversed && (
                        <div className="mt-1 inline-block text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-300">
                          {lang === 'ru' ? 'Перевернутая' : 'Reversed'}
                        </div>
                      )}
                   </div>
                </div>

                <div className="p-4 space-y-3 bg-[#111]">
                  {(() => {
                    const ext = TAROT_LONG[card.id]
                    const upLong = lang === 'ru' ? ext?.longUpRu : ext?.longUpEn
                    const revLong = lang === 'ru' ? ext?.longRevRu : ext?.longRevEn
                    const uprightTextShort = lang === 'ru' ? card.meaningUpRu : card.meaningUpEn
                    const reversedTextShort = lang === 'ru' ? card.meaningRevRu : card.meaningRevEn
                    // If card is reversed, prefer reversed text first in quick view
                    return (
                      <div className="text-xs space-y-2 text-muted-foreground">
                        {card.reversed ? (
                          <>
                            <p>
                              <strong className="text-blue-400/80 uppercase text-[10px] tracking-wider block mb-1">{lang === 'ru' ? 'Перевернутое' : 'Reversed'}</strong>
                              {detailed ? (revLong || reversedTextShort) : reversedTextShort}
                            </p>
                            <div className="h-px bg-white/5 my-2" />
                            <p>
                              <strong className="text-purple-400/80 uppercase text-[10px] tracking-wider block mb-1">{lang === 'ru' ? 'Прямое значение' : 'Upright'}</strong>
                              {detailed ? (upLong || uprightTextShort) : uprightTextShort}
                            </p>
                          </>
                        ) : (
                          <>
                            <p>
                              <strong className="text-purple-400/80 uppercase text-[10px] tracking-wider block mb-1">{lang === 'ru' ? 'Прямое значение' : 'Upright'}</strong>
                              {detailed ? (upLong || uprightTextShort) : uprightTextShort}
                            </p>
                            <div className="h-px bg-white/5 my-2" />
                            <p>
                              <strong className="text-blue-400/80 uppercase text-[10px] tracking-wider block mb-1">{lang === 'ru' ? 'Перевернутое' : 'Reversed'}</strong>
                              {detailed ? (revLong || reversedTextShort) : reversedTextShort}
                            </p>
                          </>
                        )}
                      </div>
                    )
                  })()}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
        
        {!loading && cards.length === 0 && (
          <div className="flex flex-col items-center justify-center text-muted-foreground opacity-50 h-64">
            <p>{lang === 'ru' ? 'Карты ждут твоего вопроса...' : 'The cards await your query...'}</p>
          </div>
        )}
      </div>
    </div>
  );
};
