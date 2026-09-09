import React, { useRef } from 'react';
import {
  DrawingScale,
  DisplayUnit,
  ThemeMode,
  DesignTab,
} from '../types';
import {
  Save,
  FolderOpen,
  Download,
  Undo2,
  Redo2,
  Grid,
  SunMedium,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Plus,
  X,
  History,
  Keyboard,
  Compass,
  Layers,
  SlidersHorizontal,
  ChevronDown,
  Box,
  Sun,
  Calculator,
  Building2,
  Armchair,
  FileCode,
} from 'lucide-react';

interface NavbarProps {
  tabs: DesignTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onCreateTab: (type: 'sample' | 'blank') => void;
  onReopenTab?: () => void;
  canReopen?: boolean;
  activeTab?: DesignTab;
  onUpdateActiveTab?: (updates: Partial<DesignTab>) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  zoom: number;
  onZoomChange: (z: number) => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onSaveProject: () => void;
  onLoadProject: (file: File) => void;
  onOpenExport: () => void;
  onOpenShortcuts: () => void;
  onToggleInspector?: () => void;
  onToggleLayers?: () => void;
  isInspectorOpen?: boolean;
  isLayersOpen?: boolean;
  onOpen3D?: () => void;
  onOpenSolar?: () => void;
  onOpenCost?: () => void;
  onOpenLevels?: () => void;
  onOpenFurnitureCreator?: () => void;
  onImportDxf?: (file: File) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onCreateTab,
  onReopenTab,
  canReopen = false,
  activeTab,
  onUpdateActiveTab,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  zoom,
  onZoomChange,
  theme,
  onThemeChange,
  onSaveProject,
  onLoadProject,
  onOpenExport,
  onOpenShortcuts,
  onToggleInspector,
  onToggleLayers,
  isInspectorOpen = false,
  isLayersOpen = false,
  onOpen3D,
  onOpenSolar,
  onOpenCost,
  onOpenLevels,
  onOpenFurnitureCreator,
  onImportDxf,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dxfInputRef = useRef<HTMLInputElement>(null);
  const [showNewMenu, setShowNewMenu] = React.useState(false);

  const currentTab =
    activeTab ||
    tabs.find((t) => t.id === activeTabId) ||
    tabs[0] ||
    ({
      id: 'default',
      name: 'Architectural Plan',
      scale: '1:100',
      units: 'm',
      gridVisible: true,
      focusLight: false,
    } as DesignTab);

  const handleUpdate = (updates: Partial<DesignTab>) => {
    if (onUpdateActiveTab) {
      onUpdateActiveTab(updates);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoadProject(file);
      e.target.value = '';
    }
  };

  const isDark = theme === 'trace';

  return (
    <header
      id="draftlight-navbar"
      className={`border-b transition-colors select-none z-30 ${
        isDark
          ? 'bg-[#121824] border-slate-800 text-slate-200'
          : theme === 'classic'
          ? 'bg-[#F9F6F0] border-amber-900/15 text-stone-800'
          : 'bg-white/95 backdrop-blur border-slate-200 text-slate-800'
      }`}
    >
      {/* Top Main Navigation Row */}
      <div className="flex items-center justify-between px-3 py-1.5 gap-2 flex-wrap">
        {/* Brand & File Operations */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 pr-2 border-r border-slate-200 dark:border-slate-800">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
              <Compass className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm tracking-tight hidden sm:inline">Draftlight</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              id="btn-save-project"
              onClick={onSaveProject}
              title="Save project (.draftlight.json) (Ctrl+S)"
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Save</span>
            </button>

            <button
              id="btn-load-project"
              onClick={() => fileInputRef.current?.click()}
              title="Load project file (.json)"
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Load</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,.draftlight.json"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Import AutoCAD DXF */}
            {onImportDxf && (
              <>
                <button
                  id="btn-import-dxf"
                  onClick={() => dxfInputRef.current?.click()}
                  title="Import AutoCAD DXF floor plan (.dxf)"
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-emerald-600 dark:text-emerald-400 transition-colors"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">DXF</span>
                </button>
                <input
                  type="file"
                  ref={dxfInputRef}
                  accept=".dxf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onImportDxf(file);
                      e.target.value = '';
                    }
                  }}
                />
              </>
            )}

            <button
              id="btn-export-dialog"
              onClick={onOpenExport}
              title="Export as SVG, DXF, PNG, PDF, or Project ZIP"
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>

          {/* Architectural Suite Tools */}
          <div className="flex items-center gap-1 pl-1 border-l border-slate-200 dark:border-slate-800">
            {onOpen3D && (
              <button
                id="btn-open-3d"
                onClick={onOpen3D}
                title="View interactive 3D extruded model & lighting"
                className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors shadow-2xs"
              >
                <Box className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">3D View</span>
              </button>
            )}

            {onOpenSolar && (
              <button
                id="btn-open-solar"
                onClick={onOpenSolar}
                title="Solar analysis & seasonal room sun exposure study"
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors"
              >
                <Sun className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Solar</span>
              </button>
            )}

            {onOpenCost && (
              <button
                id="btn-open-cost"
                onClick={onOpenCost}
                title="Cost Estimation & Bill of Materials (BOM) report"
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">BOM Cost</span>
              </button>
            )}

            {onOpenLevels && (
              <button
                id="btn-open-levels"
                onClick={onOpenLevels}
                title="Multi-story levels & underlay ghosting manager"
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-colors"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Levels</span>
              </button>
            )}

            {onOpenFurnitureCreator && (
              <button
                id="btn-open-furniture-creator"
                onClick={onOpenFurnitureCreator}
                title="Create custom furniture & share libraries (.furniture.json)"
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-purple-700 dark:text-purple-300 transition-colors"
              >
                <Armchair className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Furniture</span>
              </button>
            )}
          </div>

          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5 pl-1 border-l border-slate-200 dark:border-slate-800">
            <button
              id="btn-undo"
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              id="btn-redo"
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo (Ctrl+Shift+Z)"
              className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center: Precision & Drafting Controls */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Scale selector */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-[11px]">Scale:</span>
            <select
              id="select-scale"
              value={currentTab.scale}
              onChange={(e) => handleUpdate({ scale: e.target.value as DrawingScale })}
              className="bg-black/5 dark:bg-white/10 border-0 rounded px-2 py-1 text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="1:50">1:50 (Detailed)</option>
              <option value="1:100">1:100 (Standard)</option>
              <option value="1:200">1:200 (Site)</option>
            </select>
          </div>

          {/* Units selector */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-[11px]">Units:</span>
            <select
              id="select-units"
              value={currentTab.units}
              onChange={(e) => handleUpdate({ units: e.target.value as DisplayUnit })}
              className="bg-black/5 dark:bg-white/10 border-0 rounded px-2 py-1 text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="m">Meters (m)</option>
              <option value="cm">Centimeters (cm)</option>
              <option value="mm">Millimeters (mm)</option>
              <option value="in">Inches (in)</option>
              <option value="ft-in">Feet & Inches</option>
            </select>
          </div>

          {/* Grid Toggle */}
          <button
            id="btn-toggle-grid"
            onClick={() => handleUpdate({ gridVisible: !currentTab.gridVisible })}
            title="Toggle Drafting Grid"
            className={`p-1.5 rounded flex items-center gap-1 transition-colors ${
              currentTab.gridVisible
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                : 'hover:bg-black/5 dark:hover:bg-white/10 text-slate-400'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[11px]">Grid</span>
          </button>

          {/* Focus Light Toggle */}
          <button
            id="btn-toggle-focus"
            onClick={() => handleUpdate({ focusLight: !currentTab.focusLight })}
            title="Toggle Focus Light (Emphasizes selected geometry)"
            className={`p-1.5 rounded flex items-center gap-1 transition-colors ${
              currentTab.focusLight
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                : 'hover:bg-black/5 dark:hover:bg-white/10 text-slate-400'
            }`}
          >
            <SunMedium className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[11px]">Focus</span>
          </button>

          {/* Zoom Controls (55% to 180%) */}
          <div className="flex items-center gap-1 pl-1 border-l border-slate-200 dark:border-slate-800">
            <button
              id="btn-zoom-out"
              onClick={() => onZoomChange(Math.max(0.55, zoom - 0.1))}
              title="Zoom out"
              className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <input
              type="range"
              min="0.55"
              max="1.80"
              step="0.05"
              value={zoom}
              onChange={(e) => onZoomChange(parseFloat(e.target.value))}
              className="w-16 h-1 accent-blue-600 cursor-pointer hidden md:inline"
              title="Zoom scale"
            />
            <button
              id="btn-zoom-in"
              onClick={() => onZoomChange(Math.min(1.80, zoom + 0.1))}
              title="Zoom in"
              className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              id="btn-zoom-reset"
              onClick={() => onZoomChange(1.0)}
              title="Reset zoom to 100%"
              className="text-[11px] font-mono px-1 py-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10"
            >
              {Math.round(zoom * 100)}%
            </button>
          </div>
        </div>

        {/* Right side: Environment Theme, Shortcuts, Panel Toggles */}
        <div className="flex items-center gap-1.5 text-xs">
          {/* Theme selector */}
          <select
            id="select-theme"
            value={theme}
            onChange={(e) => onThemeChange(e.target.value as ThemeMode)}
            className="bg-black/5 dark:bg-white/10 border-0 rounded px-2 py-1 text-xs font-medium focus:outline-none cursor-pointer"
            title="Workspace Environment"
          >
            <option value="draftlight">Draftlight</option>
            <option value="classic">Classic Studio</option>
            <option value="trace">Architectural Trace</option>
          </select>

          {/* Shortcuts Reference */}
          <button
            id="btn-shortcuts"
            onClick={onOpenShortcuts}
            title="Keyboard shortcuts guide (?)"
            className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-slate-500"
          >
            <Keyboard className="w-3.5 h-3.5" />
          </button>

          {/* Panel toggles for mobile / drawer */}
          <button
            id="btn-toggle-layers-panel"
            onClick={onToggleLayers}
            title="Toggle Layers panel"
            className={`p-1.5 rounded flex items-center gap-1 transition-colors ${
              isLayersOpen
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300'
                : 'hover:bg-black/5 dark:hover:bg-white/10 text-slate-400'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden xl:inline text-[11px]">Layers</span>
          </button>

          <button
            id="btn-toggle-inspector-panel"
            onClick={onToggleInspector}
            title="Toggle Inspector panel"
            className={`p-1.5 rounded flex items-center gap-1 transition-colors ${
              isInspectorOpen
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300'
                : 'hover:bg-black/5 dark:hover:bg-white/10 text-slate-400'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden xl:inline text-[11px]">Inspector</span>
          </button>
        </div>
      </div>

      {/* Browser-Style Design Tabs Strip */}
      <div className="flex items-center px-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60 overflow-x-auto scrollbar-none gap-1 bg-black/2 dark:bg-black/20">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`group flex items-center gap-2 px-3 py-1.5 text-xs rounded-t-md cursor-pointer transition-all border-t-2 ${
                isActive
                  ? 'bg-white dark:bg-[#1A2234] border-blue-600 font-semibold shadow-xs text-slate-900 dark:text-slate-100'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <span className="max-w-[140px] truncate">{tab.name}</span>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  title="Close design tab"
                  className="p-0.5 rounded-full hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/40 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        {/* New Tab Button & Dropdown */}
        <div className="relative">
          <button
            id="btn-new-tab"
            onClick={() => setShowNewMenu(!showNewMenu)}
            title="Create design tab (up to 50)"
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 rounded flex items-center gap-0.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <ChevronDown className="w-2.5 h-2.5" />
          </button>

          {showNewMenu && (
            <div
              className="absolute left-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 py-1 text-xs"
              onMouseLeave={() => setShowNewMenu(false)}
            >
              <button
                onClick={() => {
                  onCreateTab('sample');
                  setShowNewMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium"
              >
                Editable Sample Bungalow
              </button>
              <button
                onClick={() => {
                  onCreateTab('blank');
                  setShowNewMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Blank Architectural Canvas
              </button>
            </div>
          )}
        </div>

        {/* Reopen Recently Closed Design */}
        {canReopen && (
          <button
            id="btn-reopen-tab"
            onClick={onReopenTab}
            title="Reopen recently closed design"
            className="flex items-center gap-1 px-2 py-1 text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 rounded transition-colors"
          >
            <History className="w-3 h-3" />
            <span className="hidden sm:inline">Reopen tab</span>
          </button>
        )}
      </div>
    </header>
  );
};
