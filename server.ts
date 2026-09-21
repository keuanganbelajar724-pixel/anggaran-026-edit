import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

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

  // Dedicated Pejabat Perbendaharaan Satker endpoints for robust cross-environment sync
  let inMemoryPejabatPerbendaharaan: any[] = [];
  try {
    const pejabatPath = path.join(process.cwd(), 'pejabat_perbendaharaan_generated.json');
    if (fs.existsSync(pejabatPath)) {
      inMemoryPejabatPerbendaharaan = JSON.parse(fs.readFileSync(pejabatPath, 'utf8'));
    }
  } catch (e) {
    console.warn('Could not load pejabat_perbendaharaan_generated.json on server start:', e);
  }

  app.get('/api/data/pejabat_perbendaharaan', (_req, res) => {
    res.json({
      status: 'ok',
      count: inMemoryPejabatPerbendaharaan.length,
      list: inMemoryPejabatPerbendaharaan,
    });
  });

  app.post('/api/data/pejabat_perbendaharaan', (req, res) => {
    try {
      const { list } = req.body || {};
      if (Array.isArray(list)) {
        inMemoryPejabatPerbendaharaan = list;
        const pejabatPath = path.join(process.cwd(), 'pejabat_perbendaharaan_generated.json');
        fs.writeFile(pejabatPath, JSON.stringify(list, null, 2), (err) => {
          if (err) console.warn('Server disk backup pejabat notice:', err);
        });
        return res.json({ status: 'ok', saved: list.length });
      }
      res.status(400).json({ status: 'error', message: 'Invalid list payload' });
    } catch (e: any) {
      res.status(500).json({ status: 'error', message: e?.message });
    }
  });

  // Dedicated Master Satkers endpoints
  let inMemoryMasterSatkers: any[] = [];
  try {
    const masterPath = path.join(process.cwd(), 'master_satkers_generated.json');
    if (fs.existsSync(masterPath)) {
      const parsed = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
      inMemoryMasterSatkers = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.list) ? parsed.list : []);
    }
  } catch (e) {
    console.warn('Could not load master_satkers_generated.json on server start:', e);
  }

  app.get('/api/data/master_satkers', (_req, res) => {
    res.json({
      status: 'ok',
      count: inMemoryMasterSatkers.length,
      list: inMemoryMasterSatkers,
    });
  });

  app.post('/api/data/master_satkers', (req, res) => {
    try {
      const { list } = req.body || {};
      if (Array.isArray(list)) {
        inMemoryMasterSatkers = list;
        const masterPath = path.join(process.cwd(), 'master_satkers_generated.json');
        fs.writeFile(masterPath, JSON.stringify(list, null, 2), (err) => {
          if (err) console.warn('Server disk backup master notice:', err);
        });
        return res.json({ status: 'ok', saved: list.length });
      }
      res.status(400).json({ status: 'error', message: 'Invalid list payload' });
    } catch (e: any) {
      res.status(500).json({ status: 'error', message: e?.message });
    }
  });

  // ==========================================
  // HAICSO BACKEND STORAGE & SECURE ENDPOINTS
  // ==========================================
  let inMemoryHaiCsoTickets: any[] = [];
  let inMemoryHaiCsoBatches: any[] = [];
  let inMemoryHaiCsoSettings: any = {
    id: 'haicso-settings-default',
    dashboard_code: 'HAICSO_DASHBOARD',
    dashboard_name: 'Monitoring Tiket HAICSO',
    is_active: true,
    target_selesai_persen: 95,
    catatan_kppn: 'Monitoring penyelesaian tiket layanan HAICSO Satker untuk pemenuhan IKU KPPN.',
    updated_by: 'Admin KPPN',
    updated_at: new Date().toISOString()
  };

  try {
    const ticketsPath = path.join(process.cwd(), 'haicso_tickets_generated.json');
    if (fs.existsSync(ticketsPath)) {
      const raw = JSON.parse(fs.readFileSync(ticketsPath, 'utf8'));
      inMemoryHaiCsoTickets = Array.isArray(raw) ? raw : (raw.list || []);
    }
    const batchesPath = path.join(process.cwd(), 'haicso_batches_generated.json');
    if (fs.existsSync(batchesPath)) {
      const rawB = JSON.parse(fs.readFileSync(batchesPath, 'utf8'));
      inMemoryHaiCsoBatches = Array.isArray(rawB) ? rawB : (rawB.list || []);
    }
    const settingsPath = path.join(process.cwd(), 'haicso_settings_generated.json');
    if (fs.existsSync(settingsPath)) {
      inMemoryHaiCsoSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }
  } catch (e) {
    console.warn('HAICSO storage initialization notice:', e);
  }

  // GET /api/haicso/tickets - Enforces backend role security
  app.get('/api/haicso/tickets', (req, res) => {
    try {
      const role = String(req.query.role || 'satker').toLowerCase();
      const year = req.query.year as string;
      const triwulan = req.query.triwulan as string;
      const status = req.query.status as string;
      const feedback = req.query.feedback as string;
      const email = req.query.email as string;
      const user = req.query.user as string;
      const satker = req.query.satker as string;
      const kodeSatker = req.query.kode_satker as string;
      const cso = req.query.cso as string;
      const search = req.query.search as string;

      let result = inMemoryHaiCsoTickets;

      // STRICT BACKEND SECURITY ENFORCEMENT FOR SATKER:
      // If user is not admin, ONLY return tickets needing Satker action:
      // - status 'Menunggu konfirmasi/respons Satker'
      // - OR status_feedback 'Belum ada feedback'
      if (role !== 'admin') {
        result = result.filter(t => {
          const s = (t.status || '').toLowerCase();
          const fb = (t.status_feedback || '').toLowerCase();
          const isMenungguSatker = s.includes('respons satker') || s.includes('respon satker');
          const isBelumFeedback = fb.includes('belum');
          return isMenungguSatker || isBelumFeedback;
        });
      } else {
        // Full filtering capabilities for Admin
        if (year && year !== 'ALL') {
          result = result.filter(t => String(t.tahun) === year);
        }
        if (triwulan && triwulan !== 'ALL') {
          const normalizeTW = (s: string) => {
            const clean = (s || '').toLowerCase().trim();
            if (clean.includes('iv') || clean.includes('4')) return '4';
            if (clean.includes('iii') || clean.includes('3')) return '3';
            if (clean.includes('ii') || clean.includes('2')) return '2';
            if (clean.includes('i') || clean.includes('1')) return '1';
            return clean;
          };
          const targetTW = normalizeTW(triwulan);
          result = result.filter(t => normalizeTW(t.triwulan) === targetTW);
        }
        if (status && status !== 'ALL') {
          const st = status.toLowerCase();
          result = result.filter(t => (t.status || '').toLowerCase().includes(st));
        }
        if (feedback && feedback !== 'ALL') {
          const fb = (t: any) => (t.status_feedback || '').toLowerCase();
          if (feedback === 'BELUM') result = result.filter(t => fb(t).includes('belum'));
          if (feedback === 'SUDAH') result = result.filter(t => fb(t).includes('sudah'));
        }
        if (email && email !== 'ALL') {
          result = result.filter(t => (t.email || '').toLowerCase() === email.toLowerCase());
        }
        if (user && user !== 'ALL') {
          result = result.filter(t => (t.nama_pengguna || '').trim() === user.trim());
        }
        if (satker && satker !== 'ALL') {
          result = result.filter(t => (t.nama_satker || '').trim() === satker.trim());
        }
        if (kodeSatker) {
          result = result.filter(t => (t.kode_satker || '').includes(kodeSatker.trim()));
        }
        if (cso && cso !== 'ALL') {
          result = result.filter(t => (t.cso || '').trim() === cso.trim());
        }
      }

      // Universal search query
      if (search) {
        const q = search.toLowerCase().trim();
        result = result.filter(t =>
          (t.nomor_referensi || '').toLowerCase().includes(q) ||
          (t.subjek || '').toLowerCase().includes(q) ||
          (t.nama_pengguna || '').toLowerCase().includes(q) ||
          (t.email || '').toLowerCase().includes(q) ||
          (t.nama_satker || '').toLowerCase().includes(q) ||
          (t.kode_satker || '').includes(q)
        );
      }

      res.json({
        status: 'ok',
        role,
        count: result.length,
        totalInStore: inMemoryHaiCsoTickets.length,
        tickets: result
      });
    } catch (e: any) {
      res.status(500).json({ status: 'error', message: e?.message });
    }
  });

  // POST /api/haicso/upload - Save and de-duplicate tickets
  app.post('/api/haicso/upload', (req, res) => {
    try {
      const { batch, tickets: incomingTickets } = req.body || {};
      if (!Array.isArray(incomingTickets)) {
        return res.status(400).json({ status: 'error', message: 'Tickets array required' });
      }

      // De-duplicate based on ticket_reference / id
      const ticketMap = new Map<string, any>();
      inMemoryHaiCsoTickets.forEach(t => {
        const key = (t.nomor_referensi || t.id).trim().toUpperCase();
        ticketMap.set(key, t);
      });

      let insertedCount = 0;
      let updatedCount = 0;

      incomingTickets.forEach(inc => {
        const key = (inc.nomor_referensi || inc.id).trim().toUpperCase();
        if (ticketMap.has(key)) {
          ticketMap.set(key, { ...ticketMap.get(key), ...inc, updated_at: new Date().toISOString() });
          updatedCount++;
        } else {
          ticketMap.set(key, inc);
          insertedCount++;
        }
      });

      inMemoryHaiCsoTickets = Array.from(ticketMap.values());
      if (batch) {
        inMemoryHaiCsoBatches = [batch, ...inMemoryHaiCsoBatches.filter(b => b.id !== batch.id)];
      }

      // Persist to disk
      const ticketsPath = path.join(process.cwd(), 'haicso_tickets_generated.json');
      fs.writeFile(ticketsPath, JSON.stringify(inMemoryHaiCsoTickets, null, 2), err => {
        if (err) console.warn('Disk backup haicso tickets error:', err);
      });

      const batchesPath = path.join(process.cwd(), 'haicso_batches_generated.json');
      fs.writeFile(batchesPath, JSON.stringify(inMemoryHaiCsoBatches, null, 2), err => {
        if (err) console.warn('Disk backup haicso batches error:', err);
      });

      res.json({
        status: 'ok',
        insertedCount,
        updatedCount,
        total: inMemoryHaiCsoTickets.length
      });
    } catch (e: any) {
      res.status(500).json({ status: 'error', message: e?.message });
    }
  });

  // GET /api/haicso/batches
  app.get('/api/haicso/batches', (_req, res) => {
    res.json({
      status: 'ok',
      count: inMemoryHaiCsoBatches.length,
      batches: inMemoryHaiCsoBatches
    });
  });

  // DELETE /api/haicso/batch/:id
  app.delete('/api/haicso/batch/:id', (req, res) => {
    try {
      const batchId = req.params.id;
      inMemoryHaiCsoBatches = inMemoryHaiCsoBatches.filter(b => b.id !== batchId);
      if (inMemoryHaiCsoBatches.length === 0) {
        inMemoryHaiCsoTickets = [];
      } else {
        inMemoryHaiCsoTickets = inMemoryHaiCsoTickets.filter(t => t.upload_batch_id !== batchId);
      }

      const ticketsPath = path.join(process.cwd(), 'haicso_tickets_generated.json');
      fs.writeFile(ticketsPath, JSON.stringify(inMemoryHaiCsoTickets, null, 2), () => {});

      const batchesPath = path.join(process.cwd(), 'haicso_batches_generated.json');
      fs.writeFile(batchesPath, JSON.stringify(inMemoryHaiCsoBatches, null, 2), () => {});

      res.json({
        status: 'ok',
        message: `Batch ${batchId} deleted`,
        remainingBatches: inMemoryHaiCsoBatches.length,
        remainingTickets: inMemoryHaiCsoTickets.length
      });
    } catch (e: any) {
      res.status(500).json({ status: 'error', message: e?.message });
    }
  });

  // DELETE /api/haicso/all - Kosongkan database HAICSO total untuk upload data asli
  app.delete('/api/haicso/all', (_req, res) => {
    try {
      inMemoryHaiCsoBatches = [];
      inMemoryHaiCsoTickets = [];

      const ticketsPath = path.join(process.cwd(), 'haicso_tickets_generated.json');
      fs.writeFile(ticketsPath, JSON.stringify([], null, 2), () => {});

      const batchesPath = path.join(process.cwd(), 'haicso_batches_generated.json');
      fs.writeFile(batchesPath, JSON.stringify([], null, 2), () => {});

      res.json({ status: 'ok', message: 'Seluruh data HAICSO berhasil dikosongkan' });
    } catch (e: any) {
      res.status(500).json({ status: 'error', message: e?.message });
    }
  });

  // GET /api/haicso/settings
  app.get('/api/haicso/settings', (_req, res) => {
    res.json({
      status: 'ok',
      settings: inMemoryHaiCsoSettings
    });
  });

  // POST /api/haicso/settings
  app.post('/api/haicso/settings', (req, res) => {
    try {
      const body = req.body || {};
      inMemoryHaiCsoSettings = {
        ...inMemoryHaiCsoSettings,
        ...body,
        updated_at: new Date().toISOString()
      };

      const settingsPath = path.join(process.cwd(), 'haicso_settings_generated.json');
      fs.writeFile(settingsPath, JSON.stringify(inMemoryHaiCsoSettings, null, 2), err => {
        if (err) console.warn('Disk backup haicso settings error:', err);
      });

      res.json({ status: 'ok', settings: inMemoryHaiCsoSettings });
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
