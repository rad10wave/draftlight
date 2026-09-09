import React from 'react';
import {
  DesignTab,
  SelectedElement,
  Room,
  Wall,
  WallOpening,
  OpeningType,
  FurnitureItem,
  DimensionItem,
  RedlineItem,
} from '../types';
import { formatArea, formatDistance } from '../utils/units';
import {
  RotateCw,
  Copy,
  Trash2,
  Lock,
  Unlock,
  Sliders,
  Maximize2,
  Info,
  Layers,
  DoorClosed,
  Plus,
  RotateCcw,
  ArrowLeftRight,
  Move,
} from 'lucide-react';

interface InspectorProps {
  activeTab: DesignTab;
  selectedElement: SelectedElement;
  onSelectElement?: (el: SelectedElement) => void;
  onUpdateRoom: (id: string, updates: Partial<Room>) => void;
  onDeleteRoom: (id: string) => void;
  onUpdateWall: (id: string, updates: Partial<Wall>) => void;
  onDeleteWall: (id: string) => void;
  onUpdateFurniture: (id: string, updates: Partial<FurnitureItem>) => void;
  onRotateFurniture: (id: string) => void;
  onDuplicateFurniture: (id: string) => void;
  onDeleteFurniture: (id: string) => void;
  onUpdateDimension: (id: string, updates: Partial<DimensionItem>) => void;
  onDeleteDimension: (id: string) => void;
  onUpdateRedline: (id: string, updates: Partial<RedlineItem>) => void;
  onDeleteRedline: (id: string) => void;
  onUpdateTabName: (name: string) => void;
  theme: string;
}

export const Inspector: React.FC<InspectorProps> = ({
  activeTab,
  selectedElement,
  onSelectElement,
  onUpdateRoom,
  onDeleteRoom,
  onUpdateWall,
  onDeleteWall,
  onUpdateFurniture,
  onRotateFurniture,
  onDuplicateFurniture,
  onDeleteFurniture,
  onUpdateDimension,
  onDeleteDimension,
  onUpdateRedline,
  onDeleteRedline,
  onUpdateTabName,
  theme,
}) => {
  const isDark = theme === 'trace';

  if (!activeTab) {
    return (
      <div id="draftlight-inspector" className="p-4 text-xs text-slate-400">
        No active design tab selected.
      </div>
    );
  }

  // Find active selected entity
  const room = selectedElement?.type === 'room'
    ? (activeTab.rooms || []).find((r) => r.id === selectedElement.id)
    : null;
  const wall = selectedElement?.type === 'wall'
    ? (activeTab.walls || []).find((w) => w.id === selectedElement.id)
    : null;
  const openingWall = selectedElement?.type === 'opening'
    ? (activeTab.walls || []).find((w) => w.id === selectedElement.wallId)
    : null;
  const opening = openingWall?.openings?.find((o) => o.id === selectedElement.openingId) || null;
  const furniture = selectedElement?.type === 'furniture'
    ? (activeTab.furniture || []).find((f) => f.id === selectedElement.id)
    : null;
  const dimension = selectedElement?.type === 'dimension'
    ? (activeTab.dimensions || []).find((d) => d.id === selectedElement.id)
    : null;
  const redline = selectedElement?.type === 'redline'
    ? (activeTab.redlines || []).find((r) => r.id === selectedElement.id)
    : null;

  const handleAddOpeningToWall = (targetWall: Wall, type: OpeningType) => {
    const wallLen = Math.hypot(targetWall.x2 - targetWall.x1, targetWall.y2 - targetWall.y1);
    let opWidth = 0.9;
    let defaultLabel = 'Door Cut';

    if (type === 'double-door') {
      opWidth = Math.min(wallLen * 0.8, 1.8);
      defaultLabel = 'Double French Door';
    } else if (type === 'sliding') {
      opWidth = Math.min(wallLen * 0.8, 2.0);
      defaultLabel = 'Sliding Patio Door';
    } else if (type === 'pocket') {
      opWidth = Math.min(wallLen * 0.6, 0.9);
      defaultLabel = 'Pocket In-Wall Door';
    } else if (type === 'bifold') {
      opWidth = Math.min(wallLen * 0.7, 1.2);
      defaultLabel = 'Bifold Accordion Door';
    } else if (type === 'window') {
      opWidth = Math.min(wallLen * 0.6, 1.2);
      defaultLabel = 'Architectural Window';
    } else {
      opWidth = Math.min(wallLen * 0.6, 0.9);
      defaultLabel = 'Single Swing Door';
    }

    const initialDist = Math.max(opWidth / 2 + 0.05, Math.min(wallLen - opWidth / 2 - 0.05, wallLen / 2));
    const newOpening: WallOpening = {
      id: `op-${Date.now()}`,
      type,
      distanceAlongWall: Math.round(initialDist * 100) / 100,
      width: Math.round(opWidth * 100) / 100,
      height: type === 'window' ? 1.2 : 2.1,
      sillHeight: type === 'window' ? 0.9 : 0,
      swingDirection: 'right',
      swingOrientation: 'in',
      swingAngle: 90,
      label: defaultLabel,
    };
    const updated = [...(targetWall.openings || []), newOpening];
    onUpdateWall(targetWall.id, { openings: updated });
    if (onSelectElement) {
      onSelectElement({ type: 'opening', wallId: targetWall.id, openingId: newOpening.id });
    }
  };

  const handleUpdateOpening = (updates: Partial<WallOpening>) => {
    if (!openingWall || !opening) return;
    const updated = (openingWall.openings || []).map((o) =>
      o.id === opening.id ? { ...o, ...updates } : o
    );
    onUpdateWall(openingWall.id, { openings: updated });
  };

  const handleDeleteOpening = () => {
    if (!openingWall || !opening) return;
    const updated = (openingWall.openings || []).filter((o) => o.id !== opening.id);
    onUpdateWall(openingWall.id, { openings: updated });
    if (onSelectElement) {
      onSelectElement(null);
    }
  };

  return (
    <div id="draftlight-inspector" className="p-3 text-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <h3 className="font-semibold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-blue-600" />
          <span>Inspector</span>
        </h3>
        {selectedElement ? (
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            {selectedElement.type}
          </span>
        ) : (
          <span className="text-[11px] text-slate-400">Plan Properties</span>
        )}
      </div>

      {/* Room Inspector */}
      {room && (
        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-slate-500 font-medium">Room Name</label>
            <input
              type="text"
              value={room.name}
              onChange={(e) => onUpdateRoom(room.id, { name: e.target.value })}
              className="mt-1 w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-black/5 dark:bg-white/5 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-500">Width (m)</label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="50"
                value={room.width}
                onChange={(e) => onUpdateRoom(room.id, { width: parseFloat(e.target.value) || 1 })}
                className="mt-1 w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-black/5 dark:bg-white/5 font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Depth (m)</label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="50"
                value={room.depth}
                onChange={(e) => onUpdateRoom(room.id, { depth: parseFloat(e.target.value) || 1 })}
                className="mt-1 w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-black/5 dark:bg-white/5 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-500">Pos X (m)</label>
              <input
                type="number"
                step="0.1"
                value={room.x}
                onChange={(e) => onUpdateRoom(room.id, { x: parseFloat(e.target.value) || 0 })}
                className="mt-1 w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-black/5 dark:bg-white/5 font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Pos Y (m)</label>
              <input
                type="number"
                step="0.1"
                value={room.y}
                onChange={(e) => onUpdateRoom(room.id, { y: parseFloat(e.target.value) || 0 })}
                className="mt-1 w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-black/5 dark:bg-white/5 font-mono"
              />
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-300">Room Area</span>
            <span className="font-semibold text-blue-700 dark:text-blue-300 font-mono">
              {formatArea(room.width * room.depth, activeTab.units)}
            </span>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={() => onUpdateRoom(room.id, { locked: !room.locked })}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5"
            >
              {room.locked ? <Lock className="w-3.5 h-3.5 text-amber-500" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>{room.locked ? 'Locked' : 'Unlocked'}</span>
            </button>

            <button
              onClick={() => onDeleteRoom(room.id)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Room</span>
            </button>
          </div>
        </div>
      )}

      {/* Wall Inspector */}
      {wall && (() => {
        const wallLength = Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1);
        const wallAngleDeg = Math.round((Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1) * 180 / Math.PI + 360) % 360);
        const wallCenterX = Number(((wall.x1 + wall.x2) / 2).toFixed(2));
        const wallCenterY = Number(((wall.y1 + wall.y2) / 2).toFixed(2));

        const handleLengthChange = (newLen: number) => {
          if (newLen <= 0.05) return;
          const rad = Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1);
          onUpdateWall(wall.id, {
            x2: Number((wall.x1 + newLen * Math.cos(rad)).toFixed(2)),
            y2: Number((wall.y1 + newLen * Math.sin(rad)).toFixed(2)),
          });
        };

        const handleAngleChange = (newAngleDeg: number) => {
          const rad = (newAngleDeg * Math.PI) / 180;
          onUpdateWall(wall.id, {
            x2: Number((wall.x1 + wallLength * Math.cos(rad)).toFixed(2)),
            y2: Number((wall.y1 + wallLength * Math.sin(rad)).toFixed(2)),
          });
        };

        const handleCenterXChange = (newCx: number) => {
          const halfDx = (wall.x2 - wall.x1) / 2;
          onUpdateWall(wall.id, {
            x1: Number((newCx - halfDx).toFixed(2)),
            x2: Number((newCx + halfDx).toFixed(2)),
          });
        };

        const handleCenterYChange = (newCy: number) => {
          const halfDy = (wall.y2 - wall.y1) / 2;
          onUpdateWall(wall.id, {
            y1: Number((newCy - halfDy).toFixed(2)),
            y2: Number((newCy + halfDy).toFixed(2)),
          });
        };

        const handleRotateWall = (degrees: number) => {
          const cx = (wall.x1 + wall.x2) / 2;
          const cy = (wall.y1 + wall.y2) / 2;
          const rad = (degrees * Math.PI) / 180;
          const cos = Math.cos(rad);
          const sin = Math.sin(rad);

          const dx1 = wall.x1 - cx;
          const dy1 = wall.y1 - cy;
          const dx2 = wall.x2 - cx;
          const dy2 = wall.y2 - cy;

          onUpdateWall(wall.id, {
            x1: Number((cx + dx1 * cos - dy1 * sin).toFixed(2)),
            y1: Number((cy + dx1 * sin + dy1 * cos).toFixed(2)),
            x2: Number((cx + dx2 * cos - dy2 * sin).toFixed(2)),
            y2: Number((cy + dx2 * sin + dy2 * cos).toFixed(2)),
          });
        };

        const handleFlipDirection = () => {
          onUpdateWall(wall.id, {
            x1: wall.x2,
            y1: wall.y2,
            x2: wall.x1,
            y2: wall.y1,
          });
        };

        const handleSnapOrtho = (axis: 'horizontal' | 'vertical') => {
          if (axis === 'horizontal') {
            onUpdateWall(wall.id, {
              y2: wall.y1,
              x2: Number((wall.x1 + (wall.x2 >= wall.x1 ? wallLength : -wallLength)).toFixed(2)),
            });
          } else {
            onUpdateWall(wall.id, {
              x2: wall.x1,
              y2: Number((wall.y1 + (wall.y2 >= wall.y1 ? wallLength : -wallLength)).toFixed(2)),
            });
          }
        };

        return (
          <div className="space-y-3">
            {/* Dimensions & Orientation (Length & Angle) */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-500 font-medium">Wall Length (m)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="100"
                  value={Number(wallLength.toFixed(2))}
                  onChange={(e) => handleLengthChange(parseFloat(e.target.value) || 0.5)}
                  className="mt-1 w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-black/5 dark:bg-white/5 font-mono text-xs font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 font-medium">Angle / Orientation</label>
                <div className="relative mt-1">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="360"
                    value={wallAngleDeg}
                    onChange={(e) => handleAngleChange((parseFloat(e.target.value) || 0) % 360)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-black/5 dark:bg-white/5 font-mono text-xs font-semibold pr-6"
                  />
                  <span className="absolute right-2 top-1.5 text-xs text-slate-400">°</span>
                </div>
              </div>
            </div>

            {/* Wall Position (Center X & Center Y) - Moves entire wall */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-500 font-medium">Center X (m)</label>
                <input
                  type="number"
                  step="0.05"
                  value={wallCenterX}
                  onChange={(e) => handleCenterXChange(parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-black/5 dark:bg-white/5 font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 font-medium">Center Y (m)</label>
                <input
                  type="number"
                  step="0.05"
                  value={wallCenterY}
                  onChange={(e) => handleCenterYChange(parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-black/5 dark:bg-white/5 font-mono text-xs"
                />
              </div>
            </div>

            {/* Quick Rotation & Alignment Tools */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-500 font-medium">Quick Orientation</label>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleRotateWall(90)}
                  title="Rotate +90 degrees clockwise"
                  className="flex items-center justify-center gap-0.5 px-1.5 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5 text-[10px] font-medium"
                >
                  <RotateCw className="w-3 h-3 text-blue-600" />
                  <span>+90°</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRotateWall(-90)}
                  title="Rotate -90 degrees counter-clockwise"
                  className="flex items-center justify-center gap-0.5 px-1.5 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5 text-[10px] font-medium"
                >
                  <RotateCcw className="w-3 h-3 text-blue-600" />
                  <span>-90°</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSnapOrtho('horizontal')}
                  title="Align Wall Horizontally (0°)"
                  className="flex items-center justify-center px-1.5 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5 text-[10px] font-medium"
                >
                  Horiz
                </button>
                <button
                  type="button"
                  onClick={() => handleSnapOrtho('vertical')}
                  title="Align Wall Vertically (90°)"
                  className="flex items-center justify-center px-1.5 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5 text-[10px] font-medium"
                >
                  Vert
                </button>
              </div>
              <button
                type="button"
                onClick={handleFlipDirection}
                title="Swap Start and End Coordinates"
                className="w-full flex items-center justify-center gap-1 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5 text-[10px] text-slate-600 dark:text-slate-300 font-medium"
              >
                <ArrowLeftRight className="w-3 h-3" />
                <span>Reverse Direction (Swap Start / End)</span>
              </button>
            </div>

            {/* Start & End Endpoint Coordinates */}
            <div className="p-2.5 rounded-md bg-black/5 dark:bg-white/5 space-y-2 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                Endpoints Coordinates
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400">Start X (m)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={wall.x1}
                    onChange={(e) => onUpdateWall(wall.id, { x1: parseFloat(e.target.value) || 0 })}
                    className="mt-0.5 w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Start Y (m)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={wall.y1}
                    onChange={(e) => onUpdateWall(wall.id, { y1: parseFloat(e.target.value) || 0 })}
                    className="mt-0.5 w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[11px]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400">End X (m)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={wall.x2}
                    onChange={(e) => onUpdateWall(wall.id, { x2: parseFloat(e.target.value) || 0 })}
                    className="mt-0.5 w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">End Y (m)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={wall.y2}
                    onChange={(e) => onUpdateWall(wall.id, { y2: parseFloat(e.target.value) || 0 })}
                    className="mt-0.5 w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>

            {/* Thickness & Height */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-500">Thickness (m)</label>
                <select
                  value={wall.thickness}
                  onChange={(e) => onUpdateWall(wall.id, { thickness: parseFloat(e.target.value) })}
                  className="mt-1 w-full px-2 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-black/5 dark:bg-white/5 font-mono text-xs"
                >
                  <option value="0.10">0.10m (Partition)</option>
                  <option value="0.15">0.15m (Interior)</option>
                  <option value="0.20">0.20m (Exterior)</option>
                  <option value="0.30">0.30m (Structural)</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-500">Wall Height (m)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="20"
                  value={wall.height ?? 2.8}
                  onChange={(e) => onUpdateWall(wall.id, { height: parseFloat(e.target.value) || 2.8 })}
                  className="mt-1 w-full px-2 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-black/5 dark:bg-white/5 font-mono text-xs"
                />
              </div>
            </div>

            {/* Wall Cuts / Openings Management */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Wall Cuts & Openings ({wall.openings?.length || 0})
                </span>
              </div>

              {/* Quick Cut Add Buttons */}
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => handleAddOpeningToWall(wall, 'door')}
                  className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 hover:bg-blue-100 text-[10px] font-medium flex items-center justify-center gap-0.5 border border-blue-200 dark:border-blue-900/40"
                  title="Add single leaf swing door"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>Single Door</span>
                </button>
                <button
                  onClick={() => handleAddOpeningToWall(wall, 'double-door')}
                  className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 hover:bg-blue-100 text-[10px] font-medium flex items-center justify-center gap-0.5 border border-blue-200 dark:border-blue-900/40"
                  title="Add double French swing door"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>Double Door</span>
                </button>
                <button
                  onClick={() => handleAddOpeningToWall(wall, 'sliding')}
                  className="px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 text-[10px] font-medium flex items-center justify-center gap-0.5 border border-indigo-200 dark:border-indigo-900/40"
                  title="Add sliding bypass patio door"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>Sliding Door</span>
                </button>
                <button
                  onClick={() => handleAddOpeningToWall(wall, 'pocket')}
                  className="px-2 py-1 rounded bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-300 hover:bg-violet-100 text-[10px] font-medium flex items-center justify-center gap-0.5 border border-violet-200 dark:border-violet-900/40"
                  title="Add pocket in-wall door"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>Pocket Door</span>
                </button>
                <button
                  onClick={() => handleAddOpeningToWall(wall, 'bifold')}
                  className="px-2 py-1 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 text-[10px] font-medium flex items-center justify-center gap-0.5 border border-amber-200 dark:border-amber-900/40"
                  title="Add accordion bifold door"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>Bifold Door</span>
                </button>
                <button
                  onClick={() => handleAddOpeningToWall(wall, 'window')}
                  className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-100 text-[10px] font-medium flex items-center justify-center gap-0.5 border border-emerald-200 dark:border-emerald-900/40"
                  title="Add architectural window opening cut"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>Window</span>
                </button>
              </div>

              {wall.openings && wall.openings.length > 0 ? (
                <div className="space-y-1">
                  {wall.openings.map((op, idx) => (
                    <div
                      key={op.id}
                      onClick={() => onSelectElement && onSelectElement({ type: 'opening', wallId: wall.id, openingId: op.id })}
                      className="p-1.5 rounded bg-black/5 dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-950/30 flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-1.5">
                        <DoorClosed className="w-3.5 h-3.5 text-blue-500" />
                        <span className="font-medium">{op.label || `${op.type} ${idx + 1}`}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {op.width}m wide @ {op.distanceAlongWall.toFixed(2)}m
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateWall(wall.id, {
                            openings: wall.openings?.filter((o) => o.id !== op.id),
                          });
                        }}
                        className="text-slate-400 hover:text-red-500 p-0.5"
                        title="Remove cut"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-slate-400">No cuts hosted on this wall. Click +Door to add a visible cut.</p>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => onUpdateWall(wall.id, { locked: !wall.locked })}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5 text-xs"
              >
                {wall.locked ? <Lock className="w-3.5 h-3.5 text-amber-500" /> : <Unlock className="w-3.5 h-3.5" />}
                <span>{wall.locked ? 'Locked' : 'Unlocked'}</span>
              </button>

              <button
                onClick={() => onDeleteWall(wall.id)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Wall</span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* Wall Opening Inspector */}
      {opening && openingWall && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]">
              Wall Hosted Cut
            </span>
            <span className="text-[10px] text-blue-600 font-mono">Wall ID: {openingWall.id.slice(0, 8)}</span>
          </div>

          <div>
            <label className="text-[11px] text-slate-500 font-medium">Opening Type</label>
            <select
              value={opening.type}
              onChange={(e) => {
                const newType = e.target.value as OpeningType;
                let newWidth = opening.width;
                let newLabel = opening.label;

                if (newType === 'double-door' && opening.width < 1.4) {
                  newWidth = 1.8;
                  newLabel = 'Double French Door';
                } else if (newType === 'sliding' && opening.width < 1.4) {
                  newWidth = 2.0;
                  newLabel = 'Sliding Patio Door';
                } else if (newType === 'bifold' && (opening.width < 1.0 || opening.width > 1.8)) {
                  newWidth = 1.2;
                  newLabel = 'Bifold Accordion Door';
                } else if (newType === 'pocket' && opening.width > 1.2) {
                  newWidth = 0.9;
                  newLabel = 'Pocket In-Wall Door';
                } else if (newType === 'door' && opening.width > 1.4) {
                  newWidth = 0.9;
                  newLabel = 'Single Swing Door';
                } else if (newType === 'window' && opening.width < 0.8) {
                  newWidth = 1.2;
                  newLabel = 'Architectural Window';
                }

                handleUpdateOpening({
                  type: newType,
                  width: newWidth,
                  label: newLabel,
                });
              }}
              className="mt-1 w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-black/5 dark:bg-white/5 font-medium"
            >
              <option value="door">Single Leaf Swing Door</option>
              <option value="double-door">Double Leaf French Door</option>
              <option value="sliding">Sliding Patio Door (Bypass)</option>
              <option value="pocket">Pocket In-Wall Sliding Door</option>
              <option value="bifold">Bifold Accordion Door</option>
              <option value="window">Architectural Window</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-500">Cut Width (m)</label>
              <input
                type="number"
                step="0.05"
                min="0.4"
                max="5.0"
                value={opening.width}
                onChange={(e) => handleUpdateOpening({ width: parseFloat(e.target.value) || 0.9 })}
                className="mt-1 w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-black/5 dark:bg-white/5 font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Distance Along Wall</label>
              <input
                type="number"
                step="0.05"
                min="0.0"
                value={opening.distanceAlongWall}
                onChange={(e) => handleUpdateOpening({ distanceAlongWall: parseFloat(e.target.value) || 0 })}
                className="mt-1 w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-black/5 dark:bg-white/5 font-mono"
              />
            </div>
          </div>

          {/* Door Specific Controls */}
          {opening.type !== 'window' && (
            <div className="space-y-2 p-2 rounded bg-black/5 dark:bg-white/5 border border-slate-200/50 dark:border-slate-800/50">
              <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block">
                {opening.type === 'pocket'
                  ? 'Pocket Orientation'
                  : opening.type === 'sliding'
                  ? 'Slide Track & Stagger'
                  : opening.type === 'bifold'
                  ? 'Accordion Pivot & Fold'
                  : opening.type === 'double-door'
                  ? 'French Door Configuration'
                  : 'Door Swing & Handing'}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {opening.type === 'double-door' ? (
                  <div
                    className="px-2 py-1 rounded border border-slate-200 dark:border-slate-800 bg-black/5 dark:bg-white/5 text-[11px] font-medium flex items-center justify-between"
                    title="Both left and right leaves are hinged at their respective outer jambs"
                  >
                    <span className="text-slate-500">Hinges:</span>
                    <strong className="text-slate-700 dark:text-slate-200">Dual (Both)</strong>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleUpdateOpening({ swingDirection: opening.swingDirection === 'left' ? 'right' : 'left' })}
                    className="px-2 py-1 rounded border text-[11px] font-medium hover:bg-black/5 flex items-center justify-between"
                  >
                    <span className="text-slate-500">
                      {opening.type === 'pocket'
                        ? 'Pocket:'
                        : opening.type === 'bifold'
                        ? 'Stack:'
                        : opening.type === 'sliding'
                        ? 'Slide:'
                        : 'Hinge:'}
                    </span>
                    <strong className="uppercase">{opening.swingDirection || 'right'}</strong>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleUpdateOpening({ swingOrientation: opening.swingOrientation === 'out' ? 'in' : 'out' })}
                  className="px-2 py-1 rounded border text-[11px] font-medium hover:bg-black/5 flex items-center justify-between"
                  title="Toggle swing direction between Inswing and Outswing"
                >
                  <span className="text-slate-500">Swing:</span>
                  <strong className="uppercase">{opening.swingOrientation === 'out' ? 'Out' : 'In'}</strong>
                </button>
              </div>

              {(opening.type === 'door' || opening.type === 'double-door') && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">Swing Arc:</span>
                  <div className="flex gap-1">
                    {[
                      { deg: 90, label: '90°' },
                      { deg: 45, label: '45°' },
                      { deg: 30, label: '30°' },
                      { deg: 0, label: 'Closed' },
                    ].map(({ deg, label }) => (
                      <button
                        key={deg}
                        type="button"
                        onClick={() => handleUpdateOpening({ swingAngle: deg })}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                          (opening.swingAngle ?? 90) === deg
                            ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                            : 'border-slate-300 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleDeleteOpening}
              className="w-full flex items-center justify-center gap-1 px-2.5 py-1.5 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200 dark:border-red-900/40 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Wall Cut</span>
            </button>
          </div>
        </div>
      )}

      {/* Furniture Inspector */}
      {furniture && (
        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-slate-500 font-medium">Asset Name</label>
            <input
              type="text"
              value={furniture.name}
              onChange={(e) => onUpdateFurniture(furniture.id, { name: e.target.value })}
              className="mt-1 w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-black/5 dark:bg-white/5 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-500">Width (m)</label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="50"
                value={furniture.width}
                onChange={(e) => onUpdateFurniture(furniture.id, { width: parseFloat(e.target.value) || 0.5 })}
                className="mt-1 w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-black/5 dark:bg-white/5 font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Depth (m)</label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="50"
                value={furniture.depth}
                onChange={(e) => onUpdateFurniture(furniture.id, { depth: parseFloat(e.target.value) || 0.5 })}
                className="mt-1 w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-black/5 dark:bg-white/5 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-500">Center X (m)</label>
              <input
                type="number"
                step="0.05"
                value={furniture.x}
                onChange={(e) => onUpdateFurniture(furniture.id, { x: parseFloat(e.target.value) || 0 })}
                className="mt-1 w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-black/5 dark:bg-white/5 font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Center Y (m)</label>
              <input
                type="number"
                step="0.05"
                value={furniture.y}
                onChange={(e) => onUpdateFurniture(furniture.id, { y: parseFloat(e.target.value) || 0 })}
                className="mt-1 w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-black/5 dark:bg-white/5 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-black/5 dark:bg-white/5">
            <span className="text-slate-500">Rotation</span>
            <span className="font-mono font-semibold">{furniture.rotation}°</span>
          </div>

          {/* Action buttons: Rotate 90°, Duplicate, Lock, Delete */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              id="btn-rotate-furniture-90"
              onClick={() => onRotateFurniture(furniture.id)}
              title="Rotate by 90 degrees"
              className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5"
            >
              <RotateCw className="w-3.5 h-3.5 text-blue-600" />
              <span>Rotate 90°</span>
            </button>

            <button
              id="btn-duplicate-furniture"
              onClick={() => onDuplicateFurniture(furniture.id)}
              title="Duplicate furniture (Ctrl+D)"
              className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5"
            >
              <Copy className="w-3.5 h-3.5 text-blue-600" />
              <span>Duplicate</span>
            </button>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={() => onUpdateFurniture(furniture.id, { locked: !furniture.locked })}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5"
            >
              {furniture.locked ? <Lock className="w-3.5 h-3.5 text-amber-500" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>{furniture.locked ? 'Locked' : 'Unlocked'}</span>
            </button>

            <button
              onClick={() => onDeleteFurniture(furniture.id)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Dimension Line Inspector */}
      {dimension && (
        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-slate-500">Dimension Label</label>
            <input
              type="text"
              value={dimension.label || ''}
              onChange={(e) => onUpdateDimension(dimension.id, { label: e.target.value })}
              className="mt-1 w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-black/5 dark:bg-white/5 font-medium"
            />
          </div>

          <div className="p-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
            <div className="text-slate-500 text-[11px]">Measured Distance</div>
            <div className="font-semibold text-sm text-blue-700 dark:text-blue-300 font-mono mt-0.5">
              {formatDistance(
                Math.hypot(dimension.x2 - dimension.x1, dimension.y2 - dimension.y1),
                activeTab.units
              )}
            </div>
          </div>

          <button
            onClick={() => onDeleteDimension(dimension.id)}
            className="w-full flex items-center justify-center gap-1 px-2.5 py-1.5 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Dimension</span>
          </button>
        </div>
      )}

      {/* Redline Markup Inspector */}
      {redline && (
        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-slate-500">Markup Note / Comment</label>
            <textarea
              rows={3}
              value={redline.text || ''}
              onChange={(e) => onUpdateRedline(redline.id, { text: e.target.value })}
              placeholder="e.g. Verify structural beam clearance here"
              className="mt-1 w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-black/5 dark:bg-white/5 resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Color</span>
            <div className="flex gap-1.5">
              {['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'].map((c) => (
                <button
                  key={c}
                  onClick={() => onUpdateRedline(redline.id, { color: c })}
                  className={`w-5 h-5 rounded-full border-2 transition-transform ${
                    redline.color === c ? 'scale-110 border-slate-900 dark:border-white' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <button
            onClick={() => onDeleteRedline(redline.id)}
            className="w-full flex items-center justify-center gap-1 px-2.5 py-1.5 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Markup</span>
          </button>
        </div>
      )}

      {/* General Project Properties (When nothing selected) */}
      {!selectedElement && (
        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-slate-500 font-medium">Design Name</label>
            <input
              type="text"
              value={activeTab.name}
              onChange={(e) => onUpdateTabName(e.target.value)}
              className="mt-1 w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-black/5 dark:bg-white/5 font-medium"
            />
          </div>

          <div className="p-3 rounded-lg bg-black/3 dark:bg-white/5 space-y-2 border border-slate-200/60 dark:border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-500">Scale</span>
              <span className="font-semibold">{activeTab.scale}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Display Units</span>
              <span className="font-semibold uppercase">{activeTab.units}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Wall Segments</span>
              <span className="font-mono font-semibold">{activeTab.walls.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Rooms</span>
              <span className="font-mono font-semibold">{activeTab.rooms.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Furniture Items</span>
              <span className="font-mono font-semibold">{activeTab.furniture.length}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 font-semibold">
              <span className="text-slate-500">Total Room Area</span>
              <span className="text-blue-600 dark:text-blue-400 font-mono">
                {formatArea(
                  activeTab.rooms.reduce((acc, r) => acc + r.width * r.depth, 0),
                  activeTab.units
                )}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 leading-relaxed">
            Click any room, wall segment, furniture asset, dimension line, or redline on the canvas to inspect and edit details.
          </div>
        </div>
      )}
    </div>
  );
};
