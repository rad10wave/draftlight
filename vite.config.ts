import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, Plugin} from 'vite';
import { getGeminiClient, generateFallbackFloorPlan, isBlockedHost } from './src/server/api';

function apiPlugin(): Plugin {
  return {
    name: 'draftlight-api-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        if (req.url === '/api/health' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 'ok', mode: 'vite-dev' }));
          return;
        }

        if (req.url === '/api/generate' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', async () => {
            try {
              const { prompt } = JSON.parse(body || '{}');
              if (!prompt || typeof prompt !== 'string') {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Prompt is required' }));
                return;
              }

              const ai = getGeminiClient();
              if (ai) {
                try {
                  const systemPrompt = `You are Draftlight AI Draftsperson, an expert architectural designer.
Given a floor plan description, return a realistic, scaled residential floor plan as JSON.
Coordinates (x, y, width, depth) must be in METERS.
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
                    contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nUser description: "${prompt}"` }] }],
                    generationConfig: { responseMimeType: 'application/json' },
                  } as any);

                  if (response.text) {
                    const parsed = JSON.parse(response.text);
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(parsed));
                    return;
                  }
                } catch (geminiErr) {
                  console.warn('Gemini API call fell back to synthesis:', geminiErr);
                }
              }

              // Fallback synthesis
              const fallback = generateFallbackFloorPlan(prompt);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(fallback));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message || 'Internal error' }));
            }
          });
          return;
        }

        if (req.url === '/api/proxy-image' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', async () => {
            try {
              const { url } = JSON.parse(body || '{}');
              if (!url || typeof url !== 'string' || !url.startsWith('https://')) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'URL must start with https://' }));
                return;
              }

              const parsedUrl = new URL(url);
              if (isBlockedHost(parsedUrl.hostname)) {
                res.statusCode = 403;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Host blocked for security reasons' }));
                return;
              }

              const fetchResponse = await fetch(url, { headers: { 'User-Agent': 'Draftlight-App/1.0' } });
              if (!fetchResponse.ok) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Failed to fetch external image' }));
                return;
              }

              const contentType = fetchResponse.headers.get('content-type') || 'image/png';
              const buffer = Buffer.from(await fetchResponse.arrayBuffer());
              const base64 = buffer.toString('base64');
              const dataUri = `data:${contentType};base64,${base64}`;

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ dataUri, mimeType: contentType }));
            } catch (err: any) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message || 'Unable to proxy image' }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

// LINT.IfChange(aistudio_media_plugin)
function aistudioMediaPlugin(): Plugin {
  return {
    name: 'vite-plugin-aistudio-media',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/assets/aistudio/')) {
          const rawPath = req.url.split('?')[0].split('#')[0];
          try {
            const decodedPath = decodeURIComponent(rawPath);
            const relativePath = decodedPath.replace(/^\//, '');
            const aistudioDir = path.resolve(
              __dirname,
              'public',
              'assets',
              'aistudio',
            );
            const filePath = path.resolve(__dirname, 'public', relativePath);
            if (
              filePath.startsWith(aistudioDir + path.sep) &&
              fs.existsSync(filePath) &&
              fs.statSync(filePath).isFile()
            ) {
              const ext = path.extname(filePath).toLowerCase();
              const mimeMap: Record<string, string> = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.svg': 'image/svg+xml',
                '.bmp': 'image/bmp',
                '.ico': 'image/x-icon',
                '.mp4': 'video/mp4',
                '.webm': 'video/webm',
                '.ogv': 'video/ogg',
                '.mp3': 'audio/mpeg',
                '.wav': 'audio/wav',
                '.ogg': 'audio/ogg',
                '.pdf': 'application/pdf',
              };
              res.setHeader(
                'Content-Type',
                mimeMap[ext] || 'application/octet-stream',
              );
              res.setHeader('Cache-Control', 'no-cache');
              fs.createReadStream(filePath).pipe(res);
              return;
            }
          } catch {
            // Fall through if URI decoding or file access fails
          }
        }
        next();
      });
    },
  };
}
// LINT.ThenChange(//depot/google3/java/com/google/alkali/boq/makersuite/applet_dev_service/templates/initializers/react_theme/vite.config.ts:aistudio_media_plugin)

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), aistudioMediaPlugin(), apiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
