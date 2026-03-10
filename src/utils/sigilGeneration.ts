
// Map elements to colors and stroke styles
const ELEMENT_STYLES: Record<string, { color: string; glow: string }> = {
  Fire: { color: '#ef4444', glow: '#f87171' }, // Red
  Water: { color: '#3b82f6', glow: '#60a5fa' }, // Blue
  Air: { color: '#f59e0b', glow: '#fbbf24' }, // Yellow/Amber
  Earth: { color: '#10b981', glow: '#34d399' }, // Green
  Spirit: { color: '#a855f7', glow: '#c084fc' }, // Purple
  default: { color: '#14b8a6', glow: '#2dd4bf' } // Teal
};

// Map planets to geometric base shapes
const PLANET_SHAPES: Record<string, string> = {
  Saturn: 'hexagon',
  Jupiter: 'square',
  Mars: 'triangle',
  Sun: 'circle',
  Venus: 'heptagon',
  Mercury: 'star',
  Moon: 'crescent',
  default: 'circle'
};

// Simple pseudo-random number generator with seed
class Random {
  private seed: number;

  constructor(seed: string) {
    this.seed = this.hashString(seed);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  // Returns float between 0 and 1
  next(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  // Returns int between min and max (inclusive)
  range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Returns true/false
  bool(): boolean {
    return this.next() > 0.5;
  }
}

interface SigilAttributes {
  name: string;
  type: string;
  element?: string;
  planet?: string;
  intention?: string;
  seedOffset?: number;
}

export function drawSigil(canvas: HTMLCanvasElement, attrs: SigilAttributes) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  const cx = width / 2;
  const cy = height / 2;
  // Use a separator to prevent "Text" + "1" colliding with "Text1" + "0"
  const rng = new Random(`${attrs.name}::${attrs.seedOffset || 0}`);

  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Background gradient (subtle)
  const gradient = ctx.createRadialGradient(cx, cy, 10, cx, cy, width / 2);
  
  // Dynamic color based on element/planet
  let baseHue = 180; // Default Teal
  if (attrs.element === 'Fire' || attrs.planet === 'Mars' || attrs.planet === 'Sun') baseHue = 0; // Red
  else if (attrs.element === 'Water' || attrs.planet === 'Moon' || attrs.planet === 'Neptune') baseHue = 220; // Blue
  else if (attrs.element === 'Air' || attrs.planet === 'Mercury' || attrs.planet === 'Uranus') baseHue = 60; // Yellow
  else if (attrs.element === 'Earth' || attrs.planet === 'Saturn' || attrs.planet === 'Venus') baseHue = 120; // Green
  else if (attrs.element === 'Spirit' || attrs.planet === 'Jupiter' || attrs.planet === 'Pluto') baseHue = 280; // Purple
  
  // Add some randomness to hue based on seed
  baseHue = (baseHue + rng.range(-20, 20)) % 360;
  
  gradient.addColorStop(0, `hsla(${baseHue}, 70%, 70%, 0.1)`);
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Determine styles
  const planetShape = PLANET_SHAPES[attrs.planet || 'default'] || PLANET_SHAPES.default;
  const elementStyle = {
    color: `hsl(${baseHue}, 80%, 70%)`,
    glow: `hsl(${baseHue}, 90%, 60%)`
  };
  
  ctx.strokeStyle = elementStyle.color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = elementStyle.glow;
  ctx.shadowBlur = 10;

  // Helper to draw polygons
  const drawPolygon = (sides: number, radius: number, rotation = 0) => {
    ctx.beginPath();
    for (let i = 0; i <= sides; i++) {
      const angle = (i * 2 * Math.PI / sides) - (Math.PI / 2) + rotation;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  };

  // 1. Draw Base Shape (Planet)
  const baseRadius = width * 0.35;
  switch (planetShape) {
    case 'hexagon': drawPolygon(6, baseRadius); break;
    case 'square': drawPolygon(4, baseRadius, Math.PI / 4); break;
    case 'triangle': drawPolygon(3, baseRadius); break;
    case 'heptagon': drawPolygon(7, baseRadius); break;
    case 'star':
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? baseRadius : baseRadius * 0.5;
        const angle = (i * Math.PI / 5) - (Math.PI / 2);
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      break;
    case 'crescent':
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius, 0.2 * Math.PI, 1.8 * Math.PI);
      ctx.bezierCurveTo(cx - baseRadius * 0.5, cy + baseRadius, cx - baseRadius * 0.5, cy - baseRadius, cx + baseRadius * 0.9, 0.2 * Math.PI);
      ctx.stroke();
      break;
    default: // Circle
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
      ctx.stroke();
  }

  // 2. Inner Lines (Intention/Name based)
  // Generate random points on the circle
  const numPoints = rng.range(3, 7);
  const points: {x: number, y: number}[] = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = rng.next() * Math.PI * 2;
    const r = rng.range(baseRadius * 0.2, baseRadius * 0.9);
    points.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle)
    });
  }

  ctx.beginPath();
  if (points.length > 0) ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    if (rng.bool()) {
      // Curve
      const cpX = (points[i-1].x + points[i].x) / 2 + (rng.next() - 0.5) * 50;
      const cpY = (points[i-1].y + points[i].y) / 2 + (rng.next() - 0.5) * 50;
      ctx.quadraticCurveTo(cpX, cpY, points[i].x, points[i].y);
    } else {
      // Line
      ctx.lineTo(points[i].x, points[i].y);
    }
  }
  // Connect back to start sometimes
  if (rng.bool()) ctx.lineTo(points[0].x, points[0].y);
  ctx.stroke();

  // 3. Decorations (Circles at ends)
  points.forEach(p => {
    if (rng.next() > 0.7) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, rng.range(2, 5), 0, Math.PI * 2);
      ctx.fillStyle = elementStyle.color;
      ctx.fill();
    }
  });

  // 4. Outer Rings (Strength)
  const rings = rng.range(1, 2);
  ctx.lineWidth = 1;
  for (let i = 1; i <= rings; i++) {
    ctx.beginPath();
    ctx.arc(cx, cy, baseRadius + (i * 15), 0, Math.PI * 2);
    if (rng.bool()) {
      ctx.setLineDash([5, 10]); // Dashed ring
    } else {
      ctx.setLineDash([]);
    }
    ctx.stroke();
  }
  ctx.setLineDash([]); // Reset

  // 5. Central Glyph (Simple letters/runes abstraction)
  ctx.font = '24px serif';
  ctx.fillStyle = elementStyle.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Draw first letter of name in center if desired, or just a symbol
  // ctx.fillText(attrs.name[0].toUpperCase(), cx, cy);
}
