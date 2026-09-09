import React from 'react';
import {
  X,
  Layers,
  Plus,
  Copy,
  Eye,
  ArrowUp,
  ArrowDown,
  Building,
  Sliders,
  Check,
} from 'lucide-react';
import { DesignTab, StoryLevel } from '../types';

interface StoryLevelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tabs: DesignTab[];
  activeTab: DesignTab;
  onUpdateActiveTab: (updates: Partial<DesignTab>) => void;
  onCreateLevelTab: (baseName: string, levelIndex: number, elevation: number, underlayTabId?: string) => void;
  onSelectTab: (tabId: string) => void;
}

export const StoryLevelsModal: React.FC<StoryLevelsModalProps> = ({
  isOpen,
  onClose,
  tabs,
  activeTab,
  onUpdateActiveTab,
  onCreateLevelTab,
  onSelectTab,
}) => {
  const currentLevel: StoryLevel = activeTab.storyLevel || {
    id: `level-${activeTab.id}`,
    name: activeTab.name,
    levelIndex: 0,
    elevation: 0,
    wallHeight: 2.8,
    underlayTabId: activeTab.underlayTabId || null,
    underlayOpacity: activeTab.underlayOpacity || 0.35,
    underlayColor: 'blue',
  };

  const handleSetUnderlay = (tabId: string | null) => {
    onUpdateActiveTab({
      underlayTabId: tabId,
      storyLevel: {
        ...currentLevel,
        underlayTabId: tabId,
      },
    });
  };

  const handleSetOpacity = (opacity: number) => {
    onUpdateActiveTab({
      underlayOpacity: opacity,
      storyLevel: {
        ...currentLevel,
        underlayOpacity: opacity,
      },
    });
  };

  const handleSetWallHeight = (height: number) => {
    onUpdateActiveTab({
      storyLevel: {
        ...currentLevel,
        wallHeight: height,
      },
    });
  };

  const handleSetElevation = (elev: number) => {
    onUpdateActiveTab({
      storyLevel: {
        ...currentLevel,
        elevation: elev,
      },
    });
  };

  const handleAddNewFloorAbove = () => {
    const nextIndex = (currentLevel.levelIndex || 0) + 1;
    const nextElev = (currentLevel.elevation || 0) + (currentLevel.wallHeight || 2.8);
    onCreateLevelTab(`Level ${nextIndex}`, nextIndex, nextElev, activeTab.id);
  };

  const handleAddNewBasementBelow = () => {
    const prevIndex = (currentLevel.levelIndex || 0) - 1;
    const prevElev = (currentLevel.elevation || 0) - 3.0;
    onCreateLevelTab(`Basement`, prevIndex, prevElev, activeTab.id);
  };

  if (!isOpen) return null;

  return (
    <div
      id="story-levels-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[88vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-blue-50/50 dark:bg-blue-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-lg">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                Multi-Story & Level Architecture
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage building levels, vertical elevations, and underlay ghost references
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Current Story Level Settings */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Active Tab Level Settings: <span className="text-blue-600 dark:text-blue-400">{activeTab.name}</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-500 block mb-1">Story / Level Elevation (m):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={currentLevel.elevation}
                    onChange={(e) => handleSetElevation(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border rounded-lg font-mono"
                  />
                  <span className="text-slate-400">m</span>
                </div>
              </div>

              <div>
                <label className="text-slate-500 block mb-1">Floor-to-Ceiling Wall Height (m):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="2.0"
                    max="6.0"
                    value={currentLevel.wallHeight}
                    onChange={(e) => handleSetWallHeight(parseFloat(e.target.value) || 2.8)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border rounded-lg font-mono"
                  />
                  <span className="text-slate-400">m</span>
                </div>
              </div>
            </div>
          </div>

          {/* Underlay Ghost (Onion Skin) Reference */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-blue-500" /> Underlay Reference (Ghost Floor)
              </h3>
              <span className="text-[11px] text-slate-400">
                Shows lower/upper floor walls as a faint architectural guide
              </span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1.5">
                  Select Tab to display as Underlay:
                </label>
                <select
                  value={activeTab.underlayTabId || ''}
                  onChange={(e) => handleSetUnderlay(e.target.value || null)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium"
                >
                  <option value="">(None - No underlay)</option>
                  {tabs
                    .filter((t) => t.id !== activeTab.id)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.walls.length} walls)
                      </option>
                    ))}
                </select>
              </div>

              {activeTab.underlayTabId && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Underlay Ghost Opacity:</span>
                    <span className="font-mono font-semibold text-blue-600">
                      {Math.round((activeTab.underlayOpacity || 0.35) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.8"
                    step="0.05"
                    value={activeTab.underlayOpacity || 0.35}
                    onChange={(e) => handleSetOpacity(parseFloat(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions: Add Level Above / Basement */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Create New Story / Level Tab
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleAddNewFloorAbove}
                className="p-3 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-xl text-left flex items-start gap-3 transition-colors"
              >
                <div className="p-2 bg-blue-600 text-white rounded-lg">
                  <ArrowUp className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                    Add Floor Level Above
                  </div>
                  <div className="text-[11px] text-blue-700/80 dark:text-blue-300/70 mt-0.5">
                    Creates upper level tab with current floor pre-configured as ghost underlay
                  </div>
                </div>
              </button>

              <button
                onClick={handleAddNewBasementBelow}
                className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 rounded-xl text-left flex items-start gap-3 transition-colors"
              >
                <div className="p-2 bg-slate-700 text-white rounded-lg">
                  <ArrowDown className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                    Add Basement Below
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Creates subterranean foundation level at -3.0m elevation
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* All Project Levels & Tabs List */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Project Stories & Tabs ({tabs.length})
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              {tabs.map((tab) => {
                const isActive = tab.id === activeTab.id;
                return (
                  <div
                    key={tab.id}
                    className={`p-3 flex items-center justify-between transition-colors ${
                      isActive
                        ? 'bg-blue-50/70 dark:bg-blue-950/40'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-600" />
                      <div>
                        <div className="text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <span>{tab.name}</span>
                          {isActive && (
                            <span className="px-2 py-0.5 text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full font-semibold">
                              Current Tab
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {tab.walls.length} walls • {tab.rooms.length} rooms • Elevation: {tab.storyLevel?.elevation || 0}m
                        </div>
                      </div>
                    </div>

                    {!isActive && (
                      <button
                        onClick={() => {
                          onSelectTab(tab.id);
                          onClose();
                        }}
                        className="px-2.5 py-1 text-xs border rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Switch To
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-900/80">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 shadow-xs"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
