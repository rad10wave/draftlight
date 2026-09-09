import { DisplayUnit, DrawingScale } from '../types';

// Convert meters to formatted string according to unit
export function formatDistance(meters: number, unit: DisplayUnit): string {
  if (isNaN(meters)) return '0 m';

  switch (unit) {
    case 'm':
      return `${meters.toFixed(2)} m`;
    case 'cm':
      return `${(meters * 100).toFixed(0)} cm`;
    case 'mm':
      return `${(meters * 1000).toFixed(0)} mm`;
    case 'in':
      return `${(meters * 39.3701).toFixed(1)}"`;
    case 'ft-in': {
      const totalInches = meters * 39.3701;
      const feet = Math.floor(totalInches / 12);
      const inches = Math.round(totalInches % 12);
      return `${feet}′ ${inches}″`;
    }
    default:
      return `${meters.toFixed(2)} m`;
  }
}

// Convert real-world square meters to formatted area string
export function formatArea(sqMeters: number, unit: DisplayUnit): string {
  if (isNaN(sqMeters) || sqMeters <= 0) return '0 m²';

  if (unit === 'in' || unit === 'ft-in') {
    const sqFeet = sqMeters * 10.7639;
    return `${sqFeet.toLocaleString('en-US', { maximumFractionDigits: 1 })} sq ft`;
  }
  return `${sqMeters.toFixed(1)} m²`;
}

// Parse user input back to meters
export function parseInputToMeters(valueStr: string, currentUnit: DisplayUnit): number | null {
  const trimmed = valueStr.trim().toLowerCase();
  if (!trimmed) return null;

  // If ends with m/cm/mm/ft/in
  if (trimmed.endsWith('mm')) {
    const val = parseFloat(trimmed);
    return isNaN(val) ? null : val / 1000;
  }
  if (trimmed.endsWith('cm')) {
    const val = parseFloat(trimmed);
    return isNaN(val) ? null : val / 100;
  }
  if (trimmed.endsWith('m') && !trimmed.endsWith('mm')) {
    const val = parseFloat(trimmed);
    return isNaN(val) ? null : val;
  }
  if (trimmed.includes("'") || trimmed.includes("′")) {
    const parts = trimmed.split(/['′]/);
    const feet = parseFloat(parts[0]) || 0;
    const inches = parseFloat(parts[1]?.replace(/["″]/, '') || '0') || 0;
    const totalInches = feet * 12 + inches;
    return totalInches * 0.0254;
  }

  const num = parseFloat(trimmed);
  if (isNaN(num)) return null;

  switch (currentUnit) {
    case 'm':
      return num;
    case 'cm':
      return num / 100;
    case 'mm':
      return num / 1000;
    case 'in':
      return num * 0.0254;
    case 'ft-in':
      return num * 0.3048;
    default:
      return num;
  }
}

// Pixel ratio per meter at 100% zoom based on architectural scale
export function getPixelsPerMeter(scale: DrawingScale): number {
  switch (scale) {
    case '1:50':
      return 80;
    case '1:100':
      return 40;
    case '1:200':
      return 20;
    default:
      return 40;
  }
}

// Snap point to grid (e.g. 0.05m = 5cm, or 0.10m = 10cm)
export function snapToGrid(val: number, step: number = 0.05): number {
  return Math.round(val / step) * step;
}
