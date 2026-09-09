import React, { useState, useRef } from 'react';
import {
  X,
  Armchair,
  Plus,
  Download,
  Upload,
  Trash2,
  Check,
  Shapes,
  Palette,
  Eye,
  Share2,
} from 'lucide-react';
import { FurnitureCatalogItem, FurnitureCategory, OpeningType } from '../types';
import { ArchitecturalSymbol } from './ArchitecturalSymbols';
import {
  loadCustomFurniture,
  addCustomFurnitureItem,
  deleteCustomFurnitureItem,
  exportFurnitureLibraryJson,
  importFurnitureLibraryJson,
} from '../utils/customFurnitureStorage';
import { downloadBlob } from '../utils/exportImport';

interface FurnitureCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCatalogUpdated: () => void;
}

export const FurnitureCreatorModal: React.FC<FurnitureCreatorModalProps> = ({
  isOpen,
  onClose,
  onCatalogUpdated,
}) => {
  const [customItems, setCustomItems] = useState<FurnitureCatalogItem[]>(() => loadCustomFurniture());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New item form state
  const [name, setName] = useState('Executive Desk & Chair');
  const [category, setCategory] = useState<FurnitureCategory>('living');
  const [width, setWidth] = useState(1.8);
  const [depth, setDepth] = useState(0.9);
  const [height, setHeight] = useState(0.75);
  const [color, setColor] = useState('#475569');
  const [shapeType, setShapeType] = useState<FurnitureCatalogItem['shapeType']>('desk-chair');
  const [doorType, setDoorType] = useState<OpeningType>('door');
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSaveItem = () => {
    if (!name.trim()) return;

    const newItem: FurnitureCatalogItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      category,
      width: Math.max(0.2, Number(width) || 1.0),
      depth: Math.max(0.2, Number(depth) || 1.0),
      height: Math.max(0.1, Number(height) || 0.75),
      iconType: 'custom',
      color,
      shapeType,
      doorType: category === 'doors-windows' ? doorType : undefined,
      description: `Custom ${width}m × ${depth}m ${category} item`,
      author: 'User Created',
      createdAt: new Date().toISOString(),
    };

    const updated = addCustomFurnitureItem(newItem);
    setCustomItems(updated);
    onCatalogUpdated();
    setFeedback(`"${newItem.name}" added to your catalog!`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleDelete = (id: string) => {
    const updated = deleteCustomFurnitureItem(id);
    setCustomItems(updated);
    onCatalogUpdated();
  };

  const handleExportLibrary = () => {
    const jsonStr = exportFurnitureLibraryJson(customItems, 'Shared Custom Furniture Library');
    const blob = new Blob([jsonStr], { type: 'application/json' });
    downloadBlob(blob, 'architectural_furniture_catalog.furniture.json');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importFurnitureLibraryJson(content);
      if (res.success && res.items) {
        setCustomItems(res.items);
        onCatalogUpdated();
        setFeedback(res.message);
      } else {
        alert(res.message || 'Import failed.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <div
      id="furniture-creator-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-purple-50/50 dark:bg-purple-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 rounded-lg">
              <Armchair className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                Custom Furniture Asset Creator & Shared Library
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Design custom parametric blocks & share furniture libraries via explicit <code className="font-mono bg-purple-100 dark:bg-purple-900/40 px-1 py-0.5 rounded text-[10px]">.furniture.json</code> files
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,.furniture.json"
              onChange={handleImportFile}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Import shared .furniture.json"
            >
              <Upload className="w-4 h-4" />
              <span>Import .furniture.json</span>
            </button>

            <button
              onClick={handleExportLibrary}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              title="Export furniture to share with others"
            >
              <Share2 className="w-4 h-4" />
              <span>Share / Export Library</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Creator Form */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Shapes className="w-4 h-4 text-purple-500" /> Parametric Block Builder
            </h3>

            {/* Name & Category */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Furniture Item Name:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 6-Person Conference Table"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Category:
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as FurnitureCategory)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-medium"
                  >
                    <option value="living">Living & Office</option>
                    <option value="bedroom">Bedroom</option>
                    <option value="kitchen">Kitchen & Dining</option>
                    <option value="bath">Bathroom Fixtures</option>
                    <option value="doors-windows">Doors & Windows</option>
                    <option value="custom">Custom / General</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Shape Geometry:
                  </label>
                  <select
                    value={shapeType}
                    onChange={(e) => {
                      const newShape = e.target.value as any;
                      setShapeType(newShape);
                      if (newShape === 'door-single') {
                        setWidth(0.9);
                        setDepth(0.9);
                        setCategory('doors-windows');
                        if (!name || name.includes('Desk')) setName('Custom Single Door');
                      } else if (newShape === 'door-double') {
                        setWidth(1.8);
                        setDepth(0.9);
                        setCategory('doors-windows');
                        if (!name || name.includes('Desk')) setName('Custom French Door');
                      } else if (newShape === 'door-sliding') {
                        setWidth(2.0);
                        setDepth(0.3);
                        setCategory('doors-windows');
                        if (!name || name.includes('Desk')) setName('Custom Sliding Door');
                      } else if (newShape === 'door-pocket') {
                        setWidth(0.9);
                        setDepth(0.25);
                        setCategory('doors-windows');
                        if (!name || name.includes('Desk')) setName('Custom Pocket Door');
                      } else if (newShape === 'door-bifold') {
                        setWidth(1.2);
                        setDepth(0.45);
                        setCategory('doors-windows');
                        if (!name || name.includes('Desk')) setName('Custom Bifold Door');
                      } else if (newShape === 'window') {
                        setWidth(1.2);
                        setDepth(0.25);
                        setCategory('doors-windows');
                        if (!name || name.includes('Desk')) setName('Custom Window');
                      }
                    }}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-medium"
                  >
                    <optgroup label="Furniture Blocks">
                      <option value="rectangle">Box / Rectangle</option>
                      <option value="circle">Round / Circle</option>
                      <option value="l-shape">L-Shape Sectional</option>
                      <option value="desk-chair">Desk with Chair</option>
                      <option value="table-chairs">Dining Table & Chairs</option>
                      <option value="fixture">Plumbing Fixture</option>
                      <option value="storage">Storage Wardrobe</option>
                    </optgroup>
                    <optgroup label="Doors & Openings">
                      <option value="door-single">Single Leaf Swing Door</option>
                      <option value="door-double">French Double Door</option>
                      <option value="door-sliding">Sliding Patio Door</option>
                      <option value="door-pocket">Pocket In-Wall Door</option>
                      <option value="door-bifold">Bifold Accordion Door</option>
                      <option value="window">Architectural Window</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Width (m):
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.2"
                    value={width}
                    onChange={(e) => setWidth(parseFloat(e.target.value) || 0.5)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Depth (m):
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.2"
                    value={depth}
                    onChange={(e) => setDepth(parseFloat(e.target.value) || 0.5)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    3D Height (m):
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    value={height}
                    onChange={(e) => setHeight(parseFloat(e.target.value) || 0.75)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              {/* Color Tint */}
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" /> Color / Finish Accent:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-9 h-8 p-0 border rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-24 px-2 py-1 text-xs font-mono bg-slate-50 dark:bg-slate-800 border rounded"
                  />
                  <div className="flex gap-1.5">
                    {['#475569', '#3b82f6', '#b45309', '#10b981', '#6366f1', '#1e293b'].map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => setColor(hex)}
                        className="w-6 h-6 rounded-full border border-black/10"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveItem}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add to My Furniture Catalog</span>
            </button>

            {feedback && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs flex items-center gap-2 border border-emerald-200 dark:border-emerald-800">
                <Check className="w-4 h-4" />
                <span>{feedback}</span>
              </div>
            )}
          </div>

          {/* 2D Vector Preview & Existing Library */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-purple-500" /> Real-World Scale 2D Preview
            </h3>

            {/* SVG Visualizer */}
            <div className="w-full h-48 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center p-4 relative overflow-hidden">
              <svg
                viewBox={`-0.15 -0.15 ${width + 0.3} ${depth + 0.3}`}
                className="w-full h-full max-w-[170px] max-h-[170px]"
              >
                <ArchitecturalSymbol
                  furniture={{
                    id: 'creator-preview',
                    assetId: (name || 'custom').toLowerCase().replace(/\s+/g, '-'),
                    name: name || 'Custom Furniture',
                    category: category,
                    width: width,
                    depth: depth,
                    x: 0,
                    y: 0,
                    rotation: 0,
                    shapeType: shapeType,
                    color: color,
                  }}
                  ppm={1}
                  theme="blueprint"
                />
              </svg>

              {/* Dimension callouts */}
              <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
                <span className="inline-block px-2 py-0.5 rounded bg-white/90 dark:bg-slate-900/90 text-[10px] text-slate-600 dark:text-slate-300 font-mono shadow-xs border border-slate-200/60 dark:border-slate-700/60">
                  {width}m × {depth}m (Height: {height}m)
                </span>
              </div>
            </div>

            {/* Custom Items List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Custom Library Items ({customItems.length}):
                </span>
                {customItems.length > 0 && (
                  <span className="text-[11px] text-purple-600 font-medium">Ready to drag onto canvas</span>
                )}
              </div>

              {customItems.length === 0 ? (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed text-center text-xs text-slate-400">
                  No custom items created yet. Build one above or click "Import .furniture.json".
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border rounded-xl">
                  {customItems.map((item) => (
                    <div key={item.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-4 h-4 rounded-full border border-black/10"
                          style={{ backgroundColor: item.color || '#475569' }}
                        />
                        <div>
                          <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {item.width}m × {item.depth}m • {item.category}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded"
                        title="Delete item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-900/80">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
