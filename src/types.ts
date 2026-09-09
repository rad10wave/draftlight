export type DrawingScale = '1:50' | '1:100' | '1:200';
export type ArchitecturalScale = DrawingScale;

export type DisplayUnit = 'm' | 'cm' | 'mm' | 'in' | 'ft-in';

export type ThemeMode = 'draftlight' | 'classic' | 'trace';

export type DraftTool =
  | 'select'
  | 'wall'
  | 'door'
  | 'window'
  | 'room'
  | 'polygon-room'
  | 'measure'
  | 'furniture'
  | 'calibrate'
  | 'ai'
  | 'redline';

export interface Point {
  x: number; // in real-world meters
  y: number; // in real-world meters
}

export type OpeningType = 'door' | 'double-door' | 'sliding' | 'pocket' | 'bifold' | 'window';

export interface WallOpening {
  id: string;
  type: OpeningType;
  distanceAlongWall: number; // in meters from (x1, y1)
  width: number; // opening width in meters (e.g., 0.9m)
  height?: number; // opening height in meters (e.g., 2.1m)
  sillHeight?: number; // sill elevation in meters (0 for doors, 0.9m for windows)
  swingDirection?: 'left' | 'right'; // Left hand vs. Right hand swing
  swingOrientation?: 'in' | 'out'; // Inswing vs. Outswing
  swingAngle?: number; // 90, 45, 30, 0
  label?: string;
  furnitureRefId?: string; // optional linked furniture block
}

export interface Room {
  id: string;
  name: string;
  type?: string;
  x: number; // top-left x in meters (or bounding box x)
  y: number; // top-left y in meters (or bounding box y)
  width: number; // in meters
  depth: number; // in meters
  polygonPoints?: Point[]; // multi-point polygon room support
  color?: string;
  wallThickness?: number;
  locked?: boolean;
}

export interface Wall {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number; // in meters (e.g. 0.15)
  openings?: WallOpening[]; // precise wall-hosted door and window cuts
  isArc?: boolean;
  arcBulge?: number; // curved wall bulge factor or arc control
  arcRadius?: number;
  locked?: boolean;
}

export type FurnitureCategory = 'living' | 'bedroom' | 'kitchen' | 'bath' | 'doors-windows' | 'custom';

export interface FurnitureCatalogItem {
  id: string;
  name: string;
  category: FurnitureCategory;
  width: number; // in meters
  depth: number; // in meters
  height?: number; // in meters (for 3D extrusion)
  iconType: string;
  description?: string;
  color?: string;
  shapeType?:
    | 'rectangle'
    | 'circle'
    | 'l-shape'
    | 'desk-chair'
    | 'table-chairs'
    | 'fixture'
    | 'storage'
    | 'door-single'
    | 'door-double'
    | 'door-sliding'
    | 'door-pocket'
    | 'door-bifold'
    | 'window'
    | 'custom';
  doorType?: OpeningType;
  swingDirection?: 'left' | 'right';
  swingOrientation?: 'in' | 'out';
  swingAngle?: number;
  author?: string;
  createdAt?: string;
}

export interface FurnitureItem {
  id: string;
  assetId: string;
  name: string;
  category: FurnitureCategory;
  x: number; // center x in meters
  y: number; // center y in meters
  width: number; // in meters
  depth: number; // in meters
  height?: number; // in meters for 3D
  rotation: number; // in degrees (0, 90, 180, 270, or arbitrary angle)
  locked?: boolean;
  color?: string;
  shapeType?: FurnitureCatalogItem['shapeType'];
  isCustomImage?: boolean;
  imageDataUri?: string;
  sourceUrl?: string;
  // Door/Window specific settings if applicable
  openingType?: OpeningType;
  swingDirection?: 'left' | 'right';
  swingOrientation?: 'in' | 'out';
  swingAngle?: number;
  hostedWallId?: string; // if snapped to a wall
  distanceAlongWall?: number;
}

export interface DimensionItem {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label?: string;
  locked?: boolean;
}

export interface RedlineItem {
  id: string;
  points: Point[];
  text?: string;
  color: string;
  strokeWidth: number;
  pressure?: number[]; // stylus/Apple pencil pressure points
  locked?: boolean;
}

export type LayerId =
  | 'walls-rooms'
  | 'furniture'
  | 'dimensions'
  | 'redline'
  | 'ai-ghost';

export interface LayerConfig {
  id: LayerId;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number; // 0.2 to 1.0
}

export interface GhostSketch {
  title?: string;
  description?: string;
  rooms: Room[];
  walls: Wall[];
  furniture?: FurnitureItem[];
}

export interface StoryLevel {
  id: string;
  name: string; // e.g. "Ground Floor", "Level 1", "Basement"
  levelIndex: number;
  elevation: number; // in meters
  wallHeight: number; // in meters (default: 2.8m)
  underlayTabId?: string | null; // ID of another tab to render as an underlay ghost
  underlayOpacity?: number; // 0.1 to 1.0 (default: 0.35)
  underlayColor?: 'blue' | 'graphite' | 'amber';
}

export interface SolarSettings {
  northAngle: number; // degrees 0-360 from vertical North
  latitude: number; // e.g. 40.7 for NYC, 51.5 for London, 37.8 for SF
  season: 'summer' | 'winter' | 'equinox';
  timeOfDay: number; // 6.0 to 18.0 (hours)
  showCompass: boolean;
  showShadows: boolean;
}

export interface DesignTab {
  id: string;
  name: string;
  scale: DrawingScale;
  units: DisplayUnit;
  gridVisible: boolean;
  focusLight: boolean;
  rooms: Room[];
  walls: Wall[];
  furniture: FurnitureItem[];
  dimensions: DimensionItem[];
  redlines: RedlineItem[];
  layers: Record<LayerId, LayerConfig>;
  ghostSketch: GhostSketch | null;
  storyLevel?: StoryLevel;
  solarSettings?: SolarSettings;
  underlayTabId?: string | null;
  underlayOpacity?: number;
  history?: Array<{
    rooms: Room[];
    walls: Wall[];
    furniture: FurnitureItem[];
    dimensions: DimensionItem[];
    redlines: RedlineItem[];
  }>;
  historyIndex?: number;
}

export interface FurnitureLibraryExport {
  version: '1.0';
  type: 'draftlight-furniture-library';
  exportedAt: string;
  name: string;
  items: FurnitureCatalogItem[];
}

export interface ProjectFileData {
  version: '1.0';
  id: string;
  name: string;
  exportedAt: string;
  scale: DrawingScale;
  units: DisplayUnit;
  rooms: Room[];
  walls: Wall[];
  furniture: FurnitureItem[];
  dimensions: DimensionItem[];
  redlines: RedlineItem[];
  layers: Record<LayerId, LayerConfig>;
  storyLevel?: StoryLevel;
  solarSettings?: SolarSettings;
}

export type SelectedElement =
  | { type: 'room'; id: string }
  | { type: 'wall'; id: string }
  | { type: 'opening'; wallId: string; openingId: string }
  | { type: 'furniture'; id: string }
  | { type: 'dimension'; id: string }
  | { type: 'redline'; id: string }
  | null;
