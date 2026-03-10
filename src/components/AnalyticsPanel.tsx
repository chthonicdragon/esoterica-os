import React, { useMemo } from 'react';
import { Activity, Zap, Shield, Star, Award } from 'lucide-react';
import { GraphData, Node } from '../services/openRouterService';

interface AnalyticsPanelProps {
  data: GraphData;
  onNodeSelect: (node: Node) => void;
  lang: 'en' | 'ru';
}

const t = {
  en: {
    title: "Network Analytics",
    powerCenters: "Power Centers",
    keyRituals: "Key Rituals",
    dominantEntities: "Dominant Entities",
    noRituals: "No rituals detected...",
    totalNodes: "Total Nodes",
    links: "Links",
    level: "lvl",
    connections: "connections"
  },
  ru: {
    title: "Аналитика Сети",
    powerCenters: "Центры Силы",
    keyRituals: "Ключевые Ритуалы",
    dominantEntities: "Доминирующие Сущности",
    noRituals: "Ритуалы не обнаружены...",
    totalNodes: "Всего узлов",
    links: "Связей",
    level: "ур",
    connections: "связей"
  }
};

interface NodeStats extends Node {
  degree: number;
  influence: number;
  connections: string[];
}

const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ data, onNodeSelect, lang }) => {
  const tr = t[lang];
  const stats = useMemo(() => {
    const nodeStats: Record<string, NodeStats> = {};
    data.nodes.forEach(node => {
      nodeStats[node.id] = { ...node, degree: 0, influence: 0, connections: [] };
    });
    data.links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id;
      const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id;
      if (nodeStats[sourceId] && nodeStats[targetId]) {
        nodeStats[sourceId].degree++;
        nodeStats[targetId].degree++;
        nodeStats[sourceId].connections.push(targetId);
        nodeStats[targetId].connections.push(sourceId);
      }
    });
    Object.values(nodeStats).forEach(node => {
      let neighborDegreeSum = 0;
      node.connections.forEach(neighborId => { neighborDegreeSum += nodeStats[neighborId]?.degree || 0; });
      node.influence = node.degree + (neighborDegreeSum * 0.5);
    });
    const allStats = Object.values(nodeStats);
    return {
      powerCenters: [...allStats].sort((a, b) => b.influence - a.influence).slice(0, 5),
      keyRituals: allStats.filter(n => n.type === 'ritual').sort((a, b) => b.degree - a.degree).slice(0, 5),
      topDeities: allStats.filter(n => n.type === 'deity').sort((a, b) => b.influence - a.influence).slice(0, 5)
    };
  }, [data]);

  if (data.nodes.length === 0) return null;

  return (
    <div className="flex flex-col gap-6 p-6 bg-[hsl(var(--sidebar))]/95 backdrop-blur-xl rounded-2xl border border-white/10 h-full overflow-y-auto shadow-2xl">
      <div className="flex items-center gap-3 mb-2">
        <Activity className="w-5 h-5 text-emerald-400" />
        <h2 className="text-lg font-cinzel font-light text-foreground tracking-tight">{tr.title}</h2>
      </div>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-yellow-400" />
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr.powerCenters}</h3>
        </div>
        <div className="space-y-1.5">
          {stats.powerCenters.map((node, i) => (
            <button
              key={node.id}
              onClick={() => onNodeSelect(node)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group text-left"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-[10px] font-mono text-muted-foreground/50 w-4">{i + 1}</span>
                <span className="text-sm font-medium text-foreground group-hover:text-yellow-400 transition-colors truncate">{node.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="h-1 w-10 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400" style={{ width: `${Math.min(100, (node.influence / (stats.powerCenters[0]?.influence || 1)) * 100)}%` }} />
                </div>
                <span className="text-[10px] font-mono text-yellow-400/70">{node.influence.toFixed(1)}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-purple-400" />
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr.keyRituals}</h3>
        </div>
        <div className="space-y-1.5">
          {stats.keyRituals.length > 0 ? stats.keyRituals.map(node => (
            <button
              key={node.id}
              onClick={() => onNodeSelect(node)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group text-left"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                <span className="text-sm font-medium text-foreground group-hover:text-purple-400 transition-colors truncate">{node.name}</span>
              </div>
              <span className="text-[10px] font-mono text-purple-400/70 shrink-0">{node.degree} {tr.connections}</span>
            </button>
          )) : (
            <p className="text-[10px] text-muted-foreground italic px-2">{tr.noRituals}</p>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-4 h-4 text-rose-400" />
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{tr.dominantEntities}</h3>
        </div>
        <div className="space-y-1.5">
          {stats.topDeities.map(node => (
            <button
              key={node.id}
              onClick={() => onNodeSelect(node)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group text-left"
            >
              <span className="text-sm font-medium text-foreground group-hover:text-rose-400 transition-colors truncate">{node.name}</span>
              <span className="text-[10px] font-mono text-rose-400/70 shrink-0">{tr.level} {Math.floor(node.influence)}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="mt-auto pt-4 border-t border-white/5">
        <div className="flex items-center justify-between text-[9px] text-muted-foreground/50 font-mono uppercase tracking-widest">
          <span>{tr.totalNodes}: {data.nodes.length}</span>
          <span>{tr.links}: {data.links.length}</span>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;
