
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw } from 'lucide-react';

interface TarotCard {
  name: string;
  suit?: string;
  meaning_up: string;
  meaning_rev: string;
  image?: string; // We might construct this or get from API
  desc?: string;
}

// Minimal fallback set (Major Arcana)
const FALLBACK_CARDS: TarotCard[] = [
  { name: 'The Fool', meaning_up: 'Beginnings, innocence, spontaneity, a free spirit', meaning_rev: 'Holding back, recklessness, risk-taking' },
  { name: 'The Magician', meaning_up: 'Manifestation, resourcefulness, power, inspired action', meaning_rev: 'Manipulation, poor planning, untapped talents' },
  { name: 'The High Priestess', meaning_up: 'Intuition, sacred knowledge, divine feminine, the subconscious mind', meaning_rev: 'Secrets, disconnected from intuition, withdrawal and silence' },
  { name: 'The Empress', meaning_up: 'Femininity, beauty, nature, nurturing, abundance', meaning_rev: 'Creative block, dependence on others' },
  { name: 'The Emperor', meaning_up: 'Authority, establishment, structure, a father figure', meaning_rev: 'Domination, excessive control, lack of discipline' },
  { name: 'The Hierophant', meaning_up: 'Spiritual wisdom, religious beliefs, conformity, tradition, institutions', meaning_rev: 'Personal beliefs, freedom, challenging the status quo' },
  { name: 'The Lovers', meaning_up: 'Love, harmony, relationships, values alignment, choices', meaning_rev: 'Self-love, disharmony, imbalance, misalignment of values' },
  { name: 'The Chariot', meaning_up: 'Control, willpower, success, action, determination', meaning_rev: 'Self-discipline, opposition, lack of direction' },
  { name: 'Strength', meaning_up: 'Strength, courage, persuasion, influence, compassion', meaning_rev: 'Inner strength, self-doubt, low energy, raw emotion' },
  { name: 'The Hermit', meaning_up: 'Soul-searching, introspection, being alone, inner guidance', meaning_rev: 'Isolation, loneliness, withdrawal' },
  { name: 'Wheel of Fortune', meaning_up: 'Good luck, karma, life cycles, destiny, a turning point', meaning_rev: 'Bad luck, resistance to change, breaking cycles' },
  { name: 'Justice', meaning_up: 'Justice, fairness, truth, cause and effect, law', meaning_rev: 'Unfairness, lack of accountability, dishonesty' },
  { name: 'The Hanged Man', meaning_up: 'Pause, surrender, letting go, new perspectives', meaning_rev: 'Delays, resistance, stalling, indecision' },
  { name: 'Death', meaning_up: 'Endings, change, transformation, transition', meaning_rev: 'Resistance to change, personal transformation, inner purging' },
  { name: 'Temperance', meaning_up: 'Balance, moderation, patience, purpose', meaning_rev: 'Imbalance, excess, self-healing, re-alignment' },
  { name: 'The Devil', meaning_up: 'Shadow self, attachment, addiction, restriction, sexuality', meaning_rev: 'Releasing limiting beliefs, exploring dark thoughts, detachment' },
  { name: 'The Tower', meaning_up: 'Sudden change, upheaval, chaos, revelation, awakening', meaning_rev: 'Personal transformation, fear of change, averting disaster' },
  { name: 'The Star', meaning_up: 'Hope, faith, purpose, renewal, spirituality', meaning_rev: 'Lack of faith, despair, self-trust, disconnection' },
  { name: 'The Moon', meaning_up: 'Illusion, fear, anxiety, subconscious, intuition', meaning_rev: 'Release of fear, repressed emotion, inner confusion' },
  { name: 'The Sun', meaning_up: 'Positivity, fun, warmth, success, vitality', meaning_rev: 'Inner child, feeling down, overly optimistic' },
  { name: 'Judgement', meaning_up: 'Judgement, rebirth, inner calling, absolution', meaning_rev: 'Self-doubt, inner critic, ignoring the call' },
  { name: 'The World', meaning_up: 'Completion, integration, accomplishment, travel', meaning_rev: 'Seeking personal closure, short-cuts, delays' },
];

interface TarotReaderProps {
  lang?: 'en' | 'ru';
}

export const TarotReader: React.FC<TarotReaderProps> = ({ lang = 'en' }) => {
  const [cards, setCards] = useState<TarotCard[]>([]);
  const [loading, setLoading] = useState(false);

  const drawCards = async (count: number) => {
    setLoading(true);
    setCards([]); // Clear previous
    
    try {
      // Attempt to fetch from API
      // Using n={count} as per common API standard, if it fails we fallback
      const res = await fetch(`https://tarotapi.dev/api/v1/cards/random?n=${count}`).catch(() => null);
      
      if (res && res.ok) {
        const data = await res.json();
        // API returns object with 'cards' array usually
        const fetchedCards = data.cards || (Array.isArray(data) ? data : [data]);
        setCards(fetchedCards);
      } else {
        throw new Error('API failed');
      }
    } catch (e) {
      // Fallback to local data
      // Shuffle fallback cards
      const shuffled = [...FALLBACK_CARDS].sort(() => 0.5 - Math.random());
      setCards(shuffled.slice(0, count));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-4xl mx-auto">
      
      {/* Controls */}
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
      </div>

      {/* Cards Display */}
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
                {/* Card Image Placeholder (or real if available) */}
                <div className="h-40 bg-gradient-to-br from-purple-900/40 to-blue-900/40 flex items-center justify-center relative overflow-hidden">
                   <div className="absolute inset-0 bg-[url('/tarot-pattern.png')] opacity-10 bg-repeat" />
                   <div className="text-6xl font-serif text-white/10 group-hover:text-purple-400/20 transition-colors">
                     {index + 1}
                   </div>
                </div>

                <div className="p-4 space-y-2">
                  <h4 className="text-lg font-bold font-cinzel text-purple-200">
                    {card.name}
                  </h4>
                  {card.suit && (
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground bg-white/5 px-2 py-0.5 rounded">
                      {card.suit}
                    </span>
                  )}
                  
                  <div className="pt-2 text-xs space-y-2 text-muted-foreground">
                    <p>
                      <strong className="text-purple-400/80">{lang === 'ru' ? 'Значение:' : 'Upright:'}</strong>{' '}
                      {card.meaning_up}
                    </p>
                    <p>
                      <strong className="text-blue-400/80">{lang === 'ru' ? 'Тень:' : 'Reversed:'}</strong>{' '}
                      {card.meaning_rev}
                    </p>
                  </div>
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
