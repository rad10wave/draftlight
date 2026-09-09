import React, { useState } from 'react';
import { DisplayUnit } from '../types';
import { formatDistance, parseInputToMeters } from '../utils/units';
import { X, Scaling } from 'lucide-react';

interface CalibrateModalProps {
  isOpen: boolean;
  onClose: () => void;
  measuredDistanceMeters: number;
  units: DisplayUnit;
  onApplyScaleFactor: (factor: number) => void;
}

export const CalibrateModal: React.FC<CalibrateModalProps> = ({
  isOpen,
  onClose,
  measuredDistanceMeters,
  units,
  onApplyScaleFactor,
}) => {
  const [actualInput, setActualInput] = useState(
    measuredDistanceMeters ? measuredDistanceMeters.toFixed(2) : '5.0'
  );
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApply = () => {
    setError(null);
    const targetMeters = parseInputToMeters(actualInput, units);
    if (!targetMeters || targetMeters <= 0) {
      setError('Please enter a valid positive distance');
      return;
    }
    if (measuredDistanceMeters <= 0) {
      setError('Measured distance must be greater than zero');
      return;
    }

    const factor = targetMeters / measuredDistanceMeters;
    if (isNaN(factor) || !isFinite(factor) || factor <= 0.001 || factor >= 1000) {
      setError('Calibration scale factor is out of reasonable range');
      return;
    }

    onApplyScaleFactor(factor);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div
        id="calibrate-plan-modal"
        className="w-full max-w-sm bg-white dark:bg-[#1E2536] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Scaling className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Calibrate Plan Scale
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 text-xs">
            <span className="text-slate-500">Reference line distance:</span>
            <div className="text-base font-semibold font-mono text-slate-800 dark:text-slate-200 mt-0.5">
              {formatDistance(measuredDistanceMeters, units)}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Known Real-World Distance ({units})
            </label>
            <input
              type="text"
              value={actualInput}
              onChange={(e) => setActualInput(e.target.value)}
              placeholder={`e.g. 5.0 ${units}`}
              className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              The entire plan will scale proportionately based on this measurement.
            </span>
          </div>

          {error && <div className="text-xs text-red-500">{error}</div>}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
          >
            Cancel
          </button>
          <button
            id="btn-apply-calibration"
            onClick={handleApply}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            Apply Calibration
          </button>
        </div>
      </div>
    </div>
  );
};
