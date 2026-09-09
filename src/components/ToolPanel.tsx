import React from 'react';
import { DraftTool } from '../types';
import {
  MousePointer2,
  Square,
  Sparkles,
  Armchair,
  Ruler,
  Scaling,
  PenTool,
  ChevronLeft,
  ChevronRight,
  SplitSquareVertical,
  DoorClosed,
  AppWindow,
} from 'lucide-react';

interface ToolPanelProps {
  activeTool: DraftTool;
  onSelectTool: (tool: DraftTool) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  theme: string;
}

interface ToolItem {
  id: DraftTool;
  label: string;
  shortcut: string;
  icon: React.ElementType;
  description: string;
}

const TOOLS: ToolItem[] = [
  {
    id: 'select',
    label: 'Select',
    shortcut: 'V',
    icon: MousePointer2,
    description: 'Select, move, inspect, and edit existing geometry',
  },
  {
    id: 'wall',
    label: 'Wall',
    shortcut: 'W',
    icon: SplitSquareVertical,
    description: 'Draw scaled wall segments by dragging',
  },
  {
    id: 'door',
    label: 'Door Cut',
    shortcut: 'O',
    icon: DoorClosed,
    description: 'Place clean architectural swing door opening cuts directly onto walls',
  },
  {
    id: 'window',
    label: 'Window Cut',
    shortcut: 'U',
    icon: AppWindow,
    description: 'Place architectural window opening cuts and sills directly onto walls',
  },
  {
    id: 'room',
    label: 'Room',
    shortcut: 'R',
    icon: Square,
    description: 'Draw rectangular rooms with connected perimeter walls',
  },
  {
    id: 'measure',
    label: 'Measure',
    shortcut: 'D',
    icon: Ruler,
    description: 'Measure distances between two points',
  },
  {
    id: 'furniture',
    label: 'Furniture',
    shortcut: 'F',
    icon: Armchair,
    description: 'Open scaled architectural furniture library',
  },
  {
    id: 'calibrate',
    label: 'Calibrate',
    shortcut: 'C',
    icon: Scaling,
    description: 'Scale complete plan from a known reference distance',
  },
  {
    id: 'ai',
    label: 'AI Draft',
    shortcut: 'A',
    icon: Sparkles,
    description: 'Open AI drafting prompt for reviewable ghost sketch',
  },
  {
    id: 'redline',
    label: 'Redline',
    shortcut: 'M',
    icon: PenTool,
    description: 'Add review markup lines and sticky notes',
  },
];

export const ToolPanel: React.FC<ToolPanelProps> = ({
  activeTool,
  onSelectTool,
  isCollapsed,
  onToggleCollapse,
  theme,
}) => {
  const isDark = theme === 'trace';

  return (
    <aside
      id="draftlight-tool-panel"
      className={`border-r transition-all duration-200 select-none flex flex-col justify-between z-20 ${
        isCollapsed ? 'w-14' : 'w-48'
      } ${
        isDark
          ? 'bg-[#121824] border-slate-800 text-slate-200'
          : theme === 'classic'
          ? 'bg-[#F9F6F0] border-amber-900/15 text-stone-800'
          : 'bg-white/95 backdrop-blur border-slate-200 text-slate-800'
      }`}
    >
      <div className="p-2 space-y-1">
        {TOOLS.map((t) => {
          const Icon = t.icon;
          const isActive = activeTool === t.id;
          return (
            <button
              key={t.id}
              id={`tool-btn-${t.id}`}
              onClick={() => onSelectTool(t.id)}
              title={`${t.label} (${t.shortcut}) — ${t.description}`}
              className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-xs font-medium transition-all group relative ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full">
                  <span className="truncate">{t.label}</span>
                  <kbd
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      isActive
                        ? 'bg-blue-700 text-blue-100'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {t.shortcut}
                  </kbd>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Collapse / Expand Button */}
      <div className="p-2 border-t border-slate-200/60 dark:border-slate-800/60">
        <button
          id="btn-collapse-tool-panel"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand tool panel' : 'Collapse tool panel'}
          className="w-full flex items-center justify-center p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
