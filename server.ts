import express from 'express';
import path from 'path';
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

  // Gemini Status endpoint
  app.get('/api/gemini/status', (_req, res) => {
    const hasServerKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
    res.json({
      connected: hasServerKey,
      hasServerKey,
      defaultModel: 'gemini-2.5-flash',
      availableModels: [
        'gemini-2.5-flash',
        'gemini-2.5-pro',
        'gemini-3.7-flash',
      ],
      message: hasServerKey
        ? 'Gemini AI terhubung otomatis melalui Server Cloud.'
        : 'Server siap menerima konfigurasi API Key.',
    });
  });

  // Gemini Test Connection endpoint
  app.post('/api/gemini/test', async (req, res) => {
    try {
      const { apiKey, model } = req.body || {};
      const ai = getGeminiClient(apiKey);
      const targetModel = model || 'gemini-2.5-flash';

      const response = await ai.models.generateContent({
        model: targetModel,
        contents: 'Katakan "KONEKSI_GEMINI_BERHASIL" dalam 1 kata.',
      });

      const reply = response.text || '';
      return res.json({
        success: true,
        reply,
        model: targetModel,
        message: 'Koneksi ke Google Gemini AI Berhasil!',
      });
    } catch (err: any) {
      console.error('Gemini test connection error:', err?.message || err);
      return res.status(400).json({
        success: false,
        error: err?.message || 'Gagal menghubungi Google Gemini AI.',
      });
    }
  });

  // Gemini Text Generation endpoint
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
      const targetModel = model || 'gemini-2.5-flash';

      const config: Record<string, any> = {};
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }

      const response = await ai.models.generateContent({
        model: targetModel,
        contents: targetPrompt,
        ...(Object.keys(config).length > 0 ? { config } : {}),
      });

      const text = response.text || '';
      return res.json({
        success: true,
        text,
        model: targetModel,
      });
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
