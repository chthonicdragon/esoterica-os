import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { GraphData, Node, Link } from '../services/openRouterService';
import { getRelationLabel } from '../lib/relationLabels';

interface GraphVisualizationProps {
  data: GraphData;
  onNodeClick?: (node: Node) => void;
  onLinkClick?: (link: Link) => void;
  lang?: 'en' | 'ru';
  searchQuery?: string;
  visibleTypes?: Set<string>;
  selectedNodeId?: string | null;
  externalHighlightNodeIds?: Set<string>;
  externalHighlightLinkIds?: Set<string>;
  showFlows?: boolean;
  flowSpeed?: number;
  flowIntensity?: number;
  flowThickness?: number;
  hideWeakFlows?: boolean;
  isExpanded?: boolean;
  activePantheons?: Set<string>;
  activePlanets?: Set<string>;
  activeElements?: Set<string>;
  activeOfferings?: Set<string>;
  showFilterBadges?: boolean;
  maxRenderNodes?: number;
  labelMode?: 'all' | 'important';
}

interface D3Node extends Node, d3.SimulationNodeDatum {
  degree?: number;
  isPowerCenter?: boolean;
  isKeyRitual?: boolean;
  influence?: number;
}

interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  relation: string;
  weight?: number;
  strength?: "weak" | "medium" | "strong" | "personal";
}

const COLORS: Record<string, string> = {
  deity: "#f43f5e",
  spirit: "#a855f7",
  ritual: "#3b82f6",
  symbol: "#eab308",
  concept: "#10b981",
  place: "#f97316",
  creature: "#06b6d4",
  artifact: "#8b5cf6",
  spell: "#ec4899",
  sigil: "#14b8a6",
};

const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  data,
  onNodeClick,
  onLinkClick,
  lang = 'en',
  searchQuery = '',
  visibleTypes = new Set(['deity', 'spirit', 'ritual', 'symbol', 'concept', 'place', 'creature', 'artifact', 'spell', 'sigil']),
  selectedNodeId = null,
  externalHighlightNodeIds,
  externalHighlightLinkIds,
  showFlows = true,
  flowSpeed = 1,
  flowIntensity = 1,
  flowThickness = 1,
  hideWeakFlows = false,
  isExpanded = false,
  activePantheons = new Set(),
  activePlanets = new Set(),
  activeElements = new Set(),
  activeOfferings = new Set(),
  showFilterBadges = true,
  maxRenderNodes = 2000,
  labelMode = 'important'
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const simulationRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null);
  const simulationKeyRef = useRef<string>('');
  const nodePositionsRef = useRef<Map<string, { x: number, y: number, vx: number, vy: number }>>(new Map());
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [debouncedDimensions] = useDebounce(dimensions, 250);

  useEffect(() => {
    if (!svgRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    observer.observe(svgRef.current.parentElement!);
    return () => observer.disconnect();
  }, []);

  const filteredData = useMemo(() => {
    const allPantheons = activePantheons.has('*')
    const allPlanets = activePlanets.has('*')
    const allElements = activeElements.has('*')
    const allOfferings = activeOfferings.has('*')

    const nodes = data.nodes.filter(n => {
      if (!visibleTypes.has(n.type)) return false;
      if (activePantheons.size > 0 && !allPantheons && (!n.pantheon || !activePantheons.has(n.pantheon))) return false;
      if (activePlanets.size > 0 && !allPlanets && (!n.planet || !activePlanets.has(n.planet))) return false;
      if (activeElements.size > 0 && !allElements && (!n.element || !activeElements.has(n.element))) return false;
      if (activeOfferings.size > 0 && !allOfferings && (!n.offerings || !n.offerings.some(o => activeOfferings.has(o)))) return false;
      return true;
    });
    const nodeIds = new Set(nodes.map(n => n.id));
    const links = data.links.filter(l => nodeIds.has(l.source as string) && nodeIds.has(l.target as string));

    const degrees: Record<string, number> = {};
    links.forEach(l => {
      const s = typeof l.source === 'string' ? l.source : (l.source as any).id;
      const t = typeof l.target === 'string' ? l.target : (l.target as any).id;
      degrees[s] = (degrees[s] || 0) + 1;
      degrees[t] = (degrees[t] || 0) + 1;
    });

    const influence: Record<string, number> = {};
    nodes.forEach(node => {
      let neighborDegreeSum = 0;
      links.forEach(link => {
        const s = typeof link.source === 'string' ? link.source : (link.source as any).id;
        const t = typeof link.target === 'string' ? link.target : (link.target as any).id;
        if (s === node.id) neighborDegreeSum += degrees[t] || 0;
        if (t === node.id) neighborDegreeSum += degrees[s] || 0;
      });
      influence[node.id] = (degrees[node.id] || 0) + (neighborDegreeSum * 0.5);
    });

    const sortedInfluence = Object.values(influence).sort((a, b) => b - a);
    const powerThreshold = sortedInfluence[Math.min(2, sortedInfluence.length - 1)] || Infinity;

    const sortedRituals = nodes.filter(n => n.type === 'ritual').sort((a, b) => (degrees[b.id] || 0) - (degrees[a.id] || 0));
    const ritualThreshold = sortedRituals[Math.min(2, sortedRituals.length - 1)]?.id ? (degrees[sortedRituals[Math.min(2, sortedRituals.length - 1)].id] || 0) : Infinity;

    return {
      nodes: nodes.map(n => ({
        ...n,
        degree: degrees[n.id] || 0,
        influence: influence[n.id] || 0,
        isPowerCenter: influence[n.id] >= powerThreshold && influence[n.id] > 2,
        isKeyRitual: n.type === 'ritual' && (degrees[n.id] || 0) >= ritualThreshold && (degrees[n.id] || 0) > 1
      })),
      links: links.map(l => ({ ...l }))
    };
  }, [activeElements, activeOfferings, activePantheons, activePlanets, data, visibleTypes]);

  const renderData = useMemo(() => {
    if (filteredData.nodes.length <= maxRenderNodes) return filteredData

    const adjacency = new Map<string, string[]>()
    const addAdj = (a: string, b: string) => {
      const arr = adjacency.get(a)
      if (arr) arr.push(b)
      else adjacency.set(a, [b])
    }

    filteredData.links.forEach(l => {
      const s = typeof l.source === 'string' ? l.source : (l.source as any).id
      const t = typeof l.target === 'string' ? l.target : (l.target as any).id
      addAdj(s, t)
      addAdj(t, s)
    })

    const keep = new Set<string>()
    const addId = (id: string) => {
      if (keep.size >= maxRenderNodes) return
      keep.add(id)
    }

    const q = searchQuery.trim().toLowerCase()
    if (q.length >= 2) {
      for (const n of filteredData.nodes) {
        if (keep.size >= Math.min(maxRenderNodes, 350)) break
        const desc = (n.description || '').toLowerCase()
        const aliases = Array.isArray((n as any).aliases) ? ((n as any).aliases as string[]) : []
        const tags = Array.isArray((n as any).tags) ? ((n as any).tags as string[]) : []
        const hit = (
          n.name.toLowerCase().includes(q) ||
          n.type.toLowerCase().includes(q) ||
          desc.includes(q) ||
          aliases.some(a => a.toLowerCase().includes(q)) ||
          tags.some(t => t.toLowerCase().includes(q))
        )
        if (hit) addId(n.id)
      }
    }

    if (selectedNodeId) {
      addId(selectedNodeId)
      const queue: Array<{ id: string; depth: number }> = [{ id: selectedNodeId, depth: 0 }]
      const seen = new Set<string>([selectedNodeId])
      while (queue.length && keep.size < maxRenderNodes) {
        const cur = queue.shift()!
        const nextDepth = cur.depth + 1
        if (nextDepth > 2) continue
        const neighbors = adjacency.get(cur.id) || []
        for (const nb of neighbors) {
          if (keep.size >= maxRenderNodes) break
          addId(nb)
          if (!seen.has(nb)) {
            seen.add(nb)
            queue.push({ id: nb, depth: nextDepth })
          }
        }
      }
    }

    externalHighlightNodeIds?.forEach(id => addId(id))

    if (keep.size < maxRenderNodes) {
      const ranked = [...filteredData.nodes].sort((a, b) => ((b.influence || 0) - (a.influence || 0)))
      for (const n of ranked) {
        if (keep.size >= maxRenderNodes) break
        addId(n.id)
      }
    }

    const nodes = filteredData.nodes.filter(n => keep.has(n.id))
    const nodeIds = new Set(nodes.map(n => n.id))
    const links = filteredData.links.filter(l => {
      const s = typeof l.source === 'string' ? l.source : (l.source as any).id
      const t = typeof l.target === 'string' ? l.target : (l.target as any).id
      return nodeIds.has(s) && nodeIds.has(t)
    })
    return { nodes, links }
  }, [externalHighlightNodeIds, filteredData, maxRenderNodes, searchQuery, selectedNodeId])

  const highlights = useMemo(() => {
    const highlightedNodeIds = new Set<string>();
    const highlightedLinkIds = new Set<string>();
    const activeId = selectedNodeId;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchedNodes = renderData.nodes.filter(n => {
        const desc = (n.description || '').toLowerCase();
        const aliases = Array.isArray((n as any).aliases) ? ((n as any).aliases as string[]) : [];
        const tags = Array.isArray((n as any).tags) ? ((n as any).tags as string[]) : [];
        return (
          n.name.toLowerCase().includes(query) ||
          n.type.toLowerCase().includes(query) ||
          desc.includes(query) ||
          aliases.some(a => a.toLowerCase().includes(query)) ||
          tags.some(t => t.toLowerCase().includes(query))
        );
      });
      matchedNodes.forEach(node => {
        highlightedNodeIds.add(node.id);
        renderData.links.forEach(link => {
          const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id;
          const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id;
          if (sourceId === node.id) { highlightedNodeIds.add(targetId); highlightedLinkIds.add(`${sourceId}-${targetId}-${link.relation}`); }
          if (targetId === node.id) { highlightedNodeIds.add(sourceId); highlightedLinkIds.add(`${sourceId}-${targetId}-${link.relation}`); }
        });
      });
    }

    if (activeId) {
      highlightedNodeIds.add(activeId);
      renderData.links.forEach(link => {
        const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id;
        const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id;
        if (sourceId === activeId) { highlightedNodeIds.add(targetId); highlightedLinkIds.add(`${sourceId}-${targetId}-${link.relation}`); }
        if (targetId === activeId) { highlightedNodeIds.add(sourceId); highlightedLinkIds.add(`${sourceId}-${targetId}-${link.relation}`); }
      });
    }

    return { nodes: highlightedNodeIds, links: highlightedLinkIds };
  }, [renderData, searchQuery, selectedNodeId]);

  const effectiveHighlights = useMemo(() => {
    const nodes = new Set<string>(highlights.nodes)
    const links = new Set<string>(highlights.links)
    externalHighlightNodeIds?.forEach(id => nodes.add(id))
    externalHighlightLinkIds?.forEach(id => links.add(id))
    return { nodes, links }
  }, [externalHighlightLinkIds, externalHighlightNodeIds, highlights.links, highlights.nodes])

  useEffect(() => {
    if (!svgRef.current || !renderData.nodes.length) {
      d3.select(svgRef.current).selectAll("*").remove();
      return;
    }

    const { width, height } = debouncedDimensions;
    if (width === 0 || height === 0) return;

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .on("click", (event) => {
        if (event.target.tagName === 'svg') {
          if (onNodeClick) onNodeClick(null as any);
        }
      });

    const nodesKey = renderData.nodes.map(n => n.id).join('|')
    const linksKey = String(renderData.links.length)
    const simKey = `${nodesKey}::${linksKey}`

    if (simulationRef.current && simulationKeyRef.current === simKey) {
      simulationRef.current
        .force("x", d3.forceX(width / 2).strength(0.05))
        .force("y", d3.forceY(height / 2).strength(0.05))
        .alpha(0.15)
        .restart();
      return;
    }

    if (simulationRef.current) {
      simulationRef.current.stop()
      simulationRef.current = null
    }

    svg.selectAll("*").remove();
    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => { g.attr("transform", event.transform); });

    zoomRef.current = zoom;
    svg.call(zoom);

    const nodes: D3Node[] = renderData.nodes.map(d => {
      const pos = nodePositionsRef.current.get(d.id);
      return {
        ...d,
        x: pos?.x ?? width / 2 + (Math.random() - 0.5) * 100,
        y: pos?.y ?? height / 2 + (Math.random() - 0.5) * 100,
        vx: pos?.vx ?? 0,
        vy: pos?.vy ?? 0
      };
    });
    const links: D3Link[] = renderData.links.map(d => ({ source: d.source, target: d.target, relation: d.relation, strength: (d as any).strength }));

    const nodeCount = nodes.length
    const enableFlows = showFlows && nodeCount <= 1200
    const linkDistance = nodeCount >= 1200 ? 80 : nodeCount >= 700 ? 110 : 160
    const chargeStrength = nodeCount >= 1200 ? -70 : nodeCount >= 700 ? -140 : -380
    const collideBase = nodeCount >= 1200 ? 18 : nodeCount >= 700 ? 26 : 40
    const collideFactor = nodeCount >= 1200 ? 1.0 : nodeCount >= 700 ? 1.6 : 2.5

    const simulation = d3.forceSimulation<D3Node>(nodes)
      .velocityDecay(nodeCount >= 700 ? 0.55 : 0.4)
      .alphaDecay(nodeCount >= 700 ? 0.06 : 0.035)
      .alphaMin(0.02)
      .force("link", d3.forceLink<D3Node, D3Link>(links).id(d => d.id).distance(linkDistance))
      .force("charge", d3.forceManyBody().strength(chargeStrength))
      .force("x", d3.forceX(width / 2).strength(0.05))
      .force("y", d3.forceY(height / 2).strength(0.05))
      .force("collision", d3.forceCollide<D3Node>().radius(d => collideBase + (d.degree || 0) * collideFactor));

    simulationRef.current = simulation;
    simulationKeyRef.current = simKey;

    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "-0 -5 10 10")
      .attr("refX", 32).attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 6).attr("markerHeight", 6)
      .attr("xoverflow", "visible")
      .append("svg:path")
      .attr("d", "M 0,-5 L 10 ,0 L 0,5")
      .attr("fill", "#666").style("stroke", "none");

    const getLinkColor = (d: D3Link) => {
      const source = d.source as D3Node;
      const target = d.target as D3Node;
      const id = `${source.id}-${target.id}-${d.relation}`;
      if (effectiveHighlights.nodes.size > 0) return effectiveHighlights.links.has(id) ? "#f97316" : "#111";
      const typePair = [source.type, target.type].sort().join('-');
      const typeColors: Record<string, string> = {
        'deity-ritual': "#f43f5e", 'spirit-symbol': "#a855f7",
        'ritual-spell': "#3b82f6", 'deity-spirit': "#ec4899",
        'place-ritual': "#f97316", 'artifact-deity': "#eab308",
        'concept-deity': "#10b981",
      };
      return typeColors[typePair] || "#333";
    };

    const linkGroup = g.append("g").attr("class", "links");

    const link = linkGroup.selectAll(".base-line")
      .data(links)
      .join("line")
      .attr("class", "base-line")
      .attr("stroke", d => getLinkColor(d))
      .attr("stroke-opacity", d => {
        const source = d.source as D3Node; const target = d.target as D3Node;
        const id = `${source.id}-${target.id}-${d.relation}`;
        if (effectiveHighlights.nodes.size > 0) return effectiveHighlights.links.has(id) ? 0.85 : 0.03;
        return 0.3;
      })
      .attr("stroke-width", d => {
        const source = d.source as D3Node; const target = d.target as D3Node;
        const id = `${source.id}-${target.id}-${d.relation}`;
        if (effectiveHighlights.links.has(id)) return 3;
        if (d.strength === 'strong') return 2.5;
        if (d.strength === 'medium') return 1.5;
        if (d.strength === 'weak') return 0.5;
        return 1;
      })
      .attr("marker-end", "url(#arrowhead)")
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        if (onLinkClick) {
          const originalLink = data.links.find(l =>
            (typeof l.source === 'string' ? l.source : (l.source as any).id) === (typeof d.source === 'string' ? d.source : (d.source as any).id) &&
            (typeof l.target === 'string' ? l.target : (l.target as any).id) === (typeof d.target === 'string' ? d.target : (d.target as any).id) &&
            l.relation === d.relation
          );
          if (originalLink) onLinkClick(originalLink);
        }
      });

    const flow = linkGroup.selectAll(".flow-line")
      .data(enableFlows ? links : [])
      .join("line")
      .attr("class", "flow-line")
      .attr("stroke", d => getLinkColor(d))
      .attr("stroke-width", d => {
        const source = d.source as D3Node; const target = d.target as D3Node;
        const isKey = source.isPowerCenter || target.isPowerCenter || source.isKeyRitual || target.isKeyRitual;
        const base = 1.5 * flowThickness;
        return isKey ? base * 2 : base;
      })
      .attr("stroke-dasharray", "4, 12")
      .attr("stroke-opacity", d => {
        const source = d.source as D3Node; const target = d.target as D3Node;
        const isKey = source.isPowerCenter || target.isPowerCenter || source.isKeyRitual || target.isKeyRitual;
        if (hideWeakFlows && !isKey) return 0;
        const id = `${source.id}-${target.id}-${d.relation}`;
        if (effectiveHighlights.nodes.size > 0 && !effectiveHighlights.links.has(id)) return 0;
        return (isKey ? 0.8 : 0.4) * flowIntensity;
      })
      .style("filter", d => {
        const source = d.source as D3Node; const target = d.target as D3Node;
        const isKey = source.isPowerCenter || target.isPowerCenter || source.isKeyRitual || target.isKeyRitual;
        return isKey ? `drop-shadow(0 0 3px ${getLinkColor(d)})` : "none";
      })
      .style("pointer-events", "none");

    flow.each(function(d) {
      const source = d.source as D3Node; const target = d.target as D3Node;
      const isKey = source.isPowerCenter || target.isPowerCenter || source.isKeyRitual || target.isKeyRitual;
      const speed = (isKey ? 2 : 1) * flowSpeed;
      const duration = 20 / speed;
      d3.select(this).append("animate")
        .attr("attributeName", "stroke-dashoffset")
        .attr("from", "16").attr("to", "0")
        .attr("dur", `${duration}s`)
        .attr("repeatCount", "indefinite");
    });

    const shouldRenderLinkText = nodeCount <= 650
    const linkText = shouldRenderLinkText
      ? g.append("g")
          .selectAll("text").data(links).join("text")
          .attr("class", "link-label")
          .attr("font-size", "9px").attr("fill", "#888")
          .attr("text-anchor", "middle").attr("dy", -5)
          .attr("opacity", d => {
            const source = d.source as D3Node; const target = d.target as D3Node;
            const id = `${source.id}-${target.id}-${d.relation}`;
            if (effectiveHighlights.nodes.size > 0) return effectiveHighlights.links.has(id) ? 1 : 0.02;
            return 0.7;
          })
          .text(d => getRelationLabel(d.relation, lang))
      : null;

    const node = g.append("g")
      .selectAll("g").data(nodes).join("g")
      .attr("class", "node-group")
      .style("cursor", "pointer")
      .attr("opacity", d => {
        if (effectiveHighlights.nodes.size > 0) return effectiveHighlights.nodes.has(d.id) ? 1 : 0.1;
        return 1;
      })
      .on("mouseenter", (event, d) => { setHoveredNodeId(d.id); })
      .on("mouseleave", () => { setHoveredNodeId(null); })
      .on("click", (event, d) => {
        event.stopPropagation();
        if (onNodeClick) {
          const originalNode = data.nodes.find(n => n.id === d.id);
          if (originalNode) onNodeClick(originalNode);
        }
      })
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    const circle = node.append("circle")
      .attr("r", d => 12 + (d.degree || 0) * 2.5)
      .attr("fill", d => COLORS[d.type] || "#999")
      .attr("stroke", d => {
        if (effectiveHighlights.nodes.has(d.id)) return "#fff";
        if (d.isPowerCenter) return "rgba(255,255,255,0.8)";
        if (d.isKeyRitual) return "rgba(168,85,247,0.8)";
        return "rgba(255,255,255,0.3)";
      })
      .attr("stroke-width", d => {
        if (effectiveHighlights.nodes.has(d.id)) return 4;
        if (d.isPowerCenter || d.isKeyRitual) return 3;
        return 2;
      })
      .style("filter", d => {
        if (effectiveHighlights.nodes.has(d.id)) return `drop-shadow(0 0 12px ${COLORS[d.type]})`;
        if (d.isPowerCenter) return `drop-shadow(0 0 8px ${COLORS[d.type]}88)`;
        if (d.isKeyRitual) return `drop-shadow(0 0 8px rgba(168,85,247,0.5))`;
        return "none";
      });

    if (showFilterBadges && (activePantheons.size > 0 || activePlanets.size > 0 || activeElements.size > 0 || activeOfferings.size > 0)) {
      const allPantheons = activePantheons.has('*')
      const allPlanets = activePlanets.has('*')
      const allElements = activeElements.has('*')
      const allOfferings = activeOfferings.has('*')
      const badgeColor = {
        pantheon: "#a855f7",
        planet: "#eab308",
        element: "#3b82f6",
        offering: "#10b981",
      }

      node.each(function(d) {
        const r = 12 + (d.degree || 0) * 2.5
        const badges: Array<{ color: string; label: string }> = []
        if (d.pantheon && (allPantheons || activePantheons.has(d.pantheon))) badges.push({ color: badgeColor.pantheon, label: "P" })
        if (d.planet && (allPlanets || activePlanets.has(d.planet))) badges.push({ color: badgeColor.planet, label: "L" })
        if (d.element && (allElements || activeElements.has(d.element))) badges.push({ color: badgeColor.element, label: "E" })
        if (Array.isArray((d as any).offerings) && (allOfferings || (d as any).offerings.some((o: string) => activeOfferings.has(o)))) badges.push({ color: badgeColor.offering, label: "O" })
        if (badges.length === 0) return

        const gSel = d3.select(this)
        badges.slice(0, 3).forEach((b, idx) => {
          const x = -r + 6 + idx * 10
          const y = -r - 6
          gSel.append("circle")
            .attr("cx", x)
            .attr("cy", y)
            .attr("r", 5.5)
            .attr("fill", "rgba(0,0,0,0.6)")
            .attr("stroke", b.color)
            .attr("stroke-width", 1.5)
          gSel.append("text")
            .attr("x", x)
            .attr("y", y + 3.2)
            .attr("text-anchor", "middle")
            .attr("font-size", "7px")
            .attr("font-weight", "800")
            .attr("fill", b.color)
            .text(b.label)
        })
      })
    }

    node.filter(d => d.type === 'sigil' && !!(d as any).image_url).each(function(d) {
      const r = 12 + (d.degree || 0) * 2.5;
      const g = d3.select(this);
      
      // Clip path for the image
      g.append("defs").append("clipPath")
        .attr("id", `clip-${d.id}`)
        .append("circle")
        .attr("r", r);

      g.append("image")
        .attr("href", (d as any).image_url as string)
        .attr("x", -r).attr("y", -r)
        .attr("width", r * 2).attr("height", r * 2)
        .attr("clip-path", `url(#clip-${d.id})`)
        .attr("preserveAspectRatio", "xMidYMid slice");
    });

    node.append("text")
      .attr("x", d => 16 + (d.degree || 0) * 2.5)
      .attr("y", 4)
      .attr("fill", "#eee")
      .attr("font-size", d => (14 + (d.degree || 0) * 0.8) + "px")
      .attr("font-weight", d => effectiveHighlights.nodes.has(d.id) ? "800" : "500")
      .attr("paint-order", "stroke")
      .attr("stroke", "#000").attr("stroke-width", "4px")
      .attr("stroke-linecap", "round").attr("stroke-linejoin", "round")
      .attr("opacity", d => {
        if (labelMode === 'all') return 1
        if (effectiveHighlights.nodes.has(d.id)) return 1
        if (d.isPowerCenter || d.isKeyRitual) return 1
        return (d.degree || 0) >= 6 ? 1 : 0
      })
      .text(d => d.name);

    simulation.on("tick", () => {
      nodes.forEach(n => {
        if (n.x !== undefined && n.y !== undefined) {
          nodePositionsRef.current.set(n.id, { x: n.x, y: n.y, vx: n.vx || 0, vy: n.vy || 0 });
        }
      });
      link
        .attr("x1", d => (d.source as D3Node).x!).attr("y1", d => (d.source as D3Node).y!)
        .attr("x2", d => (d.target as D3Node).x!).attr("y2", d => (d.target as D3Node).y!);
      flow
        .attr("x1", d => (d.source as D3Node).x!).attr("y1", d => (d.source as D3Node).y!)
        .attr("x2", d => (d.target as D3Node).x!).attr("y2", d => (d.target as D3Node).y!);
      linkText
        ?.attr("x", d => ((d.source as D3Node).x! + (d.target as D3Node).x!) / 2)
        ?.attr("y", d => ((d.source as D3Node).y! + (d.target as D3Node).y!) / 2);
      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
        simulationRef.current = null;
      }
    };
  }, [activeElements, activeOfferings, activePantheons, activePlanets, data.links, data.nodes, debouncedDimensions, lang, onLinkClick, onNodeClick, renderData, showFilterBadges, showFlows]);

  useEffect(() => {
    if (!svgRef.current || !zoomRef.current || !selectedNodeId) return;
    const pos = nodePositionsRef.current.get(selectedNodeId);
    if (!pos) return;
    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);
    const scale = 1.8;
    const tx = width / 2 - pos.x * scale;
    const ty = height / 2 - pos.y * scale;
    svg.transition().duration(600).call(zoomRef.current.transform as any, d3.zoomIdentity.translate(tx, ty).scale(scale));
  }, [selectedNodeId, dimensions]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    svg.selectAll<SVGGElement, D3Node>("g.node-group")
      .attr("opacity", d => {
        if (effectiveHighlights.nodes.size > 0) return effectiveHighlights.nodes.has(d.id) ? 1 : 0.1;
        return 1;
      });

    svg.selectAll<SVGCircleElement, D3Node>("g.node-group circle")
      .attr("stroke", d => {
        if (effectiveHighlights.nodes.has(d.id)) return "#fff";
        if (d.isPowerCenter) return "rgba(255,255,255,0.8)";
        if (d.isKeyRitual) return "rgba(168,85,247,0.8)";
        return "rgba(255,255,255,0.3)";
      })
      .attr("stroke-width", d => {
        if (effectiveHighlights.nodes.has(d.id)) return 4;
        if (d.isPowerCenter || d.isKeyRitual) return 3;
        return 2;
      })
      .style("filter", d => {
        if (effectiveHighlights.nodes.has(d.id)) return `drop-shadow(0 0 12px ${COLORS[d.type]})`;
        if (d.isPowerCenter) return `drop-shadow(0 0 8px ${COLORS[d.type]}88)`;
        if (d.isKeyRitual) return `drop-shadow(0 0 8px rgba(168,85,247,0.5))`;
        return "none";
      });

    svg.selectAll<SVGTextElement, D3Node>("g.node-group text")
      .attr("font-weight", d => effectiveHighlights.nodes.has(d.id) ? "800" : "500")
      .attr("opacity", d => {
        if (labelMode === 'all') return 1
        if (effectiveHighlights.nodes.has(d.id)) return 1
        if (d.isPowerCenter || d.isKeyRitual) return 1
        return (d.degree || 0) >= 6 ? 1 : 0
      });

    svg.selectAll<SVGLineElement, D3Link>(".base-line")
      .attr("stroke-opacity", d => {
        const source = d.source as D3Node; const target = d.target as D3Node;
        const id = `${source.id}-${target.id}-${d.relation}`;
        if (effectiveHighlights.nodes.size > 0) return effectiveHighlights.links.has(id) ? 0.85 : 0.03;
        return 0.3;
      })
      .attr("stroke-width", d => {
        const source = d.source as D3Node; const target = d.target as D3Node;
        const id = `${source.id}-${target.id}-${d.relation}`;
        if (effectiveHighlights.links.has(id)) return 3
        if (d.strength === 'strong') return 2.5
        if (d.strength === 'medium') return 1.5
        if (d.strength === 'weak') return 0.5
        return 1
      });

    svg.selectAll<SVGLineElement, D3Link>(".flow-line")
      .attr("stroke-width", d => {
        const source = d.source as D3Node; const target = d.target as D3Node;
        const isKey = source.isPowerCenter || target.isPowerCenter || source.isKeyRitual || target.isKeyRitual;
        const isHovered = hoveredNodeId === source.id || hoveredNodeId === target.id;
        const base = 1.5 * flowThickness;
        return (isKey ? base * 2 : base) * (isHovered ? 1.5 : 1);
      })
      .attr("stroke-opacity", d => {
        const source = d.source as D3Node; const target = d.target as D3Node;
        const isKey = source.isPowerCenter || target.isPowerCenter || source.isKeyRitual || target.isKeyRitual;
        const isHovered = hoveredNodeId === source.id || hoveredNodeId === target.id;
        if (hideWeakFlows && !isKey && !isHovered) return 0;
        const id = `${source.id}-${target.id}-${d.relation}`;
        if (effectiveHighlights.nodes.size > 0 && !effectiveHighlights.links.has(id)) return 0;
        return (isKey ? 0.8 : 0.4) * flowIntensity * (isHovered ? 1.2 : 1);
      });
    
    svg.selectAll<SVGTextElement, D3Link>(".link-label")
      .attr("opacity", d => {
        const source = d.source as D3Node; const target = d.target as D3Node;
        const id = `${source.id}-${target.id}-${d.relation}`;
        if (effectiveHighlights.nodes.size > 0) return effectiveHighlights.links.has(id) ? 1 : 0.02;
        return 0.7;
      });
    
    svg.selectAll<SVGLineElement, D3Link>(".flow-line").each(function(d) {
      const source = d.source as D3Node; const target = d.target as D3Node;
      const isKey = source.isPowerCenter || target.isPowerCenter || source.isKeyRitual || target.isKeyRitual;
      const isHovered = hoveredNodeId === source.id || hoveredNodeId === target.id;
      const speed = (isKey ? 2 : 1) * flowSpeed * (isHovered ? 1.5 : 1);
      const duration = 20 / speed;
      d3.select(this).select("animate").attr("dur", `${duration}s`);
    });
  }, [effectiveHighlights, hoveredNodeId, flowIntensity, flowSpeed, flowThickness, hideWeakFlows, labelMode]);

  const handleZoomIn = () => {
    if (svgRef.current && zoomRef.current) d3.select(svgRef.current).transition().call(zoomRef.current.scaleBy, 1.5);
  };
  const handleZoomOut = () => {
    if (svgRef.current && zoomRef.current) d3.select(svgRef.current).transition().call(zoomRef.current.scaleBy, 0.75);
  };
  const handleReset = () => {
    if (svgRef.current && zoomRef.current) d3.select(svgRef.current).transition().call(zoomRef.current.transform, d3.zoomIdentity);
  };

  return (
    <div className="w-full min-h-[400px] lg:h-full bg-black/40 rounded-2xl overflow-hidden border border-white/10 shadow-2xl backdrop-blur-sm relative">
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
        <button onClick={handleZoomIn} className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors text-white/70" title="Zoom In">
          <ZoomIn className="w-4 h-4" />
        </button>
        <button onClick={handleZoomOut} className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors text-white/70" title="Zoom Out">
          <ZoomOut className="w-4 h-4" />
        </button>
        <button onClick={handleReset} className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors text-white/70" title="Reset Zoom">
          <Maximize className="w-4 h-4" />
        </button>
      </div>
      <svg id="main-graph-svg" ref={svgRef} className="w-full min-h-[400px] lg:h-full touch-none" />
    </div>
  );
};

export default GraphVisualization;
