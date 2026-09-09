import React, { useState } from 'react';
import { GhostSketch } from '../types';
import { Sparkles, X, Loader2, AlertCircle, Cpu } from 'lucide-react';

interface AIDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyGhostSketch: (sketch: GhostSketch) => void;
  theme: string;
}

export const AIDraftModal: React.FC<AIDraftModalProps> = ({
  isOpen,
  onClose,
  onApplyGhostSketch,
  theme,
}) => {
  const [prompt, setPrompt] = useState('3 bedroom, 1200 sqft, south entrance');
  const [model, setModel] = useState('gpt-4.1-mini');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setError(null);
    const trimmed = prompt.trim();
    if (!trimmed) {
      setError('Please enter a floor plan description');
      return;
    }
    if (trimmed.length > 4000) {
      setError('Description exceeds the maximum limit of 4,000 characters');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed, model }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      const sketch: GhostSketch = {
        title: data.title || `AI Concept: ${trimmed.slice(0, 30)}`,
        description: data.description || 'Reviewable AI Ghost Sketch',
        rooms: data.rooms || [],
        walls: data.walls || [],
        furniture: data.furniture || [],
      };

      onApplyGhostSketch(sketch);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Unable to connect to AI generation server');
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    '3 bedroom, 1200 sqft, south entrance',
    'Modern minimalist 2 bed bungalow with open kitchen and terrace',
    'Compact studio apartment with kitchen island and luxury bath',
    '4 bedroom family villa with central courtyard and master suite',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div
        id="ai-draft-modal"
        className="w-full max-w-lg bg-white dark:bg-[#1E2536] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                AI Draftsperson
              </h2>
              <p className="text-[11px] text-slate-500">
                Generate reviewable architectural ghost sketches
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Floor Plan Description
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {prompt.length}/4000
              </span>
            </div>
            <textarea
              id="ai-prompt-input"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. 3 bedroom, 1200 sqft, south entrance, open-concept kitchen..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Quick Prompts */}
          <div>
            <span className="text-[11px] text-slate-400 block mb-1.5">Suggestions:</span>
            <div className="flex flex-wrap gap-1.5">
              {samplePrompts.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(s)}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 transition-colors text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Model Selector */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-slate-500" />
              <div>
                <div className="text-xs font-medium text-slate-800 dark:text-slate-200">AI Model</div>
                <div className="text-[10px] text-slate-400">Target server drafting engine</div>
              </div>
            </div>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium cursor-pointer"
            >
              <option value="gpt-4.1-mini">gpt-4.1-mini (Default)</option>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            </select>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs border border-red-200 dark:border-red-900/40">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/80 dark:border-blue-900/30 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            Draftlight's AI workflow is non-destructive. The generated rooms and walls will first appear as a reviewable ghost sketch on your canvas before you decide to apply them.
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
          >
            Cancel
          </button>
          <button
            id="btn-generate-ghost"
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors shadow-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing Plan...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Ghost</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
