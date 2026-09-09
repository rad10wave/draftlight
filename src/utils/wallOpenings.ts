import { Point, Wall, WallOpening, OpeningType, FurnitureItem } from '../types';

/**
 * Calculates Euclidean distance between two points.
 */
export function pointDistance(p1: Point, p2: Point): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

/**
 * Calculates wall length in meters.
 */
export function getWallLength(wall: Wall): number {
  return pointDistance({ x: wall.x1, y: wall.y1 }, { x: wall.x2, y: wall.y2 });
}

/**
 * Calculates the unit direction vector of a wall (dx, dy) and normal vector (-dy, dx).
 */
export function getWallVectors(wall: Wall): { ux: number; uy: number; nx: number; ny: number; length: number } {
  const dx = wall.x2 - wall.x1;
  const dy = wall.y2 - wall.y1;
  const length = Math.hypot(dx, dy);
  if (length < 1e-6) {
    return { ux: 1, uy: 0, nx: 0, ny: 1, length: 0 };
  }
  const ux = dx / length;
  const uy = dy / length;
  const nx = -uy;
  const ny = ux;
  return { ux, uy, nx, ny, length };
}

/**
 * Projects a point onto a wall line segment.
 * Returns distance along the wall from (x1, y1), clamp distance, and perpendicular distance.
 */
export function projectPointOntoWall(point: Point, wall: Wall): { distanceAlong: number; perpDist: number; isWithin: boolean; projPoint: Point } {
  const { ux, uy, nx, ny, length } = getWallVectors(wall);
  const vx = point.x - wall.x1;
  const vy = point.y - wall.y1;

  const dot = vx * ux + vy * uy;
  const perp = vx * nx + vy * ny;

  const clampedDist = Math.max(0, Math.min(length, dot));
  const projPoint = {
    x: wall.x1 + clampedDist * ux,
    y: wall.y1 + clampedDist * uy,
  };

  return {
    distanceAlong: dot,
    perpDist: Math.abs(perp),
    isWithin: dot >= 0 && dot <= length,
    projPoint,
  };
}

/**
 * Finds the closest wall to a given point within a threshold (e.g. 0.45 meters).
 */
export function findClosestWall(
  point: Point,
  walls: Wall[],
  threshold: number = 0.45
): { wall: Wall; distanceAlong: number; perpDist: number; projPoint: Point } | null {
  let closest: { wall: Wall; distanceAlong: number; perpDist: number; projPoint: Point } | null = null;
  let minPerp = threshold;

  for (const wall of walls) {
    const proj = projectPointOntoWall(point, wall);
    if (proj.isWithin && proj.perpDist <= minPerp) {
      minPerp = proj.perpDist;
      closest = {
        wall,
        distanceAlong: proj.distanceAlong,
        perpDist: proj.perpDist,
        projPoint: proj.projPoint,
      };
    }
  }

  return closest;
}

export interface WallSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Slices a wall into visible solid sub-segments by cutting out hosted door and window openings.
 */
export function getWallSolidSegments(wall: Wall): WallSegment[] {
  const length = getWallLength(wall);
  if (length <= 0) return [];
  if (!wall.openings || wall.openings.length === 0) {
    return [{ x1: wall.x1, y1: wall.y1, x2: wall.x2, y2: wall.y2 }];
  }

  const { ux, uy } = getWallVectors(wall);

  // Sort openings along wall by start distance
  const intervals = wall.openings
    .map((op) => {
      const halfW = op.width / 2;
      return {
        start: Math.max(0, op.distanceAlongWall - halfW),
        end: Math.min(length, op.distanceAlongWall + halfW),
      };
    })
    .sort((a, b) => a.start - b.start);

  // Merge overlapping intervals if any
  const merged: Array<{ start: number; end: number }> = [];
  for (const item of intervals) {
    if (merged.length === 0) {
      merged.push({ ...item });
    } else {
      const last = merged[merged.length - 1];
      if (item.start <= last.end) {
        last.end = Math.max(last.end, item.end);
      } else {
        merged.push({ ...item });
      }
    }
  }

  // Generate solid intervals between cuts
  const segments: WallSegment[] = [];
  let cur = 0;

  for (const cut of merged) {
    if (cut.start > cur + 0.02) {
      segments.push({
        x1: wall.x1 + cur * ux,
        y1: wall.y1 + cur * uy,
        x2: wall.x1 + cut.start * ux,
        y2: wall.y1 + cut.start * uy,
      });
    }
    cur = Math.max(cur, cut.end);
  }

  if (cur < length - 0.02) {
    segments.push({
      x1: wall.x1 + cur * ux,
      y1: wall.y1 + cur * uy,
      x2: wall.x1 + length * ux,
      y2: wall.y1 + length * uy,
    });
  }

  return segments;
}

/**
 * Creates or updates an opening on a wall.
 */
export function hostOpeningOnWall(
  wall: Wall,
  openingData: Omit<WallOpening, 'id'> & { id?: string }
): Wall {
  const wallLen = getWallLength(wall);
  const width = Math.min(openingData.width, wallLen * 0.9);
  const halfW = width / 2;
  const clampedDist = Math.max(halfW + 0.05, Math.min(wallLen - halfW - 0.05, openingData.distanceAlongWall));

  const newOpening: WallOpening = {
    id: openingData.id || `op-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: openingData.type,
    distanceAlongWall: clampedDist,
    width,
    height: openingData.height ?? (openingData.type === 'window' ? 1.2 : 2.1),
    sillHeight: openingData.sillHeight ?? (openingData.type === 'window' ? 0.9 : 0),
    swingDirection: openingData.swingDirection ?? 'left',
    swingOrientation: openingData.swingOrientation ?? 'in',
    swingAngle: openingData.swingAngle ?? 90,
    label: openingData.label,
    furnitureRefId: openingData.furnitureRefId,
  };

  const existing = (wall.openings || []).filter((o) => o.id !== newOpening.id);
  return {
    ...wall,
    openings: [...existing, newOpening],
  };
}

/**
 * Returns all openings on a wall, including cuts generated by door and window furniture placed near the wall.
 */
export function getCombinedWallOpenings(
  wall: Wall,
  furnitureList?: FurnitureItem[]
): WallOpening[] {
  const wallLen = getWallLength(wall);
  if (wallLen <= 0) return [];

  const openings: WallOpening[] = [...(wall.openings || [])];

  if (furnitureList && furnitureList.length > 0) {
    for (const f of furnitureList) {
      const isDoorOrWin =
        f.category === 'doors-windows' ||
        f.assetId === 'door' ||
        f.assetId === 'double-door' ||
        f.assetId === 'window' ||
        f.name.toLowerCase().includes('door') ||
        f.name.toLowerCase().includes('window');

      if (!isDoorOrWin) continue;

      // Avoid duplicating if already hosted as a wallOpening with furnitureRefId
      if (openings.some((op) => op.furnitureRefId === f.id)) continue;

      const proj = projectPointOntoWall({ x: f.x, y: f.y }, wall);
      const isWithinWithMargin = proj.distanceAlong >= -0.3 && proj.distanceAlong <= wallLen + 0.3;
      if (isWithinWithMargin && proj.perpDist <= Math.max(0.7, wall.thickness / 2 + 0.5)) {
        const isWin = f.assetId === 'window' || f.name.toLowerCase().includes('window');
        const halfW = f.width / 2;
        const clampedDist = Math.max(halfW + 0.02, Math.min(wallLen - halfW - 0.02, proj.distanceAlong));
        openings.push({
          id: `cut-furn-${f.id}`,
          type: isWin ? 'window' : 'door',
          distanceAlongWall: clampedDist,
          width: f.width,
          height: 2.1,
          sillHeight: 0,
          swingDirection: 'left',
          swingOrientation: 'in',
          swingAngle: 90,
          label: f.name,
          furnitureRefId: f.id,
        });
      }
    }
  }

  return openings;
}

/**
 * Slices a wall into visible solid sub-segments by cutting out hosted door and window openings
 * AND any door/window furniture items positioned along this wall.
 */
export function getWallSolidSegmentsWithFurniture(
  wall: Wall,
  furnitureList?: FurnitureItem[]
): WallSegment[] {
  const combined = getCombinedWallOpenings(wall, furnitureList);
  const virtualWall: Wall = {
    ...wall,
    openings: combined,
  };
  return getWallSolidSegments(virtualWall);
}

