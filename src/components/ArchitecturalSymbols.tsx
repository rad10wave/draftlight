import React from 'react';
import { FurnitureItem } from '../types';

interface SymbolProps {
  furniture: FurnitureItem;
  ppm: number; // pixels per meter (1 in normalized SVG world space)
  theme: string;
  isSelected?: boolean;
}

type NormalizedFurnitureKind =
  | 'door-double'
  | 'door-single'
  | 'door-sliding'
  | 'door-pocket'
  | 'door-bifold'
  | 'window'
  | 'bed-queen'
  | 'bed-single'
  | 'sofa'
  | 'armchair'
  | 'table-dining'
  | 'table-round'
  | 'table-coffee'
  | 'desk'
  | 'counter'
  | 'island'
  | 'cooktop'
  | 'refrigerator'
  | 'tub'
  | 'vanity'
  | 'toilet'
  | 'shower'
  | 'wardrobe'
  | 'storage'
  | 'ottoman-round'
  | 'l-sectional'
  | 'generic';

function classifyFurniture(furniture: FurnitureItem): NormalizedFurnitureKind {
  const assetId = (furniture.assetId || '').toLowerCase();
  const name = (furniture.name || '').toLowerCase();
  const cat = (furniture.category || '').toLowerCase();
  const shape = (furniture.shapeType || '').toLowerCase();

  // Doors & Windows
  if (
    assetId.includes('sliding') ||
    name.includes('sliding') ||
    shape.includes('sliding') ||
    name.includes('patio')
  ) {
    return 'door-sliding';
  }
  if (
    assetId.includes('pocket') ||
    name.includes('pocket') ||
    shape.includes('pocket')
  ) {
    return 'door-pocket';
  }
  if (
    assetId.includes('bifold') ||
    name.includes('bifold') ||
    name.includes('accordion') ||
    shape.includes('bifold')
  ) {
    return 'door-bifold';
  }
  if (
    shape === 'door-double' ||
    assetId === 'double-door' ||
    ((assetId === 'door' || cat === 'doors-windows' || name.includes('door')) &&
      (furniture.width >= 1.4 || name.includes('double') || name.includes('french')))
  ) {
    return 'door-double';
  }
  if (shape === 'door-single' || assetId === 'door' || cat === 'doors-windows' || name.includes('door')) {
    return 'door-single';
  }
  if (shape === 'window' || assetId === 'window' || name.includes('window')) {
    return 'window';
  }

  // Explicit shape types from custom creator
  if (shape === 'desk-chair') return 'desk';
  if (shape === 'table-chairs') return 'table-dining';
  if (shape === 'l-shape') return 'l-sectional';
  if (shape === 'circle') {
    if (name.includes('tub') || cat === 'bath') return 'tub';
    if (name.includes('ottoman') || name.includes('pouf') || cat === 'bedroom') return 'ottoman-round';
    if (name.includes('table') || cat === 'living' || cat === 'kitchen') return 'table-round';
    return 'table-round';
  }

  // Specific Toilet / WC
  if (
    assetId === 'toilet' ||
    assetId === 'wc' ||
    name.includes('toilet') ||
    name.includes('wc') ||
    name.includes('commode') ||
    name.includes('water closet')
  ) {
    return 'toilet';
  }

  // Vanity & Sinks
  if (
    assetId === 'vanity' ||
    assetId === 'sink' ||
    assetId === 'basin' ||
    name.includes('vanity') ||
    name.includes('washbasin') ||
    name.includes('lavatory') ||
    (name.includes('sink') && cat === 'bath')
  ) {
    return 'vanity';
  }

  // Bathtubs
  if (
    assetId === 'tub' ||
    assetId === 'bathtub' ||
    name.includes('tub') ||
    name.includes('bath') ||
    name.includes('jacuzzi') ||
    name.includes('soaking')
  ) {
    return 'tub';
  }

  // Shower
  if (
    assetId === 'shower' ||
    name.includes('shower') ||
    name.includes('enclosure') ||
    name.includes('cubicle')
  ) {
    return 'shower';
  }

  // Beds
  if (
    assetId === 'bed-single' ||
    name.includes('single bed') ||
    name.includes('twin bed') ||
    name.includes('bunk')
  ) {
    return 'bed-single';
  }
  if (
    assetId === 'bed-queen' ||
    assetId === 'bed-king' ||
    assetId === 'bed-double' ||
    assetId.includes('bed') ||
    name.includes('bed') ||
    name.includes('queen') ||
    name.includes('king') ||
    cat === 'bedroom'
  ) {
    // If aspect ratio is narrow (< 1.2m wide), default to single bed
    if (furniture.width <= 1.2) return 'bed-single';
    return 'bed-queen';
  }

  // Sofas & Couches
  if (
    assetId === 'sofa-armchair' ||
    assetId === 'armchair' ||
    name.includes('armchair') ||
    name.includes('lounge chair') ||
    name.includes('accent chair') ||
    (name.includes('chair') && !name.includes('table') && !name.includes('desk') && furniture.width <= 1.1)
  ) {
    return 'armchair';
  }
  if (
    assetId === 'sofa-3' ||
    assetId === 'sofa-2' ||
    assetId === 'sofa' ||
    assetId.includes('sofa') ||
    assetId.includes('couch') ||
    name.includes('sofa') ||
    name.includes('couch') ||
    name.includes('sectional') ||
    name.includes('loveseat') ||
    name.includes('davenport')
  ) {
    return 'sofa';
  }

  // Dining Tables & Chairs
  if (
    assetId === 'table-round' ||
    name.includes('round table') ||
    name.includes('circular table')
  ) {
    return 'table-round';
  }
  if (
    assetId === 'table-6' ||
    assetId === 'table-4' ||
    assetId === 'table-8' ||
    assetId.includes('table') ||
    name.includes('dining table') ||
    name.includes('dining set') ||
    name.includes('table')
  ) {
    if (name.includes('coffee') || name.includes('tea') || name.includes('cocktail')) {
      return 'table-coffee';
    }
    return 'table-dining';
  }
  if (assetId === 'coffee-table' || name.includes('coffee') || name.includes('cocktail')) {
    return 'table-coffee';
  }

  // Desks & Workstations
  if (
    assetId === 'desk' ||
    assetId === 'desk-chair' ||
    assetId.includes('desk') ||
    name.includes('desk') ||
    name.includes('workstation') ||
    name.includes('office')
  ) {
    return 'desk';
  }

  // Cooktop / Stove
  if (
    assetId === 'cooktop' ||
    assetId === 'range' ||
    assetId === 'stove' ||
    name.includes('cooktop') ||
    name.includes('range') ||
    name.includes('stove') ||
    name.includes('hob') ||
    name.includes('induction') ||
    name.includes('oven')
  ) {
    return 'cooktop';
  }

  // Refrigerator
  if (
    assetId === 'refrigerator' ||
    assetId === 'fridge' ||
    name.includes('refrigerator') ||
    name.includes('fridge') ||
    name.includes('freezer')
  ) {
    return 'refrigerator';
  }

  // Kitchen Island
  if (
    assetId === 'kitchen-island' ||
    assetId === 'island' ||
    name.includes('island')
  ) {
    return 'island';
  }

  // Kitchen Counter
  if (
    assetId === 'counter-l' ||
    assetId === 'counter' ||
    name.includes('counter') ||
    (name.includes('sink') && cat === 'kitchen')
  ) {
    return 'counter';
  }

  // Wardrobe / Closet
  if (
    assetId === 'wardrobe' ||
    assetId === 'closet' ||
    name.includes('wardrobe') ||
    name.includes('closet') ||
    name.includes('armoire') ||
    name.includes('dresser')
  ) {
    return 'wardrobe';
  }

  // Bookshelf / Storage
  if (
    assetId === 'bookshelf' ||
    assetId === 'shelf' ||
    name.includes('book') ||
    name.includes('shelf') ||
    name.includes('storage') ||
    name.includes('cabinet') ||
    name.includes('credenza')
  ) {
    return 'storage';
  }

  return 'generic';
}

export const ArchitecturalSymbol: React.FC<SymbolProps> = ({
  furniture,
  ppm,
  theme,
  isSelected,
}) => {
  // Coordinates are in world meters (ppm = 1)
  const w = Math.max(0.2, furniture.width * ppm);
  const d = Math.max(0.2, furniture.depth * ppm);

  const isDark = theme === 'trace';
  const strokeColor = isSelected ? '#2563EB' : isDark ? '#CBD5E1' : '#1E293B';
  const fillColor = isSelected
    ? 'rgba(37, 99, 235, 0.14)'
    : isDark
    ? '#1E293B'
    : '#FFFFFF';
  const softFill = isSelected
    ? 'rgba(37, 99, 235, 0.08)'
    : isDark
    ? '#0F172A'
    : '#F8FAFC';
  const bgKnockout = isDark ? '#0F172A' : '#F8FAFC';
  const accentColor = isDark ? '#64748B' : '#94A3B8';
  const glassColor = isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(14, 165, 233, 0.2)';
  const highlightColor = isDark ? '#334155' : '#E2E8F0';

  // CAD lineweights in meters
  const lwHeavy = 0.028;
  const lwMed = 0.02;
  const lwThin = 0.013;
  const lwHair = 0.008;

  const defaultCorner = Math.min(0.04, w * 0.04, d * 0.04);

  // If custom linked image asset
  if (furniture.isCustomImage && furniture.imageDataUri) {
    return (
      <g>
        <image href={furniture.imageDataUri} width={w} height={d} preserveAspectRatio="none" />
        <rect
          x={0}
          y={0}
          width={w}
          height={d}
          fill="none"
          stroke={isSelected ? '#2563EB' : '#94A3B8'}
          strokeWidth={isSelected ? lwHeavy : lwThin}
          strokeDasharray="0.08,0.04"
        />
      </g>
    );
  }

  const kind = classifyFurniture(furniture);

  switch (kind) {
    // -------------------------------------------------------------
    // 1. DOORS (Double / French)
    // -------------------------------------------------------------
    case 'door-double': {
      const centerY = d / 2;
      const halfW = w / 2;
      const jambW = Math.min(0.06, halfW * 0.2);
      const leafLen = Math.max(0.1, halfW - jambW);
      const jambH = 0.22;
      const angleDeg = typeof furniture.swingAngle === 'number' ? furniture.swingAngle : 90;
      const isOut = furniture.swingOrientation === 'out';
      const normalSign = isOut ? -1 : 1;
      const rad = (angleDeg * Math.PI) / 180;

      // Left leaf (hinged at jambW, swings toward center halfW)
      const leftDirX = Math.cos(rad) * 1;
      const leftDirY = Math.sin(rad) * normalSign;
      const leftLeafEndX = jambW + leafLen * leftDirX;
      const leftLeafEndY = centerY + leafLen * leftDirY;
      const leftSweep = normalSign > 0 ? 0 : 1;

      // Right leaf (hinged at w - jambW, swings toward center halfW)
      const rightDirX = Math.cos(rad) * -1;
      const rightDirY = Math.sin(rad) * normalSign;
      const rightLeafEndX = (w - jambW) + leafLen * rightDirX;
      const rightLeafEndY = centerY + leafLen * rightDirY;
      const rightSweep = normalSign > 0 ? 1 : 0;

      return (
        <g>
          {/* Wall Cut Knockout (hides wall geometry underneath) */}
          <rect x={-0.02} y={centerY - 0.16} width={w + 0.04} height={0.32} fill={bgKnockout} />
          {/* Jamb Endcaps */}
          <rect x={0} y={centerY - jambH / 2} width={jambW} height={jambH} fill={strokeColor} rx={0.01} />
          <rect x={w - jambW} y={centerY - jambH / 2} width={jambW} height={jambH} fill={strokeColor} rx={0.01} />
          {/* Threshold Line */}
          <line x1={jambW} y1={centerY} x2={w - jambW} y2={centerY} stroke={accentColor} strokeWidth={lwThin} strokeDasharray="0.04,0.04" />

          {/* Left Door Leaf */}
          <line x1={jambW} y1={centerY} x2={leftLeafEndX} y2={leftLeafEndY} stroke={strokeColor} strokeWidth={lwHeavy} />
          <circle cx={jambW + leafLen * 0.85 * leftDirX} cy={centerY + leafLen * 0.85 * leftDirY} r={0.02} fill={strokeColor} />
          {angleDeg > 0 && (
            <path
              d={`M ${leftLeafEndX} ${leftLeafEndY} A ${leafLen} ${leafLen} 0 0 ${leftSweep} ${halfW} ${centerY}`}
              fill="none"
              stroke={strokeColor}
              strokeWidth={lwMed}
              strokeDasharray="0.06,0.04"
            />
          )}

          {/* Right Door Leaf */}
          <line x1={w - jambW} y1={centerY} x2={rightLeafEndX} y2={rightLeafEndY} stroke={strokeColor} strokeWidth={lwHeavy} />
          <circle cx={(w - jambW) + leafLen * 0.85 * rightDirX} cy={centerY + leafLen * 0.85 * rightDirY} r={0.02} fill={strokeColor} />
          {angleDeg > 0 && (
            <path
              d={`M ${rightLeafEndX} ${rightLeafEndY} A ${leafLen} ${leafLen} 0 0 ${rightSweep} ${halfW} ${centerY}`}
              fill="none"
              stroke={strokeColor}
              strokeWidth={lwMed}
              strokeDasharray="0.06,0.04"
            />
          )}

          {/* Astragal Meeting Stile Center Line */}
          <line x1={halfW} y1={centerY - 0.04} x2={halfW} y2={centerY + 0.04} stroke={strokeColor} strokeWidth={lwMed} />
        </g>
      );
    }

    // -------------------------------------------------------------
    // 2. DOORS (Single Swing)
    // -------------------------------------------------------------
    case 'door-single': {
      const centerY = d / 2;
      const jambW = Math.min(0.06, w * 0.15);
      const leafLen = Math.max(0.1, w - jambW * 2);
      const jambH = 0.22;
      const angleDeg = typeof furniture.swingAngle === 'number' ? furniture.swingAngle : 90;
      const isRight = furniture.swingDirection === 'right';
      const isOut = furniture.swingOrientation === 'out';
      const normalSign = isOut ? -1 : 1;
      const rad = (angleDeg * Math.PI) / 180;

      const hingeX = isRight ? w - jambW : jambW;
      const latchX = isRight ? jambW : w - jambW;
      const thX = isRight ? -1 : 1;

      const leafDirX = Math.cos(rad) * thX;
      const leafDirY = Math.sin(rad) * normalSign;
      const leafEndX = hingeX + leafLen * leafDirX;
      const leafEndY = centerY + leafLen * leafDirY;

      const cross = thX * normalSign;
      const sweepFlag = cross > 0 ? 0 : 1;

      return (
        <g>
          {/* Wall Cut Knockout (hides wall geometry underneath) */}
          <rect x={-0.02} y={centerY - 0.16} width={w + 0.04} height={0.32} fill={bgKnockout} />
          {/* Jamb Endcaps */}
          <rect x={0} y={centerY - jambH / 2} width={jambW} height={jambH} fill={strokeColor} rx={0.01} />
          <rect x={w - jambW} y={centerY - jambH / 2} width={jambW} height={jambH} fill={strokeColor} rx={0.01} />
          {/* Threshold Line */}
          <line x1={jambW} y1={centerY} x2={w - jambW} y2={centerY} stroke={accentColor} strokeWidth={lwThin} strokeDasharray="0.04,0.04" />
          {/* Swung Door Leaf */}
          <line x1={hingeX} y1={centerY} x2={leafEndX} y2={leafEndY} stroke={strokeColor} strokeWidth={lwHeavy} />
          <circle
            cx={hingeX + leafLen * 0.85 * leafDirX}
            cy={centerY + leafLen * 0.85 * leafDirY}
            r={0.02}
            fill={strokeColor}
          />
          {/* Swing Arc (shown when open) */}
          {angleDeg > 0 && (
            <path
              d={`M ${leafEndX} ${leafEndY} A ${leafLen} ${leafLen} 0 0 ${sweepFlag} ${latchX} ${centerY}`}
              fill="none"
              stroke={strokeColor}
              strokeWidth={lwMed}
              strokeDasharray="0.06,0.04"
            />
          )}
        </g>
      );
    }

    // -------------------------------------------------------------
    // 2b. DOORS (Sliding Patio / Bypass)
    // -------------------------------------------------------------
    case 'door-sliding': {
      const centerY = d / 2;
      const jambW = Math.min(0.06, w * 0.1);
      const jambH = 0.22;
      const panelLen = w * 0.54;
      const offY = 0.04;
      return (
        <g>
          {/* Wall Cut Knockout */}
          <rect x={-0.02} y={centerY - 0.16} width={w + 0.04} height={0.32} fill={bgKnockout} />
          {/* Jamb Endcaps */}
          <rect x={0} y={centerY - jambH / 2} width={jambW} height={jambH} fill={strokeColor} rx={0.01} />
          <rect x={w - jambW} y={centerY - jambH / 2} width={jambW} height={jambH} fill={strokeColor} rx={0.01} />
          {/* Threshold Line */}
          <line x1={jambW} y1={centerY} x2={w - jambW} y2={centerY} stroke={accentColor} strokeWidth={lwThin} strokeDasharray="0.04,0.04" />

          {/* Interior Slider Panel */}
          <rect
            x={jambW}
            y={centerY - offY - 0.018}
            width={panelLen}
            height={0.036}
            rx={0.008}
            fill={strokeColor}
          />
          <line x1={jambW + 0.02} y1={centerY - offY} x2={jambW + panelLen - 0.02} y2={centerY - offY} stroke="#0284C7" strokeWidth={lwThin} />

          {/* Exterior Slider Panel */}
          <rect
            x={w - jambW - panelLen}
            y={centerY + offY - 0.018}
            width={panelLen}
            height={0.036}
            rx={0.008}
            fill={strokeColor}
          />
          <line x1={w - jambW - panelLen + 0.02} y1={centerY + offY} x2={w - jambW - 0.02} y2={centerY + offY} stroke="#0284C7" strokeWidth={lwThin} />

          {/* Slide Motion Arrows */}
          <line x1={w / 2 - 0.08} y1={centerY - offY} x2={w / 2 + 0.08} y2={centerY - offY} stroke="#2563EB" strokeWidth={lwThin} />
        </g>
      );
    }

    // -------------------------------------------------------------
    // 2c. DOORS (Pocket In-Wall)
    // -------------------------------------------------------------
    case 'door-pocket': {
      const centerY = d / 2;
      const jambW = Math.min(0.06, w * 0.1);
      const jambH = 0.22;
      const slabW = w * 0.85;
      return (
        <g>
          {/* Wall Cut Knockout */}
          <rect x={-0.02} y={centerY - 0.16} width={w + 0.04} height={0.32} fill={bgKnockout} />
          {/* Left strike jamb */}
          <rect x={0} y={centerY - jambH / 2} width={jambW} height={jambH} fill={strokeColor} rx={0.01} />
          {/* Right split pocket jamb */}
          <rect x={w - jambW} y={centerY - jambH / 2} width={jambW} height={jambH} fill={strokeColor} rx={0.01} />
          {/* Threshold Line */}
          <line x1={jambW} y1={centerY} x2={w - jambW} y2={centerY} stroke={accentColor} strokeWidth={lwThin} strokeDasharray="0.04,0.04" />

          {/* Partially drawn pocket slab */}
          <rect
            x={w * 0.1}
            y={centerY - 0.02}
            width={slabW}
            height={0.04}
            rx={0.006}
            fill={strokeColor}
          />
          {/* Recessed finger cup */}
          <circle cx={w * 0.25} cy={centerY} r={0.012} fill={bgKnockout} stroke={strokeColor} strokeWidth={lwThin} />
        </g>
      );
    }

    // -------------------------------------------------------------
    // 2d. DOORS (Bifold Accordion)
    // -------------------------------------------------------------
    case 'door-bifold': {
      const centerY = d / 2;
      const jambW = Math.min(0.06, w * 0.1);
      const jambH = 0.22;
      const foldApexY = centerY + w * 0.35;
      return (
        <g>
          {/* Wall Cut Knockout */}
          <rect x={-0.02} y={centerY - 0.16} width={w + 0.04} height={0.32} fill={bgKnockout} />
          {/* Jambs */}
          <rect x={0} y={centerY - jambH / 2} width={jambW} height={jambH} fill={strokeColor} rx={0.01} />
          <rect x={w - jambW} y={centerY - jambH / 2} width={jambW} height={jambH} fill={strokeColor} rx={0.01} />
          {/* Track Line */}
          <line x1={jambW} y1={centerY} x2={w - jambW} y2={centerY} stroke={accentColor} strokeWidth={lwThin} strokeDasharray="0.04,0.04" />

          {/* Panel 1 */}
          <line x1={jambW} y1={centerY} x2={w * 0.5} y2={foldApexY} stroke={strokeColor} strokeWidth={lwHeavy} />
          {/* Panel 2 */}
          <line x1={w * 0.5} y1={foldApexY} x2={w - jambW} y2={centerY} stroke={strokeColor} strokeWidth={lwHeavy} />

          {/* Pivot & Guide dots */}
          <circle cx={jambW} cy={centerY} r={0.02} fill={strokeColor} />
          <circle cx={w * 0.5} cy={foldApexY} r={0.018} fill="none" stroke={strokeColor} strokeWidth={lwThin} />
          <circle cx={w - jambW} cy={centerY} r={0.018} fill={strokeColor} />
        </g>
      );
    }

    // -------------------------------------------------------------
    // 3. WINDOWS
    // -------------------------------------------------------------
    case 'window': {
      const centerY = d / 2;
      const winDepth = Math.max(0.18, d);
      const halfD = winDepth / 2;
      return (
        <g>
          {/* Wall Cut Knockout */}
          <rect x={-0.02} y={centerY - halfD} width={w + 0.04} height={winDepth} fill={bgKnockout} />
          {/* Exterior & Interior Sill Lines */}
          <line x1={-0.04} y1={centerY - halfD} x2={w + 0.04} y2={centerY - halfD} stroke={strokeColor} strokeWidth={lwMed} />
          <line x1={-0.04} y1={centerY + halfD} x2={w + 0.04} y2={centerY + halfD} stroke={strokeColor} strokeWidth={lwMed} />
          {/* Jamb Endcaps */}
          <line x1={0} y1={centerY - halfD} x2={0} y2={centerY + halfD} stroke={strokeColor} strokeWidth={lwHeavy} />
          <line x1={w} y1={centerY - halfD} x2={w} y2={centerY + halfD} stroke={strokeColor} strokeWidth={lwHeavy} />
          {/* Glass Pane Box */}
          <rect x={0.02} y={centerY - 0.03} width={w - 0.04} height={0.06} fill={glassColor} stroke={strokeColor} strokeWidth={lwThin} />
          {/* Glazing Center Line */}
          <line x1={0.02} y1={centerY} x2={w - 0.02} y2={centerY} stroke={isSelected ? '#2563EB' : '#0284C7'} strokeWidth={lwMed} />
        </g>
      );
    }

    // -------------------------------------------------------------
    // 4. TOILET / WATER CLOSET (Authentic Architectural CAD block)
    // -------------------------------------------------------------
    case 'toilet': {
      // Tank: mounted along top edge (against wall)
      const tankH = Math.min(0.24, d * 0.32);
      const tankW = Math.min(w * 0.94, 0.48);
      const tankX = (w - tankW) / 2;

      // Elongated bowl dimensions
      const bowlTop = tankH - 0.02;
      const bowlBottom = d * 0.96;
      const bowlW = Math.min(w * 0.88, 0.4);
      const bowlMidX = w / 2;
      const halfBw = bowlW / 2;

      // Neck connection
      const neckW = bowlW * 0.58;

      return (
        <g>
          {/* Flush Tank with Chamfered Lid */}
          <rect
            x={tankX}
            y={0}
            width={tankW}
            height={tankH}
            rx={0.025}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={lwHeavy}
          />
          {/* Dual flush button on top of tank */}
          <rect
            x={w / 2 - 0.035}
            y={tankH * 0.32}
            width={0.07}
            height={tankH * 0.36}
            rx={0.015}
            fill={softFill}
            stroke={accentColor}
            strokeWidth={lwThin}
          />
          <line
            x1={w / 2}
            y1={tankH * 0.32}
            x2={w / 2}
            y2={tankH * 0.68}
            stroke={accentColor}
            strokeWidth={lwThin}
          />

          {/* Seat Hinge Mount Plates */}
          <rect
            x={bowlMidX - neckW / 2 + 0.01}
            y={tankH}
            width={0.035}
            height={0.03}
            rx={0.005}
            fill={strokeColor}
          />
          <rect
            x={bowlMidX + neckW / 2 - 0.045}
            y={tankH}
            width={0.035}
            height={0.03}
            rx={0.005}
            fill={strokeColor}
          />

          {/* Outer Elongated Ceramic Bowl contour (CAD path) */}
          <path
            d={`
              M ${bowlMidX - neckW / 2} ${bowlTop}
              L ${bowlMidX - halfBw} ${bowlTop + (bowlBottom - bowlTop) * 0.3}
              C ${bowlMidX - halfBw} ${bowlTop + (bowlBottom - bowlTop) * 0.7},
                ${bowlMidX - halfBw * 0.65} ${bowlBottom},
                ${bowlMidX} ${bowlBottom}
              C ${bowlMidX + halfBw * 0.65} ${bowlBottom},
                ${bowlMidX + halfBw} ${bowlTop + (bowlBottom - bowlTop) * 0.7},
                ${bowlMidX + halfBw} ${bowlTop + (bowlBottom - bowlTop) * 0.3}
              L ${bowlMidX + neckW / 2} ${bowlTop}
              Z
            `}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={lwMed}
          />

          {/* Inner Toilet Seat Rim Opening */}
          <path
            d={`
              M ${bowlMidX - neckW * 0.38} ${bowlTop + 0.06}
              C ${bowlMidX - halfBw * 0.72} ${bowlTop + (bowlBottom - bowlTop) * 0.35},
                ${bowlMidX - halfBw * 0.52} ${bowlBottom - 0.06},
                ${bowlMidX} ${bowlBottom - 0.06}
              C ${bowlMidX + halfBw * 0.52} ${bowlBottom - 0.06},
                ${bowlMidX + halfBw * 0.72} ${bowlTop + (bowlBottom - bowlTop) * 0.35},
                ${bowlMidX + neckW * 0.38} ${bowlTop + 0.06}
              Z
            `}
            fill={softFill}
            stroke={strokeColor}
            strokeWidth={lwThin}
          />

          {/* Water Siphon Trap & Jet Hole */}
          <ellipse
            cx={bowlMidX}
            cy={bowlTop + (bowlBottom - bowlTop) * 0.5}
            rx={bowlW * 0.16}
            ry={(bowlBottom - bowlTop) * 0.16}
            fill="none"
            stroke={accentColor}
            strokeWidth={lwThin}
          />
          <circle
            cx={bowlMidX}
            cy={bowlTop + (bowlBottom - bowlTop) * 0.44}
            r={0.015}
            fill={accentColor}
          />
        </g>
      );
    }

    // -------------------------------------------------------------
    // 5. VANITY & BASIN (Architectural Countertop with Faucet)
    // -------------------------------------------------------------
    case 'vanity': {
      const basinW = Math.min(0.58, w * 0.65);
      const basinD = Math.min(0.38, d * 0.68);
      const basinX = (w - basinW) / 2;
      const basinY = (d - basinD) / 2 + 0.02;

      return (
        <g>
          {/* Main Stone Countertop */}
          <rect
            x={0}
            y={0}
            width={w}
            height={d}
            rx={0.015}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={lwHeavy}
          />
          {/* Backsplash against wall */}
          <rect
            x={0}
            y={0}
            width={w}
            height={Math.min(0.04, d * 0.08)}
            fill={softFill}
            stroke={strokeColor}
            strokeWidth={lwThin}
          />

          {/* Front cabinet drawer edge reveal */}
          <line
            x1={0.02}
            y1={d - 0.03}
            x2={w - 0.02}
            y2={d - 0.03}
            stroke={accentColor}
            strokeWidth={lwHair}
          />

          {/* Under-mount Rectangular Ceramic Washbasin with Fillet Corners */}
          <rect
            x={basinX}
            y={basinY}
            width={basinW}
            height={basinD}
            rx={0.045}
            fill={softFill}
            stroke={strokeColor}
            strokeWidth={lwMed}
          />

          {/* Basin Interior Slope Lines (Geometric chamfers to drain) */}
          <line x1={basinX} y1={basinY} x2={basinX + 0.06} y2={basinY + 0.05} stroke={accentColor} strokeWidth={lwHair} />
          <line x1={basinX + basinW} y1={basinY} x2={basinX + basinW - 0.06} y2={basinY + 0.05} stroke={accentColor} strokeWidth={lwHair} />
          <line x1={basinX} y1={basinY + basinD} x2={basinX + 0.06} y2={basinY + basinD - 0.05} stroke={accentColor} strokeWidth={lwHair} />
          <line x1={basinX + basinW} y1={basinY + basinD} x2={basinX + basinW - 0.06} y2={basinY + basinD - 0.05} stroke={accentColor} strokeWidth={lwHair} />

          {/* Chrome Swivel Mixer Faucet */}
          {/* Base */}
          <circle cx={w / 2} cy={basinY - 0.02} r={0.025} fill={fillColor} stroke={strokeColor} strokeWidth={lwThin} />
          {/* Spout reaching into bowl */}
          <path
            d={`M ${w / 2} ${basinY - 0.02} L ${w / 2} ${basinY + 0.07}`}
            stroke={strokeColor}
            strokeWidth={lwHeavy}
            strokeLinecap="round"
          />
          {/* Left / Right Mixer Controls */}
          <line x1={w / 2 - 0.055} y1={basinY - 0.02} x2={w / 2 - 0.025} y2={basinY - 0.02} stroke={strokeColor} strokeWidth={lwMed} strokeLinecap="round" />
          <line x1={w / 2 + 0.025} y1={basinY - 0.02} x2={w / 2 + 0.055} y2={basinY - 0.02} stroke={strokeColor} strokeWidth={lwMed} strokeLinecap="round" />

          {/* Drain Stopper & Crosshair Grid */}
          <circle
            cx={w / 2}
            cy={basinY + basinD * 0.55}
            r={0.028}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={lwThin}
          />
          <line x1={w / 2 - 0.02} y1={basinY + basinD * 0.55} x2={w / 2 + 0.02} y2={basinY + basinD * 0.55} stroke={strokeColor} strokeWidth={lwHair} />
          <line x1={w / 2} y1={basinY + basinD * 0.55 - 0.02} x2={w / 2} y2={basinY + basinD * 0.55 + 0.02} stroke={strokeColor} strokeWidth={lwHair} />
        </g>
      );
    }

    // -------------------------------------------------------------
    // 6. BATHTUB (Architectural Soaking Tub with Ergonomic Contours)
    // -------------------------------------------------------------
    case 'tub': {
      const rimMargin = Math.min(0.1, w * 0.06, d * 0.12);
      const innerW = w - rimMargin * 2;
      const innerD = d - rimMargin * 2;
      const headRadius = Math.min(innerD * 0.45, 0.35);

      return (
        <g>
          {/* Outer Deck / Tile Surround */}
          <rect
            x={0}
            y={0}
            width={w}
            height={d}
            rx={0.02}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={lwHeavy}
          />

          {/* Inner Ergonomic Tub Basin with Sloped Headrest End */}
          <rect
            x={rimMargin}
            y={rimMargin}
            width={innerW}
            height={innerD}
            rx={headRadius}
            fill={softFill}
            stroke={strokeColor}
            strokeWidth={lwMed}
          />

          {/* Ergonomic Reclined Backrest Contour Lines (Headrest end at right) */}
          <path
            d={`M ${w - rimMargin - 0.12} ${rimMargin + 0.04} Q ${w - rimMargin - 0.22} ${d / 2} ${w - rimMargin - 0.12} ${d - rimMargin - 0.04}`}
            fill="none"
            stroke={accentColor}
            strokeWidth={lwThin}
          />
          <path
            d={`M ${w - rimMargin - 0.24} ${rimMargin + 0.08} Q ${w - rimMargin - 0.36} ${d / 2} ${w - rimMargin - 0.24} ${d - rimMargin - 0.08}`}
            fill="none"
            stroke={accentColor}
            strokeWidth={lwThin}
            strokeDasharray="0.04,0.03"
          />

          {/* Drain End (Foot end at left) with Chrome Strainer & Overflow */}
          <circle
            cx={rimMargin + innerW * 0.18}
            cy={d / 2}
            r={0.035}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={lwThin}
          />
          <line
            x1={rimMargin + innerW * 0.18 - 0.025}
            y1={d / 2}
            x2={rimMargin + innerW * 0.18 + 0.025}
            y2={d / 2}
            stroke={strokeColor}
            strokeWidth={lwHair}
          />
          <line
            x1={rimMargin + innerW * 0.18}
            y1={d / 2 - 0.025}
            x2={rimMargin + innerW * 0.18}
            y2={d / 2 + 0.025}
            stroke={strokeColor}
            strokeWidth={lwHair}
          />

          {/* Overflow Slit on Wall Edge */}
          <line
            x1={rimMargin + 0.02}
            y1={d / 2 - 0.06}
            x2={rimMargin + 0.02}
            y2={d / 2 + 0.06}
            stroke={strokeColor}
            strokeWidth={lwMed}
          />

          {/* Bath Filler Tap Spout on Deck */}
          <path
            d={`M ${rimMargin * 0.4} ${d / 2} L ${rimMargin + 0.04} ${d / 2}`}
            stroke={strokeColor}
            strokeWidth={lwHeavy}
            strokeLinecap="round"
          />
          <circle cx={rimMargin * 0.4} cy={d / 2 - 0.05} r={0.015} fill={strokeColor} />
          <circle cx={rimMargin * 0.4} cy={d / 2 + 0.05} r={0.015} fill={strokeColor} />
        </g>
      );
    }

    // -------------------------------------------------------------
    // 7. EXECUTIVE DESK & ERGONOMIC TASK CHAIR
    // -------------------------------------------------------------
    case 'desk': {
      const chairW = Math.min(0.55, w * 0.55);
      const chairD = Math.min(0.52, d * 0.85);
      const chairCenterX = w / 2;
      const chairCenterY = d * 0.68;

      return (
        <g>
          {/* Main Desktop Surface */}
          <rect
            x={0}
            y={0}
            width={w}
            height={d}
            rx={0.02}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={lwHeavy}
          />

          {/* Under-desk Pedestal Drawers (Left or Right) */}
          <line x1={w * 0.28} y1={0} x2={w * 0.28} y2={d} stroke={accentColor} strokeWidth={lwThin} strokeDasharray="0.06,0.04" />

          {/* Cable Pass-Through Grommet (Top Right) */}
          <circle cx={w * 0.88} cy={d * 0.16} r={0.03} fill={softFill} stroke={accentColor} strokeWidth={lwThin} />

          {/* Desk Blotter / Laptop Footprint */}
          <rect
            x={w * 0.32}
            y={d * 0.1}
            width={w * 0.36}
            height={d * 0.38}
            rx={0.015}
            fill={softFill}
            stroke={accentColor}
            strokeWidth={lwThin}
          />

          {/* ERGONOMIC OFFICE TASK CHAIR */}
          {/* 5-Star Swivel Castor Base */}
          {[0, 72, 144, 216, 288].map((angle, idx) => {
            const rad = (angle * Math.PI) / 180;
            const legLen = chairW * 0.42;
            const lx = chairCenterX + Math.sin(rad) * legLen;
            const ly = chairCenterY + Math.cos(rad) * legLen;
            return (
              <g key={`castor-${idx}`}>
                <line
                  x1={chairCenterX}
                  y1={chairCenterY}
                  x2={lx}
                  y2={ly}
                  stroke={accentColor}
                  strokeWidth={lwThin}
                />
                <circle cx={lx} cy={ly} r={0.014} fill={strokeColor} />
              </g>
            );
          })}

          {/* Waterfall Front Seat Pan */}
          <rect
            x={chairCenterX - chairW * 0.4}
            y={chairCenterY - chairD * 0.35}
            width={chairW * 0.8}
            height={chairD * 0.7}
            rx={0.04}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={lwMed}
          />

          {/* Left & Right Ergonomic Armrests */}
          <rect
            x={chairCenterX - chairW * 0.48}
            y={chairCenterY - chairD * 0.25}
            width={chairW * 0.12}
            height={chairD * 0.5}
            rx={0.02}
            fill={softFill}
            stroke={strokeColor}
            strokeWidth={lwThin}
          />
          <rect
            x={chairCenterX + chairW * 0.36}
            y={chairCenterY - chairD * 0.25}
            width={chairW * 0.12}
            height={chairD * 0.5}
            rx={0.02}
            fill={softFill}
            stroke={strokeColor}
            strokeWidth={lwThin}
          />

          {/* Contoured Lumbar Backrest Rail */}
          <path
            d={`
              M ${chairCenterX - chairW * 0.38} ${chairCenterY + chairD * 0.22}
              Q ${chairCenterX} ${chairCenterY + chairD * 0.36} ${chairCenterX + chairW * 0.38} ${chairCenterY + chairD * 0.22}
            `}
            fill="none"
            stroke={strokeColor}
            strokeWidth={lwHeavy}
            strokeLinecap="round"
          />
        </g>
      );
    }

    // -------------------------------------------------------------
    // 8. SOFAS & COUCHES (Luxury 3-Seat with Pillows & Cushion Seams)
    // -------------------------------------------------------------
    case 'sofa': {
      const armW = Math.min(0.18, w * 0.11);
      const backDepth = Math.min(0.24, d * 0.28);
      const numCushions = w > 2.4 ? 4 : w < 1.5 ? 2 : 3;
      const cushionW = (w - armW * 2) / numCushions;
      const seatD = d - backDepth;

      return (
        <g>
          {/* Main Upholstered Frame */}
          <rect
            x={0}
            y={0}
            width={w}
            height={d}
            rx={0.04}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={lwHeavy}
          />

          {/* Structured Backrest along the top */}
          <rect
            x={0}
            y={0}
            width={w}
            height={backDepth}
            rx={0.03}
            fill={softFill}
            stroke={strokeColor}
            strokeWidth={lwMed}
          />

          {/* Individual Plump Seat Cushions */}
          {Array.from({ length: numCushions }).map((_, idx) => {
            const cx = armW + idx * cushionW + 0.01;
            const cw = cushionW - 0.02;
            const cd = seatD - 0.02;
            return (
              <g key={`cushion-${idx}`}>
                <rect
                  x={cx}
                  y={backDepth}
                  width={cw}
                  height={cd}
                  rx={0.035}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={lwMed}
                />
                {/* Cushion center tufting/seam indentation line */}
                <line
                  x1={cx + cw * 0.25}
                  y1={backDepth + cd * 0.45}
                  x2={cx + cw * 0.75}
                  y2={backDepth + cd * 0.45}
                  stroke={accentColor}
                  strokeWidth={lwHair}
                />
              </g>
            );
          })}

          {/* Left Padded Armrest */}
          <rect
            x={0}
            y={0}
            width={armW}
            height={d}
            rx={0.03}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={lwMed}
          />
          <line x1={armW * 0.5} y1={0.06} x2={armW * 0.5} y2={d - 0.06} stroke={accentColor} strokeWidth={lwHair} />

          {/* Right Padded Armrest */}
          <rect
            x={w - armW}
            y={0}
            width={armW}
            height={d}
            rx={0.03}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={lwMed}
          />
          <line x1={w - armW * 0.5} y1={0.06} x2={w - armW * 0.5} y2={d - 0.06} stroke={accentColor} strokeWidth={lwHair} />

          {/* Angled Corner Throw Pillows (45° angle) */}
          <g transform={`translate(${armW + 0.08}, ${backDepth + 0.08}) rotate(35)`}>
            <rect
              x={-0.12}
              y={-0.08}
              width={0.24}
              height={0.16}
              rx={0.03}
              fill={softFill}
              stroke={strokeColor}
              strokeWidth={lwThin}
            />
            <line x1={-0.08} y1={0} x2={0.08} y2={0} stroke={accentColor} strokeWidth={lwHair} />
          </g>

          <g transform={`translate(${w - armW - 0.08}, ${backDepth + 0.08}) rotate(-35)`}>
            <rect
              x={-0.12}
              y={-0.08}
              width={0.24}
              height={0.16}
              rx={0.03}
              fill={softFill}
              stroke={strokeColor}
              strokeWidth={lwThin}
            />
            <line x1={-0.08} y1={0} x2={0.08} y2={0} stroke={accentColor} strokeWidth={lwHair} />
          </g>
        </g>
      );
    }

    // -------------------------------------------------------------
    // 9. ARMCHAIR / LOUNGE CHAIR
    // -------------------------------------------------------------
    case 'armchair': {
      const armW = Math.min(0.2, w * 0.2);
      const backDepth = Math.min(0.24, d * 0.28);
      const seatW = w - armW * 2;
      const seatD = d - backDepth;

      return (
        <g>
          {/* Main Frame */}
          <rect
            x={0}
            y={0}
            width={w}
            height={d}
            rx={0.04}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={lwHeavy}
          />
          {/* Backrest */}
          <rect
            x={0}
            y={0}
            width={w}
            height={backDepth}
            rx={0.03}
            fill={softFill}
            stroke={strokeColor}
            strokeWidth={lwMed}
          />
          {/* Plump Seat Cushion */}
          <rect
            x={armW + 0.01}
            y={backDepth}
            width={seatW - 0.02}
            height={seatD - 0.02}
            rx={0.04}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={lwMed}
          />
          {/* Left Armrest */}
          <rect
            x={0}
            y={0}
            width={armW}
            height={d}
            rx={0.03}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={lwMed}
          />
          {/* Right Armrest */}
          <rect
            x={w - armW}
            y={0}
            width={armW}
            height={d}
            rx={0.03}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={lwMed}
          />
          {/* Accent Pillow */}
          <rect
            x={w / 2 - seatW * 0.3}
            y={backDepth + 0.04}
            width={seatW * 0.6}
            height={seatD * 0.25}
            rx={0.02}
            fill={softFill}
            stroke={strokeColor}
            strokeWidth={lwThin}
          />
        </g>
      );
    }

    // -------------------------------------------------------------
    // 10. DINING TABLE & CHAIRS (Authentic CAD Dining Set)
    // -------------------------------------------------------------
    case 'table-dining': {
      const chairW = Math.min(0.46, w * 0.24);
      const chairD = 0.38;
      const numChairsPerSide = w > 2.2 ? 4 : w < 1.4 ? 2 : 3;
      const spacing = w / (numChairsPerSide + 1);

      return (
        <g>
          {/* Top Row Chairs */}
          {Array.from({ length: numChairsPerSide }).map((_, idx) => {
            const cx = spacing * (idx + 1) - chairW / 2;
            const cy = -chairD * 0.6;
            return (
              <g key={`top-chair-${idx}`}>
                {/* Chair seat pad */}
                <rect
                  x={cx}
                  y={cy}
                  width={chairW}
                  height={chairD}
                  rx={0.03}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={lwMed}
                />
                {/* Curved backrest rail */}
                <path
                  d={`M ${cx} ${cy + 0.04} Q ${cx + chairW / 2} ${cy - 0.04} ${cx + chairW} ${cy + 0.04}`}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={lwHeavy}
                />
              </g>
            );
          })}

          {/* Bottom Row Chairs */}
          {Array.from({ length: numChairsPerSide }).map((_, idx) => {
            const cx = spacing * (idx + 1) - chairW / 2;
            const cy = d - chairD * 0.4;
            return (
              <g key={`bot-chair-${idx}`}>
                {/* Chair seat pad */}
                <rect
                  x={cx}
                  y={cy}
                  width={chairW}
                  height={chairD}
                  rx={0.03}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={lwMed}
                />
                {/* Curved backrest rail */}
                <path
                  d={`M ${cx} ${cy + chairD - 0.04} Q ${cx + chairW / 2} ${cy + chairD + 0.04} ${cx + chairW} ${cy + chairD - 0.04}`}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={lwHeavy}
                />
              </g>
            );
          })}

          {/* Main Table Top */}
          <rect
            x={0}
            y={0}
            width={w}
            height={d}
            rx={0.03}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={lwHeavy}
          />
          {/* Inner Inlay Bevel Line */}
          <rect
            x={0.04}
            y={0.04}
            width={w - 0.08}
            height={d - 0.08}
            rx={0.02}
            fill="none"
            stroke={accentColor}
            strokeWidth={lwThin}
          />
          {/* Center Table Runner */}
          <line
            x1={0.15}
            y1={d / 2}
            x2={w - 0.15}
            y2={d / 2}
            stroke={accentColor}
            strokeWidth={lwThin}
            strokeDasharray="0.08,0.05"
          />
        </g>
      );
    }

    // -------------------------------------------------------------
    // 11. ROUND DINING TABLE & RADIAL CHAIRS
    // -------------------------------------------------------------
    case 'table-round': {
      const radius = Math.min(w, d) / 2;
      const numChairs = radius >= 0.8 ? 6 : 4;
      const chairW = Math.min(0.42, radius * 0.45);
      const chairD = 0.32;

      return (
        <g>
          {/* Radial Chairs Arrayed Around Circle */}
          {Array.from({ length: numChairs }).map((_, idx) => {
            const angle = (idx * 360) / numChairs;
            return (
              <g
                key={`rchair-${idx}`}
                transform={`translate(${w / 2}, ${d / 2}) rotate(${angle}) translate(0, ${-radius - chairD * 0.4})`}
              >
                <rect
                  x={-chairW / 2}
                  y={0}
                  width={chairW}
                  height={chairD}
                  rx={0.03}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={lwMed}
                />
                <path
                  d={`M ${-chairW / 2} 0 Q 0 -0.05 ${chairW / 2} 0`}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={lwHeavy}
                />
              </g>
            );
          })}

          {/* Main Table Top Circle */}
          <circle
            cx={w / 2}
            cy={d / 2}
            r={radius}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={lwHeavy}
          />
          {/* Inner concentric wood inlay */}
          <circle
            cx={w / 2}
            cy={d / 2}
            r={radius * 0.84}
            fill="none"
            stroke={accentColor}
            strokeWidth={lwThin}
            strokeDasharray="0.06,0.04"
          />
          {/* Center decorative flower / centerpiece */}
          <circle
            cx={w / 2}
            cy={d / 2}
            r={radius * 0.16}
            fill={softFill}
            stroke={accentColor}
            strokeWidth={lwThin}
          />
        </g>
      );
    }

    // -------------------------------------------------------------
    // 12. COFFEE TABLE (Wood / Glass Inlay with Shelf)
    // -------------------------------------------------------------
    case 'table-coffee': {
      return (
        <g>
          {/* Main Table Top */}
          <rect
            x={0}
            y={0}
            width={w}
            height={d}
            rx={0.02}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={lwHeavy}
          />
          {/* Inner Glass or Slat Insert */}
          <rect
            x={w * 0.08}
            y={d * 0.12}
            width={w * 0.84}
            height={d * 0.76}
            rx={0.015}
            fill={glassColor}
            stroke={accentColor}
            strokeWidth={lwThin}
          />
          {/* Slatted Wood Lines or Glass Cross Reflection */}
          <line x1={w * 0.12} y1={d * 0.25} x2={w * 0.88} y2={d * 0.25} stroke={accentColor} strokeWidth={lwHair} />
          <line x1={w * 0.12} y1={d * 0.5} x2={w * 0.88} y2={d * 0.5} stroke={accentColor} strokeWidth={lwHair} />
          <line x1={w * 0.12} y1={d * 0.75} x2={w * 0.88} y2={d * 0.75} stroke={accentColor} strokeWidth={lwHair} />
        </g>
      );
    }

    // -------------------------------------------------------------
    // 13. QUEEN & KING BEDS (Headboard, Pillows, Turned-down Duvet)
    // -------------------------------------------------------------
    case 'bed-queen': {
      const pillowW = w * 0.38;
      const pillowH = d * 0.2;
      const headH = d * 0.09;
      const duvetY = d * 0.44;

      return (
        <g>
          {/* Bed Base / Mattress Border */}
          <rect
            x={0}
            y={0}
            width={w}
            height={d}
            rx={defaultCorner}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={lwHeavy}
          />

          {/* Structural Headboard at the top with end posts */}
          <rect
            x={0}
            y={0}
            width={w}
            height={headH}
            fill={softFill}
            stroke={strokeColor}
            strokeWidth={lwMed}
          />
          <rect x={0} y={0} width={0.06} height={headH} fill={strokeColor} />
          <rect x={w - 0.06} y={0} width={0.06} height={headH} fill={strokeColor} />

          {/* Left Pillow with Pillow Sham Border & Indent Crease */}
          <rect
            x={w * 0.08}
            y={headH + 0.04}
            width={pillowW}
            height={pillowH}
            rx={0.03}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={lwThin}
          />
          <path
            d={`M ${w * 0.18} ${headH + 0.04 + pillowH * 0.5} Q ${w * 0.27} ${headH + 0.04 + pillowH * 0.7} ${w * 0.36} ${headH + 0.04 + pillowH * 0.5}`}
            fill="none"
            stroke={accentColor}
            strokeWidth={lwHair}
          />

          {/* Right Pillow with Pillow Sham Border & Indent Crease */}
          <rect
            x={w * 0.54}
            y={headH + 0.04}
            width={pillowW}
            height={pillowH}
            rx={0.03}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={lwThin}
          />
          <path
            d={`M ${w * 0.64} ${headH + 0.04 + pillowH * 0.5} Q ${w * 0.73} ${headH + 0.04 + pillowH * 0.7} ${w * 0.82} ${headH + 0.04 + pillowH * 0.5}`}
            fill="none"
            stroke={accentColor}
            strokeWidth={lwHair}
          />

          {/* Turned-down Sheet Border Cuff */}
          <rect
            x={0.01}
            y={duvetY}
            width={w - 0.02}
            height={0.06}
            fill={softFill}
            stroke={strokeColor}
            strokeWidth={lwThin}
          />

          {/* Duvet Quilt turned down */}
          <line x1={0} y1={duvetY + 0.06} x2={w} y2={duvetY + 0.06} stroke={strokeColor} strokeWidth={lwMed} />

          {/* Architectural Quilted Drape Lines */}
          <line x1={w * 0.25} y1={duvetY + 0.06} x2={w * 0.25} y2={d - 0.04} stroke={accentColor} strokeWidth={lwHair} strokeDasharray="0.08,0.06" />
          <line x1={w * 0.5} y1={duvetY + 0.06} x2={w * 0.5} y2={d - 0.04} stroke={accentColor} strokeWidth={lwHair} strokeDasharray="0.08,0.06" />
          <line x1={w * 0.75} y1={duvetY + 0.06} x2={w * 0.75} y2={d - 0.04} stroke={accentColor} strokeWidth={lwHair} strokeDasharray="0.08,0.06" />
        </g>
      );
    }

    // -------------------------------------------------------------
    // 14. SINGLE BED
    // -------------------------------------------------------------
    case 'bed-single': {
      const pillowW = w * 0.72;
      const pillowH = d * 0.2;
      const headH = d * 0.09;
      const duvetY = d * 0.42;

      return (
        <g>
          <rect
            x={0}
            y={0}
            width={w}
            height={d}
            rx={defaultCorner}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={lwHeavy}
          />
          {/* Headboard */}
          <rect x={0} y={0} width={w} height={headH} fill={softFill} stroke={strokeColor} strokeWidth={lwMed} />

          {/* Centered Pillow with Crease */}
          <rect
            x={w * 0.14}
            y={headH + 0.04}
            width={pillowW}
            height={pillowH}
            rx={0.03}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={lwThin}
          />
          <path
            d={`M ${w * 0.3} ${headH + 0.04 + pillowH * 0.5} Q ${w * 0.5} ${headH + 0.04 + pillowH * 0.7} ${w * 0.7} ${headH + 0.04 + pillowH * 0.5}`}
            fill="none"
            stroke={accentColor}
            strokeWidth={lwHair}
          />

          {/* Folded Sheet Cuff & Duvet */}
          <rect x={0.01} y={duvetY} width={w - 0.02} height={0.05} fill={softFill} stroke={strokeColor} strokeWidth={lwThin} />
          <line x1={0} y1={duvetY + 0.05} x2={w} y2={duvetY + 0.05} stroke={strokeColor} strokeWidth={lwMed} />
          <line x1={w * 0.5} y1={duvetY + 0.05} x2={w * 0.5} y2={d - 0.04} stroke={accentColor} strokeWidth={lwHair} strokeDasharray="0.08,0.06" />
        </g>
      );
    }

    // -------------------------------------------------------------
    // 15. KITCHEN COUNTER & PREP SINK
    // -------------------------------------------------------------
    case 'counter': {
      const sinkW = Math.min(0.75, w * 0.42);
      const sinkD = Math.min(0.44, d * 0.75);
      const sinkX = w * 0.12;
      const sinkY = (d - sinkD) / 2;

      return (
        <g>
          {/* Base Countertop */}
          <rect
            x={0}
            y={0}
            width={w}
            height={d}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={lwHeavy}
          />
          {/* Backsplash Tile Band */}
          <rect x={0} y={0} width={w} height={0.04} fill={softFill} stroke={strokeColor} strokeWidth={lwThin} />

          {/* Stainless Steel Prep Sink Surround */}
          <rect
            x={sinkX}
            y={sinkY}
            width={sinkW}
            height={sinkD}
            rx={0.03}
            fill={softFill}
            stroke={strokeColor}
            strokeWidth={lwMed}
          />

          {/* Main Basin (Left) */}
          <rect
            x={sinkX + 0.03}
            y={sinkY + 0.03}
            width={sinkW * 0.58}
            height={sinkD - 0.06}
            rx={0.025}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={lwThin}
          />
          {/* Basket Strainer Drain in Basin */}
          <circle cx={sinkX + sinkW * 0.32} cy={sinkY + sinkD * 0.5} r={0.032} fill={fillColor} stroke={strokeColor} strokeWidth={lwThin} />
          <line x1={sinkX + sinkW * 0.32 - 0.02} y1={sinkY + sinkD * 0.5} x2={sinkX + sinkW * 0.32 + 0.02} y2={sinkY + sinkD * 0.5} stroke={strokeColor} strokeWidth={lwHair} />
          <line x1={sinkX + sinkW * 0.32} y1={sinkY + sinkD * 0.5 - 0.02} x2={sinkX + sinkW * 0.32} y2={sinkY + sinkD * 0.5 + 0.02} stroke={strokeColor} strokeWidth={lwHair} />

          {/* Sloped Ribbed Drainboard (Right) */}
          <rect
            x={sinkX + sinkW * 0.65}
            y={sinkY + 0.03}
            width={sinkW * 0.3}
            height={sinkD - 0.06}
            rx={0.015}
            fill="none"
            stroke={accentColor}
            strokeWidth={lwThin}
          />
          {[0.25, 0.5, 0.75].map((pos, idx) => (
            <line
              key={`drain-rib-${idx}`}
              x1={sinkX + sinkW * 0.68}
              y1={sinkY + sinkD * pos}
              x2={sinkX + sinkW * 0.92}
              y2={sinkY + sinkD * pos}
              stroke={accentColor}
              strokeWidth={lwHair}
            />
          ))}

          {/* Gooseneck Swivel Mixer Faucet */}
          <circle cx={sinkX + sinkW * 0.32} cy={sinkY - 0.015} r={0.02} fill={fillColor} stroke={strokeColor} strokeWidth={lwThin} />
          <path
            d={`M ${sinkX + sinkW * 0.32} ${sinkY - 0.015} L ${sinkX + sinkW * 0.32} ${sinkY + 0.06}`}
            stroke={strokeColor}
            strokeWidth={lwHeavy}
            strokeLinecap="round"
          />
        </g>
      );
    }

    // -------------------------------------------------------------
    // 16. KITCHEN ISLAND
    // -------------------------------------------------------------
    case 'island': {
      const numStools = Math.max(2, Math.floor(w / 0.7));
      const spacing = w / (numStools + 1);

      return (
        <g>
          {/* Island Prep Counter */}
          <rect
            x={0}
            y={0}
            width={w}
            height={d}
            rx={0.02}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={lwHeavy}
          />
          {/* Seating Overhang Line (Dashed architectural boundary) */}
          <line
            x1={0}
            y1={d * 0.68}
            x2={w}
            y2={d * 0.68}
            stroke={accentColor}
            strokeWidth={lwThin}
            strokeDasharray="0.08,0.05"
          />

          {/* Barstools tucked under overhang */}
          {Array.from({ length: numStools }).map((_, idx) => {
            const bx = spacing * (idx + 1);
            const by = d * 0.85;
            return (
              <g key={`stool-${idx}`}>
                <circle cx={bx} cy={by} r={0.16} fill={softFill} stroke={strokeColor} strokeWidth={lwMed} />
                <path
                  d={`M ${bx - 0.12} ${by + 0.04} Q ${bx} ${by + 0.14} ${bx + 0.12} ${by + 0.04}`}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={lwHeavy}
                />
              </g>
            );
          })}
        </g>
      );
    }

    // -------------------------------------------------------------
    // 17. RANGE & COOKTOP (Cast-Iron Trivet Grates & Control Dials)
    // -------------------------------------------------------------
    case 'cooktop': {
      const rBurner = Math.min(d * 0.13, w * 0.13, 0.1);
      const bx1 = w * 0.28;
      const bx2 = w * 0.72;
      const by1 = d * 0.3;
      const by2 = d * 0.68;

      const renderBurnerWithGrate = (cx: number, cy: number, r: number) => (
        <g>
          {/* Burner outer ring */}
          <circle cx={cx} cy={cy} r={r} fill={softFill} stroke={strokeColor} strokeWidth={lwThin} />
          {/* Inner flame spreader */}
          <circle cx={cx} cy={cy} r={r * 0.45} fill={fillColor} stroke={strokeColor} strokeWidth={lwThin} />
          {/* Cast-Iron Pan Support Trivet Crosshairs (Extending slightly beyond ring) */}
          <line x1={cx - r * 1.3} y1={cy} x2={cx + r * 1.3} y2={cy} stroke={strokeColor} strokeWidth={lwHeavy} strokeLinecap="square" />
          <line x1={cx} y1={cy - r * 1.3} x2={cx} y2={cy + r * 1.3} stroke={strokeColor} strokeWidth={lwHeavy} strokeLinecap="square" />
        </g>
      );

      return (
        <g>
          {/* Glass / Stainless Steel Cooktop Chassis */}
          <rect
            x={0}
            y={0}
            width={w}
            height={d}
            rx={0.02}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={lwHeavy}
          />
          {/* Back exhaust vent grille */}
          <line x1={w * 0.15} y1={0.04} x2={w * 0.85} y2={0.04} stroke={accentColor} strokeWidth={lwThin} strokeDasharray="0.03,0.02" />

          {/* 4 Professional Gas / Induction Burners with Heavy Grates */}
          {renderBurnerWithGrate(bx1, by1, rBurner)}
          {renderBurnerWithGrate(bx2, by1, rBurner * 0.9)}
          {renderBurnerWithGrate(bx1, by2, rBurner * 0.85)}
          {renderBurnerWithGrate(bx2, by2, rBurner * 1.15)}

          {/* Front Control Knobs with Position Pointers */}
          {[0.2, 0.4, 0.6, 0.8].map((kpos, idx) => (
            <g key={`knob-${idx}`}>
              <circle cx={w * kpos} cy={d - 0.04} r={0.022} fill={softFill} stroke={strokeColor} strokeWidth={lwThin} />
              <line x1={w * kpos} y1={d - 0.04} x2={w * kpos} y2={d - 0.055} stroke={strokeColor} strokeWidth={lwMed} />
            </g>
          ))}
        </g>
      );
    }

    // -------------------------------------------------------------
    // 18. REFRIGERATOR (French Door with Handles & Dispenser)
    // -------------------------------------------------------------
    case 'refrigerator': {
      const handleLen = d * 0.55;
      const handleY = (d - handleLen) / 2;

      return (
        <g>
          {/* Main Refrigerator Body */}
          <rect
            x={0}
            y={0}
            width={w}
            height={d}
            rx={0.02}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={lwHeavy}
          />
          {/* Double Door Split Line */}
          <line x1={w * 0.5} y1={0} x2={w * 0.5} y2={d} stroke={strokeColor} strokeWidth={lwMed} />

          {/* Left Door Vertical Handle */}
          <rect
            x={w * 0.43}
            y={handleY}
            width={0.03}
            height={handleLen}
            rx={0.01}
            fill={strokeColor}
          />

          {/* Right Door Vertical Handle */}
          <rect
            x={w * 0.54}
            y={handleY}
            width={0.03}
            height={handleLen}
            rx={0.01}
            fill={strokeColor}
          />

          {/* Ice / Water Dispenser on Left Door */}
          <rect
            x={w * 0.14}
            y={d * 0.3}
            width={w * 0.22}
            height={d * 0.38}
            rx={0.015}
            fill={softFill}
            stroke={accentColor}
            strokeWidth={lwThin}
          />
        </g>
      );
    }

    // -------------------------------------------------------------
    // 19. SHOWER ENCLOSURE (Tiled with Screen & Rain Head)
    // -------------------------------------------------------------
    case 'shower': {
      return (
        <g>
          {/* Tiled Shower Pan Surround */}
          <rect
            x={0}
            y={0}
            width={w}
            height={d}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={lwHeavy}
          />

          {/* Perimeter Water Threshold Curb */}
          <rect
            x={0.05}
            y={0.05}
            width={w - 0.1}
            height={d - 0.1}
            fill={softFill}
            stroke={strokeColor}
            strokeWidth={lwThin}
          />

          {/* Tiled Slope Lines to Floor Drain */}
          <line x1={0.05} y1={0.05} x2={w / 2} y2={d / 2} stroke={accentColor} strokeWidth={lwHair} strokeDasharray="0.05,0.04" />
          <line x1={w - 0.05} y1={0.05} x2={w / 2} y2={d / 2} stroke={accentColor} strokeWidth={lwHair} strokeDasharray="0.05,0.04" />
          <line x1={0.05} y1={d - 0.05} x2={w / 2} y2={d / 2} stroke={accentColor} strokeWidth={lwHair} strokeDasharray="0.05,0.04" />
          <line x1={w - 0.05} y1={d - 0.05} x2={w / 2} y2={d / 2} stroke={accentColor} strokeWidth={lwHair} strokeDasharray="0.05,0.04" />

          {/* Square Stainless Steel Floor Drain */}
          <rect
            x={w / 2 - 0.045}
            y={d / 2 - 0.045}
            width={0.09}
            height={0.09}
            rx={0.01}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={lwThin}
          />
          {/* Perforated grid */}
          <line x1={w / 2 - 0.03} y1={d / 2} x2={w / 2 + 0.03} y2={d / 2} stroke={strokeColor} strokeWidth={lwHair} />
          <line x1={w / 2} y1={d / 2 - 0.03} x2={w / 2} y2={d / 2 + 0.03} stroke={strokeColor} strokeWidth={lwHair} />

          {/* Wall-mounted Overhead Rain Shower Fixture */}
          <line x1={0.05} y1={d * 0.25} x2={0.18} y2={d * 0.25} stroke={strokeColor} strokeWidth={lwHeavy} />
          <circle cx={0.22} cy={d * 0.25} r={0.05} fill={glassColor} stroke={strokeColor} strokeWidth={lwMed} />

          {/* Frameless Glass Screen Indicator along front */}
          <line x1={0} y1={d} x2={w * 0.65} y2={d} stroke={isSelected ? '#2563EB' : '#0284C7'} strokeWidth={lwHeavy} />
        </g>
      );
    }

    // -------------------------------------------------------------
    // 20. WARDROBE / CLOSET (Clothes Rail & Hangers)
    // -------------------------------------------------------------
    case 'wardrobe': {
      const hangerCount = Math.max(3, Math.floor(w / 0.22));
      const railY = d * 0.5;

      return (
        <g>
          {/* Cabinet Carcass */}
          <rect
            x={0}
            y={0}
            width={w}
            height={d}
            rx={0.02}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={lwHeavy}
          />
          {/* Sliding Door Tracks along front */}
          <line x1={0} y1={d - 0.04} x2={w} y2={d - 0.04} stroke={accentColor} strokeWidth={lwThin} />

          {/* Clothes Hanging Rail */}
          <line x1={0.05} y1={railY} x2={w - 0.05} y2={railY} stroke={strokeColor} strokeWidth={lwMed} />

          {/* Angled Clothes Hangers along rail */}
          {Array.from({ length: hangerCount }).map((_, idx) => {
            const hx = (w / (hangerCount + 1)) * (idx + 1);
            return (
              <path
                key={`hanger-${idx}`}
                d={`M ${hx - 0.08} ${railY + 0.1} L ${hx} ${railY} L ${hx + 0.08} ${railY + 0.1} Z`}
                fill="none"
                stroke={accentColor}
                strokeWidth={lwHair}
              />
            );
          })}
        </g>
      );
    }

    // -------------------------------------------------------------
    // 21. BOOKSHELF / STORAGE
    // -------------------------------------------------------------
    case 'storage': {
      const shelfCount = Math.max(2, Math.floor(w / 0.5));
      const spacing = w / shelfCount;

      return (
        <g>
          <rect
            x={0}
            y={0}
            width={w}
            height={d}
            rx={0.02}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={lwHeavy}
          />
          {/* Upright Dividers */}
          {Array.from({ length: shelfCount - 1 }).map((_, idx) => (
            <line
              key={`div-${idx}`}
              x1={spacing * (idx + 1)}
              y1={0}
              x2={spacing * (idx + 1)}
              y2={d}
              stroke={strokeColor}
              strokeWidth={lwMed}
            />
          ))}
          {/* Book spines diagonal line or shelf depth */}
          <line x1={0.04} y1={d * 0.5} x2={w - 0.04} y2={d * 0.5} stroke={accentColor} strokeWidth={lwThin} strokeDasharray="0.05,0.04" />
        </g>
      );
    }

    // -------------------------------------------------------------
    // 22. ROUND OTTOMAN (Tufted with Button & Seams)
    // -------------------------------------------------------------
    case 'ottoman-round': {
      const radius = Math.min(w, d) / 2;
      return (
        <g>
          <circle
            cx={w / 2}
            cy={d / 2}
            r={radius}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={lwHeavy}
          />
          {/* Piping rim */}
          <circle
            cx={w / 2}
            cy={d / 2}
            r={radius * 0.88}
            fill="none"
            stroke={strokeColor}
            strokeWidth={lwThin}
          />
          {/* 8 Radial Tufting lines */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((ang, idx) => {
            const rad = (ang * Math.PI) / 180;
            return (
              <line
                key={`tuft-${idx}`}
                x1={w / 2 + Math.sin(rad) * radius * 0.15}
                y1={d / 2 + Math.cos(rad) * radius * 0.15}
                x2={w / 2 + Math.sin(rad) * radius * 0.85}
                y2={d / 2 + Math.cos(rad) * radius * 0.85}
                stroke={accentColor}
                strokeWidth={lwHair}
              />
            );
          })}
          {/* Center Tufting Button */}
          <circle
            cx={w / 2}
            cy={d / 2}
            r={radius * 0.09}
            fill={strokeColor}
          />
        </g>
      );
    }

    // -------------------------------------------------------------
    // 23. L-SHAPED SECTIONAL COUCH
    // -------------------------------------------------------------
    case 'l-sectional': {
      const thick = Math.min(w * 0.45, d * 0.45, 0.75);
      return (
        <g>
          <path
            d={`M 0 0 L ${w} 0 L ${w} ${thick} L ${thick} ${thick} L ${thick} ${d} L 0 ${d} Z`}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={lwHeavy}
          />
          {/* Backrest along top & left */}
          <path
            d={`M 0 0 L ${w} 0 L ${w} ${thick * 0.3} L ${thick * 0.3} ${thick * 0.3} L ${thick * 0.3} ${d} L 0 ${d} Z`}
            fill={softFill}
            stroke={strokeColor}
            strokeWidth={lwMed}
          />
          {/* Cushion divider lines */}
          <line x1={w * 0.5} y1={thick * 0.3} x2={w * 0.5} y2={thick} stroke={strokeColor} strokeWidth={lwThin} />
          <line x1={thick * 0.3} y1={d * 0.5} x2={thick} y2={d * 0.5} stroke={strokeColor} strokeWidth={lwThin} />
        </g>
      );
    }

    // -------------------------------------------------------------
    // 24. GENERIC / FALLBACK (Clean CAD Equipment Block)
    // -------------------------------------------------------------
    default: {
      return (
        <g>
          {/* Clean Outer Block */}
          <rect
            x={0}
            y={0}
            width={w}
            height={d}
            rx={defaultCorner}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={lwHeavy}
          />
          {/* Inset Border */}
          <rect
            x={Math.min(0.04, w * 0.05)}
            y={Math.min(0.04, d * 0.05)}
            width={w - Math.min(0.08, w * 0.1)}
            height={d - Math.min(0.08, d * 0.1)}
            rx={Math.max(0.01, defaultCorner - 0.01)}
            fill={softFill}
            stroke={accentColor}
            strokeWidth={lwHair}
          />
          {/* Equipment Name Label */}
          <text
            x={w / 2}
            y={d / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={Math.max(0.12, Math.min(0.22, w * 0.14, d * 0.24))}
            fill={strokeColor}
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fontWeight="600"
          >
            {furniture.name || 'Furniture'}
          </text>
        </g>
      );
    }
  }
};

