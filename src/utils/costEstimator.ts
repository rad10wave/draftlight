import { DesignTab, DisplayUnit, Room, Wall } from '../types';
import { getWallLength } from './wallOpenings';

export interface MaterialCostRates {
  drywallPerSqM: number; // framing + drywall installed ($/m2 of wall)
  doorUnitCost: number; // per door assembly
  windowUnitCost: number; // per window unit
  flooringHardwoodPerSqM: number;
  flooringTilePerSqM: number;
  flooringCarpetPerSqM: number;
  flooringConcretePerSqM: number;
  paintPerSqM: number;
  contractorMarginPct: number; // e.g. 15%
  contingencyPct: number; // e.g. 10%
}

export const DEFAULT_RATES_METRIC: MaterialCostRates = {
  drywallPerSqM: 45, // $45/m2
  doorUnitCost: 450, // $450/door
  windowUnitCost: 650, // $650/window
  flooringHardwoodPerSqM: 85, // $85/m2
  flooringTilePerSqM: 95, // $95/m2
  flooringCarpetPerSqM: 40, // $40/m2
  flooringConcretePerSqM: 35, // $35/m2
  paintPerSqM: 18, // $18/m2
  contractorMarginPct: 15,
  contingencyPct: 10,
};

export interface CostLineItem {
  category: 'Structure & Framing' | 'Finishes' | 'Doors & Windows' | 'Fixtures' | 'Fees & Contingency';
  item: string;
  quantity: number;
  unit: string;
  unitRate: number;
  totalCost: number;
}

export interface CostEstimateReport {
  tabName: string;
  units: DisplayUnit;
  wallHeightMeters: number;
  totalWallLengthMeters: number;
  totalFloorAreaSqM: number;
  lineItems: CostLineItem[];
  subtotal: number;
  contractorFee: number;
  contingency: number;
  grandTotal: number;
  doorCount: number;
  windowCount: number;
  studCount: number;
  drywallSheetsCount: number;
}

/**
 * Calculates a comprehensive Bill of Materials and estimated construction costs.
 */
export function calculateBillOfMaterials(
  tab: DesignTab,
  rates: MaterialCostRates = DEFAULT_RATES_METRIC
): CostEstimateReport {
  const wallHeight = tab.storyLevel?.wallHeight || 2.8;

  // 1. Walls & Openings Calculation
  let totalWallLength = 0;
  let doorCount = 0;
  let windowCount = 0;

  for (const wall of tab.walls) {
    totalWallLength += getWallLength(wall);
    if (wall.openings) {
      for (const op of wall.openings) {
        if (op.type === 'window') {
          windowCount++;
        } else {
          doorCount++;
        }
      }
    }
  }

  // Also count doors and windows from furniture items if not in openings
  for (const furn of tab.furniture) {
    if (furn.category === 'doors-windows' || furn.assetId.includes('door')) {
      doorCount++;
    } else if (furn.assetId.includes('window')) {
      windowCount++;
    }
  }

  // Wall Gross Surface Area (both sides of wall partition = 2 x length x height)
  const wallGrossArea = totalWallLength * wallHeight * 2;
  // Deduct opening areas (approx 1.8m2 per door, 1.4m2 per window on both sides)
  const openingAreaDeduction = (doorCount * 1.89 + windowCount * 1.44) * 2;
  const wallNetArea = Math.max(0, wallGrossArea - openingAreaDeduction);

  // Stud Count: every 400mm (0.4m) along wall length, plus 4 per corner/opening
  const studCount = Math.ceil(totalWallLength / 0.4) + (doorCount + windowCount) * 4;
  // Drywall sheets: standard 1.2m x 2.4m = 2.88 m2 per board
  const drywallSheetsCount = Math.ceil(wallNetArea / 2.88);

  // 2. Flooring Areas by Room
  let totalFloorArea = 0;
  let hardwoodArea = 0;
  let tileArea = 0;
  let carpetArea = 0;
  let concreteArea = 0;

  for (const room of tab.rooms) {
    const area = room.width * room.depth;
    totalFloorArea += area;
    const name = room.name.toLowerCase();

    if (name.includes('bath') || name.includes('toilet') || name.includes('powder') || name.includes('kitchen')) {
      tileArea += area;
    } else if (name.includes('bed') || name.includes('guest')) {
      carpetArea += area;
    } else if (name.includes('garage') || name.includes('utility') || name.includes('storage') || name.includes('patio')) {
      concreteArea += area;
    } else {
      hardwoodArea += area;
    }
  }

  // 3. Assemble Line Items
  const lineItems: CostLineItem[] = [];

  // Framing & Drywall
  lineItems.push({
    category: 'Structure & Framing',
    item: 'Stud Framing, Insulation & Drywall Partitions',
    quantity: Number(wallNetArea.toFixed(1)),
    unit: 'm²',
    unitRate: rates.drywallPerSqM,
    totalCost: wallNetArea * rates.drywallPerSqM,
  });

  // Doors & Windows
  if (doorCount > 0) {
    lineItems.push({
      category: 'Doors & Windows',
      item: 'Interior/Exterior Pre-hung Door Units & Hardware',
      quantity: doorCount,
      unit: 'units',
      unitRate: rates.doorUnitCost,
      totalCost: doorCount * rates.doorUnitCost,
    });
  }

  if (windowCount > 0) {
    lineItems.push({
      category: 'Doors & Windows',
      item: 'Double-Glazed Energy Efficient Windows',
      quantity: windowCount,
      unit: 'units',
      unitRate: rates.windowUnitCost,
      totalCost: windowCount * rates.windowUnitCost,
    });
  }

  // Flooring Finishes
  if (hardwoodArea > 0) {
    lineItems.push({
      category: 'Finishes',
      item: 'Engineered Hardwood Flooring & Underlayment',
      quantity: Number(hardwoodArea.toFixed(1)),
      unit: 'm²',
      unitRate: rates.flooringHardwoodPerSqM,
      totalCost: hardwoodArea * rates.flooringHardwoodPerSqM,
    });
  }

  if (tileArea > 0) {
    lineItems.push({
      category: 'Finishes',
      item: 'Porcelain Tile & Waterproof Membrane (Kitchen/Baths)',
      quantity: Number(tileArea.toFixed(1)),
      unit: 'm²',
      unitRate: rates.flooringTilePerSqM,
      totalCost: tileArea * rates.flooringTilePerSqM,
    });
  }

  if (carpetArea > 0) {
    lineItems.push({
      category: 'Finishes',
      item: 'Plush Carpet & Cushion Padding (Bedrooms)',
      quantity: Number(carpetArea.toFixed(1)),
      unit: 'm²',
      unitRate: rates.flooringCarpetPerSqM,
      totalCost: carpetArea * rates.flooringCarpetPerSqM,
    });
  }

  if (concreteArea > 0) {
    lineItems.push({
      category: 'Finishes',
      item: 'Sealed & Polished Concrete Finish (Garage/Utility)',
      quantity: Number(concreteArea.toFixed(1)),
      unit: 'm²',
      unitRate: rates.flooringConcretePerSqM,
      totalCost: concreteArea * rates.flooringConcretePerSqM,
    });
  }

  // Paint
  lineItems.push({
    category: 'Finishes',
    item: 'Interior Primer & 2-Coat Low-VOC Paint',
    quantity: Number(wallNetArea.toFixed(1)),
    unit: 'm²',
    unitRate: rates.paintPerSqM,
    totalCost: wallNetArea * rates.paintPerSqM,
  });

  // Calculate Subtotal & Fees
  const subtotal = lineItems.reduce((acc, item) => acc + item.totalCost, 0);
  const contractorFee = subtotal * (rates.contractorMarginPct / 100);
  const contingency = (subtotal + contractorFee) * (rates.contingencyPct / 100);
  const grandTotal = subtotal + contractorFee + contingency;

  return {
    tabName: tab.name,
    units: tab.units,
    wallHeightMeters: wallHeight,
    totalWallLengthMeters: Number(totalWallLength.toFixed(2)),
    totalFloorAreaSqM: Number(totalFloorArea.toFixed(2)),
    lineItems,
    subtotal: Math.round(subtotal),
    contractorFee: Math.round(contractorFee),
    contingency: Math.round(contingency),
    grandTotal: Math.round(grandTotal),
    doorCount,
    windowCount,
    studCount,
    drywallSheetsCount,
  };
}

/**
 * Generates an RFC-4180 compliant CSV string for export to Excel/Sheets.
 */
export function exportCostReportToCSV(report: CostEstimateReport): string {
  const lines: string[] = [];
  lines.push(`"PROJECT ESTIMATE - ${report.tabName.replace(/"/g, '""')}"`);
  lines.push(`"Wall Height (m)",${report.wallHeightMeters}`);
  lines.push(`"Total Wall Length (m)",${report.totalWallLengthMeters}`);
  lines.push(`"Total Floor Area (m²)",${report.totalFloorAreaSqM}`);
  lines.push(`"Estimated 2x4 Stud Count",${report.studCount}`);
  lines.push(`"Estimated Drywall Sheets (4x8ft)",${report.drywallSheetsCount}`);
  lines.push('');
  lines.push('"Category","Item Description","Quantity","Unit","Unit Rate ($)","Total Cost ($)"');

  for (const item of report.lineItems) {
    lines.push(
      `"${item.category}","${item.item.replace(/"/g, '""')}",${item.quantity},"${item.unit}",${item.unitRate.toFixed(2)},${item.totalCost.toFixed(2)}`
    );
  }

  lines.push('');
  lines.push(`"Subtotal","Direct Construction Costs",,,,"${report.subtotal.toFixed(2)}"`);
  lines.push(`"Overhead & Profit","General Contractor Margin",,,,"${report.contractorFee.toFixed(2)}"`);
  lines.push(`"Contingency","Design & Construction Contingency",,,,"${report.contingency.toFixed(2)}"`);
  lines.push(`"TOTAL ESTIMATE","Grand Total Estimated Budget",,,,"${report.grandTotal.toFixed(2)}"`);

  return lines.join('\r\n');
}
