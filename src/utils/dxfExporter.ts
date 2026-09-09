import { DesignTab } from '../types';

/**
 * Generates an AutoCAD R12 / R2000 compliant ASCII DXF file from a DesignTab.
 */
export function generateDxfString(tab: DesignTab): string {
  const lines: string[] = [];

  const add = (code: number, value: string | number) => {
    lines.push(code.toString());
    lines.push(value.toString());
  };

  // 1. HEADER SECTION
  add(0, 'SECTION');
  add(2, 'HEADER');
  add(9, '$ACADVER');
  add(1, 'AC1009'); // AutoCAD R12 ASCII DXF
  add(9, '$INSUNITS');
  add(70, 6); // 6 = Meters
  add(0, 'ENDSEC');

  // 2. TABLES SECTION (LAYERS)
  add(0, 'SECTION');
  add(2, 'TABLES');
  add(0, 'TABLE');
  add(2, 'LAYER');
  add(70, 4);

  // Layer 0
  add(0, 'LAYER');
  add(2, '0');
  add(70, 0);
  add(62, 7); // white
  add(6, 'CONTINUOUS');

  // Layer WALLS
  add(0, 'LAYER');
  add(2, 'A-WALL');
  add(70, 0);
  add(62, 1); // red/black
  add(6, 'CONTINUOUS');

  // Layer ROOMS
  add(0, 'LAYER');
  add(2, 'A-AREA');
  add(70, 0);
  add(62, 4); // cyan
  add(6, 'CONTINUOUS');

  // Layer FURNITURE
  add(0, 'LAYER');
  add(2, 'A-FURN');
  add(70, 0);
  add(62, 3); // green
  add(6, 'CONTINUOUS');

  // Layer DIMS
  add(0, 'LAYER');
  add(2, 'A-DIMS');
  add(70, 0);
  add(62, 2); // yellow
  add(6, 'CONTINUOUS');

  add(0, 'ENDTAB');
  add(0, 'ENDSEC');

  // 3. ENTITIES SECTION
  add(0, 'SECTION');
  add(2, 'ENTITIES');

  // Export Walls as LINEs
  for (const wall of tab.walls) {
    add(0, 'LINE');
    add(8, 'A-WALL');
    add(10, wall.x1.toFixed(4));
    add(20, (-wall.y1).toFixed(4)); // Flip Y for standard Cartesian CAD coords
    add(30, '0.0');
    add(11, wall.x2.toFixed(4));
    add(21, (-wall.y2).toFixed(4));
    add(31, '0.0');

    // Also export openings as markers or text
    if (wall.openings && wall.openings.length > 0) {
      for (const op of wall.openings) {
        add(0, 'TEXT');
        add(8, 'A-WALL');
        // Midpoint of wall plus distance
        const dx = wall.x2 - wall.x1;
        const dy = wall.y2 - wall.y1;
        const len = Math.hypot(dx, dy) || 1;
        const ox = wall.x1 + (op.distanceAlongWall * dx) / len;
        const oy = -(wall.y1 + (op.distanceAlongWall * dy) / len);

        add(10, ox.toFixed(4));
        add(20, oy.toFixed(4));
        add(30, '0.0');
        add(40, '0.2'); // text height
        add(1, `${op.type.toUpperCase()} (${op.width.toFixed(2)}m)`);
      }
    }
  }

  // Export Rooms as closed polylines and labels
  for (const room of tab.rooms) {
    if (room.polygonPoints && room.polygonPoints.length >= 3) {
      // Polygon room
      for (let i = 0; i < room.polygonPoints.length; i++) {
        const p1 = room.polygonPoints[i];
        const p2 = room.polygonPoints[(i + 1) % room.polygonPoints.length];
        add(0, 'LINE');
        add(8, 'A-AREA');
        add(10, p1.x.toFixed(4));
        add(20, (-p1.y).toFixed(4));
        add(30, '0.0');
        add(11, p2.x.toFixed(4));
        add(21, (-p2.y).toFixed(4));
        add(31, '0.0');
      }
    } else {
      // Rectangle room
      const p1 = { x: room.x, y: room.y };
      const p2 = { x: room.x + room.width, y: room.y };
      const p3 = { x: room.x + room.width, y: room.y + room.depth };
      const p4 = { x: room.x, y: room.y + room.depth };

      const corners = [p1, p2, p3, p4];
      for (let i = 0; i < 4; i++) {
        const c1 = corners[i];
        const c2 = corners[(i + 1) % 4];
        add(0, 'LINE');
        add(8, 'A-AREA');
        add(10, c1.x.toFixed(4));
        add(20, (-c1.y).toFixed(4));
        add(30, '0.0');
        add(11, c2.x.toFixed(4));
        add(21, (-c2.y).toFixed(4));
        add(31, '0.0');
      }
    }

    // Room Label
    const cx = room.x + room.width / 2;
    const cy = -(room.y + room.depth / 2);
    add(0, 'TEXT');
    add(8, 'A-AREA');
    add(10, cx.toFixed(4));
    add(20, cy.toFixed(4));
    add(30, '0.0');
    add(40, '0.25'); // text height
    add(1, `${room.name} (${(room.width * room.depth).toFixed(1)}m2)`);
  }

  // Export Furniture as bounding rectangles and text
  for (const furn of tab.furniture) {
    const hw = furn.width / 2;
    const hd = furn.depth / 2;
    const rad = (furn.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const localCorners = [
      { x: -hw, y: -hd },
      { x: hw, y: -hd },
      { x: hw, y: hd },
      { x: -hw, y: hd },
    ];

    const worldCorners = localCorners.map((pt) => ({
      x: furn.x + (pt.x * cos - pt.y * sin),
      y: -(furn.y + (pt.x * sin + pt.y * cos)),
    }));

    for (let i = 0; i < 4; i++) {
      const c1 = worldCorners[i];
      const c2 = worldCorners[(i + 1) % 4];
      add(0, 'LINE');
      add(8, 'A-FURN');
      add(10, c1.x.toFixed(4));
      add(20, c1.y.toFixed(4));
      add(30, '0.0');
      add(11, c2.x.toFixed(4));
      add(21, c2.y.toFixed(4));
      add(31, '0.0');
    }

    add(0, 'TEXT');
    add(8, 'A-FURN');
    add(10, furn.x.toFixed(4));
    add(20, (-furn.y).toFixed(4));
    add(30, '0.0');
    add(40, '0.15');
    add(1, furn.name);
  }

  // Export Dimensions
  for (const dim of tab.dimensions) {
    add(0, 'LINE');
    add(8, 'A-DIMS');
    add(10, dim.x1.toFixed(4));
    add(20, (-dim.y1).toFixed(4));
    add(30, '0.0');
    add(11, dim.x2.toFixed(4));
    add(21, (-dim.y2).toFixed(4));
    add(31, '0.0');

    if (dim.label) {
      add(0, 'TEXT');
      add(8, 'A-DIMS');
      add(10, ((dim.x1 + dim.x2) / 2).toFixed(4));
      add(20, (-((dim.y1 + dim.y2) / 2)).toFixed(4));
      add(30, '0.0');
      add(40, '0.2');
      add(1, dim.label);
    }
  }

  add(0, 'ENDSEC');
  add(0, 'EOF');

  return lines.join('\n');
}
