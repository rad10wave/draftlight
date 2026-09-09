import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'V', desc: 'Select, move, inspect, and edit existing geometry' },
    { key: 'W', desc: 'Draw wall segments by dragging' },
    { key: 'O', desc: 'Place architectural door opening cuts on walls' },
    { key: 'U', desc: 'Place architectural window opening cuts and sills on walls' },
    { key: 'R', desc: 'Draw rectangular rooms with connected perimeter walls' },
    { key: 'D', desc: 'Measure distance between two points' },
    { key: 'F', desc: 'Open scaled architectural furniture library' },
    { key: 'C', desc: 'Scale the complete plan from a known reference distance' },
    { key: 'A', desc: 'Open the AI drafting prompt for reviewable ghost sketches' },
    { key: 'M', desc: 'Add review markup lines and sticky notes' },
    { key: 'Escape', desc: 'Cancel in-progress drawing or return to Select' },
    { key: 'Ctrl / ⌘ + Z', desc: 'Undo up to 30 editing snapshots' },
    { key: 'Ctrl / ⌘ + Shift + Z / Y', desc: 'Redo previously undone action' },
    { key: 'Ctrl / ⌘ + D', desc: 'Duplicate selected furniture item' },
    { key: 'Ctrl / ⌘ + S', desc: 'Download current project (.draftlight.json)' },
    { key: 'Delete / Backspace', desc: 'Delete selected element' },
    { key: 'Arrow Keys', desc: 'Nudge selected geometry by 1 cm (0.01m)' },
    { key: 'Shift + Arrow Keys', desc: 'Nudge selected geometry by 10 cm (0.10m)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div
        id="shortcuts-reference-modal"
        className="w-full max-w-md bg-white dark:bg-[#1E2536] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 max-h-[70vh] overflow-y-auto space-y-2">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs"
            >
              <span className="text-slate-600 dark:text-slate-300">{s.desc}</span>
              <kbd className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold border border-slate-200 dark:border-slate-700 shadow-2xs whitespace-nowrap ml-3">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
