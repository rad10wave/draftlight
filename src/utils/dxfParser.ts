import { DesignTab, Wall, Room, DimensionItem, FurnitureItem, Point } from '../types';

interface DxfEntity {
  type: string;
  layer: string;
  values: Record<number, any[]>;
}

/**
 * Parses an AutoCAD ASCII DXF string into entities and structure.
 */
export function parseDxfString(dxfContent: string): {
  insUnits: number; // 1=inches, 2=feet, 4=mm, 5=cm, 6=m
  entities: DxfEntity[];
} {
  const lines = dxfContent.split(/\r?\n/);
  let insUnits = 4; // default to mm for CAD drawings
  const entities: DxfEntity[] = [];

  let i = 0;
  let inHeader = false;
  let inEntities = false;
  let currentEntity: DxfEntity | null = null;

  while (i < lines.length - 1) {
    const code = parseInt(lines[i].trim(), 10);
    const value = lines[i + 1]?.trim() ?? '';
    i += 2;

    if (isNaN(code)) continue;

    if (code === 0 && value === 'SECTION') {
      const nextCode = parseInt(lines[i]?.trim(), 10);
      const nextVal = lines[i + 1]?.trim();
      if (nextCode === 2) {
        if (nextVal === 'HEADER') inHeader = true;
        if (nextVal === 'ENTITIES') inEntities = true;
        i += 2;
      }
      continue;
    }

    if (code === 0 && value === 'ENDSEC') {
      inHeader = false;
      inEntities = false;
      if (currentEntity) {
        entities.push(currentEntity);
        currentEntity = null;
      }
      continue;
    }

    // Check header units ($INSUNITS)
    if (inHeader) {
      if (code === 9 && value === '$INSUNITS') {
        const uCode = parseInt(lines[i]?.trim(), 10);
        const uVal = parseInt(lines[i + 1]?.trim(), 10);
        if (uCode === 70 && !isNaN(uVal)) {
          insUnits = uVal;
        }
      }
    }

    // Parse entities
    if (inEntities) {
      if (code === 0) {
        if (currentEntity) {
          entities.push(currentEntity);
        }
        currentEntity = {
          type: value.toUpperCase(),
          layer: '0',
          values: {},
        };
        continue;
      }

      if (currentEntity) {
        if (code === 8) {
          currentEntity.layer = value;
        }
        if (!currentEntity.values[code]) {
          currentEntity.values[code] = [];
        }
        currentEntity.values[code].push(value);
      }
    }
  }

  if (currentEntity) {
    entities.push(currentEntity);
  }

  return { insUnits, entities };
}

/**
 * Derives conversion factor from DXF drawing units to meters.
 */
export function getUnitToMeterFactor(insUnits: number, sampleCoords: number[]): number {
  // DXF $INSUNITS: 1=Inches, 2=Feet, 4=Millimeters, 5=Centimeters, 6=Meters
  if (insUnits === 1) return 0.0254; // inches to m
  if (insUnits === 2) return 0.3048; // feet to m
  if (insUnits === 4) return 0.001; // mm to m
  if (insUnits === 5) return 0.01; // cm to m
  if (insUnits === 6) return 1.0; // m to m

  // Auto-detection heuristic if insUnits is 0 or unassigned:
  // If coordinates are in thousands (e.g. 5000, 12000), it's millimeters.
  // If coordinates are around 10 to 50, it's meters or feet.
  const maxCoord = Math.max(...sampleCoords.map(Math.abs), 1);
  if (maxCoord > 500) {
    return 0.001; // likely mm
  } else if (maxCoord > 60) {
    return 0.0254; // likely inches
  }
  return 1.0; // assume meters
}

/**
 * Converts parsed DXF entities into a full Draftlight DesignTab.
 */
export function convertDxfToDesignTab(
  dxfContent: string,
  fileName: string = 'Imported DXF Floor Plan'
): DesignTab {
  const { insUnits, entities } = parseDxfString(dxfContent);

  // Collect sample coordinate numbers to test unit scale
  const sampleCoords: number[] = [];
  entities.forEach((ent) => {
    if (ent.values[10]) sampleCoords.push(parseFloat(ent.values[10][0]));
    if (ent.values[20]) sampleCoords.push(parseFloat(ent.values[20][0]));
  });

  const toMeter = getUnitToMeterFactor(insUnits, sampleCoords);

  const walls: Wall[] = [];
  const rooms: Room[] = [];
  const dimensions: DimensionItem[] = [];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const updateBounds = (x: number, y: number) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };

  let wallIdCounter = 1;
  let roomIdCounter = 1;
  let dimIdCounter = 1;

  for (const ent of entities) {
    const layer = (ent.layer || '').toLowerCase();
    const isWallLayer =
      layer.includes('wall') ||
      layer.includes('mur') ||
      layer.includes('wand') ||
      layer.includes('parede') ||
      layer.includes('paroi') ||
      layer.includes('arch') ||
      layer === '0' ||
      entities.length < 50; // fallback if single-layer DXF

    if (ent.type === 'LINE') {
      const x1 = parseFloat(ent.values[10]?.[0] || '0') * toMeter;
      const y1 = parseFloat(ent.values[20]?.[0] || '0') * toMeter;
      const x2 = parseFloat(ent.values[11]?.[0] || '0') * toMeter;
      const y2 = parseFloat(ent.values[21]?.[0] || '0') * toMeter;

      const len = Math.hypot(x2 - x1, y2 - y1);
      if (len > 0.05) {
        updateBounds(x1, y1);
        updateBounds(x2, y2);
        walls.push({
          id: `dxf-wall-${wallIdCounter++}`,
          x1,
          y1,
          x2,
          y2,
          thickness: isWallLayer ? 0.15 : 0.1,
        });
      }
    } else if (ent.type === 'LWPOLYLINE' || ent.type === 'POLYLINE') {
      const xs = (ent.values[10] || []).map((v) => parseFloat(v) * toMeter);
      const ys = (ent.values[20] || []).map((v) => parseFloat(v) * toMeter);
      const isClosed = (ent.values[70]?.[0] & 1) === 1;

      const pts: Point[] = [];
      for (let i = 0; i < Math.min(xs.length, ys.length); i++) {
        if (!isNaN(xs[i]) && !isNaN(ys[i])) {
          pts.push({ x: xs[i], y: ys[i] });
          updateBounds(xs[i], ys[i]);
        }
      }

      if (pts.length >= 2) {
        // Generate wall lines between sequential vertices
        for (let i = 0; i < pts.length - 1; i++) {
          walls.push({
            id: `dxf-wall-${wallIdCounter++}`,
            x1: pts[i].x,
            y1: pts[i].y,
            x2: pts[i + 1].x,
            y2: pts[i + 1].y,
            thickness: 0.15,
          });
        }
        if (isClosed && pts.length > 2) {
          walls.push({
            id: `dxf-wall-${wallIdCounter++}`,
            x1: pts[pts.length - 1].x,
            y1: pts[pts.length - 1].y,
            x2: pts[0].x,
            y2: pts[0].y,
            thickness: 0.15,
          });

          // Check if it's a closed room boundary
          const polyMinX = Math.min(...pts.map((p) => p.x));
          const polyMaxX = Math.max(...pts.map((p) => p.x));
          const polyMinY = Math.min(...pts.map((p) => p.y));
          const polyMaxY = Math.max(...pts.map((p) => p.y));
          const w = polyMaxX - polyMinX;
          const d = polyMaxY - polyMinY;

          if (w >= 1.5 && d >= 1.5 && w <= 25 && d <= 25) {
            rooms.push({
              id: `dxf-room-${roomIdCounter++}`,
              name: `Space ${roomIdCounter - 1}`,
              x: polyMinX,
              y: polyMinY,
              width: w,
              depth: d,
              polygonPoints: pts,
              color: 'rgba(230, 240, 255, 0.25)',
            });
          }
        }
      }
    } else if (ent.type === 'DIMENSION') {
      const x1 = parseFloat(ent.values[13]?.[0] || '0') * toMeter;
      const y1 = parseFloat(ent.values[23]?.[0] || '0') * toMeter;
      const x2 = parseFloat(ent.values[14]?.[0] || '0') * toMeter;
      const y2 = parseFloat(ent.values[24]?.[0] || '0') * toMeter;
      if (Math.hypot(x2 - x1, y2 - y1) > 0.1) {
        dimensions.push({
          id: `dxf-dim-${dimIdCounter++}`,
          x1,
          y1,
          x2,
          y2,
          label: `${Math.hypot(x2 - x1, y2 - y1).toFixed(2)}m`,
        });
      }
    }
  }

  // Normalize coordinates so the floor plan starts with a comfortable 1m margin
  const shiftX = isFinite(minX) ? -minX + 1.0 : 0;
  const shiftY = isFinite(minY) ? -minY + 1.0 : 0;

  const normalizedWalls = walls.map((w) => ({
    ...w,
    x1: Number((w.x1 + shiftX).toFixed(3)),
    y1: Number((w.y1 + shiftY).toFixed(3)),
    x2: Number((w.x2 + shiftX).toFixed(3)),
    y2: Number((w.y2 + shiftY).toFixed(3)),
  }));

  const normalizedRooms = rooms.map((r) => ({
    ...r,
    x: Number((r.x + shiftX).toFixed(3)),
    y: Number((r.y + shiftY).toFixed(3)),
    polygonPoints: r.polygonPoints?.map((p) => ({
      x: Number((p.x + shiftX).toFixed(3)),
      y: Number((p.y + shiftY).toFixed(3)),
    })),
  }));

  const normalizedDimensions = dimensions.map((d) => ({
    ...d,
    x1: Number((d.x1 + shiftX).toFixed(3)),
    y1: Number((d.y1 + shiftY).toFixed(3)),
    x2: Number((d.x2 + shiftX).toFixed(3)),
    y2: Number((d.y2 + shiftY).toFixed(3)),
  }));

  return {
    id: `tab-dxf-${Date.now()}`,
    name: fileName.replace(/\.[^/.]+$/, ''),
    scale: '1:100',
    units: 'm',
    gridVisible: true,
    focusLight: false,
    rooms: normalizedRooms,
    walls: normalizedWalls,
    furniture: [],
    dimensions: normalizedDimensions,
    redlines: [],
    ghostSketch: null,
    layers: {
      'walls-rooms': { id: 'walls-rooms', name: 'Walls & Rooms', visible: true, locked: false, opacity: 1.0 },
      furniture: { id: 'furniture', name: 'Furniture & Fixtures', visible: true, locked: false, opacity: 1.0 },
      dimensions: { id: 'dimensions', name: 'Dimension Lines', visible: true, locked: false, opacity: 1.0 },
      redline: { id: 'redline', name: 'Redlines & Review', visible: true, locked: false, opacity: 1.0 },
      'ai-ghost': { id: 'ai-ghost', name: 'AI Ghost Sketch', visible: false, locked: true, opacity: 0.5 },
    },
    storyLevel: {
      id: 'level-0',
      name: 'Ground Floor (Level 0)',
      levelIndex: 0,
      elevation: 0,
      wallHeight: 2.8,
    },
    solarSettings: {
      northAngle: 0,
      latitude: 40.7,
      season: 'summer',
      timeOfDay: 14.0,
      showCompass: true,
      showShadows: false,
    },
  };
}
