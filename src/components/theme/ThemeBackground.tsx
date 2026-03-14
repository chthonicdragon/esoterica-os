// src/components/theme/ThemeBackground.tsx
import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

export function ThemeBackground() {
  const { theme } = useTheme();
  
  return (
    <div className="fixed inset-0 -z-50 overflow-hidden bg-background">
      <AnimatePresence mode="wait">
        <motion.div
          key={theme.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0"
        >
          {theme.backgroundType === 'geometric' && <GeometricEngine />}
          {theme.backgroundType === 'particles' && <ParticlesEngine />}
          {theme.backgroundType === 'nebula' && <NebulaEngine />}
          {theme.backgroundType === 'matrix' && <MatrixEngine />}
          {theme.backgroundType === 'waves' && <WavesEngine />}
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background pointer-events-none" />
    </div>
  );
}

function GeometricEngine() {
  return (
    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03]">
      <svg className="w-[80%] h-[80%] text-primary animate-spin-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor">
        <circle cx="50%" cy="50%" r="40" />
        <circle cx="50%" cy="50%" r="30" />
        <circle cx="50%" cy="50%" r="20" />
        <line x1="10%" y1="50%" x2="90%" y2="50%" />
        <line x1="50%" y1="10%" x2="50%" y2="90%" />
        <line x1="15%" y1="15%" x2="85%" y2="85%" />
        <line x1="85%" y1="15%" x2="15%" y2="85%" />
      </svg>
    </div>
  );
}

function ParticlesEngine() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Array<{ x: number; y: number; size: number; speedX: number; speedY: number; opacity: number }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      particles = [];
      for (let i = 0; i < 50; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 1,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: (Math.random() - 0.5) * 0.5,
          opacity: Math.random() * 0.5 + 0.1,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#8b5cf6';
      
      particles.forEach((p) => {
        ctx.globalAlpha = p.opacity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    resize();
    createParticles();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 opacity-20" />;
}

function NebulaEngine() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[50%] h-[50%] rounded-full bg-accent/5 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
    </div>
  );
}

function MatrixEngine() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const chars = '✦⊕✨🔯🔯🔯🔯🔯';
    const fontSize = 14;
    let columns: number[];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      columns = Array(Math.floor(canvas.width / fontSize)).fill(1);
    };

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#8b5cf6';
      ctx.font = `${fontSize}px serif`;

      columns.forEach((y, i) => {
        const text = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        ctx.fillText(text, x, y * fontSize);

        if (y * fontSize > canvas.height && Math.random() > 0.975) {
          columns[i] = 0;
        }
        columns[i]++;
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    resize();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 opacity-[0.08]" />;
}

function WavesEngine() {
  return (
    <div className="absolute inset-0 opacity-[0.05]">
      <svg className="absolute bottom-0 w-full h-64" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path
          fill="currentColor"
          className="text-primary"
          d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,128,576,122.7C672,117,768,181,864,181.3C960,181,1056,117,1152,90.7C1248,64,1344,75,1392,80L1440,85.3L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        >
          <animate attributeName="d" dur="10s" repeatCount="indefinite" values="
            M0,160L48,176C96,192,192,224,288,213.3C384,203,480,128,576,122.7C672,117,768,181,864,181.3C960,181,1056,117,1152,90.7C1248,64,1344,75,1392,80L1440,85.3L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z;
            M0,192L48,197.3C96,203,192,208,288,186.7C384,165,480,117,576,128C672,139,768,261,864,245.3C960,229,1056,75,1152,64C1248,53,1344,187,1392,245.3L1440,304L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z;
            M0,160L48,176C96,192,192,224,288,213.3C384,203,480,128,576,122.7C672,117,768,181,864,181.3C960,181,1056,117,1152,90.7C1248,64,1344,75,1392,80L1440,85.3L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z
          " />
        </path>
      </svg>
    </div>
  );
}
