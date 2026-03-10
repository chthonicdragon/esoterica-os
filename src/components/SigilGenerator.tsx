
import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, RefreshCw, Save, Sparkles } from 'lucide-react';
import { Node } from '../services/openRouterService';
import { drawSigil } from '../utils/sigilGeneration';

interface SigilGeneratorProps {
  sourceNode: Node;
  onClose: () => void;
  onSave: (sigilData: { name: string; imageUrl: string; description: string }) => void;
}

export const SigilGenerator: React.FC<SigilGeneratorProps> = ({ sourceNode, onClose, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [seedOffset, setSeedOffset] = useState(0);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [sigilName, setSigilName] = useState(`Sigil of ${sourceNode.name}`);
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = () => {
    setIsGenerating(true);
    // Small delay to allow UI to update if we were doing heavy computation, 
    // but canvas drawing is fast enough.
    setTimeout(() => {
      if (canvasRef.current) {
        drawSigil(canvasRef.current, {
          name: sourceNode.name,
          type: sourceNode.type,
          element: sourceNode.element,
          planet: sourceNode.planet,
          seedOffset: seedOffset
        });
        setGeneratedImage(canvasRef.current.toDataURL('image/png'));
      }
      setIsGenerating(false);
    }, 50);
  };

  useEffect(() => {
    generate();
  }, [seedOffset]);

  const handleRegenerate = () => {
    setSeedOffset(prev => prev + 1);
  };

  const handleSave = () => {
    if (generatedImage) {
      onSave({
        name: sigilName,
        imageUrl: generatedImage,
        description: `Procedurally generated sigil for ${sourceNode.name}.\nAttributes: ${sourceNode.element || 'None'}, ${sourceNode.planet || 'None'}.`
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-[#0b0f19] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Sigil Generator</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center gap-6">
          <div className="relative group">
            <canvas 
              ref={canvasRef} 
              width={300} 
              height={300} 
              className="rounded-xl border border-white/10 bg-black/40 shadow-[0_0_30px_rgba(20,184,166,0.1)]"
            />
            {/* Glow effect behind */}
            <div className="absolute -inset-4 bg-teal-500/10 blur-xl -z-10 rounded-full opacity-50" />
          </div>

          <div className="w-full space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 block mb-1">Sigil Name</label>
              <input 
                value={sigilName} 
                onChange={(e) => setSigilName(e.target.value)} 
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:border-teal-500/50 outline-none transition-colors"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground/60">
              <div className="bg-white/5 rounded px-2 py-1 border border-white/5">
                <span className="font-bold uppercase text-[9px]">Source:</span> {sourceNode.name}
              </div>
              <div className="bg-white/5 rounded px-2 py-1 border border-white/5">
                <span className="font-bold uppercase text-[9px]">Planet:</span> {sourceNode.planet || 'None'}
              </div>
              <div className="bg-white/5 rounded px-2 py-1 border border-white/5">
                <span className="font-bold uppercase text-[9px]">Element:</span> {sourceNode.element || 'None'}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/5 flex justify-between gap-3">
          <button 
            onClick={handleRegenerate}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-foreground transition-all text-xs font-bold uppercase tracking-wider"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </button>
          <button 
            onClick={handleSave}
            className="flex-[2] flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/30 text-teal-400 transition-all text-xs font-bold uppercase tracking-wider"
          >
            <Save className="w-3.5 h-3.5" />
            Save to Graph
          </button>
        </div>
      </motion.div>
    </div>
  );
};
