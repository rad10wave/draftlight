import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, Schema } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Helper for Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

// Architectural Fallback Plan Generator
function generateFallbackFloorPlan(promptText: string) {
  const lower = promptText.toLowerCase();
  
  // Extract number of bedrooms if specified
  let bedCount = 2;
  if (lower.includes('1 bed') || lower.includes('one bed') || lower.includes('studio')) bedCount = 1;
  else if (lower.includes('3 bed') || lower.includes('three bed')) bedCount = 3;
  else if (lower.includes('4 bed') || lower.includes('four bed')) bedCount = 4;

  // Check entrance
  const southEntrance = lower.includes('south');
  
  // Room blueprint layout in meters (x, y, width, height/depth, name, type)
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

  // Generate a harmonious layout
  if (bedCount === 1) {
    // 1-Bedroom Layout
    rooms.push({ id: 'r1', name: 'Living & Dining', type: 'living', x: 0, y: 0, width: 5.5, depth: 4.5 });
    rooms.push({ id: 'r2', name: 'Kitchen', type: 'kitchen', x: 5.5, y: 0, width: 3.5, depth: 4.5 });
    rooms.push({ id: 'r3', name: 'Bedroom', type: 'bedroom', x: 0, y: 4.5, width: 4.5, depth: 4.0 });
    rooms.push({ id: 'r4', name: 'Bathroom', type: 'bath', x: 4.5, y: 4.5, width: 2.5, depth: 2.4 });
    rooms.push({ id: 'r5', name: 'Entry Foyer', type: 'entry', x: 7.0, y: 4.5, width: 2.0, depth: 4.0 });

    furniture.push({ id: 'f1', name: '3-Seat Sofa', assetId: 'sofa-3', x: 2.0, y: 2.5, width: 2.2, depth: 0.9, rotation: 0 });
    furniture.push({ id: 'f2', name: 'Coffee Table', assetId: 'coffee-table', x: 2.2, y: 1.5, width: 1.1, depth: 0.6, rotation: 0 });
    furniture.push({ id: 'f3', name: 'Queen Bed', assetId: 'bed-queen', x: 1.5, y: 6.0, width: 1.6, depth: 2.0, rotation: 0 });
    furniture.push({ id: 'f4', name: 'Bath Tub', assetId: 'tub', x: 4.8, y: 5.0, width: 1.7, depth: 0.75, rotation: 90 });
    furniture.push({ id: 'f5', name: 'Kitchen Counter', assetId: 'counter-l', x: 6.0, y: 0.8, width: 2.4, depth: 0.6, rotation: 0 });
    furniture.push({ id: 'f6', name: 'Interior Door', assetId: 'door', x: 7.5, y: 8.5, width: 0.9, depth: 0.15, rotation: 0 });
  } else if (bedCount === 3) {
    // 3-Bedroom Layout (e.g. 1200 sqft / 111 sqm)
    rooms.push({ id: 'r1', name: 'Living Room', type: 'living', x: 0, y: 0, width: 6.2, depth: 5.0 });
    rooms.push({ id: 'r2', name: 'Dining & Kitchen', type: 'kitchen', x: 6.2, y: 0, width: 5.8, depth: 5.0 });
    rooms.push({ id: 'r3', name: 'Primary Suite', type: 'bedroom', x: 0, y: 5.0, width: 4.5, depth: 4.5 });
    rooms.push({ id: 'r4', name: 'Primary Bath', type: 'bath', x: 4.5, y: 5.0, width: 2.5, depth: 2.5 });
    rooms.push({ id: 'r5', name: 'Bedroom 2', type: 'bedroom', x: 7.0, y: 5.0, width: 4.0, depth: 4.0 });
    rooms.push({ id: 'r6', name: 'Bedroom 3 / Study', type: 'bedroom', x: 0, y: 9.5, width: 4.0, depth: 3.5 });
    rooms.push({ id: 'r7', name: 'Hall Bath', type: 'bath', x: 4.0, y: 7.5, width: 2.5, depth: 2.5 });
    rooms.push({ id: 'r8', name: 'South Porch & Entry', type: 'entry', x: 4.0, y: 10.0, width: 4.0, depth: 2.5 });

    furniture.push({ id: 'f1', name: '3-Seat Sofa', assetId: 'sofa-3', x: 2.2, y: 2.5, width: 2.2, depth: 0.9, rotation: 0 });
    furniture.push({ id: 'f2', name: '6-Seat Table', assetId: 'table-6', x: 8.5, y: 2.5, width: 1.8, depth: 0.9, rotation: 0 });
    furniture.push({ id: 'f3', name: 'Island Unit', assetId: 'kitchen-island', x: 7.0, y: 1.0, width: 1.8, depth: 1.0, rotation: 0 });
    furniture.push({ id: 'f4', name: 'Queen Bed', assetId: 'bed-queen', x: 1.2, y: 6.5, width: 1.6, depth: 2.0, rotation: 0 });
    furniture.push({ id: 'f5', name: 'Single Bed', assetId: 'bed-single', x: 8.2, y: 6.5, width: 1.0, depth: 2.0, rotation: 0 });
    furniture.push({ id: 'f6', name: 'Bath Tub', assetId: 'tub', x: 4.8, y: 5.4, width: 1.7, depth: 0.75, rotation: 90 });
    furniture.push({ id: 'f7', name: 'Vanity', assetId: 'vanity', x: 4.5, y: 8.2, width: 1.2, depth: 0.55, rotation: 0 });
    furniture.push({ id: 'f8', name: 'Interior Door', assetId: 'door', x: 5.5, y: 12.5, width: 0.9, depth: 0.15, rotation: southEntrance ? 180 : 0 });
  } else {
    // 2-Bedroom Classic Bungalow Layout
    rooms.push({ id: 'r1', name: 'Living Room', type: 'living', x: 0, y: 0, width: 5.6, depth: 4.8 });
    rooms.push({ id: 'r2', name: 'Kitchen & Dining', type: 'kitchen', x: 5.6, y: 0, width: 4.8, depth: 4.8 });
    rooms.push({ id: 'r3', name: 'Master Bedroom', type: 'bedroom', x: 0, y: 4.8, width: 4.8, depth: 4.2 });
    rooms.push({ id: 'r4', name: 'Bedroom 2', type: 'bedroom', x: 4.8, y: 4.8, width: 3.6, depth: 4.2 });
    rooms.push({ id: 'r5', name: 'Bathroom', type: 'bath', x: 8.4, y: 4.8, width: 2.0, depth: 3.0 });
    rooms.push({ id: 'r6', name: 'Entry Foyer', type: 'entry', x: 8.4, y: 7.8, width: 2.0, depth: 1.2 });

    furniture.push({ id: 'f1', name: '3-Seat Sofa', assetId: 'sofa-3', x: 1.8, y: 2.2, width: 2.2, depth: 0.9, rotation: 0 });
    furniture.push({ id: 'f2', name: '6-Seat Table', assetId: 'table-6', x: 7.2, y: 2.2, width: 1.8, depth: 0.9, rotation: 90 });
    furniture.push({ id: 'f3', name: 'Queen Bed', assetId: 'bed-queen', x: 1.6, y: 6.0, width: 1.6, depth: 2.0, rotation: 0 });
    furniture.push({ id: 'f4', name: 'Single Bed', assetId: 'bed-single', x: 6.0, y: 6.0, width: 1.0, depth: 2.0, rotation: 0 });
    furniture.push({ id: 'f5', name: 'Bath Tub', assetId: 'tub', x: 8.6, y: 5.2, width: 1.7, depth: 0.75, rotation: 90 });
    furniture.push({ id: 'f6', name: 'Kitchen Counter', assetId: 'counter-l', x: 6.0, y: 0.5, width: 2.4, depth: 0.6, rotation: 0 });
    furniture.push({ id: 'f7', name: 'Interior Door', assetId: 'door', x: 9.0, y: 9.0, width: 0.9, depth: 0.15, rotation: 0 });
    furniture.push({ id: 'f8', name: 'Window', assetId: 'window', x: 2.5, y: 0, width: 1.2, depth: 0.15, rotation: 0 });
  }

  // Derive walls automatically from room boundaries (with 0.15m thickness)
  const wallSet = new Set<string>();
  const addWallSegment = (x1: number, y1: number, x2: number, y2: number) => {
    // Normalize coordinates
    const [nx1, ny1, nx2, ny2] = (x1 < x2 || (x1 === x2 && y1 < y2))
      ? [x1, y1, x2, y2]
      : [x2, y2, x1, y1];
    const key = `${nx1.toFixed(2)},${ny1.toFixed(2)}-${nx2.toFixed(2)},${ny2.toFixed(2)}`;
    if (!wallSet.has(key)) {
      wallSet.add(key);
      walls.push({
        id: `w${walls.length + 1}`,
        x1: nx1,
        y1: ny1,
        x2: nx2,
        y2: ny2,
        thickness: 0.15,
      });
    }
  };

  rooms.forEach((r) => {
    addWallSegment(r.x, r.y, r.x + r.width, r.y);
    addWallSegment(r.x + r.width, r.y, r.x + r.width, r.y + r.depth);
    addWallSegment(r.x + r.width, r.y + r.depth, r.x, r.y + r.depth);
    addWallSegment(r.x, r.y + r.depth, r.x, r.y);
  });

  return {
    title: `AI Concept: ${promptText.slice(0, 40)}`,
    description: `Architectural concept plan synthesized from prompt: "${promptText}"`,
    scale: '1:100',
    units: 'm',
    rooms,
    walls,
    furniture,
  };
}

// GET /api/health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// POST /api/generate
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, model } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Prompt must be a non-empty string' });
      return;
    }
    if (prompt.length > 4000) {
      res.status(400).json({ error: 'Prompt exceeds maximum limit of 4,000 characters' });
      return;
    }

    const ai = getGeminiClient();
    if (ai) {
      try {
        const systemPrompt = `You are Draftlight AI Draftsperson, an expert architectural designer.
Given a floor plan description, return a realistic, scaled residential floor plan as JSON.
Coordinates (x, y, width, depth) must be in METERS.
Walls must line up and rooms should connect logically with realistic sizes (Living: 20-35m², Bedroom: 12-20m², Kitchen: 10-18m², Bath: 4-8m²).
Return valid JSON matching this schema:
{
  "title": "Short title",
  "description": "Short explanation",
  "rooms": [
    { "id": "r1", "name": "Living Room", "type": "living", "x": 0, "y": 0, "width": 5.5, "depth": 4.5 }
  ],
  "walls": [
    { "id": "w1", "x1": 0, "y1": 0, "x2": 5.5, "y2": 0, "thickness": 0.15 }
  ],
  "furniture": [
    { "id": "f1", "name": "3-Seat Sofa", "assetId": "sofa-3", "x": 1.5, "y": 2.0, "width": 2.2, "depth": 0.9, "rotation": 0 }
  ]
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nUser description: "${prompt}"` }],
            },
          ],
          config: {
            responseMimeType: 'application/json',
          },
        });

        const text = response.text?.trim();
        if (text) {
          const parsed = JSON.parse(text);
          if (parsed.rooms && Array.isArray(parsed.rooms) && parsed.rooms.length > 0) {
            // Ensure valid walls if empty
            if (!parsed.walls || parsed.walls.length === 0) {
              const walls: any[] = [];
              parsed.rooms.forEach((r: any, idx: number) => {
                walls.push({ id: `gw_${idx}_1`, x1: r.x, y1: r.y, x2: r.x + r.width, y2: r.y, thickness: 0.15 });
                walls.push({ id: `gw_${idx}_2`, x1: r.x + r.width, y1: r.y, x2: r.x + r.width, y2: r.y + r.depth, thickness: 0.15 });
                walls.push({ id: `gw_${idx}_3`, x1: r.x + r.width, y1: r.y + r.depth, x2: r.x, y2: r.y + r.depth, thickness: 0.15 });
                walls.push({ id: `gw_${idx}_4`, x1: r.x, y1: r.y + r.depth, x2: r.x, y2: r.y, thickness: 0.15 });
              });
              parsed.walls = walls;
            }
            res.json(parsed);
            return;
          }
        }
      } catch (geminiError) {
        console.warn('Gemini generateContent error, falling back to algorithmic synthesizer:', geminiError);
      }
    }

    // Algorithmic Fallback
    const fallback = generateFallbackFloorPlan(prompt);
    res.json(fallback);
  } catch (err: any) {
    console.error('API generate error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate floor plan' });
  }
});

// POST /api/proxy-image
// Embeds external image safely, preventing CORS issues and SSRF
app.post('/api/proxy-image', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string' || !url.startsWith('https://')) {
      res.status(400).json({ error: 'Only HTTPS URLs are allowed' });
      return;
    }

    const parsedUrl = new URL(url);
    // Disallow local loopback or private ranges
    const hostname = parsedUrl.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.local') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('172.')
    ) {
      res.status(403).json({ error: 'Private or local hosts are not permitted' });
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const fetchResponse = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'DraftlightArchitecturalBot/1.0',
      },
    });
    clearTimeout(timeout);

    if (!fetchResponse.ok) {
      res.status(400).json({ error: `Failed to fetch image: status ${fetchResponse.status}` });
      return;
    }

    const contentType = fetchResponse.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      res.status(400).json({ error: 'Target URL does not return a valid image' });
      return;
    }

    const buffer = Buffer.from(await fetchResponse.arrayBuffer());
    if (buffer.length > 5 * 1024 * 1024) {
      res.status(400).json({ error: 'Image exceeds maximum allowed size of 5 MB' });
      return;
    }

    const base64 = buffer.toString('base64');
    const dataUri = `data:${contentType};base64,${base64}`;

    res.json({ dataUri, mimeType: contentType });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Unable to proxy image' });
  }
});

// Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Draftlight server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
