import { GoogleGenAI } from '@google/genai';

let geminiClient: GoogleGenAI | null = null;
export function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

export function generateFallbackFloorPlan(promptText: string) {
  const lower = promptText.toLowerCase();

  let bedCount = 2;
  if (lower.includes('1 bed') || lower.includes('one bed') || lower.includes('studio')) bedCount = 1;
  else if (lower.includes('3 bed') || lower.includes('three bed')) bedCount = 3;
  else if (lower.includes('4 bed') || lower.includes('four bed')) bedCount = 4;

  const rooms: Array<{
    id: string;
    name: string;
    type: string;
    x: number;
    y: number;
    width: number;
    depth: number;
    color?: string;
  }> = [];

  const walls: Array<{
    id: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    thickness: number;
  }> = [];

  const furniture: Array<{
    id: string;
    name: string;
    assetId: string;
    x: number;
    y: number;
    width: number;
    depth: number;
    rotation: number;
  }> = [];

  if (bedCount === 1) {
    rooms.push({ id: 'r1', name: 'Living & Dining', type: 'living', x: 0, y: 0, width: 5.5, depth: 4.5, color: 'rgba(230, 240, 255, 0.3)' });
    rooms.push({ id: 'r2', name: 'Kitchen', type: 'kitchen', x: 5.5, y: 0, width: 3.5, depth: 4.5, color: 'rgba(255, 245, 230, 0.3)' });
    rooms.push({ id: 'r3', name: 'Bedroom', type: 'bedroom', x: 0, y: 4.5, width: 4.5, depth: 4.0, color: 'rgba(240, 235, 255, 0.3)' });
    rooms.push({ id: 'r4', name: 'Bathroom', type: 'bath', x: 4.5, y: 4.5, width: 2.5, depth: 2.4, color: 'rgba(230, 255, 250, 0.3)' });
    rooms.push({ id: 'r5', name: 'Entry Foyer', type: 'entry', x: 7.0, y: 4.5, width: 2.0, depth: 4.0, color: 'rgba(245, 245, 245, 0.3)' });

    furniture.push({ id: 'f1', name: '3-Seat Sofa', assetId: 'sofa-3', x: 2.0, y: 2.2, width: 2.2, depth: 0.9, rotation: 0 });
    furniture.push({ id: 'f2', name: 'Coffee Table', assetId: 'coffee-table', x: 2.0, y: 1.2, width: 1.1, depth: 0.6, rotation: 0 });
    furniture.push({ id: 'f3', name: 'Queen Bed', assetId: 'bed-queen', x: 1.5, y: 6.0, width: 1.6, depth: 2.0, rotation: 0 });
    furniture.push({ id: 'f4', name: 'Bath Tub', assetId: 'tub', x: 4.8, y: 5.0, width: 1.7, depth: 0.75, rotation: 90 });
    furniture.push({ id: 'f5', name: 'Kitchen Counter', assetId: 'counter-l', x: 6.0, y: 0.8, width: 2.4, depth: 0.6, rotation: 0 });
  } else if (bedCount === 3) {
    rooms.push({ id: 'r1', name: 'Living Room', type: 'living', x: 0, y: 0, width: 6.2, depth: 5.0, color: 'rgba(230, 240, 255, 0.3)' });
    rooms.push({ id: 'r2', name: 'Dining & Kitchen', type: 'kitchen', x: 6.2, y: 0, width: 5.8, depth: 5.0, color: 'rgba(255, 245, 230, 0.3)' });
    rooms.push({ id: 'r3', name: 'Primary Suite', type: 'bedroom', x: 0, y: 5.0, width: 4.5, depth: 4.5, color: 'rgba(240, 235, 255, 0.3)' });
    rooms.push({ id: 'r4', name: 'Primary Bath', type: 'bath', x: 4.5, y: 5.0, width: 2.5, depth: 2.5, color: 'rgba(230, 255, 250, 0.3)' });
    rooms.push({ id: 'r5', name: 'Bedroom 2', type: 'bedroom', x: 7.0, y: 5.0, width: 4.0, depth: 4.0, color: 'rgba(240, 235, 255, 0.3)' });
    rooms.push({ id: 'r6', name: 'Bedroom 3', type: 'bedroom', x: 0, y: 9.5, width: 4.0, depth: 3.5, color: 'rgba(240, 235, 255, 0.3)' });
    rooms.push({ id: 'r7', name: 'Hall Bath', type: 'bath', x: 4.0, y: 7.5, width: 2.5, depth: 2.5, color: 'rgba(230, 255, 250, 0.3)' });
    rooms.push({ id: 'r8', name: 'South Porch & Entry', type: 'entry', x: 4.0, y: 10.0, width: 4.0, depth: 2.5, color: 'rgba(245, 245, 245, 0.3)' });

    furniture.push({ id: 'f1', name: '3-Seat Sofa', assetId: 'sofa-3', x: 2.2, y: 2.5, width: 2.2, depth: 0.9, rotation: 0 });
    furniture.push({ id: 'f2', name: '6-Seat Table', assetId: 'table-6', x: 8.5, y: 2.5, width: 1.8, depth: 0.9, rotation: 0 });
    furniture.push({ id: 'f3', name: 'Island Unit', assetId: 'kitchen-island', x: 7.0, y: 1.0, width: 1.8, depth: 1.0, rotation: 0 });
    furniture.push({ id: 'f4', name: 'Queen Bed', assetId: 'bed-queen', x: 1.2, y: 6.5, width: 1.6, depth: 2.0, rotation: 0 });
    furniture.push({ id: 'f5', name: 'Single Bed', assetId: 'bed-single', x: 8.2, y: 6.5, width: 1.0, depth: 2.0, rotation: 0 });
    furniture.push({ id: 'f6', name: 'Bath Tub', assetId: 'tub', x: 4.8, y: 5.4, width: 1.7, depth: 0.75, rotation: 90 });
    furniture.push({ id: 'f7', name: 'Vanity', assetId: 'vanity', x: 4.5, y: 8.2, width: 1.2, depth: 0.55, rotation: 0 });
  } else {
    // 2-Bedroom Layout (Standard default)
    rooms.push({ id: 'r1', name: 'Living Room', type: 'living', x: 0, y: 0, width: 5.8, depth: 4.6, color: 'rgba(230, 240, 255, 0.3)' });
    rooms.push({ id: 'r2', name: 'Kitchen & Dining', type: 'kitchen', x: 5.8, y: 0, width: 4.2, depth: 4.6, color: 'rgba(255, 245, 230, 0.3)' });
    rooms.push({ id: 'r3', name: 'Bedroom 1', type: 'bedroom', x: 0, y: 4.6, width: 4.5, depth: 4.2, color: 'rgba(240, 235, 255, 0.3)' });
    rooms.push({ id: 'r4', name: 'Bathroom', type: 'bath', x: 4.5, y: 4.6, width: 2.5, depth: 2.6, color: 'rgba(230, 255, 250, 0.3)' });
    rooms.push({ id: 'r5', name: 'Bedroom 2', type: 'bedroom', x: 7.0, y: 4.6, width: 3.8, depth: 4.2, color: 'rgba(240, 235, 255, 0.3)' });

    furniture.push({ id: 'f1', name: '3-Seat Sofa', assetId: 'sofa-3', x: 2.0, y: 2.3, width: 2.2, depth: 0.9, rotation: 0 });
    furniture.push({ id: 'f2', name: '6-Seat Table', assetId: 'table-6', x: 7.5, y: 2.3, width: 1.8, depth: 0.9, rotation: 0 });
    furniture.push({ id: 'f3', name: 'Queen Bed', assetId: 'bed-queen', x: 1.5, y: 6.2, width: 1.6, depth: 2.0, rotation: 0 });
    furniture.push({ id: 'f4', name: 'Single Bed', assetId: 'bed-single', x: 8.0, y: 6.2, width: 1.0, depth: 2.0, rotation: 0 });
    furniture.push({ id: 'f5', name: 'Bath Tub', assetId: 'tub', x: 4.8, y: 5.2, width: 1.7, depth: 0.75, rotation: 90 });
  }

  // Generate perimeter wall segments
  let wallCounter = 1;
  const addWall = (x1: number, y1: number, x2: number, y2: number) => {
    const exists = walls.some(
      (w) =>
        (Math.abs(w.x1 - x1) < 0.05 && Math.abs(w.y1 - y1) < 0.05 && Math.abs(w.x2 - x2) < 0.05 && Math.abs(w.y2 - y2) < 0.05) ||
        (Math.abs(w.x1 - x2) < 0.05 && Math.abs(w.y1 - y2) < 0.05 && Math.abs(w.x2 - x1) < 0.05 && Math.abs(w.y2 - y1) < 0.05)
    );
    if (!exists) {
      walls.push({
        id: `gw-${wallCounter++}`,
        x1,
        y1,
        x2,
        y2,
        thickness: 0.15,
      });
    }
  };

  rooms.forEach((r) => {
    addWall(r.x, r.y, r.x + r.width, r.y);
    addWall(r.x + r.width, r.y, r.x + r.width, r.y + r.depth);
    addWall(r.x + r.width, r.y + r.depth, r.x, r.y + r.depth);
    addWall(r.x, r.y + r.depth, r.x, r.y);
  });

  return {
    title: `AI Concept: ${promptText.slice(0, 40)}`,
    description: `Architectural concept plan synthesized from prompt: "${promptText}"`,
    rooms,
    walls,
    furniture,
  };
}

export function isBlockedHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (lower === 'localhost' || lower === '127.0.0.1' || lower === '::1' || lower === '0.0.0.0') return true;
  if (lower.startsWith('10.') || lower.startsWith('192.168.') || lower.startsWith('172.16.') || lower.startsWith('169.254.')) return true;
  if (lower.endsWith('.local') || lower.endsWith('.internal')) return true;
  return false;
}
