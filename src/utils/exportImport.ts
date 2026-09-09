import { DesignTab, ProjectFileData, Room, Wall, FurnitureItem } from '../types';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { formatArea } from './units';

export type ExportPalette = 'classic' | 'blueprint' | 'dark';

export interface ExportOptions {
  palette: ExportPalette;
  format: 'svg' | 'png' | 'pdf' | 'zip';
  includeMetadata: boolean;
  includeGrid: boolean;
}

// Validation function for imported files
export function validateProjectFile(data: any): { valid: boolean; error?: string; project?: DesignTab } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'File content is not valid JSON' };
  }

  // Check required fields
  if (!data.rooms || !Array.isArray(data.rooms)) {
    return { valid: false, error: 'Invalid schema: rooms array is missing' };
  }
  if (!data.walls || !Array.isArray(data.walls)) {
    return { valid: false, error: 'Invalid schema: walls array is missing' };
  }

  // Validate scales and units
  const validScales = ['1:50', '1:100', '1:200'];
  const validUnits = ['m', 'cm', 'mm', 'in', 'ft-in'];

  const scale = validScales.includes(data.scale) ? data.scale : '1:100';
  const units = validUnits.includes(data.units) ? data.units : 'm';

  // Check ID duplicates
  const idSet = new Set<string>();

  for (const r of data.rooms) {
    if (!r.id || typeof r.x !== 'number' || typeof r.y !== 'number' || typeof r.width !== 'number' || typeof r.depth !== 'number') {
      return { valid: false, error: 'Invalid room geometry coordinates' };
    }
    if (r.width <= 0 || r.depth <= 0 || r.width > 200 || r.depth > 200) {
      return { valid: false, error: 'Room dimensions out of reasonable architectural range' };
    }
    if (idSet.has(r.id)) {
      return { valid: false, error: `Duplicate ID detected: ${r.id}` };
    }
    idSet.add(r.id);
  }

  for (const w of data.walls) {
    if (!w.id || typeof w.x1 !== 'number' || typeof w.y1 !== 'number' || typeof w.x2 !== 'number' || typeof w.y2 !== 'number') {
      return { valid: false, error: 'Invalid wall geometry coordinates' };
    }
    if (idSet.has(w.id)) {
      return { valid: false, error: `Duplicate ID detected: ${w.id}` };
    }
    idSet.add(w.id);
  }

  // Check safe image URLs in furniture
  const furniture: FurnitureItem[] = [];
  if (Array.isArray(data.furniture)) {
    for (const f of data.furniture) {
      if (f.imageDataUri && !f.imageDataUri.startsWith('data:image/')) {
        return { valid: false, error: 'Unsafe image data detected in furniture' };
      }
      if (f.sourceUrl && !f.sourceUrl.startsWith('https://')) {
        return { valid: false, error: 'Linked image must use secure HTTPS' };
      }
      furniture.push(f);
    }
  }

  const tab: DesignTab = {
    id: data.id || `design-${Date.now()}`,
    name: data.name || 'Imported Design',
    scale,
    units,
    gridVisible: true,
    focusLight: false,
    rooms: data.rooms,
    walls: data.walls,
    furniture,
    dimensions: Array.isArray(data.dimensions) ? data.dimensions : [],
    redlines: Array.isArray(data.redlines) ? data.redlines : [],
    layers: data.layers || {},
    ghostSketch: null,
    history: [
      {
        rooms: data.rooms,
        walls: data.walls,
        furniture,
        dimensions: data.dimensions || [],
        redlines: data.redlines || [],
      },
    ],
    historyIndex: 0,
  };

  return { valid: true, project: tab };
}

// Validation function for multi-tab project data or single-tab files
export function validateProjectData(data: any): { tabs: DesignTab[]; activeTabId: string } | null {
  if (!data || typeof data !== 'object') return null;

  if (Array.isArray(data.tabs) && data.tabs.length > 0) {
    const validTabs: DesignTab[] = [];
    for (const rawTab of data.tabs) {
      const res = validateProjectFile(rawTab);
      if (res.valid && res.project) {
        validTabs.push(res.project);
      }
    }
    if (validTabs.length > 0) {
      return {
        tabs: validTabs,
        activeTabId: data.activeTabId || validTabs[0].id,
      };
    }
  }

  const single = validateProjectFile(data);
  if (single.valid && single.project) {
    return {
      tabs: [single.project],
      activeTabId: single.project.id,
    };
  }

  return null;
}

// Generate SVG string representation of the floor plan
export function generateSVG(tab: DesignTab, palette: ExportPalette, includeMetadata: boolean = true): string {
  // Determine bounding box in meters with 2m margin
  let minX = 0, minY = 0, maxX = 12, maxY = 10;
  if (tab.rooms.length > 0 || tab.walls.length > 0) {
    const xs: number[] = [];
    const ys: number[] = [];
    tab.rooms.forEach((r) => {
      xs.push(r.x, r.x + r.width);
      ys.push(r.y, r.y + r.depth);
    });
    tab.walls.forEach((w) => {
      xs.push(w.x1, w.x2);
      ys.push(w.y1, w.y2);
    });
    tab.furniture.forEach((f) => {
      xs.push(f.x - f.width / 2, f.x + f.width / 2);
      ys.push(f.y - f.depth / 2, f.y + f.depth / 2);
    });
    if (xs.length > 0) {
      minX = Math.min(...xs) - 1.5;
      maxX = Math.max(...xs) + 1.5;
      minY = Math.min(...ys) - 1.5;
      maxY = Math.max(...ys) + 2.5;
    }
  }

  const widthMeters = maxX - minX;
  const heightMeters = maxY - minY;
  const scalePpm = 60; // 60 pixels per meter in SVG
  const svgWidth = Math.max(1200, Math.round(widthMeters * scalePpm));
  const svgHeight = Math.max(850, Math.round(heightMeters * scalePpm));

  const totalArea = tab.rooms.reduce((acc, r) => acc + r.width * r.depth, 0);

  // Colors based on palette
  let bg = '#FAFAFA';
  let wallStroke = '#1A1A1A';
  let wallFill = '#2A2A2A';
  let roomFill = 'rgba(240, 243, 246, 0.7)';
  let roomStroke = '#94A3B8';
  let textPrimary = '#0F172A';
  let textSecondary = '#64748B';
  let gridColor = 'rgba(203, 213, 225, 0.4)';
  let furnitureStroke = '#334155';
  let furnitureFill = '#FFFFFF';
  let dimColor = '#2563EB';

  if (palette === 'blueprint') {
    bg = '#0C2340';
    wallStroke = '#FFFFFF';
    wallFill = '#1E3A8A';
    roomFill = 'rgba(30, 58, 138, 0.4)';
    roomStroke = '#60A5FA';
    textPrimary = '#FFFFFF';
    textSecondary = '#93C5FD';
    gridColor = 'rgba(59, 130, 246, 0.25)';
    furnitureStroke = '#93C5FD';
    furnitureFill = 'rgba(14, 116, 144, 0.3)';
    dimColor = '#FBBF24';
  } else if (palette === 'dark') {
    bg = '#121417';
    wallStroke = '#F1F5F9';
    wallFill = '#334155';
    roomFill = 'rgba(30, 41, 59, 0.7)';
    roomStroke = '#475569';
    textPrimary = '#F8FAFC';
    textSecondary = '#94A3B8';
    gridColor = 'rgba(51, 65, 85, 0.4)';
    furnitureStroke = '#E2E8F0';
    furnitureFill = 'rgba(51, 65, 85, 0.5)';
    dimColor = '#38BDF8';
  }

  // Coordinate mapping helper
  const mapX = (x: number) => (x - minX) * scalePpm;
  const mapY = (y: number) => (y - minY) * scalePpm;

  let roomsSvg = '';
  tab.rooms.forEach((r) => {
    const rx = mapX(r.x);
    const ry = mapY(r.y);
    const rw = r.width * scalePpm;
    const rh = r.depth * scalePpm;
    const areaStr = formatArea(r.width * r.depth, tab.units);

    roomsSvg += `
      <g class="room-element">
        <rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="${roomFill}" stroke="${roomStroke}" stroke-width="1.5" rx="2" />
        <text x="${rx + rw / 2}" y="${ry + rh / 2 - 8}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="${textPrimary}">${r.name}</text>
        <text x="${rx + rw / 2}" y="${ry + rh / 2 + 14}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="${textSecondary}">${areaStr}</text>
      </g>
    `;
  });

  let wallsSvg = '';
  tab.walls.forEach((w) => {
    const x1 = mapX(w.x1);
    const y1 = mapY(w.y1);
    const x2 = mapX(w.x2);
    const y2 = mapY(w.y2);
    const thicknessPx = Math.max(3, w.thickness * scalePpm);

    wallsSvg += `
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${wallStroke}" stroke-width="${thicknessPx}" stroke-linecap="square" />
    `;
  });

  let furnitureSvg = '';
  tab.furniture.forEach((f) => {
    const cx = mapX(f.x);
    const cy = mapY(f.y);
    const fw = f.width * scalePpm;
    const fd = f.depth * scalePpm;

    furnitureSvg += `
      <g transform="translate(${cx}, ${cy}) rotate(${f.rotation}) translate(${-fw / 2}, ${-fd / 2})">
        ${
          f.imageDataUri
            ? `<image href="${f.imageDataUri}" width="${fw}" height="${fd}" preserveAspectRatio="none" />`
            : `<rect x="0" y="0" width="${fw}" height="${fd}" fill="${furnitureFill}" stroke="${furnitureStroke}" stroke-width="1.5" rx="3" />
               <text x="${fw / 2}" y="${fd / 2 + 4}" text-anchor="middle" font-family="sans-serif" font-size="10" fill="${textPrimary}">${f.name}</text>`
        }
      </g>
    `;
  });

  let dimensionsSvg = '';
  tab.dimensions.forEach((d) => {
    const x1 = mapX(d.x1);
    const y1 = mapY(d.y1);
    const x2 = mapX(d.x2);
    const y2 = mapY(d.y2);
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    dimensionsSvg += `
      <g>
        <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${dimColor}" stroke-width="1.5" stroke-dasharray="4,2" />
        <circle cx="${x1}" cy="${y1}" r="3" fill="${dimColor}" />
        <circle cx="${x2}" cy="${y2}" r="3" fill="${dimColor}" />
        <rect x="${midX - 35}" y="${midY - 10}" width="70" height="20" rx="3" fill="${bg}" stroke="${dimColor}" stroke-width="1" />
        <text x="${midX}" y="${midY + 4}" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="bold" fill="${dimColor}">${d.label || ''}</text>
      </g>
    `;
  });

  // Metadata banner at bottom
  let metadataSvg = '';
  if (includeMetadata) {
    const bannerY = svgHeight - 60;
    metadataSvg = `
      <g class="metadata-banner">
        <rect x="20" y="${bannerY}" width="${svgWidth - 40}" height="44" rx="6" fill="${bg}" stroke="${roomStroke}" stroke-width="1" opacity="0.95" />
        <text x="40" y="${bannerY + 27}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="700" fill="${textPrimary}">Draftlight — ${tab.name}</text>
        <text x="320" y="${bannerY + 27}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" fill="${textSecondary}">Scale: ${tab.scale}</text>
        <text x="460" y="${bannerY + 27}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" fill="${textSecondary}">Walls: ${tab.walls.length}</text>
        <text x="580" y="${bannerY + 27}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" fill="${textSecondary}">Area: ${formatArea(totalArea, tab.units)}</text>
        <text x="${svgWidth - 40}" y="${bannerY + 27}" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="${textSecondary}">A3 Landscape Architectural Concept</text>
      </g>
    `;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}">
  <rect width="${svgWidth}" height="${svgHeight}" fill="${bg}" />
  <!-- Drafting Grid -->
  <defs>
    <pattern id="export-grid" width="${scalePpm}" height="${scalePpm}" patternUnits="userSpaceOnUse">
      <path d="M ${scalePpm} 0 L 0 0 0 ${scalePpm}" fill="none" stroke="${gridColor}" stroke-width="0.75" />
    </pattern>
  </defs>
  <rect width="${svgWidth}" height="${svgHeight}" fill="url(#export-grid)" />

  <!-- Plan Elements -->
  ${roomsSvg}
  ${wallsSvg}
  ${furnitureSvg}
  ${dimensionsSvg}
  ${metadataSvg}
</svg>`;
}

// Convert SVG to PNG via high-res canvas
export async function generatePNG(svgString: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context not available'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to generate PNG blob'));
      }, 'image/png');
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };

    img.src = url;
  });
}

// Generate PDF using A3 landscape
export async function generatePDF(svgString: string, projectName: string): Promise<Blob> {
  const pngBlob = await generatePNG(svgString);
  const pngDataUrl = await blobToDataUrl(pngBlob);

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a3', // 420mm x 297mm
  });

  doc.addImage(pngDataUrl, 'PNG', 10, 10, 400, 277);
  doc.setProperties({
    title: `${projectName} - Floor Plan`,
    subject: 'Draftlight Architectural Concept Studio',
    creator: 'Draftlight',
  });

  return doc.output('blob');
}

// Create Project ZIP bundle containing JSON, SVG, PNG, and Readme
export async function generateProjectZip(tab: DesignTab, palette: ExportPalette): Promise<Blob> {
  const zip = new JSZip();
  const jsonString = JSON.stringify(tab, null, 2);
  const svgString = generateSVG(tab, palette, true);
  const pngBlob = await generatePNG(svgString);

  zip.file(`${tab.name.toLowerCase().replace(/\s+/g, '_')}.draftlight.json`, jsonString);
  zip.file(`${tab.name.toLowerCase().replace(/\s+/g, '_')}_floorplan.svg`, svgString);
  zip.file(`${tab.name.toLowerCase().replace(/\s+/g, '_')}_floorplan.png`, pngBlob);
  zip.file(
    'README.txt',
    `Draftlight Architectural Concept Studio
Project: ${tab.name}
Scale: ${tab.scale}
Units: ${tab.units}
Walls: ${tab.walls.length}
Rooms: ${tab.rooms.length}
Furniture pieces: ${tab.furniture.length}
Exported at: ${new Date().toISOString()}

Use Draftlight (https://ai.studio/build) to reopen and continue drafting.
`
  );

  return zip.generateAsync({ type: 'blob' });
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
