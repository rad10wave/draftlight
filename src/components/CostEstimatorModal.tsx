import React, { useState } from 'react';
import {
  X,
  Calculator,
  Download,
  DollarSign,
  Layers,
  Settings2,
  FileSpreadsheet,
  Check,
} from 'lucide-react';
import { DesignTab } from '../types';
import {
  calculateBillOfMaterials,
  DEFAULT_RATES_METRIC,
  MaterialCostRates,
  exportCostReportToCSV,
} from '../utils/costEstimator';
import { downloadBlob } from '../utils/exportImport';

interface CostEstimatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: DesignTab;
}

export const CostEstimatorModal: React.FC<CostEstimatorModalProps> = ({
  isOpen,
  onClose,
  activeTab,
}) => {
  const [rates, setRates] = useState<MaterialCostRates>(DEFAULT_RATES_METRIC);
  const [isEditingRates, setIsEditingRates] = useState(false);
  const [copied, setCopied] = useState(false);

  const report = calculateBillOfMaterials(activeTab, rates);

  const handleExportCSV = () => {
    const csvContent = exportCostReportToCSV(report);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `${activeTab.name.toLowerCase().replace(/\s+/g, '_')}_estimate.csv`);
  };

  const handleCopySummary = () => {
    const text = `Project Estimate: ${report.tabName}\nFloor Area: ${report.totalFloorAreaSqM} m²\nWall Length: ${report.totalWallLengthMeters} m\nDoors: ${report.doorCount} | Windows: ${report.windowCount}\nSubtotal: $${report.subtotal.toLocaleString()}\nContractor Fee: $${report.contractorFee.toLocaleString()}\nContingency: $${report.contingency.toLocaleString()}\nGrand Total: $${report.grandTotal.toLocaleString()}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      id="cost-estimator-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-lg">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                Cost & Bill of Materials (BOM) Estimator
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automated quantity takeoffs for framing, drywall, doors, windows & floor finishes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditingRates(!isEditingRates)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                isEditingRates
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-900/40 dark:border-emerald-700 dark:text-emerald-200'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Settings2 className="w-4 h-4" />
              <span>{isEditingRates ? 'Hide Unit Rates' : 'Adjust Unit Rates'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Key Metrics Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <div className="text-[11px] text-slate-400 uppercase font-medium">Total Floor Area</div>
              <div className="text-xl font-bold text-slate-800 dark:text-slate-100 font-mono">
                {report.totalFloorAreaSqM} m²
              </div>
              <div className="text-[10px] text-slate-500">{(report.totalFloorAreaSqM * 10.764).toFixed(0)} sq ft</div>
            </div>

            <div>
              <div className="text-[11px] text-slate-400 uppercase font-medium">Wall Length</div>
              <div className="text-xl font-bold text-slate-800 dark:text-slate-100 font-mono">
                {report.totalWallLengthMeters} m
              </div>
              <div className="text-[10px] text-slate-500">Height: {report.wallHeightMeters}m</div>
            </div>

            <div>
              <div className="text-[11px] text-slate-400 uppercase font-medium">Framing Takeoff</div>
              <div className="text-xl font-bold text-slate-800 dark:text-slate-100 font-mono">
                {report.studCount} Studs
              </div>
              <div className="text-[10px] text-slate-500">{report.drywallSheetsCount} Drywall Boards (4x8)</div>
            </div>

            <div>
              <div className="text-[11px] text-slate-400 uppercase font-medium">Grand Total Budget</div>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                ${report.grandTotal.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500">Incl. fees & contingency</div>
            </div>
          </div>

          {/* Unit Rate Customizer Drawer */}
          {isEditingRates && (
            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/50 space-y-3">
              <h3 className="text-xs font-semibold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                Custom Unit Rates & Labor Settings
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-500">Framing/Drywall ($/m²):</label>
                  <input
                    type="number"
                    value={rates.drywallPerSqM}
                    onChange={(e) => setRates({ ...rates, drywallPerSqM: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 px-2.5 py-1 bg-white dark:bg-slate-800 border rounded font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500">Door Assembly ($/unit):</label>
                  <input
                    type="number"
                    value={rates.doorUnitCost}
                    onChange={(e) => setRates({ ...rates, doorUnitCost: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 px-2.5 py-1 bg-white dark:bg-slate-800 border rounded font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500">Window Unit ($/unit):</label>
                  <input
                    type="number"
                    value={rates.windowUnitCost}
                    onChange={(e) => setRates({ ...rates, windowUnitCost: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 px-2.5 py-1 bg-white dark:bg-slate-800 border rounded font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500">Hardwood Floor ($/m²):</label>
                  <input
                    type="number"
                    value={rates.flooringHardwoodPerSqM}
                    onChange={(e) => setRates({ ...rates, flooringHardwoodPerSqM: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 px-2.5 py-1 bg-white dark:bg-slate-800 border rounded font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500">Tile Floor ($/m²):</label>
                  <input
                    type="number"
                    value={rates.flooringTilePerSqM}
                    onChange={(e) => setRates({ ...rates, flooringTilePerSqM: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 px-2.5 py-1 bg-white dark:bg-slate-800 border rounded font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500">Carpet ($/m²):</label>
                  <input
                    type="number"
                    value={rates.flooringCarpetPerSqM}
                    onChange={(e) => setRates({ ...rates, flooringCarpetPerSqM: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 px-2.5 py-1 bg-white dark:bg-slate-800 border rounded font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500">Contractor Margin (%):</label>
                  <input
                    type="number"
                    value={rates.contractorMarginPct}
                    onChange={(e) => setRates({ ...rates, contractorMarginPct: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 px-2.5 py-1 bg-white dark:bg-slate-800 border rounded font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500">Contingency (%):</label>
                  <input
                    type="number"
                    value={rates.contingencyPct}
                    onChange={(e) => setRates({ ...rates, contingencyPct: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 px-2.5 py-1 bg-white dark:bg-slate-800 border rounded font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Line Items Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Item Description</th>
                  <th className="py-2.5 px-4 text-right">Quantity</th>
                  <th className="py-2.5 px-4 text-right">Rate</th>
                  <th className="py-2.5 px-4 text-right">Total ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {report.lineItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2 px-4 text-slate-500 dark:text-slate-400 font-medium">
                      {item.category}
                    </td>
                    <td className="py-2 px-4 text-slate-800 dark:text-slate-200">
                      {item.item}
                    </td>
                    <td className="py-2 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="py-2 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                      ${item.unitRate.toFixed(2)}
                    </td>
                    <td className="py-2 px-4 text-right font-mono font-semibold text-slate-800 dark:text-slate-100">
                      ${item.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-800/60 font-medium border-t border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                <tr>
                  <td colSpan={4} className="py-2 px-4 text-right">
                    Subtotal Direct Costs:
                  </td>
                  <td className="py-2 px-4 text-right font-mono font-semibold text-slate-900 dark:text-white">
                    ${report.subtotal.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td colSpan={4} className="py-1.5 px-4 text-right text-slate-500">
                    Contractor Overhead & Profit ({rates.contractorMarginPct}%):
                  </td>
                  <td className="py-1.5 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                    ${report.contractorFee.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td colSpan={4} className="py-1.5 px-4 text-right text-slate-500">
                    Design & Construction Contingency ({rates.contingencyPct}%):
                  </td>
                  <td className="py-1.5 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                    ${report.contingency.toLocaleString()}
                  </td>
                </tr>
                <tr className="border-t border-slate-300 dark:border-slate-600 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  <td colSpan={4} className="py-3 px-4 text-right uppercase tracking-wider">
                    Total Estimated Budget:
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-base">
                    ${report.grandTotal.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80 text-xs">
          <button
            onClick={handleCopySummary}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 font-medium"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <DollarSign className="w-4 h-4" />}
            <span>{copied ? 'Summary Copied!' : 'Copy Summary'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
