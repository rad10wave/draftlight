import React, { useState, useRef } from 'react';
import { FurnitureCatalogItem, FurnitureCategory, FurnitureItem } from '../types';
import { ArchitecturalSymbol } from './ArchitecturalSymbols';
import {
  getMergedFurnitureCatalog,
  exportFurnitureLibraryJson,
  importFurnitureLibraryJson,
  loadCustomFurniture,
} from '../utils/customFurnitureStorage';
import { downloadBlob } from '../utils/exportImport';
import {
  X,
  Search,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Loader2,
  Plus,
  Share2,
  Upload,
  Sparkles,
} from 'lucide-react';

interface FurnitureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFurniture: (item: Omit<FurnitureItem, 'id' | 'x' | 'y' | 'rotation'>) => void;
  theme: string;
  onOpenFurnitureCreator?: () => void;
}

export const FurnitureModal: React.FC<FurnitureModalProps> = ({
  isOpen,
  onClose,
  onAddFurniture,
  theme,
  onOpenFurnitureCreator,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [catalogRevision, setCatalogRevision] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const furnitureFileInputRef = useRef<HTMLInputElement>(null);

  // Custom linked image asset state
  const [showCustomImage, setShowCustomImage] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageWidth, setImageWidth] = useState('2.0');
  const [imageDepth, setImageDepth] = useState('1.5');
  const [imageAssetName, setImageAssetName] = useState('Custom Image Asset');
  const [isValidatingImage, setIsValidatingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [validatedDataUri, setValidatedDataUri] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'All Assets' },
    { id: 'doors-windows', label: 'Doors & Windows' },
    { id: 'living', label: 'Living & Office' },
    { id: 'bedroom', label: 'Bedroom' },
    { id: 'kitchen', label: 'Kitchen & Dining' },
    { id: 'bath', label: 'Bathroom' },
    { id: 'custom', label: 'Custom / Shared' },
  ];

  const fullCatalog = getMergedFurnitureCatalog();
  const filteredCatalog = fullCatalog.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleExportFurnitureJson = () => {
    const customItems = loadCustomFurniture();
    const itemsToExport = customItems.length > 0 ? customItems : fullCatalog;
    const jsonStr = exportFurnitureLibraryJson(itemsToExport, 'Shared Furniture Library');
    const blob = new Blob([jsonStr], { type: 'application/json' });
    downloadBlob(blob, 'furniture_assets.furniture.json');
    setStatusMessage('Exported furniture library as JSON!');
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleImportFurnitureJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importFurnitureLibraryJson(content);
      if (res.success) {
        setCatalogRevision((r) => r + 1);
        setStatusMessage(res.message);
        setSelectedCategory('custom');
      } else {
        setStatusMessage(`Error: ${res.message}`);
      }
      setTimeout(() => setStatusMessage(null), 4000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleValidateAndAddImage = async () => {
    setImageError(null);

    // Validate URL
    const trimmed = imageUrl.trim();
    if (!trimmed.startsWith('https://')) {
      setImageError('Image URL must use secure HTTPS (https://)');
      return;
    }

    const widthNum = parseFloat(imageWidth);
    const depthNum = parseFloat(imageDepth);
    if (isNaN(widthNum) || isNaN(depthNum) || widthNum <= 0 || depthNum <= 0 || widthNum > 100 || depthNum > 100) {
      setImageError('Dimensions must be greater than 0 and no more than 100 meters');
      return;
    }

    setIsValidatingImage(true);

    try {
      // Call server proxy to check host and embed image as PNG
      const res = await fetch('/api/proxy-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to embed image asset');
      }

      setValidatedDataUri(data.dataUri);

      // Add to plan
      onAddFurniture({
        assetId: `custom-img-${Date.now()}`,
        name: imageAssetName.trim() || 'Linked Image Asset',
        category: 'custom',
        width: widthNum,
        depth: depthNum,
        isCustomImage: true,
        imageDataUri: data.dataUri,
        sourceUrl: trimmed,
      });

      onClose();
    } catch (err: any) {
      setImageError(err.message || 'Image rejected: Host blocked or CORS error');
    } finally {
      setIsValidatingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div
        id="furniture-library-modal"
        className="w-full max-w-2xl bg-white dark:bg-[#1E2536] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Furniture & Architectural Library
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select scaled assets to place onto your floor plan
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search, Filter & Custom Image Tabs */}
        <div className="px-5 pt-3 pb-2 space-y-3 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search assets by name or room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={() => setShowCustomImage(!showCustomImage)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                showCustomImage
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Link Image Asset</span>
            </button>
          </div>

          {!showCustomImage && (
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 text-xs rounded-full whitespace-nowrap font-medium transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto flex-1">
          {showCustomImage ? (
            /* Custom Linked Image Form */
            <div className="max-w-md mx-auto space-y-4 py-2">
              <div className="p-3.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  <span>Add Scaled Linked Image Asset</span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">
                  Provide an HTTPS image URL (site plan overlay, texture, or equipment photo) and its real-world dimensions. Draftlight embeds it safely as a PNG.
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Asset Label</label>
                <input
                  type="text"
                  value={imageAssetName}
                  onChange={(e) => setImageAssetName(e.target.value)}
                  placeholder="e.g. Site Survey Map / Pergola"
                  className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">HTTPS Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-... or your CDN"
                  className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Real Width (meters)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="100"
                    value={imageWidth}
                    onChange={(e) => setImageWidth(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Real Depth (meters)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="100"
                    value={imageDepth}
                    onChange={(e) => setImageDepth(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              {imageError && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs border border-red-200 dark:border-red-900/40">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{imageError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowCustomImage(false)}
                  className="px-3 py-1.5 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  id="btn-validate-embed-image"
                  onClick={handleValidateAndAddImage}
                  disabled={isValidatingImage || !imageUrl}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors"
                >
                  {isValidatingImage ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Validating & Embedding...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Embed on Plan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Catalog Grid */
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredCatalog.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onAddFurniture({
                      assetId: item.id,
                      name: item.name,
                      category: item.category,
                      width: item.width,
                      depth: item.depth,
                      shapeType: item.shapeType,
                      color: item.color,
                    });
                    onClose();
                  }}
                  className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md cursor-pointer transition-all bg-white dark:bg-slate-850 flex flex-col justify-between group"
                >
                  <div>
                    {/* Architectural CAD Preview Box */}
                    <div className="w-full h-24 mb-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-lg flex items-center justify-center p-2 border border-slate-100 dark:border-slate-800/80 overflow-hidden group-hover:border-blue-200 dark:group-hover:border-blue-900/50 transition-colors">
                      <svg
                        viewBox={`-0.12 -0.12 ${item.width + 0.24} ${item.depth + 0.24}`}
                        className="max-h-full max-w-full drop-shadow-xs"
                      >
                        <ArchitecturalSymbol
                          furniture={{
                            id: `preview-${item.id}`,
                            assetId: item.id,
                            name: item.name,
                            category: item.category,
                            width: item.width,
                            depth: item.depth,
                            x: 0,
                            y: 0,
                            rotation: 0,
                            shapeType: item.shapeType,
                            color: item.color,
                          }}
                          ppm={1}
                          theme={theme}
                        />
                      </svg>
                    </div>

                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-snug">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-600 dark:text-slate-400">
                    <span>{item.width.toFixed(2)}m × {item.depth.toFixed(2)}m</span>
                    <span className="text-blue-600 font-medium group-hover:translate-x-0.5 transition-transform">
                      + Place
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer: Sharing & Custom Creation Bar */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={furnitureFileInputRef}
              accept=".json,.furniture.json"
              onChange={handleImportFurnitureJson}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => furnitureFileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium text-slate-700 dark:text-slate-200 transition-colors"
              title="Import furniture JSON shared by another user"
            >
              <Upload className="w-3.5 h-3.5 text-blue-500" />
              <span>Import Furniture (.json)</span>
            </button>

            <button
              type="button"
              onClick={handleExportFurnitureJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium text-slate-700 dark:text-slate-200 transition-colors"
              title="Export your custom/library furniture as explicit JSON to share with other users"
            >
              <Share2 className="w-3.5 h-3.5 text-purple-500" />
              <span>Share Furniture Library (.json)</span>
            </button>

            {onOpenFurnitureCreator && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFurnitureCreator();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-2xs transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Custom Furniture Builder</span>
              </button>
            )}
          </div>

          {statusMessage && (
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium animate-in fade-in">
              {statusMessage}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
