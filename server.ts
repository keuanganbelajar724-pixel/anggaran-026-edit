import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '20mb' }));

  // Shared Gemini client helper with lazy initialization
  function getGeminiClient(customApiKey?: string): GoogleGenAI {
    const key = (customApiKey && customApiKey.trim()) || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is not set on the server and no custom API key was provided.');
    }
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      server: 'ANGKASA KPPN Semarang I Core Server',
    });
  });

  // Load initial baseline satkers if available
  let inMemorySatkers: any[] = [];
  try {
    const jsonPath = path.join(process.cwd(), 'satkers_generated.json');
    if (fs.existsSync(jsonPath)) {
      inMemorySatkers = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    }
  } catch (e) {
    console.warn('Could not load satkers_generated.json on server start:', e);
  }

  // High-availability satker data endpoints to safeguard against Firestore rate limits
  app.get('/api/data/satkers', (_req, res) => {
    res.json({
      status: 'ok',
      count: inMemorySatkers.length,
      list: inMemorySatkers,
    });
  });

  app.post('/api/data/satkers', (req, res) => {
    try {
      const { list } = req.body || {};
      if (Array.isArray(list) && list.length > 0) {
        inMemorySatkers = list;
        const jsonPath = path.join(process.cwd(), 'satkers_generated.json');
        fs.writeFile(jsonPath, JSON.stringify(list, null, 2), (err) => {
          if (err) console.warn('Server disk backup notice:', err);
        });
        return res.json({ status: 'ok', saved: list.length });
      }
      res.status(400).json({ status: 'error', message: 'Invalid list payload' });
    } catch (e: any) {
      res.status(500).json({ status: 'error', message: e?.message });
    }
  });

  // Global settings endpoints for cross-browser synchronization
  let inMemorySettings: any = null;
  try {
    const settingsPath = path.join(process.cwd(), 'settings_generated.json');
    if (fs.existsSync(settingsPath)) {
      inMemorySettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }
  } catch (e) {
    console.warn('Could not load settings_generated.json on server start:', e);
  }

  app.get('/api/data/settings', (_req, res) => {
    res.json({
      status: 'ok',
      settings: inMemorySettings,
    });
  });

  app.post('/api/data/settings', (req, res) => {
    try {
      const body = req.body || {};
      inMemorySettings = {
        ...(inMemorySettings || {}),
        ...body,
        updatedAt: new Date().toISOString(),
      };
      const settingsPath = path.join(process.cwd(), 'settings_generated.json');
      fs.writeFile(settingsPath, JSON.stringify(inMemorySettings, null, 2), (err) => {
        if (err) console.warn('Server disk backup settings notice:', err);
      });
      res.json({ status: 'ok', settings: inMemorySettings });
    } catch (e: any) {
      res.status(500).json({ status: 'error', message: e?.message });
    }
  });

  // Dedicated historical upload archive endpoints for robust fallback
  app.get('/api/data/historical_uploads', (_req, res) => {
    const list = inMemorySettings?.dashboardConfig?.historicalUploads || inMemorySettings?.historicalUploads || [];
    res.json({
      status: 'ok',
      count: Array.isArray(list) ? list.length : 0,
      list: Array.isArray(list) ? list : [],
    });
  });

  app.post('/api/data/historical_uploads', (req, res) => {
    try {
      const { list } = req.body || {};
      if (Array.isArray(list)) {
        inMemorySettings = {
          ...(inMemorySettings || {}),
          historicalUploads: list,
          dashboardConfig: {
            ...(inMemorySettings?.dashboardConfig || {}),
            historicalUploads: list,
          },
          updatedAt: new Date().toISOString(),
        };
        const settingsPath = path.join(process.cwd(), 'settings_generated.json');
        fs.writeFile(settingsPath, JSON.stringify(inMemorySettings, null, 2), (err) => {
          if (err) console.warn('Server disk backup historical uploads notice:', err);
        });
        return res.json({ status: 'ok', count: list.length });
      }
      res.status(400).json({ status: 'error', message: 'Invalid list payload' });
    } catch (e: any) {
      res.status(500).json({ status: 'error', message: e?.message });
    }
  });

  // Proxy image endpoint to safely serve Google Drive / external banner images without Referrer / iframe blocking
  app.get('/api/proxy-image', async (req, res) => {
    const rawUrl = req.query.url as string;
    if (!rawUrl) {
      return res.status(400).send('URL query parameter required');
    }
    try {
      let targetUrl = rawUrl;
      const driveMatch = rawUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/i) || rawUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/i) || rawUrl.match(/\/d\/([a-zA-Z0-9_-]+)/i);
      if (driveMatch && driveMatch[1]) {
        targetUrl = `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
      }

      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        }
      });

      if (!response.ok) {
        if (driveMatch && driveMatch[1]) {
          const fallbackRes = await fetch(`https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1920`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            }
          });
          if (fallbackRes.ok) {
            const buffer = await fallbackRes.arrayBuffer();
            const contentType = fallbackRes.headers.get('content-type') || 'image/jpeg';
            res.setHeader('Content-Type', contentType);
            res.setHeader('Cache-Control', 'public, max-age=86400');
            return res.send(Buffer.from(buffer));
          }
        }
        return res.status(response.status).send('Failed to fetch image');
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const buffer = await response.arrayBuffer();
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(Buffer.from(buffer));
    } catch (err: any) {
      console.warn('Proxy image error:', err);
      return res.status(500).send('Error proxying image');
    }
  });

  // Supported and fallback models according to official @google/genai specification
  const FALLBACK_MODELS = [
    'gemini-3.7-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-3.1-pro-preview',
  ];

  // Simple sleep helper for backoff
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Helper to normalize and sanitize model identifiers
  function normalizeModelName(inputModel?: string): string {
    const raw = (inputModel || '').trim();
    if (!raw) return 'gemini-3.7-flash';
    if (
      raw.includes('3.6-flash') ||
      raw.includes('2.5-flash') ||
      raw.includes('2.0-flash') ||
      raw.includes('1.5-flash') ||
      raw.includes('gemini-pro') ||
      raw.includes('2.5-pro')
    ) {
      return 'gemini-3.7-flash';
    }
    return raw;
  }

  // Gemini Status endpoint
  app.get('/api/gemini/status', (_req, res) => {
    const hasServerKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
    res.json({
      connected: hasServerKey,
      hasServerKey,
      defaultModel: 'gemini-3.7-flash',
      availableModels: FALLBACK_MODELS,
      message: hasServerKey
        ? 'Gemini AI terhubung otomatis melalui Server Cloud.'
        : 'Server siap menerima konfigurasi API Key.',
    });
  });

  // Gemini Test Connection endpoint with auto-fallback cascade
  app.post('/api/gemini/test', async (req, res) => {
    try {
      const { apiKey, model } = req.body || {};
      const ai = getGeminiClient(apiKey);
      const requestedModel = normalizeModelName(model);

      const candidateModels = [
        requestedModel,
        ...FALLBACK_MODELS.filter(m => m !== requestedModel)
      ];

      let lastError: any = null;
      for (const targetModel of candidateModels) {
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            if (attempt > 0) {
              await sleep(600);
            }
            const response = await ai.models.generateContent({
              model: targetModel,
              contents: 'Katakan "KONEKSI_GEMINI_BERHASIL" dalam 1 kata.',
            });

            const reply = response.text || '';
            const usedFallback = targetModel !== requestedModel;
            return res.json({
              success: true,
              reply,
              model: targetModel,
              fallbackUsed: usedFallback,
              message: usedFallback
                ? `Koneksi Google Gemini AI Berhasil! (Menggunakan model stabil ${targetModel} karena ${requestedModel} sedang padat antrean).`
                : 'Koneksi ke Google Gemini AI Berhasil & Valid!',
            });
          } catch (mErr: any) {
            lastError = mErr;
            console.warn(`Model ${targetModel} attempt ${attempt + 1} test error:`, mErr?.message || mErr);
            const msg = (mErr?.message || '').toLowerCase();
            if (msg.includes('api_key_invalid') || msg.includes('api key not valid')) {
              break;
            }
          }
        }
      }

      throw lastError || new Error('Semua model Gemini sedang tidak dapat dihubungi.');
    } catch (err: any) {
      console.error('Gemini test connection error:', err?.message || err);
      return res.status(400).json({
        success: false,
        error: err?.message || 'Gagal menghubungi Google Gemini AI. Pastikan API Key valid.',
      });
    }
  });

  // Gemini Text Generation endpoint with auto-fallback cascade
  app.post('/api/gemini/generate', async (req, res) => {
    try {
      const { prompt, contents, model, systemInstruction, apiKey } = req.body || {};
      const targetPrompt = prompt || contents;

      if (!targetPrompt) {
        return res.status(400).json({
          success: false,
          error: 'Prompt atau contents diperlukan.',
        });
      }

      const ai = getGeminiClient(apiKey);
      const requestedModel = normalizeModelName(model);

      const config: Record<string, any> = {};
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }

      const candidateModels = [
        requestedModel,
        ...FALLBACK_MODELS.filter(m => m !== requestedModel)
      ];

      let lastError: any = null;
      for (const targetModel of candidateModels) {
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            if (attempt > 0) {
              await sleep(600);
            }
            const response = await ai.models.generateContent({
              model: targetModel,
              contents: targetPrompt,
              ...(Object.keys(config).length > 0 ? { config } : {}),
            });

            const text = response.text || '';
            if (text) {
              return res.json({
                success: true,
                text,
                model: targetModel,
                fallbackUsed: targetModel !== requestedModel,
              });
            }
          } catch (mErr: any) {
            lastError = mErr;
            console.warn(`Model ${targetModel} attempt ${attempt + 1} generate error:`, mErr?.message || mErr);
            const msg = (mErr?.message || '').toLowerCase();
            if (msg.includes('api_key_invalid') || msg.includes('api key not valid')) {
              break;
            }
          }
        }
      }

      throw lastError || new Error('Gagal menghasilkan teks melalui Gemini AI.');
    } catch (err: any) {
      console.error('Gemini generation error:', err?.message || err);
      return res.status(500).json({
        success: false,
        error: err?.message || 'Terjadi kesalahan saat memproses permintaan Gemini AI.',
      });
    }
  });

  // Vite middleware in dev, static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ANGKASA KPPN Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
