import { LayerConfig, LayerId, DesignTab, Room, Wall, FurnitureItem, DimensionItem } from '../types';

export const DEFAULT_LAYERS: Record<LayerId, LayerConfig> = {
  'walls-rooms': {
    id: 'walls-rooms',
    name: 'Walls + rooms',
    visible: true,
    locked: false,
    opacity: 1.0,
  },
  furniture: {
    id: 'furniture',
    name: 'Furniture',
    visible: true,
    locked: false,
    opacity: 1.0,
  },
  dimensions: {
    id: 'dimensions',
    name: 'Dimensions',
    visible: true,
    locked: false,
    opacity: 1.0,
  },
  redline: {
    id: 'redline',
    name: 'Redline markup',
    visible: true,
    locked: false,
    opacity: 1.0,
  },
  'ai-ghost': {
    id: 'ai-ghost',
    name: 'AI Ghost Sketch',
    visible: true,
    locked: true, // locked by default as specified in prompt
    opacity: 0.75,
  },
};

export function createSampleBungalowTab(id: string = 'design-1'): DesignTab {
  const rooms: Room[] = [
    {
      id: 'r-living',
      name: 'Living Room',
      type: 'living',
      x: 1.0,
      y: 1.0,
      width: 5.6,
      depth: 4.8,
      wallThickness: 0.15,
      color: 'rgba(230, 240, 255, 0.25)',
    },
    {
      id: 'r-kitchen',
      name: 'Kitchen & Dining',
      type: 'kitchen',
      x: 6.6,
      y: 1.0,
      width: 4.4,
      depth: 4.8,
      wallThickness: 0.15,
      color: 'rgba(255, 245, 230, 0.25)',
    },
    {
      id: 'r-master',
      name: 'Master Bedroom',
      type: 'bedroom',
      x: 1.0,
      y: 5.8,
      width: 4.2,
      depth: 4.2,
      wallThickness: 0.15,
      color: 'rgba(240, 235, 250, 0.25)',
    },
    {
      id: 'r-bed2',
      name: 'Bedroom 2',
      type: 'bedroom',
      x: 5.2,
      y: 5.8,
      width: 3.4,
      depth: 4.2,
      wallThickness: 0.15,
      color: 'rgba(240, 235, 250, 0.25)',
    },
    {
      id: 'r-bath',
      name: 'Bathroom',
      type: 'bath',
      x: 8.6,
      y: 5.8,
      width: 2.4,
      depth: 2.6,
      wallThickness: 0.15,
      color: 'rgba(230, 250, 245, 0.25)',
    },
    {
      id: 'r-foyer',
      name: 'Foyer / Entry',
      type: 'entry',
      x: 8.6,
      y: 8.4,
      width: 2.4,
      depth: 1.6,
      wallThickness: 0.15,
      color: 'rgba(245, 245, 245, 0.25)',
    },
  ];

  // Helper to build perimeter walls with thickness 0.15
  const wallList: Wall[] = [];
  let wallCounter = 1;
  const wallMap = new Set<string>();

  function addWall(x1: number, y1: number, x2: number, y2: number) {
    const [nx1, ny1, nx2, ny2] = (x1 < x2 || (x1 === x2 && y1 < y2))
      ? [x1, y1, x2, y2]
      : [x2, y2, x1, y1];
    const key = `${nx1.toFixed(2)},${ny1.toFixed(2)}-${nx2.toFixed(2)},${ny2.toFixed(2)}`;
    if (!wallMap.has(key)) {
      wallMap.add(key);
      wallList.push({
        id: `w-${wallCounter++}`,
        x1: nx1,
        y1: ny1,
        x2: nx2,
        y2: ny2,
        thickness: 0.15,
      });
    }
  }

  rooms.forEach((r) => {
    addWall(r.x, r.y, r.x + r.width, r.y);
    addWall(r.x + r.width, r.y, r.x + r.width, r.y + r.depth);
    addWall(r.x + r.width, r.y + r.depth, r.x, r.y + r.depth);
    addWall(r.x, r.y + r.depth, r.x, r.y);
  });

  // Attach authentic wall-hosted door and window openings
  const livingTopWall = wallList.find(
    (w) => Math.abs(w.y1 - 1.0) < 0.05 && Math.abs(w.y2 - 1.0) < 0.05 && w.x1 <= 2.0 && w.x2 >= 5.0
  );
  if (livingTopWall) {
    livingTopWall.openings = [
      {
        id: 'op-win-living',
        type: 'window',
        distanceAlongWall: 1.8,
        width: 1.6,
        height: 1.4,
        sillHeight: 0.8,
        label: 'Living Room Window',
      },
    ];
  }

  const foyerBottomWall = wallList.find(
    (w) => Math.abs(w.y1 - 10.0) < 0.05 && Math.abs(w.y2 - 10.0) < 0.05
  );
  if (foyerBottomWall) {
    foyerBottomWall.openings = [
      {
        id: 'op-entry-door',
        type: 'door',
        distanceAlongWall: 0.6,
        width: 0.9,
        height: 2.1,
        sillHeight: 0,
        swingDirection: 'right',
        swingOrientation: 'in',
        swingAngle: 90,
        label: 'Main Entry Door',
      },
    ];
  }

  const furniture: FurnitureItem[] = [
    // Living Room
    {
      id: 'f-sofa',
      assetId: 'sofa-3',
      name: '3-Seat Sofa',
      category: 'living',
      x: 3.5,
      y: 3.0,
      width: 2.2,
      depth: 0.9,
      rotation: 0,
    },
    {
      id: 'f-coffee',
      assetId: 'coffee-table',
      name: 'Coffee Table',
      category: 'living',
      x: 3.5,
      y: 2.0,
      width: 1.1,
      depth: 0.6,
      rotation: 0,
    },
    {
      id: 'f-armchair',
      assetId: 'sofa-armchair',
      name: 'Lounge Armchair',
      category: 'living',
      x: 1.8,
      y: 2.5,
      width: 0.9,
      depth: 0.85,
      rotation: 45,
    },

    // Kitchen & Dining
    {
      id: 'f-dining',
      assetId: 'table-6',
      name: '6-Seat Table',
      category: 'living',
      x: 8.8,
      y: 3.4,
      width: 1.8,
      depth: 0.9,
      rotation: 90,
    },
    {
      id: 'f-counter',
      assetId: 'counter-l',
      name: 'Kitchen Counter',
      category: 'kitchen',
      x: 7.8,
      y: 1.35,
      width: 2.4,
      depth: 0.6,
      rotation: 0,
    },
    {
      id: 'f-cooktop',
      assetId: 'cooktop',
      name: 'Range & Cooktop',
      category: 'kitchen',
      x: 9.6,
      y: 1.35,
      width: 0.8,
      depth: 0.65,
      rotation: 0,
    },

    // Master Bedroom
    {
      id: 'f-queen',
      assetId: 'bed-queen',
      name: 'Queen Bed',
      category: 'bedroom',
      x: 3.0,
      y: 7.2,
      width: 1.6,
      depth: 2.0,
      rotation: 0,
    },
    {
      id: 'f-desk',
      assetId: 'desk-chair',
      name: 'Work Desk & Chair',
      category: 'bedroom',
      x: 1.8,
      y: 9.3,
      width: 1.4,
      depth: 0.7,
      rotation: 0,
    },

    // Bedroom 2
    {
      id: 'f-single',
      assetId: 'bed-single',
      name: 'Single Bed',
      category: 'bedroom',
      x: 6.8,
      y: 7.2,
      width: 1.0,
      depth: 2.0,
      rotation: 0,
    },

    // Bath
    {
      id: 'f-tub',
      assetId: 'tub',
      name: 'Bath Tub',
      category: 'bath',
      x: 9.8,
      y: 6.3,
      width: 1.7,
      depth: 0.75,
      rotation: 90,
    },
    {
      id: 'f-vanity',
      assetId: 'vanity',
      name: 'Vanity & Basin',
      category: 'bath',
      x: 9.3,
      y: 7.8,
      width: 1.2,
      depth: 0.55,
      rotation: 0,
    },
    {
      id: 'f-toilet',
      assetId: 'toilet',
      name: 'Toilet',
      category: 'bath',
      x: 10.3,
      y: 7.8,
      width: 0.5,
      depth: 0.7,
      rotation: 0,
    },
  ];

  const dimensions: DimensionItem[] = [
    {
      id: 'dim-1',
      x1: 1.0,
      y1: 0.5,
      x2: 6.6,
      y2: 0.5,
      label: '5.60 m',
    },
    {
      id: 'dim-2',
      x1: 6.6,
      y1: 0.5,
      x2: 11.0,
      y2: 0.5,
      label: '4.40 m',
    },
  ];

  return {
    id,
    name: 'Sample Bungalow',
    scale: '1:100',
    units: 'm',
    gridVisible: true,
    focusLight: false,
    rooms,
    walls: wallList,
    furniture,
    dimensions,
    redlines: [],
    layers: JSON.parse(JSON.stringify(DEFAULT_LAYERS)),
    ghostSketch: null,
    history: [
      {
        rooms: JSON.parse(JSON.stringify(rooms)),
        walls: JSON.parse(JSON.stringify(wallList)),
        furniture: JSON.parse(JSON.stringify(furniture)),
        dimensions: JSON.parse(JSON.stringify(dimensions)),
        redlines: [],
      },
    ],
    historyIndex: 0,
  };
}

export function createBlankTab(id: string, name: string): DesignTab {
  return {
    id,
    name,
    scale: '1:100',
    units: 'm',
    gridVisible: true,
    focusLight: false,
    rooms: [],
    walls: [],
    furniture: [],
    dimensions: [],
    redlines: [],
    layers: JSON.parse(JSON.stringify(DEFAULT_LAYERS)),
    ghostSketch: null,
    history: [
      {
        rooms: [],
        walls: [],
        furniture: [],
        dimensions: [],
        redlines: [],
      },
    ],
    historyIndex: 0,
  };
}

export const SAMPLE_BUNGALOW_PLAN: DesignTab = createSampleBungalowTab();
