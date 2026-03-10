import React, { useMemo } from 'react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { useChakra } from '../ChakraContext'
import { CHAKRA_INFO, ChakraName } from '../types'
import { motion } from 'framer-motion'

export function EnergyMap({ lang = 'en' }: { lang?: 'en' | 'ru' }) {
  const { state } = useChakra()

  const data = useMemo(() => {
    return (Object.keys(CHAKRA_INFO) as ChakraName[]).map(key => ({
      subject: lang === 'ru' ? CHAKRA_INFO[key].nameRu : CHAKRA_INFO[key].name,
      A: state.chakras[key].level,
      fullMark: 100,
      fill: CHAKRA_INFO[key].color
    }))
  }, [state.chakras, lang])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
      {/* Radar Balance Chart */}
      <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
        <h3 className="text-white/80 text-sm font-medium absolute top-4 left-4 z-10 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          {lang === 'ru' ? 'Баланс энергии' : 'Energy Balance'}
        </h3>
        
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name={lang === 'ru' ? 'Текущая энергия' : 'Current Energy'}
                dataKey="A"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Level Bars */}
      <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-4 flex flex-col justify-center relative overflow-hidden">
        <h3 className="text-white/80 text-sm font-medium mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          {lang === 'ru' ? 'Уровни чакр' : 'Chakra Levels'}
        </h3>

        <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {(Object.keys(CHAKRA_INFO) as ChakraName[]).map((key) => {
            const level = state.chakras[key].level
            const color = CHAKRA_INFO[key].color
            
            return (
              <div key={key} className="group relative">
                <div className="flex justify-between text-xs text-white/60 mb-1">
                  <span>{lang === 'ru' ? CHAKRA_INFO[key].nameRu : CHAKRA_INFO[key].name}</span>
                  <span className="font-mono">{Math.round(level)}%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${level}%` }}
                    transition={{ type: "spring", stiffness: 50, damping: 10 }}
                    className="h-full rounded-full relative"
                    style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}40` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-1/2 animate-shimmer" />
                  </motion.div>
                </div>
                <div className="mt-1 text-[10px] text-white/30 truncate opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 -bottom-4 bg-black/80 px-2 py-0.5 rounded border border-white/10 z-20 pointer-events-none">
                  {lang === 'ru' ? CHAKRA_INFO[key].descriptionRu : CHAKRA_INFO[key].description}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
