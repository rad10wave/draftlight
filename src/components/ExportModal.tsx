import React, { useState } from 'react';
import { DesignTab } from '../types';
import {
  ExportPalette,
  generateSVG,
  generatePNG,
  generatePDF,
  generateProjectZip,
  downloadBlob,
} from '../utils/exportImport';
import { generateDxfString } from '../utils/dxfExporter';
import {
  X,
  FileCode,
  Image as ImageIcon,
  FileText,
  Package,
  Download,
  Check,
  Loader2,
  Compass,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: DesignTab;
  theme: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  activeTab,
  theme,
}) => {
  const [palette, setPalette] = useState<ExportPalette>('classic');
  const [selectedFormat, setSelectedFormat] = useState<'svg' | 'png' | 'pdf' | 'zip' | 'dxf'>('svg');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !activeTab) return null;

  const handleExport = async () => {
    setIsExporting(true);
    const sanitizedName = activeTab.name.toLowerCase().replace(/\s+/g, '_');

    try {
      if (selectedFormat === 'svg') {
        const svgContent = generateSVG(activeTab, palette, includeMetadata);
        const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        downloadBlob(blob, `${sanitizedName}_scaled_plan.svg`);
      } else if (selectedFormat === 'png') {
        const svgContent = generateSVG(activeTab, palette, includeMetadata);
        const pngBlob = await generatePNG(svgContent);
        downloadBlob(pngBlob, `${sanitizedName}_a3_plan.png`);
      } else if (selectedFormat === 'pdf') {
        const svgContent = generateSVG(activeTab, palette, includeMetadata);
        const pdfBlob = await generatePDF(svgContent, activeTab.name);
        downloadBlob(pdfBlob, `${sanitizedName}_a3_landscape.pdf`);
      } else if (selectedFormat === 'zip') {
        const zipBlob = await generateProjectZip(activeTab, palette);
        downloadBlob(zipBlob, `${sanitizedName}_draftlight_bundle.zip`);
      } else if (selectedFormat === 'dxf') {
        const dxfContent = generateDxfString(activeTab);
        const blob = new Blob([dxfContent], { type: 'application/dxf;charset=utf-8' });
        downloadBlob(blob, `${sanitizedName}.dxf`);
      }
      onClose();
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const formats = [
    {
      id: 'svg',
      title: 'SVG Vector',
      desc: 'Scalable CAD vector floor plan with embedded symbols and layers',
      icon: FileCode,
    },
    {
      id: 'dxf',
      title: 'AutoCAD DXF (.dxf)',
      desc: 'Standard AutoCAD CAD exchange file with layers, wall lines, doors & dimensions',
      icon: Compass,
    },
    {
      id: 'png',
      title: 'High-Res PNG',
      desc: '300 DPI high-resolution raster plan ready for presentations',
      icon: ImageIcon,
    },
    {
      id: 'pdf',
      title: 'A3 Landscape PDF',
      desc: 'Architectural print-ready standard document with title block',
      icon: FileText,
    },
    {
      id: 'zip',
      title: 'Complete Project ZIP',
      desc: 'Includes .draftlight.json, SVG vector, PNG image, and README',
      icon: Package,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div
        id="export-dialog-modal"
        className="w-full max-w-lg bg-white dark:bg-[#1E2536] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Export Architectural Plan
            </h2>
            <p className="text-[11px] text-slate-500">
              {activeTab.name} • Scale {activeTab.scale} • {activeTab.walls.length} walls
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Format Selection */}
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2 block">
              Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              {formats.map((f) => {
                const Icon = f.icon;
                const isSelected = selectedFormat === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFormat(f.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 ring-1 ring-blue-600'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5 text-blue-600" />
                        {f.title}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-snug line-clamp-2">
                      {f.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Palette Selection */}
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2 block">
              Output Palette
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  id: 'classic',
                  label: 'Classic',
                  desc: 'White paper, black ink',
                  color: 'bg-white text-slate-900 border-slate-300',
                },
                {
                  id: 'blueprint',
                  label: 'Blueprint',
                  desc: 'Cyan blue, white ink',
                  color: 'bg-[#0C2340] text-blue-100 border-blue-800',
                },
                {
                  id: 'dark',
                  label: 'Dark Trace',
                  desc: 'Slate black, chalk lines',
                  color: 'bg-[#121417] text-slate-100 border-slate-700',
                },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPalette(p.id as ExportPalette)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    palette === p.id ? 'ring-2 ring-blue-600 font-semibold' : 'opacity-80 hover:opacity-100'
                  } ${p.color}`}
                >
                  <div className="text-xs font-semibold">{p.label}</div>
                  <div className="text-[10px] opacity-75">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Metadata checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="cb-include-metadata"
              checked={includeMetadata}
              onChange={(e) => setIncludeMetadata(e.target.checked)}
              className="rounded accent-blue-600"
            />
            <label htmlFor="cb-include-metadata" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
              Include title block (project name, scale, wall count, area, date)
            </label>
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
            id="btn-confirm-export"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors shadow-xs"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download {selectedFormat.toUpperCase()}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
