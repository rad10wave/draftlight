import React from 'react';
import { LayerConfig, LayerId } from '../types';
import { Eye, EyeOff, Lock, Unlock } from 'lucide-react';

interface LayersPanelProps {
  layers: Record<LayerId, LayerConfig>;
  onUpdateLayer: (layerId: LayerId, updates: Partial<LayerConfig>) => void;
  theme: string;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  onUpdateLayer,
  theme,
}) => {
  const layerList: LayerConfig[] = Object.values(layers);
  const isDark = theme === 'trace';

  return (
    <div id="draftlight-layers-panel" className="p-3 text-xs space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <h3 className="font-semibold tracking-tight text-slate-900 dark:text-slate-100">Project Layers</h3>
        <span className="text-[11px] text-slate-400">{layerList.length} layers</span>
      </div>

      <div className="space-y-2.5">
        {layerList.map((layer) => {
          return (
            <div
              key={layer.id}
              className={`p-2.5 rounded-lg border transition-all ${
                layer.visible
                  ? isDark
                    ? 'bg-slate-800/50 border-slate-700/80'
                    : 'bg-white border-slate-200/80 shadow-2xs'
                  : 'bg-slate-100/50 dark:bg-slate-900/40 border-dashed border-slate-300 dark:border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                  {layer.name}
                </span>

                <div className="flex items-center gap-1">
                  {/* Visibility Button */}
                  <button
                    id={`btn-layer-vis-${layer.id}`}
                    onClick={() => onUpdateLayer(layer.id, { visible: !layer.visible })}
                    title={layer.visible ? 'Hide layer' : 'Show layer'}
                    className={`p-1 rounded transition-colors ${
                      layer.visible
                        ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                        : 'text-slate-400 hover:bg-black/5 dark:hover:bg-white/10'
                    }`}
                  >
                    {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  {/* Lock Button */}
                  <button
                    id={`btn-layer-lock-${layer.id}`}
                    onClick={() => onUpdateLayer(layer.id, { locked: !layer.locked })}
                    title={layer.locked ? 'Unlock layer' : 'Lock layer'}
                    className={`p-1 rounded transition-colors ${
                      layer.locked
                        ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30'
                        : 'text-slate-400 hover:bg-black/5 dark:hover:bg-white/10'
                    }`}
                  >
                    {layer.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Opacity Slider (20% to 100%) */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span className="w-12">Opacity:</span>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={layer.opacity}
                  onChange={(e) =>
                    onUpdateLayer(layer.id, { opacity: parseFloat(e.target.value) })
                  }
                  className="w-full h-1 accent-blue-600 cursor-pointer"
                />
                <span className="w-8 text-right font-mono">
                  {Math.round(layer.opacity * 100)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
        Locked and hidden layers prevent accidental selections and canvas modifications. AI Ghost Sketch is locked by default.
      </p>
    </div>
  );
};
