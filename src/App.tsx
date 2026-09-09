import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  DesignTab,
  DraftTool,
  SelectedElement,
  DisplayUnit,
  ArchitecturalScale,
  ThemeMode,
  FurnitureItem,
  Room,
  Wall,
  DimensionItem,
  RedlineItem,
  GhostSketch,
  LayerId,
  LayerConfig,
} from './types';
import { SAMPLE_BUNGALOW_PLAN, createSampleBungalowTab, createBlankTab } from './data/samplePlan';
import { loadProject, saveProject, getSavedTheme, saveTheme } from './utils/storage';
import { downloadBlob, validateProjectData } from './utils/exportImport';
import { convertDxfToDesignTab } from './utils/dxfParser';
import { Navbar } from './components/Navbar';
import { ToolPanel } from './components/ToolPanel';
import { Canvas } from './components/Canvas';
import { Inspector } from './components/Inspector';
import { LayersPanel } from './components/LayersPanel';
import { FurnitureModal } from './components/FurnitureModal';
import { AIDraftModal } from './components/AIDraftModal';
import { ExportModal } from './components/ExportModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { CalibrateModal } from './components/CalibrateModal';
import { ThreeDViewModal } from './components/ThreeDViewModal';
import { SolarStudyModal } from './components/SolarStudyModal';
import { CostEstimatorModal } from './components/CostEstimatorModal';
import { StoryLevelsModal } from './components/StoryLevelsModal';
import { FurnitureCreatorModal } from './components/FurnitureCreatorModal';
import { Sliders, Layers as LayersIcon, PanelRightClose, PanelRightOpen } from 'lucide-react';

export default function App() {
  // Tabs State
  const [tabs, setTabs] = useState<DesignTab[]>([SAMPLE_BUNGALOW_PLAN]);
  const [activeTabId, setActiveTabId] = useState<string>(SAMPLE_BUNGALOW_PLAN.id);
  const [closedTabsStack, setClosedTabsStack] = useState<DesignTab[]>([]);

  // Active Tool & Selection
  const [activeTool, setActiveTool] = useState<DraftTool>('select');
  const [selectedElement, setSelectedElement] = useState<SelectedElement>(null);

  // View Settings
  const [zoom, setZoom] = useState<number>(1.0);
  const [theme, setTheme] = useState<ThemeMode>(() => getSavedTheme()); // 'draftlight', 'trace', 'classic'

  // Right sidebar state
  const [rightTab, setRightTab] = useState<'inspector' | 'layers'>('inspector');
  const [isRightCollapsed, setIsRightCollapsed] = useState<boolean>(false);
  const [isToolPanelCollapsed, setIsToolPanelCollapsed] = useState<boolean>(false);

  // Modals
  const [isFurnitureModalOpen, setIsFurnitureModalOpen] = useState(false);
  const [isAIDraftModalOpen, setIsAIDraftModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [is3DModalOpen, setIs3DModalOpen] = useState(false);
  const [isSolarModalOpen, setIsSolarModalOpen] = useState(false);
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [isFurnitureCreatorModalOpen, setIsFurnitureCreatorModalOpen] = useState(false);
  const [calibrateDistance, setCalibrateDistance] = useState<number | null>(null);

  // Undo / Redo history stack (up to 30 snapshots)
  const [undoStack, setUndoStack] = useState<DesignTab[]>([]);
  const [redoStack, setRedoStack] = useState<DesignTab[]>([]);

  // Hidden file input for project import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get active tab
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0] || SAMPLE_BUNGALOW_PLAN;

  // Load from IndexedDB on initial mount
  useEffect(() => {
    async function initStorage() {
      try {
        const savedProject = await loadProject();
        if (savedProject && savedProject.tabs && savedProject.tabs.length > 0) {
          setTabs(savedProject.tabs);
          if (savedProject.activeTabId) {
            setActiveTabId(savedProject.activeTabId);
          }
        }
      } catch (err) {
        console.warn('Could not load project from IndexedDB:', err);
      }
    }
    initStorage();
  }, []);

  // Autosave to IndexedDB whenever tabs change
  useEffect(() => {
    if (tabs.length > 0) {
      saveProject(tabs, activeTabId).catch((err) =>
        console.warn('Autosave to IndexedDB failed:', err)
      );
    }
  }, [tabs, activeTabId]);

  // Push snapshot to undo stack before committing changes
  const pushUndoSnapshot = useCallback(() => {
    setUndoStack((prev) => [...prev.slice(-29), JSON.parse(JSON.stringify(activeTab))]);
    setRedoStack([]); // clear redo stack on new action
  }, [activeTab]);

  // Undo
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [...prev, JSON.parse(JSON.stringify(activeTab))]);
    setUndoStack((prev) => prev.slice(0, prev.length - 1));

    setTabs((prev) =>
      prev.map((t) => (t.id === activeTab.id ? { ...previous, id: t.id } : t))
    );
    setSelectedElement(null);
  }, [undoStack, activeTab]);

  // Redo
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, JSON.parse(JSON.stringify(activeTab))]);
    setRedoStack((prev) => prev.slice(0, prev.length - 1));

    setTabs((prev) =>
      prev.map((t) => (t.id === activeTab.id ? { ...next, id: t.id } : t))
    );
    setSelectedElement(null);
  }, [redoStack, activeTab]);

  // Commit changes to the active tab (with undo snapshot)
  const handleCommitTabChange = useCallback(
    (updates: Partial<DesignTab>, recordUndo = true) => {
      if (recordUndo) {
        pushUndoSnapshot();
      }
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTab.id ? { ...t, ...updates } : t))
      );
    },
    [activeTab.id, pushUndoSnapshot]
  );

  // Tool Selection
  const handleSelectTool = (tool: DraftTool) => {
    if (tool === 'furniture') {
      setIsFurnitureModalOpen(true);
      setActiveTool('select');
      return;
    }
    if (tool === 'ai') {
      setIsAIDraftModalOpen(true);
      setActiveTool('select');
      return;
    }
    setActiveTool(tool);
    if (tool !== 'select') {
      setSelectedElement(null);
    }
  };

  // Add Furniture onto canvas center
  const handleAddFurniture = (
    itemData: Omit<FurnitureItem, 'id' | 'x' | 'y' | 'rotation'>
  ) => {
    pushUndoSnapshot();
    const newFurniture: FurnitureItem = {
      ...itemData,
      id: `furn-${Date.now()}`,
      x: 7.0, // center default on canvas
      y: 5.0,
      rotation: 0,
    };
    handleCommitTabChange({
      furniture: [...activeTab.furniture, newFurniture],
    });
    setSelectedElement({ type: 'furniture', id: newFurniture.id });
    setActiveTool('select');
  };

  // Rotate Furniture by 90 degrees
  const handleRotateFurniture = (id: string) => {
    pushUndoSnapshot();
    const updated = activeTab.furniture.map((f) =>
      f.id === id ? { ...f, rotation: (f.rotation + 90) % 360 } : f
    );
    handleCommitTabChange({ furniture: updated }, false);
  };

  // Duplicate Furniture (Ctrl+D)
  const handleDuplicateFurniture = (id: string) => {
    const item = activeTab.furniture.find((f) => f.id === id);
    if (!item) return;
    pushUndoSnapshot();
    const clone: FurnitureItem = {
      ...item,
      id: `furn-${Date.now()}`,
      name: `${item.name} (Copy)`,
      x: item.x + 0.4,
      y: item.y + 0.4,
    };
    handleCommitTabChange({
      furniture: [...activeTab.furniture, clone],
    });
    setSelectedElement({ type: 'furniture', id: clone.id });
  };

  // Delete Element (Room, Wall, Furniture, Dimension, Redline)
  const handleDeleteElement = (type: string, id: string) => {
    pushUndoSnapshot();
    if (type === 'room') {
      handleCommitTabChange({
        rooms: activeTab.rooms.filter((r) => r.id !== id),
      });
    } else if (type === 'wall') {
      handleCommitTabChange({
        walls: activeTab.walls.filter((w) => w.id !== id),
      });
    } else if (type === 'furniture') {
      handleCommitTabChange({
        furniture: activeTab.furniture.filter((f) => f.id !== id),
      });
    } else if (type === 'dimension') {
      handleCommitTabChange({
        dimensions: activeTab.dimensions.filter((d) => d.id !== id),
      });
    } else if (type === 'redline') {
      handleCommitTabChange({
        redlines: activeTab.redlines.filter((r) => r.id !== id),
      });
    } else if (type === 'opening') {
      const wallId = selectedElement?.wallId;
      const opId = selectedElement?.openingId || id;
      if (wallId) {
        handleCommitTabChange({
          walls: activeTab.walls.map((w) =>
            w.id === wallId
              ? { ...w, openings: (w.openings || []).filter((op) => op.id !== opId) }
              : w
          ),
        });
      }
    }
    setSelectedElement(null);
  };

  // Apply Ghost Sketch from AI
  const handleApplyGhostSketch = (sketch: GhostSketch) => {
    pushUndoSnapshot();
    handleCommitTabChange({ ghostSketch: sketch }, false);
  };

  // Open New Tab with Ghost Sketch
  const handleOpenNewTabWithGhost = (sketch: GhostSketch) => {
    const newTab: DesignTab = {
      id: `tab-${Date.now()}`,
      name: sketch.title || 'AI Generated Concept',
      scale: '1:50',
      units: activeTab.units,
      rooms: sketch.rooms,
      walls: sketch.walls,
      furniture: sketch.furniture || [],
      dimensions: [],
      redlines: [],
      ghostSketch: null,
      layers: { ...SAMPLE_BUNGALOW_PLAN.layers },
      focusLight: false,
      gridVisible: true,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  // Tab operations: Add Sample Tab, Add Blank Tab, Close Tab, Reopen Tab, Duplicate Tab
  const handleAddSampleTab = () => {
    const newTab = createSampleBungalowTab(`tab-${Date.now()}`);
    newTab.name = `Bungalow ${tabs.length + 1}`;
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const handleAddBlankTab = () => {
    const newTab = createBlankTab(`tab-${Date.now()}`, `Design ${tabs.length + 1}`);
    newTab.units = activeTab.units;
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const handleCloseTab = (id: string) => {
    if (tabs.length <= 1) return;
    const tabToClose = tabs.find((t) => t.id === id);
    if (tabToClose) {
      setClosedTabsStack((prev) => [...prev.slice(-9), tabToClose]);
    }
    const filtered = tabs.filter((t) => t.id !== id);
    setTabs(filtered);
    if (activeTabId === id) {
      setActiveTabId(filtered[0].id);
    }
  };

  const handleReopenTab = () => {
    if (closedTabsStack.length === 0) return;
    const lastClosed = closedTabsStack[closedTabsStack.length - 1];
    setClosedTabsStack((prev) => prev.slice(0, -1));
    setTabs((prev) => [...prev, lastClosed]);
    setActiveTabId(lastClosed.id);
  };

  const handleDuplicateTab = (id: string) => {
    const tabToDupe = tabs.find((t) => t.id === id);
    if (!tabToDupe) return;
    const clonedTab: DesignTab = {
      ...JSON.parse(JSON.stringify(tabToDupe)),
      id: `tab-${Date.now()}`,
      name: `${tabToDupe.name} (Copy)`,
    };
    setTabs((prev) => [...prev, clonedTab]);
    setActiveTabId(clonedTab.id);
  };

  // Reset current design tab to blank or sample bungalow
  const handleResetToBlank = () => {
    pushUndoSnapshot();
    handleCommitTabChange({
      rooms: [],
      walls: [],
      furniture: [],
      dimensions: [],
      redlines: [],
      ghostSketch: null,
    });
    setSelectedElement(null);
  };

  const handleLoadSampleBungalow = () => {
    pushUndoSnapshot();
    handleCommitTabChange({
      name: 'Sample Bungalow Plan',
      rooms: SAMPLE_BUNGALOW_PLAN.rooms,
      walls: SAMPLE_BUNGALOW_PLAN.walls,
      furniture: SAMPLE_BUNGALOW_PLAN.furniture,
      dimensions: SAMPLE_BUNGALOW_PLAN.dimensions,
      redlines: [],
      ghostSketch: null,
    });
    setSelectedElement(null);
  };

  // Download project JSON (.draftlight.json)
  const handleDownloadProjectJSON = () => {
    const projectData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      tabs,
      activeTabId,
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], {
      type: 'application/json',
    });
    downloadBlob(blob, `${activeTab.name.toLowerCase().replace(/\s+/g, '_')}.draftlight.json`);
  };

  // Direct load project JSON file
  const handleFileLoadDirect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawJson = JSON.parse(event.target?.result as string);
        const validated = validateProjectData(rawJson);
        if (validated && validated.tabs && validated.tabs.length > 0) {
          pushUndoSnapshot();
          setTabs(validated.tabs);
          setActiveTabId(validated.activeTabId || validated.tabs[0].id);
        } else {
          alert('Invalid Draftlight project file format.');
        }
      } catch (err) {
        alert('Could not parse project file. Ensure it is a valid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // Import project JSON via file input
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleFileLoadDirect(file);
    e.target.value = ''; // reset
  };

  // Import AutoCAD DXF file (.dxf) and create a dedicated tab
  const handleImportDxf = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const newTab = convertDxfToDesignTab(text, file.name);
        pushUndoSnapshot();
        setTabs((prev) => [...prev, newTab]);
        setActiveTabId(newTab.id);
      } catch (err) {
        console.error('Failed to parse DXF file:', err);
        alert('Could not parse AutoCAD DXF file. Please verify it is an ASCII DXF format.');
      }
    };
    reader.readAsText(file);
  };

  // Create a new level tab linked with elevation & underlay ghosting
  const handleCreateLevelTab = (
    baseName: string,
    levelIndex: number,
    elevation: number,
    underlayTabId?: string
  ) => {
    pushUndoSnapshot();
    const newTabId = `tab-level-${Date.now()}`;
    const newTabName = `${baseName} (L${levelIndex})`;
    const blank = createBlankTab(newTabId, newTabName);
    const newTab: DesignTab = {
      ...blank,
      storyLevel: {
        id: `level-${Date.now()}`,
        name: baseName,
        levelIndex,
        elevation,
        wallHeight: 2.8,
        underlayTabId: underlayTabId || activeTab.id,
        underlayOpacity: 0.35,
        underlayColor: 'blue',
      },
      underlayTabId: underlayTabId || activeTab.id,
      underlayOpacity: 0.35,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Undo: Ctrl/Cmd + Z
      if (cmdOrCtrl && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if ((cmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'z') || (cmdOrCtrl && e.key.toLowerCase() === 'y')) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Duplicate Furniture: Ctrl/Cmd + D
      if (cmdOrCtrl && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (selectedElement?.type === 'furniture') {
          handleDuplicateFurniture(selectedElement.id);
        }
        return;
      }

      // Save / Download Project: Ctrl/Cmd + S
      if (cmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleDownloadProjectJSON();
        return;
      }

      // Delete: Delete / Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElement) {
        e.preventDefault();
        handleDeleteElement(selectedElement.type, selectedElement.id);
        return;
      }

      // Tool keys
      if (!cmdOrCtrl && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'v':
            setActiveTool('select');
            break;
          case 'w':
            setActiveTool('wall');
            break;
          case 'o':
            setActiveTool('door');
            break;
          case 'u':
            setActiveTool('window');
            break;
          case 'r':
            setActiveTool('room');
            break;
          case 'd':
            setActiveTool('measure');
            break;
          case 'f':
            setIsFurnitureModalOpen(true);
            break;
          case 'c':
            setActiveTool('calibrate');
            break;
          case 'a':
            setIsAIDraftModalOpen(true);
            break;
          case 'm':
            setActiveTool('redline');
            break;
          case '?':
            setIsShortcutsModalOpen(true);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, handleUndo, handleRedo, activeTab]);

  return (
    <div
      id="draftlight-app"
      className={`flex flex-col h-screen w-screen overflow-hidden font-sans antialiased select-none ${
        theme === 'trace'
          ? 'dark bg-[#0F172A] text-slate-100'
          : theme === 'classic'
          ? 'bg-[#FDFBF7] text-stone-900'
          : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Hidden File Input for Imports */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        accept=".json,.draftlight.json"
        className="hidden"
      />

      {/* Top Navbar */}
      <Navbar
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={setActiveTabId}
        onCloseTab={handleCloseTab}
        onCreateTab={(type) => (type === 'sample' ? handleAddSampleTab() : handleAddBlankTab())}
        onReopenTab={handleReopenTab}
        canReopen={closedTabsStack.length > 0}
        activeTab={activeTab}
        onUpdateActiveTab={(updates) => handleCommitTabChange(updates, false)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        zoom={zoom}
        onZoomChange={setZoom}
        theme={theme}
        onThemeChange={(newTheme: ThemeMode) => {
          setTheme(newTheme);
          saveTheme(newTheme);
        }}
        onSaveProject={handleDownloadProjectJSON}
        onLoadProject={handleFileLoadDirect}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
        onOpen3D={() => setIs3DModalOpen(true)}
        onOpenSolar={() => setIsSolarModalOpen(true)}
        onOpenCost={() => setIsCostModalOpen(true)}
        onOpenLevels={() => setIsLevelModalOpen(true)}
        onOpenFurnitureCreator={() => setIsFurnitureCreatorModalOpen(true)}
        onImportDxf={handleImportDxf}
        onToggleInspector={() => {
          if (isRightCollapsed) {
            setIsRightCollapsed(false);
            setRightTab('inspector');
          } else if (rightTab === 'inspector') {
            setIsRightCollapsed(true);
          } else {
            setRightTab('inspector');
          }
        }}
        onToggleLayers={() => {
          if (isRightCollapsed) {
            setIsRightCollapsed(false);
            setRightTab('layers');
          } else if (rightTab === 'layers') {
            setIsRightCollapsed(true);
          } else {
            setRightTab('layers');
          }
        }}
        isInspectorOpen={!isRightCollapsed && rightTab === 'inspector'}
        isLayersOpen={!isRightCollapsed && rightTab === 'layers'}
      />

      {/* Workspace Area: Left Tools + Center Canvas + Right Inspector/Layers */}
      <div className="flex flex-1 w-full h-[calc(100vh-3.25rem)] overflow-hidden relative">
        {/* Left Tool Panel */}
        <ToolPanel
          activeTool={activeTool}
          onSelectTool={handleSelectTool}
          isCollapsed={isToolPanelCollapsed}
          onToggleCollapse={() => setIsToolPanelCollapsed(!isToolPanelCollapsed)}
          theme={theme}
        />

        {/* Center Canvas */}
        <main className="flex-1 h-full relative overflow-hidden flex flex-col">
          <Canvas
            activeTab={activeTab}
            activeTool={activeTool}
            onSelectTool={setActiveTool}
            selectedElement={selectedElement}
            onSelectElement={setSelectedElement}
            onCommitChange={(updates) => handleCommitTabChange(updates, true)}
            zoom={zoom}
            onZoomChange={setZoom}
            theme={theme}
            onOpenCalibrate={(dist) => setCalibrateDistance(dist)}
            onOpenNewTabWithGhost={handleOpenNewTabWithGhost}
          />
        </main>

        {/* Right Sidebar: Inspector & Layers */}
        <aside
          id="draftlight-right-sidebar"
          className={`border-l transition-all duration-200 flex flex-col z-20 ${
            isRightCollapsed ? 'w-10' : 'w-72'
          } ${
            theme === 'trace'
              ? 'bg-[#121824] border-slate-800'
              : theme === 'classic'
              ? 'bg-[#F9F6F0] border-amber-900/15'
              : 'bg-white/95 backdrop-blur border-slate-200'
          }`}
        >
          {isRightCollapsed ? (
            /* Collapsed rail */
            <div className="flex flex-col items-center py-3 space-y-3">
              <button
                onClick={() => setIsRightCollapsed(false)}
                title="Expand panel"
                className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-slate-500"
              >
                <PanelRightOpen className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setIsRightCollapsed(false);
                  setRightTab('inspector');
                }}
                title="Open Inspector"
                className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-slate-500"
              >
                <Sliders className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setIsRightCollapsed(false);
                  setRightTab('layers');
                }}
                title="Open Layers"
                className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-slate-500"
              >
                <LayersIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Expanded Inspector/Layers */
            <>
              {/* Tab Selector Header */}
              <div className="flex items-center justify-between p-2 border-b border-slate-200/80 dark:border-slate-800">
                <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-medium">
                  <button
                    id="btn-tab-inspector"
                    onClick={() => setRightTab('inspector')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                      rightTab === 'inspector'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Inspector</span>
                  </button>

                  <button
                    id="btn-tab-layers"
                    onClick={() => setRightTab('layers')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                      rightTab === 'layers'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <LayersIcon className="w-3.5 h-3.5" />
                    <span>Layers</span>
                  </button>
                </div>

                <button
                  id="btn-collapse-right-sidebar"
                  onClick={() => setIsRightCollapsed(true)}
                  title="Collapse panel"
                  className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <PanelRightClose className="w-4 h-4" />
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto">
                {rightTab === 'inspector' ? (
                  <Inspector
                    activeTab={activeTab}
                    selectedElement={selectedElement}
                    onSelectElement={setSelectedElement}
                    onUpdateRoom={(id, updates) => {
                      pushUndoSnapshot();
                      handleCommitTabChange(
                        {
                          rooms: activeTab.rooms.map((r) =>
                            r.id === id ? { ...r, ...updates } : r
                          ),
                        },
                        false
                      );
                    }}
                    onDeleteRoom={(id) => handleDeleteElement('room', id)}
                    onUpdateWall={(id, updates) => {
                      pushUndoSnapshot();
                      handleCommitTabChange(
                        {
                          walls: activeTab.walls.map((w) =>
                            w.id === id ? { ...w, ...updates } : w
                          ),
                        },
                        false
                      );
                    }}
                    onDeleteWall={(id) => handleDeleteElement('wall', id)}
                    onUpdateFurniture={(id, updates) => {
                      pushUndoSnapshot();
                      handleCommitTabChange(
                        {
                          furniture: activeTab.furniture.map((f) =>
                            f.id === id ? { ...f, ...updates } : f
                          ),
                        },
                        false
                      );
                    }}
                    onRotateFurniture={handleRotateFurniture}
                    onDuplicateFurniture={handleDuplicateFurniture}
                    onDeleteFurniture={(id) => handleDeleteElement('furniture', id)}
                    onUpdateDimension={(id, updates) => {
                      pushUndoSnapshot();
                      handleCommitTabChange(
                        {
                          dimensions: activeTab.dimensions.map((d) =>
                            d.id === id ? { ...d, ...updates } : d
                          ),
                        },
                        false
                      );
                    }}
                    onDeleteDimension={(id) => handleDeleteElement('dimension', id)}
                    onUpdateRedline={(id, updates) => {
                      pushUndoSnapshot();
                      handleCommitTabChange(
                        {
                          redlines: activeTab.redlines.map((r) =>
                            r.id === id ? { ...r, ...updates } : r
                          ),
                        },
                        false
                      );
                    }}
                    onDeleteRedline={(id) => handleDeleteElement('redline', id)}
                    onUpdateTabName={(name) => handleCommitTabChange({ name }, false)}
                    theme={theme}
                  />
                ) : (
                  <LayersPanel
                    layers={activeTab.layers}
                    onUpdateLayer={(layerId: LayerId, updates: Partial<LayerConfig>) => {
                      const updatedLayers = {
                        ...activeTab.layers,
                        [layerId]: {
                          ...activeTab.layers[layerId],
                          ...updates,
                        },
                      };
                      handleCommitTabChange({ layers: updatedLayers }, false);
                    }}
                    theme={theme}
                  />
                )}
              </div>
            </>
          )}
        </aside>
      </div>

      {/* MODALS */}
      {/* Furniture Modal */}
      <FurnitureModal
        isOpen={isFurnitureModalOpen}
        onClose={() => setIsFurnitureModalOpen(false)}
        onAddFurniture={handleAddFurniture}
        theme={theme}
        onOpenFurnitureCreator={() => setIsFurnitureCreatorModalOpen(true)}
      />

      {/* AI Draft Modal */}
      <AIDraftModal
        isOpen={isAIDraftModalOpen}
        onClose={() => setIsAIDraftModalOpen(false)}
        onApplyGhostSketch={handleApplyGhostSketch}
        theme={theme}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        activeTab={activeTab}
        theme={theme}
      />

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      {/* Calibrate Modal */}
      <CalibrateModal
        isOpen={calibrateDistance !== null}
        onClose={() => setCalibrateDistance(null)}
        measuredDistanceMeters={calibrateDistance || 1}
        units={activeTab.units}
        onApplyScaleFactor={(factor) => {
          pushUndoSnapshot();
          // Scale all geometry by factor
          const scaledRooms: Room[] = activeTab.rooms.map((r) => ({
            ...r,
            x: r.x * factor,
            y: r.y * factor,
            width: r.width * factor,
            depth: r.depth * factor,
          }));
          const scaledWalls: Wall[] = activeTab.walls.map((w) => ({
            ...w,
            x1: w.x1 * factor,
            y1: w.y1 * factor,
            x2: w.x2 * factor,
            y2: w.y2 * factor,
          }));
          const scaledFurn: FurnitureItem[] = activeTab.furniture.map((f) => ({
            ...f,
            x: f.x * factor,
            y: f.y * factor,
            width: f.width * factor,
            depth: f.depth * factor,
          }));
          const scaledDims: DimensionItem[] = activeTab.dimensions.map((d) => ({
            ...d,
            x1: d.x1 * factor,
            y1: d.y1 * factor,
            x2: d.x2 * factor,
            y2: d.y2 * factor,
          }));

          handleCommitTabChange({
            rooms: scaledRooms,
            walls: scaledWalls,
            furniture: scaledFurn,
            dimensions: scaledDims,
          });
        }}
      />

      {/* 3D Extruded Model & Lighting Modal */}
      <ThreeDViewModal
        isOpen={is3DModalOpen}
        onClose={() => setIs3DModalOpen(false)}
        activeTab={activeTab}
      />

      {/* Solar Study & Sunlight Analysis Modal */}
      <SolarStudyModal
        isOpen={isSolarModalOpen}
        onClose={() => setIsSolarModalOpen(false)}
        activeTab={activeTab}
        onUpdateSolarSettings={(settings) => {
          pushUndoSnapshot();
          handleCommitTabChange({ solarSettings: settings }, false);
        }}
      />

      {/* Cost Estimator & Bill of Materials Modal */}
      <CostEstimatorModal
        isOpen={isCostModalOpen}
        onClose={() => setIsCostModalOpen(false)}
        activeTab={activeTab}
      />

      {/* Multi-Story Levels & Underlay Manager Modal */}
      <StoryLevelsModal
        isOpen={isLevelModalOpen}
        onClose={() => setIsLevelModalOpen(false)}
        tabs={tabs}
        activeTab={activeTab}
        onUpdateActiveTab={(updates) => handleCommitTabChange(updates, false)}
        onCreateLevelTab={handleCreateLevelTab}
        onSelectTab={(id) => setActiveTabId(id)}
      />

      {/* Parametric Custom Furniture Creator & Sharing Library Modal */}
      <FurnitureCreatorModal
        isOpen={isFurnitureCreatorModalOpen}
        onClose={() => setIsFurnitureCreatorModalOpen(false)}
        onCatalogUpdated={() => {}}
      />
    </div>
  );
}
