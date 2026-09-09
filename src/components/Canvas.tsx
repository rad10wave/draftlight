import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  DesignTab,
  DraftTool,
  SelectedElement,
  Point,
  Room,
  Wall,
  WallOpening,
  FurnitureItem,
  DimensionItem,
  RedlineItem,
  GhostSketch,
} from '../types';
import {
  getPixelsPerMeter,
  formatDistance,
  formatArea,
  snapToGrid,
} from '../utils/units';
import {
  getWallSolidSegmentsWithFurniture,
  getCombinedWallOpenings,
  getWallVectors,
  findClosestWall,
  projectPointOntoWall,
  getWallLength,
} from '../utils/wallOpenings';
import { ArchitecturalSymbol } from './ArchitecturalSymbols';
import {
  Compass,
  Sparkles,
  Check,
  X,
  PlusSquare,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';

interface CanvasProps {
  activeTab: DesignTab;
  activeTool: DraftTool;
  onSelectTool: (tool: DraftTool) => void;
  selectedElement: SelectedElement;
  onSelectElement: (el: SelectedElement) => void;
  onCommitChange: (newTabState: Partial<DesignTab>) => void;
  zoom: number;
  onZoomChange: (z: number) => void;
  theme: string;
  onOpenCalibrate: (distance: number) => void;
  onOpenNewTabWithGhost: (sketch: GhostSketch) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  activeTab,
  activeTool,
  onSelectTool,
  selectedElement,
  onSelectElement,
  onCommitChange,
  zoom,
  onZoomChange,
  theme,
  onOpenCalibrate,
  onOpenNewTabWithGhost,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState<Point>({ x: 80, y: 80 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });

  // Cursor real-world position
  const [cursorPos, setCursorPos] = useState<Point>({ x: 0, y: 0 });

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<Point>({ x: 0, y: 0 });
  const [drawCurrent, setDrawCurrent] = useState<Point>({ x: 0, y: 0 });

  // Redline points during drawing
  const [redlinePoints, setRedlinePoints] = useState<Point[]>([]);

  // Dragging existing geometry
  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<Point>({ x: 0, y: 0 });
  const [elementInitialPos, setElementInitialPos] = useState<{
    x: number;
    y: number;
    x2?: number;
    y2?: number;
    width?: number;
    depth?: number;
  }>({ x: 0, y: 0 });

  // Wall dragging mode: body translation, start endpoint, end endpoint, rotation
  const [wallDragMode, setWallDragMode] = useState<'body' | 'start' | 'end' | 'rotate' | null>(null);

  // Multi-touch tracking for pinch-to-zoom and two-finger pan
  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartZoom = useRef<number>(zoom);
  const pinchStartPan = useRef<Point>(pan);
  const pinchStartCenter = useRef<{ x: number; y: number } | null>(null);

  // Resizing Room handle ('nw' | 'ne' | 'se' | 'sw' | 'n' | 'e' | 's' | 'w')
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);

  // Calibrate first point
  const [calibrateFirstPoint, setCalibrateFirstPoint] = useState<Point | null>(null);

  // Snap preview when hovering walls with 'door' or 'window' tool
  const [openingHoverSnap, setOpeningHoverSnap] = useState<{
    wall: Wall;
    distanceAlongWall: number;
    projPoint: Point;
    type: 'door' | 'window';
  } | null>(null);

  const ppm = getPixelsPerMeter(activeTab?.scale || '1:100');
  const isDark = theme === 'trace';

  // Screen pixel to real-world meters conversion
  const screenToMeters = useCallback(
    (clientX: number, clientY: number): Point => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const px = clientX - rect.left - pan.x;
      const py = clientY - rect.top - pan.y;
      const rawX = px / (ppm * zoom);
      const rawY = py / (ppm * zoom);
      return {
        x: Math.round(rawX * 100) / 100,
        y: Math.round(rawY * 100) / 100,
      };
    },
    [pan, ppm, zoom]
  );

  // Real-world meters to screen pixels
  const metersToScreen = useCallback(
    (mx: number, my: number) => {
      return {
        x: mx * ppm * zoom + pan.x,
        y: my * ppm * zoom + pan.y,
      };
    },
    [pan, ppm, zoom]
  );

  // Handle pointer move over canvas
  const handlePointerMove = (e: React.PointerEvent) => {
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Multi-touch 2-finger pinch to zoom & pan
    if (activePointers.current.size === 2 && pinchStartDist.current && pinchStartCenter.current) {
      const pts: Array<{ x: number; y: number }> = [];
      activePointers.current.forEach((pt) => pts.push(pt));
      if (pts.length >= 2) {
        const currentDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        if (pinchStartDist.current > 0) {
          const scaleRatio = currentDist / pinchStartDist.current;
          const targetZoom = Math.min(2.5, Math.max(0.35, pinchStartZoom.current * scaleRatio));
          onZoomChange(Math.round(targetZoom * 100) / 100);

          const currentCenter = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
          const panDx = currentCenter.x - pinchStartCenter.current.x;
          const panDy = currentCenter.y - pinchStartCenter.current.y;
          setPan({
            x: pinchStartPan.current.x + panDx,
            y: pinchStartPan.current.y + panDy,
          });
        }
      }
      return;
    }

    const m = screenToMeters(e.clientX, e.clientY);
    setCursorPos(m);

    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (isDrawing) {
      const snapped = {
        x: snapToGrid(m.x, 0.05),
        y: snapToGrid(m.y, 0.05),
      };
      setDrawCurrent(snapped);

      if (activeTool === 'redline') {
        setRedlinePoints((prev) => [...prev, snapped]);
      }
      return;
    }

    if (isDraggingElement && selectedElement) {
      const dx = m.x - dragStartPos.x;
      const dy = m.y - dragStartPos.y;

      if (selectedElement.type === 'room') {
        if (resizeHandle) {
          // Resize room via handles
          const updatedRooms = activeTab.rooms.map((r) => {
            if (r.id === selectedElement.id) {
              let newX = elementInitialPos.x;
              let newY = elementInitialPos.y;
              let newW = elementInitialPos.width || r.width;
              let newD = elementInitialPos.depth || r.depth;

              if (resizeHandle.includes('e')) newW = Math.max(0.5, (elementInitialPos.width || r.width) + dx);
              if (resizeHandle.includes('s')) newD = Math.max(0.5, (elementInitialPos.depth || r.depth) + dy);
              if (resizeHandle.includes('w')) {
                const proposedW = (elementInitialPos.width || r.width) - dx;
                if (proposedW >= 0.5) {
                  newX = elementInitialPos.x + dx;
                  newW = proposedW;
                }
              }
              if (resizeHandle.includes('n')) {
                const proposedD = (elementInitialPos.depth || r.depth) - dy;
                if (proposedD >= 0.5) {
                  newY = elementInitialPos.y + dy;
                  newD = proposedD;
                }
              }

              return {
                ...r,
                x: snapToGrid(newX, 0.05),
                y: snapToGrid(newY, 0.05),
                width: snapToGrid(newW, 0.05),
                depth: snapToGrid(newD, 0.05),
              };
            }
            return r;
          });
          onCommitChange({ rooms: updatedRooms });
        } else {
          // Move room
          const updatedRooms = activeTab.rooms.map((r) => {
            if (r.id === selectedElement.id) {
              return {
                ...r,
                x: snapToGrid(elementInitialPos.x + dx, 0.05),
                y: snapToGrid(elementInitialPos.y + dy, 0.05),
              };
            }
            return r;
          });
          onCommitChange({ rooms: updatedRooms });
        }
      } else if (selectedElement.type === 'wall') {
        const targetWall = activeTab.walls.find((w) => w.id === selectedElement.id);
        if (targetWall) {
          const initX1 = elementInitialPos.x;
          const initY1 = elementInitialPos.y;
          const initX2 = elementInitialPos.x2 ?? targetWall.x2;
          const initY2 = elementInitialPos.y2 ?? targetWall.y2;

          let updatedWalls = activeTab.walls;

          if (resizeHandle === 'start' || wallDragMode === 'start') {
            updatedWalls = activeTab.walls.map((w) => {
              if (w.id === targetWall.id) {
                return {
                  ...w,
                  x1: snapToGrid(m.x, 0.05),
                  y1: snapToGrid(m.y, 0.05),
                };
              }
              return w;
            });
          } else if (resizeHandle === 'end' || wallDragMode === 'end') {
            updatedWalls = activeTab.walls.map((w) => {
              if (w.id === targetWall.id) {
                return {
                  ...w,
                  x2: snapToGrid(m.x, 0.05),
                  y2: snapToGrid(m.y, 0.05),
                };
              }
              return w;
            });
          } else if (wallDragMode === 'rotate') {
            const midX = (initX1 + initX2) / 2;
            const midY = (initY1 + initY2) / 2;
            const wallLen = Math.hypot(initX2 - initX1, initY2 - initY1) || 1;
            const halfLen = wallLen / 2;
            let angleRad = Math.atan2(m.y - midY, m.x - midX);
            if (e.shiftKey) {
              const deg = (angleRad * 180) / Math.PI;
              const snappedDeg = Math.round(deg / 15) * 15;
              angleRad = (snappedDeg * Math.PI) / 180;
            }
            updatedWalls = activeTab.walls.map((w) => {
              if (w.id === targetWall.id) {
                return {
                  ...w,
                  x1: parseFloat((midX - Math.cos(angleRad) * halfLen).toFixed(2)),
                  y1: parseFloat((midY - Math.sin(angleRad) * halfLen).toFixed(2)),
                  x2: parseFloat((midX + Math.cos(angleRad) * halfLen).toFixed(2)),
                  y2: parseFloat((midY + Math.sin(angleRad) * halfLen).toFixed(2)),
                };
              }
              return w;
            });
          } else {
            // Translating the whole wall
            updatedWalls = activeTab.walls.map((w) => {
              if (w.id === targetWall.id) {
                return {
                  ...w,
                  x1: snapToGrid(initX1 + dx, 0.05),
                  y1: snapToGrid(initY1 + dy, 0.05),
                  x2: snapToGrid(initX2 + dx, 0.05),
                  y2: snapToGrid(initY2 + dy, 0.05),
                };
              }
              return w;
            });
          }
          onCommitChange({ walls: updatedWalls });
        }
      } else if (selectedElement.type === 'furniture') {
        const newX = snapToGrid(elementInitialPos.x + dx, 0.05);
        const newY = snapToGrid(elementInitialPos.y + dy, 0.05);

        const updatedFurn = activeTab.furniture.map((f) => {
          if (f.id === selectedElement.id) {
            let rotation = f.rotation;
            const isDoorOrWin =
              f.category === 'doors-windows' ||
              f.assetId === 'door' ||
              f.assetId === 'double-door' ||
              f.assetId === 'window' ||
              f.name.toLowerCase().includes('door') ||
              f.name.toLowerCase().includes('window');

            if (isDoorOrWin) {
              for (const wall of activeTab.walls) {
                const wallLen = Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1);
                if (wallLen > 0.1) {
                  const pDist =
                    Math.abs(
                      (wall.y2 - wall.y1) * newX -
                        (wall.x2 - wall.x1) * newY +
                        wall.x2 * wall.y1 -
                        wall.y2 * wall.x1
                    ) / wallLen;
                  if (pDist <= wall.thickness / 2 + 0.45) {
                    const wallAngle = Math.round(
                      ((Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1) * 180) /
                        Math.PI +
                        360) %
                        360
                    );
                    rotation = wallAngle;
                    break;
                  }
                }
              }
            }

            return {
              ...f,
              x: newX,
              y: newY,
              rotation,
            };
          }
          return f;
        });
        onCommitChange({ furniture: updatedFurn });
      }
    }

    // Snap preview calculation when activeTool is door or window
    if (activeTool === 'door' || activeTool === 'window') {
      const closest = findClosestWall(m, activeTab.walls, 0.9);
      if (closest) {
        const wallLen = getWallLength(closest.wall);
        const opW = activeTool === 'window' ? 1.2 : 0.9;
        const halfW = opW / 2;
        const clampedDist = Math.max(halfW + 0.05, Math.min(wallLen - halfW - 0.05, closest.distanceAlong));
        setOpeningHoverSnap({
          wall: closest.wall,
          distanceAlongWall: clampedDist,
          projPoint: closest.projPoint,
          type: activeTool,
        });
      } else {
        setOpeningHoverSnap(null);
      }
    } else if (openingHoverSnap) {
      setOpeningHoverSnap(null);
    }
  };

  // Pointer down on canvas
  const handlePointerDown = (e: React.PointerEvent) => {
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Two finger gesture detection (pinch & pan)
    if (activePointers.current.size === 2) {
      setIsDrawing(false);
      setIsDraggingElement(false);
      setIsPanning(false);
      setWallDragMode(null);
      setResizeHandle(null);
      const pts: Array<{ x: number; y: number }> = [];
      activePointers.current.forEach((pt) => pts.push(pt));
      if (pts.length >= 2) {
        const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        pinchStartDist.current = dist > 0 ? dist : 1;
        pinchStartZoom.current = zoom;
        pinchStartPan.current = pan;
        pinchStartCenter.current = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      }
      return;
    }

    // Middle click or space key drag starts panning
    if (e.button === 1 || e.buttons === 4 || e.altKey || (e.shiftKey && activeTool === 'select' && e.target === containerRef.current)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    const m = screenToMeters(e.clientX, e.clientY);
    const snapped = {
      x: snapToGrid(m.x, 0.05),
      y: snapToGrid(m.y, 0.05),
    };

    if (activeTool === 'calibrate') {
      if (!calibrateFirstPoint) {
        setCalibrateFirstPoint(snapped);
      } else {
        const dist = Math.hypot(snapped.x - calibrateFirstPoint.x, snapped.y - calibrateFirstPoint.y);
        setCalibrateFirstPoint(null);
        if (dist > 0.1) {
          onOpenCalibrate(dist);
        }
      }
      return;
    }

    // Interactive placement of Door or Window opening cuts on walls
    if (activeTool === 'door' || activeTool === 'window') {
      const closest = openingHoverSnap || (() => {
        const c = findClosestWall(m, activeTab.walls, 0.9);
        if (!c) return null;
        const wallLen = getWallLength(c.wall);
        const opW = activeTool === 'window' ? 1.2 : 0.9;
        const halfW = opW / 2;
        const clampedDist = Math.max(halfW + 0.05, Math.min(wallLen - halfW - 0.05, c.distanceAlong));
        return {
          wall: c.wall,
          distanceAlongWall: clampedDist,
          projPoint: c.projPoint,
          type: activeTool,
        };
      })();

      if (closest) {
        const opW = activeTool === 'window' ? 1.2 : 0.9;
        const newOpening: WallOpening = {
          id: `op-${Date.now()}`,
          type: activeTool,
          distanceAlongWall: Math.round(closest.distanceAlongWall * 100) / 100,
          width: opW,
          height: activeTool === 'window' ? 1.2 : 2.1,
          sillHeight: activeTool === 'window' ? 0.9 : 0,
          swingDirection: 'right',
          swingOrientation: 'in',
          swingAngle: 90,
          label: activeTool === 'window' ? 'Window Cut' : 'Door Cut',
        };

        const updatedWalls = activeTab.walls.map((w) => {
          if (w.id === closest.wall.id) {
            return {
              ...w,
              openings: [...(w.openings || []), newOpening],
            };
          }
          return w;
        });

        onCommitChange({ walls: updatedWalls });
        onSelectElement({ type: 'opening', wallId: closest.wall.id, openingId: newOpening.id });
        setOpeningHoverSnap(null);
        return;
      }
    }

    if (activeTool === 'wall' || activeTool === 'room' || activeTool === 'measure' || activeTool === 'redline') {
      setIsDrawing(true);
      setDrawStart(snapped);
      setDrawCurrent(snapped);
      if (activeTool === 'redline') {
        setRedlinePoints([snapped]);
      }
      return;
    }

    // If select tool and clicked on empty background, deselect
    if (activeTool === 'select' && (e.target as HTMLElement).id === 'main-canvas-svg') {
      onSelectElement(null);
    }
  };

  // Pointer up on canvas
  const handlePointerUp = (e?: React.PointerEvent) => {
    if (e?.pointerId !== undefined) {
      activePointers.current.delete(e.pointerId);
    }
    if (activePointers.current.size < 2) {
      pinchStartDist.current = null;
      pinchStartCenter.current = null;
    }

    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDraggingElement) {
      setIsDraggingElement(false);
      setResizeHandle(null);
      setWallDragMode(null);
      return;
    }

    if (isDrawing) {
      setIsDrawing(false);

      if (activeTool === 'wall') {
        const dist = Math.hypot(drawCurrent.x - drawStart.x, drawCurrent.y - drawStart.y);
        if (dist >= 0.2) {
          const newWall: Wall = {
            id: `w-${Date.now()}`,
            x1: drawStart.x,
            y1: drawStart.y,
            x2: drawCurrent.x,
            y2: drawCurrent.y,
            thickness: 0.15,
          };
          onCommitChange({ walls: [...activeTab.walls, newWall] });
        }
      } else if (activeTool === 'room') {
        const x = Math.min(drawStart.x, drawCurrent.x);
        const y = Math.min(drawStart.y, drawCurrent.y);
        const width = Math.abs(drawCurrent.x - drawStart.x);
        const depth = Math.abs(drawCurrent.y - drawStart.y);

        if (width >= 0.8 && depth >= 0.8) {
          const newRoom: Room = {
            id: `r-${Date.now()}`,
            name: `Room ${activeTab.rooms.length + 1}`,
            x,
            y,
            width,
            depth,
            wallThickness: 0.15,
            color: 'rgba(230, 240, 255, 0.3)',
          };

          // Create connected perimeter walls automatically
          const wallThick = 0.15;
          const w1: Wall = { id: `w-${Date.now()}-1`, x1: x, y1: y, x2: x + width, y2: y, thickness: wallThick };
          const w2: Wall = { id: `w-${Date.now()}-2`, x1: x + width, y1: y, x2: x + width, y2: y + depth, thickness: wallThick };
          const w3: Wall = { id: `w-${Date.now()}-3`, x1: x + width, y1: y + depth, x2: x, y2: y + depth, thickness: wallThick };
          const w4: Wall = { id: `w-${Date.now()}-4`, x1: x, y1: y + depth, x2: x, y2: y, thickness: wallThick };

          onCommitChange({
            rooms: [...activeTab.rooms, newRoom],
            walls: [...activeTab.walls, w1, w2, w3, w4],
          });
          onSelectElement({ type: 'room', id: newRoom.id });
          onSelectTool('select');
        }
      } else if (activeTool === 'measure') {
        const dist = Math.hypot(drawCurrent.x - drawStart.x, drawCurrent.y - drawStart.y);
        if (dist >= 0.1) {
          const newDim: DimensionItem = {
            id: `dim-${Date.now()}`,
            x1: drawStart.x,
            y1: drawStart.y,
            x2: drawCurrent.x,
            y2: drawCurrent.y,
            label: formatDistance(dist, activeTab.units),
          };
          onCommitChange({ dimensions: [...activeTab.dimensions, newDim] });
        }
      } else if (activeTool === 'redline') {
        if (redlinePoints.length >= 2) {
          const newRedline: RedlineItem = {
            id: `red-${Date.now()}`,
            points: redlinePoints,
            color: '#EF4444',
            strokeWidth: 2,
          };
          onCommitChange({ redlines: [...activeTab.redlines, newRedline] });
          setRedlinePoints([]);
        }
      }
    }
  };

  // Pointer cancel (e.g. gesture interrupted or browser tab switched)
  const handlePointerCancel = (e: React.PointerEvent) => {
    activePointers.current.delete(e.pointerId);
    pinchStartDist.current = null;
    pinchStartCenter.current = null;
    setIsPanning(false);
    setIsDrawing(false);
    setIsDraggingElement(false);
    setWallDragMode(null);
    setResizeHandle(null);
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const newZoom = Math.min(1.8, Math.max(0.55, zoom * zoomFactor));
    onZoomChange(Math.round(newZoom * 100) / 100);
  };

  // Keyboard navigation & Nudge: 1 cm per press, or 10 cm with Shift
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If user typing in an input or textarea, don't hijack keys
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      const step = e.shiftKey ? 0.10 : 0.01; // 10 cm or 1 cm

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedElement) {
        e.preventDefault();
        let dx = 0;
        let dy = 0;
        if (e.key === 'ArrowUp') dy = -step;
        if (e.key === 'ArrowDown') dy = step;
        if (e.key === 'ArrowLeft') dx = -step;
        if (e.key === 'ArrowRight') dx = step;

        if (selectedElement.type === 'room') {
          const updated = activeTab.rooms.map((r) =>
            r.id === selectedElement.id ? { ...r, x: r.x + dx, y: r.y + dy } : r
          );
          onCommitChange({ rooms: updated });
        } else if (selectedElement.type === 'furniture') {
          const updated = activeTab.furniture.map((f) =>
            f.id === selectedElement.id ? { ...f, x: f.x + dx, y: f.y + dy } : f
          );
          onCommitChange({ furniture: updated });
        } else if (selectedElement.type === 'wall') {
          const updated = activeTab.walls.map((w) =>
            w.id === selectedElement.id
              ? { ...w, x1: w.x1 + dx, y1: w.y1 + dy, x2: w.x2 + dx, y2: w.y2 + dy }
              : w
          );
          onCommitChange({ walls: updated });
        }
        return;
      }

      if (e.key === 'Escape') {
        setIsDrawing(false);
        setCalibrateFirstPoint(null);
        onSelectTool('select');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, selectedElement, onCommitChange, onSelectTool]);

  // AI Ghost Actions
  const handleDiscardGhost = () => {
    onCommitChange({ ghostSketch: null });
  };

  const handleReplaceWithGhost = () => {
    if (!activeTab.ghostSketch) return;
    onCommitChange({
      rooms: activeTab.ghostSketch.rooms,
      walls: activeTab.ghostSketch.walls,
      furniture: activeTab.ghostSketch.furniture || [],
      ghostSketch: null,
    });
  };

  const handleAddGhost = () => {
    if (!activeTab.ghostSketch) return;
    onCommitChange({
      rooms: [...activeTab.rooms, ...activeTab.ghostSketch.rooms],
      walls: [...activeTab.walls, ...activeTab.ghostSketch.walls],
      furniture: [...activeTab.furniture, ...(activeTab.ghostSketch.furniture || [])],
      ghostSketch: null,
    });
  };

  // Total room area
  const totalRoomArea = activeTab.rooms.reduce((acc, r) => acc + r.width * r.depth, 0);

  // Layer lookups with safe fallbacks
  const layerWalls = activeTab?.layers?.['walls-rooms'] ?? { id: 'walls-rooms', name: 'Walls & Rooms', visible: true, locked: false };
  const layerFurn = activeTab?.layers?.['furniture'] ?? { id: 'furniture', name: 'Furniture', visible: true, locked: false };
  const layerDim = activeTab?.layers?.['dimensions'] ?? { id: 'dimensions', name: 'Dimensions', visible: true, locked: false };
  const layerRed = activeTab?.layers?.['redline'] ?? { id: 'redline', name: 'Redlines', visible: true, locked: false };
  const layerGhost = activeTab?.layers?.['ai-ghost'] ?? { id: 'ai-ghost', name: 'AI Ghost Sketch', visible: true, locked: false };

  // Scale bar math: calculate pixels for 2m
  const scaleBarMeters = 2;
  const scaleBarPixels = scaleBarMeters * ppm * zoom;

  return (
    <div
      ref={containerRef}
      id="draftlight-canvas-container"
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onWheel={handleWheel}
      className={`relative flex-1 w-full h-full overflow-hidden select-none touch-none cursor-crosshair ${
        isDark
          ? 'bg-[#0B1320]'
          : theme === 'classic'
          ? 'bg-[#FAF7F0]'
          : 'bg-[#F8FAFC]'
      }`}
    >
      {/* AI Ghost Sketch Review Floating Banner */}
      {activeTab.ghostSketch && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-lg border border-blue-400 dark:border-blue-600 flex items-center gap-3 animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-2 pr-2 border-r border-slate-200 dark:border-slate-800">
            <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
            <div className="text-xs">
              <div className="font-semibold text-slate-800 dark:text-slate-100">
                AI Ghost Sketch Ready
              </div>
              <div className="text-[10px] text-slate-500">
                {activeTab.ghostSketch.rooms.length} rooms • {activeTab.ghostSketch.walls.length} walls
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={handleReplaceWithGhost}
              className="flex items-center gap-1 px-2.5 py-1 font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-2xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Replace Plan</span>
            </button>

            <button
              onClick={handleAddGhost}
              className="flex items-center gap-1 px-2.5 py-1 font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
            >
              <PlusSquare className="w-3.5 h-3.5" />
              <span>Add to Plan</span>
            </button>

            <button
              onClick={() => onOpenNewTabWithGhost(activeTab.ghostSketch!)}
              className="flex items-center gap-1 px-2.5 py-1 font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in New Tab</span>
            </button>

            <button
              onClick={handleDiscardGhost}
              className="flex items-center gap-1 px-2 py-1 font-medium rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Discard</span>
            </button>
          </div>
        </div>
      )}

      {/* Main SVG Drafting Surface */}
      <svg
        id="main-canvas-svg"
        className="w-full h-full pointer-events-auto"
      >
        <defs>
          {/* Subtle Drafting Grid pattern */}
          <pattern
            id="drafting-grid"
            width={ppm * zoom}
            height={ppm * zoom}
            patternUnits="userSpaceOnUse"
            x={pan.x % (ppm * zoom)}
            y={pan.y % (ppm * zoom)}
          >
            <path
              d={`M ${ppm * zoom} 0 L 0 0 0 ${ppm * zoom}`}
              fill="none"
              stroke={
                isDark
                  ? 'rgba(71, 85, 105, 0.25)'
                  : theme === 'classic'
                  ? 'rgba(180, 160, 140, 0.2)'
                  : 'rgba(203, 213, 225, 0.4)'
              }
              strokeWidth="0.8"
            />
          </pattern>

          {/* Diagonal hatch for thick walls */}
          <pattern id="wall-hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="8" stroke={isDark ? '#475569' : '#CBD5E1'} strokeWidth="1.5" />
          </pattern>
        </defs>

        {/* Background Grid */}
        {activeTab.gridVisible && (
          <rect width="100%" height="100%" fill="url(#drafting-grid)" pointerEvents="none" />
        )}

        {/* Canvas World Transform Group */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${ppm * zoom})`}>
          {/* 1. ROOMS LAYER */}
          {layerWalls?.visible && (
            <g id="layer-rooms" opacity={layerWalls.opacity}>
              {activeTab.rooms.map((r) => {
                const isSelected = selectedElement?.type === 'room' && selectedElement.id === r.id;
                const isDimmed = activeTab.focusLight && selectedElement && !isSelected;

                return (
                  <g
                    key={r.id}
                    id={`room-${r.id}`}
                    opacity={isDimmed ? 0.25 : 1}
                    onPointerDown={(e) => {
                      if (layerWalls.locked || r.locked) return;
                      e.stopPropagation();
                      onSelectElement({ type: 'room', id: r.id });
                      setIsDraggingElement(true);
                      const m = screenToMeters(e.clientX, e.clientY);
                      setDragStartPos(m);
                      setElementInitialPos({ x: r.x, y: r.y, width: r.width, depth: r.depth });
                    }}
                    className="cursor-move"
                  >
                    <rect
                      x={r.x}
                      y={r.y}
                      width={r.width}
                      height={r.depth}
                      fill={r.color || (isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(241, 245, 249, 0.8)')}
                      stroke={isSelected ? '#3B82F6' : (isDark ? '#475569' : '#94A3B8')}
                      strokeWidth={isSelected ? 0.05 : 0.02}
                      strokeDasharray={isSelected ? '0.1,0.05' : 'none'}
                      rx={0.05}
                    />

                    {/* Room Title and Area text */}
                    <text
                      x={r.x + r.width / 2}
                      y={r.y + r.depth / 2 - 0.12}
                      textAnchor="middle"
                      fontSize={Math.max(0.24, Math.min(0.4, r.width * 0.1))}
                      fontWeight="600"
                      fill={isDark ? '#F1F5F9' : '#1E293B'}
                      fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                      pointerEvents="none"
                    >
                      {r.name}
                    </text>
                    <text
                      x={r.x + r.width / 2}
                      y={r.y + r.depth / 2 + 0.2}
                      textAnchor="middle"
                      fontSize={Math.max(0.18, Math.min(0.28, r.width * 0.07))}
                      fill={isDark ? '#94A3B8' : '#64748B'}
                      fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                      pointerEvents="none"
                    >
                      {formatArea(r.width * r.depth, activeTab.units)}
                    </text>

                    {/* Resize Handles when selected */}
                    {isSelected && !layerWalls.locked && !r.locked && (
                      <g>
                        {[
                          { handle: 'nw', cx: r.x, cy: r.y },
                          { handle: 'ne', cx: r.x + r.width, cy: r.y },
                          { handle: 'se', cx: r.x + r.width, cy: r.y + r.depth },
                          { handle: 'sw', cx: r.x, cy: r.y + r.depth },
                          { handle: 'n', cx: r.x + r.width / 2, cy: r.y },
                          { handle: 'e', cx: r.x + r.width, cy: r.y + r.depth / 2 },
                          { handle: 's', cx: r.x + r.width / 2, cy: r.y + r.depth },
                          { handle: 'w', cx: r.x, cy: r.y + r.depth / 2 },
                        ].map((h) => (
                          <circle
                            key={h.handle}
                            cx={h.cx}
                            cy={h.cy}
                            r={0.09}
                            fill="#FFFFFF"
                            stroke="#2563EB"
                            strokeWidth={0.03}
                            className="cursor-pointer hover:scale-125 transition-transform"
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              setResizeHandle(h.handle);
                              setIsDraggingElement(true);
                              const m = screenToMeters(e.clientX, e.clientY);
                              setDragStartPos(m);
                              setElementInitialPos({ x: r.x, y: r.y, width: r.width, depth: r.depth });
                            }}
                          />
                        ))}
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* 2. WALLS LAYER */}
          {layerWalls?.visible && (
            <g id="layer-walls" opacity={layerWalls.opacity}>
              {activeTab.walls.map((w) => {
                const isSelected = selectedElement?.type === 'wall' && selectedElement.id === w.id;
                const isDimmed = activeTab.focusLight && selectedElement && !isSelected;
                const wallColor = isSelected ? '#3B82F6' : isDark ? '#E2E8F0' : '#1E293B';
                const segments = getWallSolidSegmentsWithFurniture(w, activeTab.furniture);
                const openings = getCombinedWallOpenings(w, activeTab.furniture);
                const { ux, uy, nx, ny, length: wallLen } = getWallVectors(w);
                const wallAngleDeg = Math.round(
                  ((Math.atan2(w.y2 - w.y1, w.x2 - w.x1) * 180) / Math.PI + 360) % 360
                );
                const midX = (w.x1 + w.x2) / 2;
                const midY = (w.y1 + w.y2) / 2;

                return (
                  <g
                    key={w.id}
                    id={`wall-${w.id}`}
                    opacity={isDimmed ? 0.25 : 1}
                    className="cursor-move"
                    onPointerDown={(e) => {
                      if (layerWalls.locked || w.locked) return;
                      e.stopPropagation();
                      onSelectElement({ type: 'wall', id: w.id });
                      setIsDraggingElement(true);
                      setResizeHandle(null);
                      setWallDragMode('body');
                      const m = screenToMeters(e.clientX, e.clientY);
                      setDragStartPos(m);
                      setElementInitialPos({
                        x: w.x1,
                        y: w.y1,
                        x2: w.x2,
                        y2: w.y2,
                      });
                    }}
                  >
                    {/* Invisible Wide Touch Target for easy wall grabbing on touchscreens */}
                    <line
                      x1={w.x1}
                      y1={w.y1}
                      x2={w.x2}
                      y2={w.y2}
                      stroke="transparent"
                      strokeWidth={Math.max(0.35, w.thickness + 0.2)}
                      strokeLinecap="round"
                    />

                    {/* Sliced Solid Wall Segments (Doors & Windows form visible cuts/gaps in wall geometry) */}
                    {segments.map((seg, sIdx) => (
                      <line
                        key={`seg-${sIdx}`}
                        x1={seg.x1}
                        y1={seg.y1}
                        x2={seg.x2}
                        y2={seg.y2}
                        stroke={wallColor}
                        strokeWidth={w.thickness}
                        strokeLinecap="butt"
                      />
                    ))}

                    {/* Render Opening Cuts details (Jamb endcaps, Door Swing Arc, Window Sill lines) */}
                    {openings.map((op) => {
                      const cutStart = Math.max(0, op.distanceAlongWall - op.width / 2);
                      const cutEnd = Math.min(wallLen, op.distanceAlongWall + op.width / 2);
                      const p1 = { x: w.x1 + cutStart * ux, y: w.y1 + cutStart * uy };
                      const p2 = { x: w.x1 + cutEnd * ux, y: w.y1 + cutEnd * uy };
                      const halfThick = w.thickness / 2;

                      return (
                        <g key={`cut-vis-${op.id}`}>
                          {/* Left cut jamb cap line */}
                          <line
                            x1={p1.x - halfThick * nx}
                            y1={p1.y - halfThick * ny}
                            x2={p1.x + halfThick * nx}
                            y2={p1.y + halfThick * ny}
                            stroke={wallColor}
                            strokeWidth={0.02}
                          />
                          {/* Right cut jamb cap line */}
                          <line
                            x1={p2.x - halfThick * nx}
                            y1={p2.y - halfThick * ny}
                            x2={p2.x + halfThick * nx}
                            y2={p2.y + halfThick * ny}
                            stroke={wallColor}
                            strokeWidth={0.02}
                          />

                          {/* If hosted opening (not from a furniture symbol) - render the door / window symbol right in the cut! */}
                          {!op.furnitureRefId && (() => {
                            const isOpeningSelected =
                              selectedElement?.type === 'opening' &&
                              selectedElement.openingId === op.id;
                            const isRight = op.swingDirection === 'right';
                            const normalDir = op.swingOrientation === 'out' ? -1 : 1;
                            const snx = nx * normalDir;
                            const sny = ny * normalDir;
                            const midP = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
                            const actualWidth = Math.max(0.1, Math.hypot(p2.x - p1.x, p2.y - p1.y));
                            const accentBlue = '#2563EB';

                            return (
                              <g
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectElement({ type: 'opening', wallId: w.id, openingId: op.id });
                                }}
                                className="cursor-pointer group"
                              >
                                {/* Invisible easy-click hit area */}
                                <rect
                                  x={Math.min(p1.x, p2.x) - 0.2}
                                  y={Math.min(p1.y, p2.y) - 0.2}
                                  width={Math.abs(p2.x - p1.x) + 0.4}
                                  height={Math.abs(p2.y - p1.y) + 0.4}
                                  fill="transparent"
                                />

                                {/* Selection halo */}
                                {isOpeningSelected && (
                                  <line
                                    x1={p1.x}
                                    y1={p1.y}
                                    x2={p2.x}
                                    y2={p2.y}
                                    stroke={accentBlue}
                                    strokeWidth={w.thickness + 0.08}
                                    strokeOpacity={0.25}
                                    strokeLinecap="round"
                                  />
                                )}

                                {/* Threshold line */}
                                <line
                                  x1={p1.x}
                                  y1={p1.y}
                                  x2={p2.x}
                                  y2={p2.y}
                                  stroke={isOpeningSelected ? accentBlue : '#94A3B8'}
                                  strokeWidth={0.018}
                                  strokeDasharray="0.04,0.04"
                                />

                                {/* 1. SINGLE LEAF SWING DOOR */}
                                {op.type === 'door' && (() => {
                                  const angleDeg = typeof op.swingAngle === 'number' ? op.swingAngle : 90;
                                  const hP = isRight ? p2 : p1;
                                  const lP = isRight ? p1 : p2;
                                  const thx = isRight ? -ux : ux;
                                  const thy = isRight ? -uy : uy;
                                  const rad = (angleDeg * Math.PI) / 180;

                                  // Direction of swung leaf
                                  const leafDirX = Math.cos(rad) * thx + Math.sin(rad) * snx;
                                  const leafDirY = Math.cos(rad) * thy + Math.sin(rad) * sny;
                                  const leafEnd = {
                                    x: hP.x + actualWidth * leafDirX,
                                    y: hP.y + actualWidth * leafDirY,
                                  };

                                  // 2D cross product to mathematically determine SVG arc sweep direction
                                  const cross = thx * sny - thy * snx;
                                  const sweepFlag = cross > 0 ? 0 : 1;

                                  return (
                                    <g>
                                      {/* Door leaf */}
                                      <line
                                        x1={hP.x}
                                        y1={hP.y}
                                        x2={leafEnd.x}
                                        y2={leafEnd.y}
                                        stroke={isOpeningSelected ? accentBlue : wallColor}
                                        strokeWidth={0.03}
                                      />
                                      {/* Door knob / handle dot */}
                                      <circle
                                        cx={hP.x + actualWidth * 0.85 * leafDirX}
                                        cy={hP.y + actualWidth * 0.85 * leafDirY}
                                        r={0.02}
                                        fill={isOpeningSelected ? accentBlue : wallColor}
                                      />
                                      {/* Swing arc (shown when door leaf is swung open) */}
                                      {angleDeg > 0 && (
                                        <path
                                          d={`M ${leafEnd.x} ${leafEnd.y} A ${actualWidth} ${actualWidth} 0 0 ${sweepFlag} ${lP.x} ${lP.y}`}
                                          fill="none"
                                          stroke={isOpeningSelected ? accentBlue : wallColor}
                                          strokeWidth={0.018}
                                          strokeDasharray="0.05,0.03"
                                        />
                                      )}
                                    </g>
                                  );
                                })()}

                                {/* 2. DOUBLE LEAF FRENCH DOOR */}
                                {op.type === 'double-door' && (() => {
                                  const angleDeg = typeof op.swingAngle === 'number' ? op.swingAngle : 90;
                                  const halfW = actualWidth / 2;
                                  const rad = (angleDeg * Math.PI) / 180;

                                  // Left leaf (hinged at p1, swings toward midP)
                                  const leftDirX = Math.cos(rad) * ux + Math.sin(rad) * snx;
                                  const leftDirY = Math.cos(rad) * uy + Math.sin(rad) * sny;
                                  const leftLeafEnd = {
                                    x: p1.x + halfW * leftDirX,
                                    y: p1.y + halfW * leftDirY,
                                  };
                                  const crossLeft = ux * sny - uy * snx;
                                  const leftSweep = crossLeft > 0 ? 0 : 1;

                                  // Right leaf (hinged at p2, swings toward midP)
                                  const rightDirX = Math.cos(rad) * (-ux) + Math.sin(rad) * snx;
                                  const rightDirY = Math.cos(rad) * (-uy) + Math.sin(rad) * sny;
                                  const rightLeafEnd = {
                                    x: p2.x + halfW * rightDirX,
                                    y: p2.y + halfW * rightDirY,
                                  };
                                  const crossRight = (-ux) * sny - (-uy) * snx;
                                  const rightSweep = crossRight > 0 ? 0 : 1;

                                  return (
                                    <g>
                                      {/* Left door leaf */}
                                      <line
                                        x1={p1.x}
                                        y1={p1.y}
                                        x2={leftLeafEnd.x}
                                        y2={leftLeafEnd.y}
                                        stroke={isOpeningSelected ? accentBlue : wallColor}
                                        strokeWidth={0.03}
                                      />
                                      {/* Left door knob */}
                                      <circle
                                        cx={p1.x + halfW * 0.85 * leftDirX}
                                        cy={p1.y + halfW * 0.85 * leftDirY}
                                        r={0.02}
                                        fill={isOpeningSelected ? accentBlue : wallColor}
                                      />
                                      {/* Left swing arc */}
                                      {angleDeg > 0 && (
                                        <path
                                          d={`M ${leftLeafEnd.x} ${leftLeafEnd.y} A ${halfW} ${halfW} 0 0 ${leftSweep} ${midP.x} ${midP.y}`}
                                          fill="none"
                                          stroke={isOpeningSelected ? accentBlue : wallColor}
                                          strokeWidth={0.018}
                                          strokeDasharray="0.05,0.03"
                                        />
                                      )}

                                      {/* Right door leaf */}
                                      <line
                                        x1={p2.x}
                                        y1={p2.y}
                                        x2={rightLeafEnd.x}
                                        y2={rightLeafEnd.y}
                                        stroke={isOpeningSelected ? accentBlue : wallColor}
                                        strokeWidth={0.03}
                                      />
                                      {/* Right door knob */}
                                      <circle
                                        cx={p2.x + halfW * 0.85 * rightDirX}
                                        cy={p2.y + halfW * 0.85 * rightDirY}
                                        r={0.02}
                                        fill={isOpeningSelected ? accentBlue : wallColor}
                                      />
                                      {/* Right swing arc */}
                                      {angleDeg > 0 && (
                                        <path
                                          d={`M ${rightLeafEnd.x} ${rightLeafEnd.y} A ${halfW} ${halfW} 0 0 ${rightSweep} ${midP.x} ${midP.y}`}
                                          fill="none"
                                          stroke={isOpeningSelected ? accentBlue : wallColor}
                                          strokeWidth={0.018}
                                          strokeDasharray="0.05,0.03"
                                        />
                                      )}

                                      {/* Center astragal meeting line */}
                                      <line
                                        x1={midP.x - halfThick * 0.4 * nx}
                                        y1={midP.y - halfThick * 0.4 * ny}
                                        x2={midP.x + halfThick * 0.4 * nx}
                                        y2={midP.y + halfThick * 0.4 * ny}
                                        stroke={wallColor}
                                        strokeWidth={0.02}
                                      />
                                    </g>
                                  );
                                })()}

                                {/* 3. SLIDING PATIO DOOR */}
                                {op.type === 'sliding' && (() => {
                                  const panelLen = actualWidth * 0.54;
                                  const offDist = Math.max(0.025, halfThick * 0.38);

                                  const p1a = { x: p1.x + offDist * snx, y: p1.y + offDist * sny };
                                  const p1b = { x: p1.x + panelLen * ux + offDist * snx, y: p1.y + panelLen * uy + offDist * sny };

                                  const p2a = { x: p2.x - panelLen * ux - offDist * snx, y: p2.y - panelLen * uy - offDist * sny };
                                  const p2b = { x: p2.x - offDist * snx, y: p2.y - offDist * sny };

                                  return (
                                    <g>
                                      {/* Panel 1 (Interior Track) */}
                                      <line
                                        x1={p1a.x}
                                        y1={p1a.y}
                                        x2={p1b.x}
                                        y2={p1b.y}
                                        stroke={isOpeningSelected ? accentBlue : wallColor}
                                        strokeWidth={0.035}
                                        strokeLinecap="round"
                                      />
                                      <line
                                        x1={p1a.x}
                                        y1={p1a.y}
                                        x2={p1b.x}
                                        y2={p1b.y}
                                        stroke="#0284C7"
                                        strokeWidth={0.015}
                                      />

                                      {/* Panel 2 (Exterior Track) */}
                                      <line
                                        x1={p2a.x}
                                        y1={p2a.y}
                                        x2={p2b.x}
                                        y2={p2b.y}
                                        stroke={isOpeningSelected ? accentBlue : wallColor}
                                        strokeWidth={0.035}
                                        strokeLinecap="round"
                                      />
                                      <line
                                        x1={p2a.x}
                                        y1={p2a.y}
                                        x2={p2b.x}
                                        y2={p2b.y}
                                        stroke="#0284C7"
                                        strokeWidth={0.015}
                                      />

                                      {/* Direction arrow on active sliding panel */}
                                      <line
                                        x1={midP.x - 0.08 * ux + offDist * snx}
                                        y1={midP.y - 0.08 * uy + offDist * sny}
                                        x2={midP.x + 0.08 * ux + offDist * snx}
                                        y2={midP.y + 0.08 * uy + offDist * sny}
                                        stroke="#2563EB"
                                        strokeWidth={0.015}
                                      />
                                    </g>
                                  );
                                })()}

                                {/* 4. POCKET DOOR */}
                                {op.type === 'pocket' && (() => {
                                  const pocketSide = isRight ? 1 : -1;
                                  const pocketOrigin = isRight ? p2 : p1;
                                  const pocketEnd = {
                                    x: pocketOrigin.x + pocketSide * actualWidth * ux,
                                    y: pocketOrigin.y + pocketSide * actualWidth * uy,
                                  };

                                  // Partially closed door slab
                                  const slabStart = isRight
                                    ? { x: p2.x + 0.15 * actualWidth * ux, y: p2.y + 0.15 * actualWidth * uy }
                                    : { x: p1.x - 0.15 * actualWidth * ux, y: p1.y - 0.15 * actualWidth * uy };
                                  const slabEnd = isRight
                                    ? { x: p1.x + 0.1 * actualWidth * ux, y: p1.y + 0.1 * actualWidth * uy }
                                    : { x: p2.x - 0.1 * actualWidth * ux, y: p2.y - 0.1 * actualWidth * uy };

                                  return (
                                    <g>
                                      {/* Hidden pocket cavity outline in wall */}
                                      <line
                                        x1={pocketOrigin.x - halfThick * 0.5 * nx}
                                        y1={pocketOrigin.y - halfThick * 0.5 * ny}
                                        x2={pocketEnd.x - halfThick * 0.5 * nx}
                                        y2={pocketEnd.y - halfThick * 0.5 * ny}
                                        stroke="#94A3B8"
                                        strokeWidth={0.015}
                                        strokeDasharray="0.04,0.03"
                                      />
                                      <line
                                        x1={pocketOrigin.x + halfThick * 0.5 * nx}
                                        y1={pocketOrigin.y + halfThick * 0.5 * ny}
                                        x2={pocketEnd.x + halfThick * 0.5 * nx}
                                        y2={pocketEnd.y + halfThick * 0.5 * ny}
                                        stroke="#94A3B8"
                                        strokeWidth={0.015}
                                        strokeDasharray="0.04,0.03"
                                      />

                                      {/* Pocket Door Slab */}
                                      <line
                                        x1={slabStart.x}
                                        y1={slabStart.y}
                                        x2={slabEnd.x}
                                        y2={slabEnd.y}
                                        stroke={isOpeningSelected ? accentBlue : wallColor}
                                        strokeWidth={0.035}
                                      />
                                      {/* Recessed finger cup */}
                                      <circle
                                        cx={(slabStart.x + slabEnd.x) / 2}
                                        cy={(slabStart.y + slabEnd.y) / 2}
                                        r={0.018}
                                        fill="none"
                                        stroke={isOpeningSelected ? accentBlue : wallColor}
                                        strokeWidth={0.015}
                                      />
                                    </g>
                                  );
                                })()}

                                {/* 5. BIFOLD ACCORDION DOOR */}
                                {op.type === 'bifold' && (() => {
                                  const pivotP = isRight ? p2 : p1;
                                  const runnerP = isRight ? p1 : p2;
                                  const sign = isRight ? -1 : 1;
                                  const apex = {
                                    x: pivotP.x + sign * actualWidth * 0.48 * ux + actualWidth * 0.35 * snx,
                                    y: pivotP.y + sign * actualWidth * 0.48 * uy + actualWidth * 0.35 * sny,
                                  };

                                  return (
                                    <g>
                                      {/* Overhead guide track */}
                                      <line
                                        x1={p1.x}
                                        y1={p1.y}
                                        x2={p2.x}
                                        y2={p2.y}
                                        stroke="#94A3B8"
                                        strokeWidth={0.012}
                                        strokeDasharray="0.03,0.03"
                                      />
                                      {/* Leaf 1 */}
                                      <line
                                        x1={pivotP.x}
                                        y1={pivotP.y}
                                        x2={apex.x}
                                        y2={apex.y}
                                        stroke={isOpeningSelected ? accentBlue : wallColor}
                                        strokeWidth={0.028}
                                      />
                                      {/* Leaf 2 */}
                                      <line
                                        x1={apex.x}
                                        y1={apex.y}
                                        x2={runnerP.x}
                                        y2={runnerP.y}
                                        stroke={isOpeningSelected ? accentBlue : wallColor}
                                        strokeWidth={0.028}
                                      />
                                      {/* Pivot & roller markers */}
                                      <circle cx={pivotP.x} cy={pivotP.y} r={0.02} fill={wallColor} />
                                      <circle cx={apex.x} cy={apex.y} r={0.018} fill="none" stroke={wallColor} strokeWidth={0.01} />
                                      <circle cx={runnerP.x} cy={runnerP.y} r={0.018} fill={wallColor} />
                                    </g>
                                  );
                                })()}

                                {/* 6. ARCHITECTURAL WINDOW */}
                                {op.type === 'window' && (
                                  <g>
                                    {/* Sill Edge Lines */}
                                    <line
                                      x1={p1.x - halfThick * nx}
                                      y1={p1.y - halfThick * ny}
                                      x2={p2.x - halfThick * nx}
                                      y2={p2.y - halfThick * ny}
                                      stroke={wallColor}
                                      strokeWidth={0.02}
                                    />
                                    <line
                                      x1={p1.x + halfThick * nx}
                                      y1={p1.y + halfThick * ny}
                                      x2={p2.x + halfThick * nx}
                                      y2={p2.y + halfThick * ny}
                                      stroke={wallColor}
                                      strokeWidth={0.02}
                                    />
                                    {/* Glazing Glass Lines */}
                                    <line
                                      x1={p1.x - 0.015 * nx}
                                      y1={p1.y - 0.015 * ny}
                                      x2={p2.x - 0.015 * nx}
                                      y2={p2.y - 0.015 * ny}
                                      stroke="#0284C7"
                                      strokeWidth={0.015}
                                    />
                                    <line
                                      x1={p1.x + 0.015 * nx}
                                      y1={p1.y + 0.015 * ny}
                                      x2={p2.x + 0.015 * nx}
                                      y2={p2.y + 0.015 * ny}
                                      stroke="#0284C7"
                                      strokeWidth={0.015}
                                    />
                                    {/* Central Mullion Bar for wide windows */}
                                    {actualWidth >= 1.2 && (
                                      <line
                                        x1={midP.x - halfThick * nx}
                                        y1={midP.y - halfThick * ny}
                                        x2={midP.x + halfThick * nx}
                                        y2={midP.y + halfThick * ny}
                                        stroke={wallColor}
                                        strokeWidth={0.02}
                                      />
                                    )}
                                  </g>
                                )}
                              </g>
                            );
                          })()}
                        </g>
                      );
                    })}

                    {/* When Wall is Selected: Interactive Resizing & Angle Handles and HUD Tag */}
                    {isSelected && !layerWalls.locked && !w.locked && (
                      <g>
                        {/* Wall Length & Angle floating pill HUD */}
                        <g pointerEvents="none">
                          <rect
                            x={midX - 0.55}
                            y={midY - 0.16}
                            width={1.1}
                            height={0.32}
                            rx={0.06}
                            fill={isDark ? '#0F172A' : '#FFFFFF'}
                            stroke="#2563EB"
                            strokeWidth={0.02}
                            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
                          />
                          <text
                            x={midX}
                            y={midY + 0.05}
                            textAnchor="middle"
                            fontSize={0.13}
                            fontWeight="bold"
                            fill="#2563EB"
                            fontFamily="monospace"
                          >
                            {formatDistance(wallLen, activeTab.units)} • {wallAngleDeg}°
                          </text>
                        </g>

                        {/* Start Point Interactive Drag Handle (changes angle & start position) */}
                        <g>
                          <circle
                            cx={w.x1}
                            cy={w.y1}
                            r={0.25}
                            fill="transparent"
                            className="cursor-crosshair"
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              setResizeHandle('start');
                              setWallDragMode('start');
                              setIsDraggingElement(true);
                              const m = screenToMeters(e.clientX, e.clientY);
                              setDragStartPos(m);
                              setElementInitialPos({
                                x: w.x1,
                                y: w.y1,
                                x2: w.x2,
                                y2: w.y2,
                              });
                            }}
                          />
                          <circle
                            cx={w.x1}
                            cy={w.y1}
                            r={0.12}
                            fill="#FFFFFF"
                            stroke="#2563EB"
                            strokeWidth={0.03}
                            pointerEvents="none"
                          />
                        </g>

                        {/* End Point Interactive Drag Handle (changes angle & end position) */}
                        <g>
                          <circle
                            cx={w.x2}
                            cy={w.y2}
                            r={0.25}
                            fill="transparent"
                            className="cursor-crosshair"
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              setResizeHandle('end');
                              setWallDragMode('end');
                              setIsDraggingElement(true);
                              const m = screenToMeters(e.clientX, e.clientY);
                              setDragStartPos(m);
                              setElementInitialPos({
                                x: w.x1,
                                y: w.y1,
                                x2: w.x2,
                                y2: w.y2,
                              });
                            }}
                          />
                          <circle
                            cx={w.x2}
                            cy={w.y2}
                            r={0.12}
                            fill="#FFFFFF"
                            stroke="#2563EB"
                            strokeWidth={0.03}
                            pointerEvents="none"
                          />
                        </g>

                        {/* Wall Orientation / Rotate Handle (at perpendicular offset from center) */}
                        <g>
                          {/* Connector stem */}
                          <line
                            x1={midX}
                            y1={midY}
                            x2={midX + nx * 0.42}
                            y2={midY + ny * 0.42}
                            stroke="#2563EB"
                            strokeWidth={0.02}
                            strokeDasharray="0.04,0.03"
                            pointerEvents="none"
                          />
                          {/* Big touch target */}
                          <circle
                            cx={midX + nx * 0.42}
                            cy={midY + ny * 0.42}
                            r={0.25}
                            fill="transparent"
                            className="cursor-grab active:cursor-grabbing"
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              setResizeHandle(null);
                              setWallDragMode('rotate');
                              setIsDraggingElement(true);
                              const m = screenToMeters(e.clientX, e.clientY);
                              setDragStartPos(m);
                              setElementInitialPos({
                                x: w.x1,
                                y: w.y1,
                                x2: w.x2,
                                y2: w.y2,
                              });
                            }}
                          />
                          {/* Visual rotate circle */}
                          <circle
                            cx={midX + nx * 0.42}
                            cy={midY + ny * 0.42}
                            r={0.11}
                            fill="#2563EB"
                            stroke="#FFFFFF"
                            strokeWidth={0.025}
                            pointerEvents="none"
                          />
                        </g>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* 3. FURNITURE LAYER */}
          {layerFurn?.visible && (
            <g id="layer-furniture" opacity={layerFurn.opacity}>
              {activeTab.furniture.map((f) => {
                const isSelected = selectedElement?.type === 'furniture' && selectedElement.id === f.id;
                const isDimmed = activeTab.focusLight && selectedElement && !isSelected;

                return (
                  <g
                    key={f.id}
                    id={`furniture-${f.id}`}
                    opacity={isDimmed ? 0.25 : 1}
                    transform={`translate(${f.x}, ${f.y}) rotate(${f.rotation}) translate(${-f.width / 2}, ${-f.depth / 2})`}
                    onPointerDown={(e) => {
                      if (layerFurn.locked || f.locked) return;
                      e.stopPropagation();
                      onSelectElement({ type: 'furniture', id: f.id });
                      setIsDraggingElement(true);
                      const m = screenToMeters(e.clientX, e.clientY);
                      setDragStartPos(m);
                      setElementInitialPos({ x: f.x, y: f.y });
                    }}
                    className="cursor-move"
                  >
                    {/* Render Scaled CAD Architectural Symbol */}
                    <ArchitecturalSymbol
                      furniture={f}
                      ppm={1} // normalized for world coordinate group
                      theme={theme}
                      isSelected={isSelected}
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* 4. DIMENSIONS LAYER */}
          {layerDim?.visible && (
            <g id="layer-dimensions" opacity={layerDim.opacity}>
              {activeTab.dimensions.map((d) => {
                const isSelected = selectedElement?.type === 'dimension' && selectedElement.id === d.id;
                const isDimmed = activeTab.focusLight && selectedElement && !isSelected;
                const midX = (d.x1 + d.x2) / 2;
                const midY = (d.y1 + d.y2) / 2;

                return (
                  <g
                    key={d.id}
                    id={`dim-${d.id}`}
                    opacity={isDimmed ? 0.25 : 1}
                    onPointerDown={(e) => {
                      if (layerDim.locked) return;
                      e.stopPropagation();
                      onSelectElement({ type: 'dimension', id: d.id });
                    }}
                    className="cursor-pointer"
                  >
                    <line
                      x1={d.x1}
                      y1={d.y1}
                      x2={d.x2}
                      y2={d.y2}
                      stroke={isSelected ? '#3B82F6' : '#2563EB'}
                      strokeWidth={0.03}
                      strokeDasharray="0.08,0.05"
                    />
                    <circle cx={d.x1} cy={d.y1} r={0.06} fill="#2563EB" />
                    <circle cx={d.x2} cy={d.y2} r={0.06} fill="#2563EB" />

                    {/* Measurement Pill Tag */}
                    <rect
                      x={midX - 0.45}
                      y={midY - 0.14}
                      width={0.9}
                      height={0.28}
                      rx={0.06}
                      fill={isDark ? '#1E293B' : '#FFFFFF'}
                      stroke="#2563EB"
                      strokeWidth={0.02}
                    />
                    <text
                      x={midX}
                      y={midY + 0.05}
                      textAnchor="middle"
                      fontSize={0.16}
                      fontWeight="bold"
                      fill="#2563EB"
                      fontFamily="monospace"
                    >
                      {d.label}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* 5. REDLINE MARKUP LAYER */}
          {layerRed?.visible && (
            <g id="layer-redline" opacity={layerRed.opacity}>
              {activeTab.redlines.map((r) => {
                const pathD = r.points
                  .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                  .join(' ');

                return (
                  <g
                    key={r.id}
                    id={`redline-${r.id}`}
                    onPointerDown={(e) => {
                      if (layerRed.locked) return;
                      e.stopPropagation();
                      onSelectElement({ type: 'redline', id: r.id });
                    }}
                    className="cursor-pointer"
                  >
                    <path
                      d={pathD}
                      fill="none"
                      stroke={r.color}
                      strokeWidth={0.04}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {r.text && r.points.length > 0 && (
                      <text
                        x={r.points[0].x}
                        y={r.points[0].y - 0.15}
                        fontSize={0.2}
                        fill={r.color}
                        fontWeight="bold"
                      >
                        {r.text}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* 6. AI GHOST SKETCH LAYER */}
          {layerGhost?.visible && activeTab.ghostSketch && (
            <g id="layer-ai-ghost" opacity={layerGhost.opacity}>
              {/* Ghost Rooms */}
              {activeTab.ghostSketch.rooms.map((gr, idx) => (
                <rect
                  key={`ghost-r-${idx}`}
                  x={gr.x}
                  y={gr.y}
                  width={gr.width}
                  height={gr.depth}
                  fill="rgba(6, 182, 212, 0.15)"
                  stroke="#06B6D4"
                  strokeWidth={0.04}
                  strokeDasharray="0.1,0.06"
                  rx={0.04}
                />
              ))}

              {/* Ghost Walls */}
              {activeTab.ghostSketch.walls.map((gw, idx) => (
                <line
                  key={`ghost-w-${idx}`}
                  x1={gw.x1}
                  y1={gw.y1}
                  x2={gw.x2}
                  y2={gw.y2}
                  stroke="#06B6D4"
                  strokeWidth={gw.thickness}
                  strokeDasharray="0.12,0.08"
                />
              ))}

              {/* Ghost Furniture */}
              {activeTab.ghostSketch.furniture?.map((gf, idx) => (
                <g
                  key={`ghost-f-${idx}`}
                  transform={`translate(${gf.x}, ${gf.y}) rotate(${gf.rotation}) translate(${-gf.width / 2}, ${-gf.depth / 2})`}
                  opacity={0.7}
                >
                  <rect
                    x={0}
                    y={0}
                    width={gf.width}
                    height={gf.depth}
                    fill="rgba(6, 182, 212, 0.2)"
                    stroke="#06B6D4"
                    strokeWidth={0.03}
                    strokeDasharray="0.08,0.05"
                    rx={0.03}
                  />
                  <text
                    x={gf.width / 2}
                    y={gf.depth / 2 + 0.05}
                    textAnchor="middle"
                    fontSize={0.16}
                    fill="#06B6D4"
                    fontFamily="sans-serif"
                  >
                    {gf.name}
                  </text>
                </g>
              ))}
            </g>
          )}

          {/* In-Progress Drawing Overlays */}
          {isDrawing && (
            <g id="in-progress-drawing">
              {activeTool === 'wall' && (
                <g>
                  <line
                    x1={drawStart.x}
                    y1={drawStart.y}
                    x2={drawCurrent.x}
                    y2={drawCurrent.y}
                    stroke="#2563EB"
                    strokeWidth={0.15}
                    strokeLinecap="square"
                  />
                  {/* Distance label */}
                  <text
                    x={(drawStart.x + drawCurrent.x) / 2}
                    y={(drawStart.y + drawCurrent.y) / 2 - 0.2}
                    textAnchor="middle"
                    fontSize={0.22}
                    fill="#2563EB"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {formatDistance(
                      Math.hypot(drawCurrent.x - drawStart.x, drawCurrent.y - drawStart.y),
                      activeTab.units
                    )}
                  </text>
                </g>
              )}

              {activeTool === 'room' && (
                <g>
                  <rect
                    x={Math.min(drawStart.x, drawCurrent.x)}
                    y={Math.min(drawStart.y, drawCurrent.y)}
                    width={Math.abs(drawCurrent.x - drawStart.x)}
                    height={Math.abs(drawCurrent.y - drawStart.y)}
                    fill="rgba(59, 130, 246, 0.2)"
                    stroke="#2563EB"
                    strokeWidth={0.05}
                    strokeDasharray="0.1,0.05"
                  />
                  <text
                    x={(drawStart.x + drawCurrent.x) / 2}
                    y={(drawStart.y + drawCurrent.y) / 2}
                    textAnchor="middle"
                    fontSize={0.25}
                    fill="#2563EB"
                    fontWeight="bold"
                  >
                    {formatArea(
                      Math.abs(drawCurrent.x - drawStart.x) * Math.abs(drawCurrent.y - drawStart.y),
                      activeTab.units
                    )}
                  </text>
                </g>
              )}

              {activeTool === 'measure' && (
                <g>
                  <line
                    x1={drawStart.x}
                    y1={drawStart.y}
                    x2={drawCurrent.x}
                    y2={drawCurrent.y}
                    stroke="#2563EB"
                    strokeWidth={0.04}
                    strokeDasharray="0.08,0.05"
                  />
                  <circle cx={drawStart.x} cy={drawStart.y} r={0.08} fill="#2563EB" />
                  <circle cx={drawCurrent.x} cy={drawCurrent.y} r={0.08} fill="#2563EB" />
                  <text
                    x={(drawStart.x + drawCurrent.x) / 2}
                    y={(drawStart.y + drawCurrent.y) / 2 - 0.15}
                    textAnchor="middle"
                    fontSize={0.22}
                    fontWeight="bold"
                    fill="#2563EB"
                    fontFamily="monospace"
                  >
                    {formatDistance(
                      Math.hypot(drawCurrent.x - drawStart.x, drawCurrent.y - drawStart.y),
                      activeTab.units
                    )}
                  </text>
                </g>
              )}

              {activeTool === 'redline' && redlinePoints.length > 1 && (
                <path
                  d={redlinePoints
                    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                    .join(' ')}
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth={0.05}
                  strokeLinecap="round"
                />
              )}
            </g>
          )}

          {/* Calibration First Point Reference Indicator */}
          {calibrateFirstPoint && (
            <g>
              <circle cx={calibrateFirstPoint.x} cy={calibrateFirstPoint.y} r={0.15} fill="#EF4444" opacity={0.7} />
              <line
                x1={calibrateFirstPoint.x}
                y1={calibrateFirstPoint.y}
                x2={cursorPos.x}
                y2={cursorPos.y}
                stroke="#EF4444"
                strokeWidth={0.04}
                strokeDasharray="0.1,0.05"
              />
            </g>
          )}

          {/* Door / Window snap placement preview */}
          {(activeTool === 'door' || activeTool === 'window') && openingHoverSnap && (() => {
            const op = openingHoverSnap;
            const w = op.wall;
            const wallLen = getWallLength(w);
            const ux = (w.x2 - w.x1) / wallLen;
            const uy = (w.y2 - w.y1) / wallLen;
            const nx = -uy;
            const ny = ux;
            const opW = op.type === 'window' ? 1.2 : 0.9;
            const p1 = {
              x: w.x1 + (op.distanceAlongWall - opW / 2) * ux,
              y: w.y1 + (op.distanceAlongWall - opW / 2) * uy,
            };
            const p2 = {
              x: w.x1 + (op.distanceAlongWall + opW / 2) * ux,
              y: w.y1 + (op.distanceAlongWall + opW / 2) * uy,
            };
            const halfThick = w.thickness / 2;

            return (
              <g className="pointer-events-none">
                {/* Wall cut knockout highlight */}
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke="#2563EB"
                  strokeWidth={w.thickness + 0.06}
                  strokeOpacity={0.35}
                  strokeLinecap="round"
                />
                {/* Cut jamb tick marks */}
                <line
                  x1={p1.x - halfThick * nx}
                  y1={p1.y - halfThick * ny}
                  x2={p1.x + halfThick * nx}
                  y2={p1.y + halfThick * ny}
                  stroke="#2563EB"
                  strokeWidth={0.03}
                />
                <line
                  x1={p2.x - halfThick * nx}
                  y1={p2.y - halfThick * ny}
                  x2={p2.x + halfThick * nx}
                  y2={p2.y + halfThick * ny}
                  stroke="#2563EB"
                  strokeWidth={0.03}
                />
                {/* Door swing preview or window sill preview */}
                {op.type === 'door' ? (
                  <g>
                    <line
                      x1={p1.x}
                      y1={p1.y}
                      x2={p1.x + opW * nx}
                      y2={p1.y + opW * ny}
                      stroke="#2563EB"
                      strokeWidth={0.03}
                    />
                    <path
                      d={`M ${p1.x + opW * nx} ${p1.y + opW * ny} A ${opW} ${opW} 0 0 0 ${p2.x} ${p2.y}`}
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth={0.02}
                      strokeDasharray="0.05,0.03"
                    />
                  </g>
                ) : (
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="#0284C7"
                    strokeWidth={0.03}
                  />
                )}
                {/* Floating placement tooltip badge */}
                <g transform={`translate(${op.projPoint.x}, ${op.projPoint.y - 0.45})`}>
                  <rect
                    x={-1.0}
                    y={-0.18}
                    width={2.0}
                    height={0.36}
                    rx={0.08}
                    fill="#1E293B"
                    stroke="#3B82F6"
                    strokeWidth={0.02}
                  />
                  <text
                    x={0}
                    y={0.06}
                    fill="#FFFFFF"
                    fontSize={0.13}
                    fontWeight="600"
                    textAnchor="middle"
                    fontFamily="system-ui"
                  >
                    Click wall to place {op.type === 'window' ? '1.2m Window' : '0.9m Door'} cut
                  </text>
                </g>
              </g>
            );
          })()}

          {/* Guide prompt when door or window tool active but not near wall */}
          {(activeTool === 'door' || activeTool === 'window') && !openingHoverSnap && (
            <g className="pointer-events-none" transform={`translate(${cursorPos.x}, ${cursorPos.y - 0.35})`}>
              <rect
                x={-1.1}
                y={-0.16}
                width={2.2}
                height={0.32}
                rx={0.06}
                fill="rgba(15, 23, 42, 0.9)"
                stroke="#60A5FA"
                strokeWidth={0.015}
              />
              <text
                x={0}
                y={0.05}
                fill="#93C5FD"
                fontSize={0.12}
                fontWeight="500"
                textAnchor="middle"
                fontFamily="system-ui"
              >
                Hover near any wall to place {activeTool} cut
              </text>
            </g>
          )}
        </g>
      </svg>

      {/* North Indicator (Compass) in Top-Right */}
      <div
        id="north-indicator"
        className="absolute top-4 right-4 z-20 pointer-events-none flex flex-col items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs p-2 rounded-full shadow-xs border border-slate-200/80 dark:border-slate-800"
      >
        <div className="text-[10px] font-bold text-red-600 font-mono tracking-tighter mb-0.5">N</div>
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-300">
          <Compass className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </div>
      </div>

      {/* Live Canvas Status Display (Bottom) */}
      <div
        id="canvas-status-display"
        className="absolute bottom-3 left-4 right-4 z-20 pointer-events-none flex items-center justify-between gap-4 text-xs font-mono"
      >
        {/* Left: Dynamic Scale Bar & Metric Info */}
        <div className="pointer-events-auto flex items-center gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300">
          {/* Graphic Scale Bar */}
          <div className="flex flex-col items-start">
            <div
              className="h-1.5 bg-slate-800 dark:bg-slate-200 border-l border-r border-blue-600"
              style={{ width: `${Math.max(30, scaleBarPixels)}px` }}
            />
            <span className="text-[10px] text-slate-500 font-semibold mt-0.5">
              {scaleBarMeters}m (Scale {activeTab.scale})
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

          {/* Wall Count & Room Area */}
          <div className="flex items-center gap-2.5 text-[11px]">
            <span>
              <strong>{activeTab.walls.length}</strong> walls
            </span>
            <span>•</span>
            <span>
              Total: <strong>{formatArea(totalRoomArea, activeTab.units)}</strong>
            </span>
          </div>
        </div>

        {/* Right: Real-time Cursor Coordinates */}
        <div className="pointer-events-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-[11px]">
          <span className="text-slate-400 mr-1.5">Tool: <strong className="uppercase text-blue-600">{activeTool}</strong></span>
          <span>X: <strong>{cursorPos.x.toFixed(2)}m</strong></span>
          <span className="ml-2">Y: <strong>{cursorPos.y.toFixed(2)}m</strong></span>
        </div>
      </div>
    </div>
  );
};
