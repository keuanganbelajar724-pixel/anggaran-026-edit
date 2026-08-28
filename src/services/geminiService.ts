/**
 * Gemini AI Service & Real-time Cloud Synchronization
 * Supports dual-mode:
 * 1. Server-side proxy (/api/gemini/*) for secure Cloud Run deployment
 * 2. Direct client-side SDK (@google/genai) fallback for static builds or client-keyed sessions
 * 3. Real-time Firestore sync for chat history & archives across all devices and URLs
 */

import { GoogleGenAI } from '@google/genai';
import { ChatMessage, ArchivedChatSession } from '../types';
import { safeLocalStorageSet, safeLocalStorageGet, safeLocalStorageRemove } from '../utils/safeStorage';
import { db, doc, getDoc, setDoc, onSnapshot } from '../lib/firebase';

export interface GeminiGenerateOptions {
  prompt?: string;
  contents?: string;
  model?: string;
  systemInstruction?: string;
  apiKey?: string;
}

export interface GeminiGenerateResponse {
  success: boolean;
  text: string;
  model?: string;
  error?: string;
  source?: 'server' | 'client_sdk';
}

export interface GeminiServerStatus {
  connected: boolean;
  hasServerKey: boolean;
  defaultModel: string;
  availableModels: string[];
  message: string;
}

export interface CloudGeminiConfig {
  apiKey: string;
  selectedModel: string;
  updatedAt?: string;
  updatedBy?: string;
}

export const LOCAL_GEMINI_KEY_STORAGE = 'kppn_gemini_api_key';
export const LOCAL_GEMINI_MODEL_STORAGE = 'kppn_gemini_selected_model';
export const LOCAL_GEMINI_CHAT_STORAGE = 'kppn_gemini_chat_history';
export const LOCAL_GEMINI_ARCHIVES_STORAGE = 'kppn_gemini_archived_sessions';

/**
 * Retrieve API key stored in local client browser storage or environment
 */
export function getClientStoredApiKey(): string {
  try {
    const local = safeLocalStorageGet(LOCAL_GEMINI_KEY_STORAGE);
    if (local && local.trim()) return local.trim();
    const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (envKey && typeof envKey === 'string' && envKey.trim()) return envKey.trim();
    return '';
  } catch {
    return '';
  }
}

/**
 * Save or remove custom Gemini API key locally and trigger cloud sync
 */
export function saveClientStoredApiKey(key: string): void {
  try {
    if (!key || !key.trim()) {
      safeLocalStorageRemove(LOCAL_GEMINI_KEY_STORAGE);
    } else {
      safeLocalStorageSet(LOCAL_GEMINI_KEY_STORAGE, key.trim());
    }
  } catch (e) {
    console.warn('Failed to save Gemini API key in localStorage', e);
  }
}

export const DEFAULT_GEMINI_MODEL = 'gemini-3.6-flash';

export const SUPPORTED_GEMINI_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-flash-latest',
  'gemini-3.1-pro-preview'
];

export function sanitizeGeminiModel(model?: string): string {
  const m = (model || '').trim();
  if (!m) return DEFAULT_GEMINI_MODEL;
  if (
    m.includes('2.5-flash') ||
    m.includes('2.0-flash') ||
    m.includes('1.5-flash') ||
    m.includes('gemini-pro') ||
    m.includes('2.5-pro')
  ) {
    return DEFAULT_GEMINI_MODEL;
  }
  return m;
}

/**
 * Load Gemini API Configuration from Cloud Firestore with localStorage fallback
 */
export async function loadCloudGeminiConfig(): Promise<CloudGeminiConfig> {
  let config: CloudGeminiConfig = {
    apiKey: getClientStoredApiKey(),
    selectedModel: sanitizeGeminiModel(safeLocalStorageGet(LOCAL_GEMINI_MODEL_STORAGE) || DEFAULT_GEMINI_MODEL)
  };

  try {
    const snap = await getDoc(doc(db, 'settings', 'gemini_config'));
    if (snap && typeof snap.exists === 'function' && snap.exists()) {
      const data = snap.data();
      if (data) {
        if (typeof data.apiKey === 'string' && data.apiKey.trim()) {
          config.apiKey = data.apiKey.trim();
          saveClientStoredApiKey(config.apiKey);
        }
        if (data.selectedModel) {
          config.selectedModel = sanitizeGeminiModel(data.selectedModel);
          safeLocalStorageSet(LOCAL_GEMINI_MODEL_STORAGE, config.selectedModel);
        }
        config.updatedAt = data.updatedAt;
        config.updatedBy = data.updatedBy;
      }
    }
  } catch (e) {
    console.warn('Notice loading cloud gemini config (using local):', e);
  }

  return config;
}

/**
 * Save Gemini Configuration to Cloud Firestore and sync across all clients/devices
 */
export async function saveCloudGeminiConfig(config: Partial<CloudGeminiConfig>): Promise<void> {
  const sanitizedModel = sanitizeGeminiModel(config.selectedModel);
  const cleanKey = (config.apiKey !== undefined ? config.apiKey : getClientStoredApiKey()).trim();

  // 1. Update local storage
  saveClientStoredApiKey(cleanKey);
  if (sanitizedModel) {
    safeLocalStorageSet(LOCAL_GEMINI_MODEL_STORAGE, sanitizedModel);
  }

  // 2. Persist to Firestore Cloud Settings
  try {
    await setDoc(
      doc(db, 'settings', 'gemini_config'),
      {
        apiKey: cleanKey,
        selectedModel: sanitizedModel || DEFAULT_GEMINI_MODEL,
        updatedAt: new Date().toISOString(),
        updatedBy: 'Admin KPPN 026'
      },
      { merge: true }
    );
  } catch (e) {
    console.warn('Failed to save Gemini config to Firestore:', e);
  }
}

/**
 * Real-time subscription to Gemini API Key & Model changes across devices
 */
export function subscribeToCloudGeminiConfig(
  callback: (config: CloudGeminiConfig) => void
): () => void {
  try {
    const unsub = onSnapshot(
      doc(db, 'settings', 'gemini_config'),
      (snap: any) => {
        if (snap && typeof snap.exists === 'function' && snap.exists()) {
          const data = snap.data();
          if (data) {
            const cleanKey = typeof data.apiKey === 'string' ? data.apiKey.trim() : '';
            const cleanModel = sanitizeGeminiModel(data.selectedModel);

            if (cleanKey) {
              saveClientStoredApiKey(cleanKey);
            }
            if (cleanModel) {
              safeLocalStorageSet(LOCAL_GEMINI_MODEL_STORAGE, cleanModel);
            }

            callback({
              apiKey: cleanKey,
              selectedModel: cleanModel,
              updatedAt: data.updatedAt,
              updatedBy: data.updatedBy
            });
          }
        }
      },
      (err: any) => {
        console.warn('Gemini config snapshot error:', err);
      }
    );
    return unsub;
  } catch (e) {
    console.warn('Could not setup Firestore Gemini config snapshot listener', e);
    return () => {};
  }
}

/**
 * Check backend Gemini connection and server-side key availability
 */
export async function checkGeminiStatus(): Promise<GeminiServerStatus> {
  try {
    const res = await fetch('/api/gemini/status', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Backend /api/gemini/status not responding, will rely on client API key/SDK', e);
  }
  const hasLocal = Boolean(getClientStoredApiKey());
  return {
    connected: hasLocal,
    hasServerKey: false,
    defaultModel: DEFAULT_GEMINI_MODEL,
    availableModels: SUPPORTED_GEMINI_MODELS,
    message: hasLocal
      ? 'Gemini terhubung menggunakan API Key Kustom peramban.'
      : 'API Key belum terpasang. Anda dapat memasukkan Gemini API Key dari Google AI Studio.',
  };
}

/**
 * Test Gemini API connection using server or client-side fallback with multi-model cascade
 */
export async function testGeminiConnection(options?: {
  apiKey?: string;
  model?: string;
}): Promise<{ success: boolean; message: string; reply?: string; usedModel?: string; fallbackUsed?: boolean }> {
  const activeKey = options?.apiKey?.trim() || getClientStoredApiKey();
  const targetModel = sanitizeGeminiModel(options?.model);

  // 1. Try server endpoint first
  try {
    const res = await fetch('/api/gemini/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: activeKey || undefined,
        model: targetModel,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          success: true,
          message: data.message || 'Koneksi ke Google Gemini AI Berhasil!',
          reply: data.reply,
          usedModel: data.model,
          fallbackUsed: data.fallbackUsed,
        };
      }
    }
  } catch (err) {
    console.warn('Server test failed, attempting direct client SDK test', err);
  }

  // 2. Direct client-side SDK test if client key exists (with model fallback cascade)
  if (activeKey) {
    const candidateModels = [
      targetModel,
      ...SUPPORTED_GEMINI_MODELS.filter(m => m !== targetModel)
    ];

    let lastError: any = null;
    for (const modelToTry of candidateModels) {
      try {
        const ai = new GoogleGenAI({ apiKey: activeKey });
        const response = await ai.models.generateContent({
          model: modelToTry,
          contents: 'Katakan "KONEKSI_GEMINI_BERHASIL" dalam 1 kata.',
        });
        const text = response.text || '';
        const isFallback = modelToTry !== targetModel;
        return {
          success: true,
          message: isFallback
            ? `Koneksi Google Gemini API Berhasil! (Menggunakan model stabil ${modelToTry} karena ${targetModel} sedang mengalami antrean padat di server Google).`
            : 'Koneksi Google Gemini API Berhasil langsung dari peramban!',
          reply: text,
          usedModel: modelToTry,
          fallbackUsed: isFallback,
        };
      } catch (sdkErr: any) {
        lastError = sdkErr;
        console.warn(`Client SDK test model ${modelToTry} failed:`, sdkErr);
        const msg = (sdkErr?.message || '').toLowerCase();
        if (msg.includes('api_key_invalid') || msg.includes('api key not valid')) {
          break;
        }
      }
    }

    return {
      success: false,
      message: `Gagal verifikasi API Key: ${lastError?.message || 'Periksa kembali API Key atau kuota Anda.'}`,
    };
  }

  return {
    success: false,
    message: 'Belum ada API Key yang dikonfigurasi pada server maupun peramban.',
  };
}

/**
 * Main content generator: Uses server proxy first, then client-side GoogleGenAI SDK
 */
export async function generateGeminiContent(
  options: GeminiGenerateOptions
): Promise<GeminiGenerateResponse> {
  const customKey = options.apiKey?.trim() || getClientStoredApiKey();
  const targetPrompt = options.prompt || options.contents || '';
  const requestedModel = sanitizeGeminiModel(options.model);

  if (!targetPrompt) {
    throw new Error('Prompt tidak boleh kosong.');
  }

  // 1. Try server-side proxy
  try {
    const payload: Record<string, any> = {
      prompt: targetPrompt,
      model: requestedModel,
    };
    if (options.systemInstruction) {
      payload.systemInstruction = options.systemInstruction;
    }
    if (customKey) {
      payload.apiKey = customKey;
    }

    const res = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.text) {
        return {
          success: true,
          text: data.text,
          model: data.model || requestedModel,
          source: 'server',
        };
      }
    }
  } catch (serverErr) {
    console.warn('Server generation proxy unavailable, attempting client SDK fallback', serverErr);
  }

  // 2. Direct client-side SDK fallback with model cascade
  if (customKey) {
    const candidateModels = [
      requestedModel,
      ...SUPPORTED_GEMINI_MODELS.filter(m => m !== requestedModel)
    ];

    let lastError: any = null;
    for (const modelToTry of candidateModels) {
      try {
        const ai = new GoogleGenAI({ apiKey: customKey });
        const config: Record<string, any> = {};
        if (options.systemInstruction) {
          config.systemInstruction = options.systemInstruction;
        }

        const response = await ai.models.generateContent({
          model: modelToTry,
          contents: targetPrompt,
          ...(Object.keys(config).length > 0 ? { config } : {}),
        });

        const text = response.text || '';
        if (text) {
          return {
            success: true,
            text,
            model: modelToTry,
            source: 'client_sdk',
          };
        }
      } catch (sdkErr: any) {
        lastError = sdkErr;
        console.warn(`Client SDK model ${modelToTry} failed:`, sdkErr);
        const msg = (sdkErr?.message || '').toLowerCase();
        if (msg.includes('api_key_invalid') || msg.includes('api key not valid')) {
          break;
        }
      }
    }

    throw new Error(`Gemini AI Error: ${lastError?.message || 'Gagal menghasilkan analisis.'}`);
  }

  throw new Error('Tidak ada API Key Google Gemini yang tersedia untuk memproses permintaan.');
}

/* ==========================================================================
   FIRESTORE CLOUD CHAT SYNCHRONIZATION
   Synchronizes active chat and archives across preview, deploy & devices
   ========================================================================== */

/**
 * Load Active Chat History from Cloud Firestore with localStorage fallback
 */
export async function loadCloudChatHistory(): Promise<ChatMessage[] | null> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'gemini_chat'));
    if (snap && typeof snap.exists === 'function' && snap.exists()) {
      const data = snap.data();
      if (data && Array.isArray(data.chatMessages) && data.chatMessages.length > 0) {
        safeLocalStorageSet(LOCAL_GEMINI_CHAT_STORAGE, JSON.stringify(data.chatMessages));
        return data.chatMessages;
      }
    }
  } catch (e) {
    console.warn('Notice loading cloud chat from Firestore (using local fallback):', e);
  }

  // Fallback to local storage
  try {
    const raw = safeLocalStorageGet(LOCAL_GEMINI_CHAT_STORAGE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse local chat history:', e);
  }
  return null;
}

/**
 * Save Active Chat History to Firestore and localStorage
 */
export async function saveCloudChatHistory(messages: ChatMessage[]): Promise<void> {
  const trimmed = messages.slice(-50);
  
  // 1. Save locally
  try {
    safeLocalStorageSet(LOCAL_GEMINI_CHAT_STORAGE, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Failed to save chat to local storage', e);
  }

  // 2. Persist to Firestore
  try {
    await setDoc(
      doc(db, 'settings', 'gemini_chat'),
      {
        chatMessages: trimmed,
        updatedAt: new Date().toISOString(),
        lastMessageTimestamp: trimmed[trimmed.length - 1]?.timestamp || ''
      },
      { merge: true }
    );
  } catch (e) {
    console.warn('Failed to sync chat history to Firestore:', e);
  }
}

/**
 * Real-time subscription to Cloud Chat History
 */
export function subscribeToCloudChatHistory(
  callback: (messages: ChatMessage[]) => void
): () => void {
  try {
    const unsub = onSnapshot(
      doc(db, 'settings', 'gemini_chat'),
      (snap: any) => {
        if (snap && typeof snap.exists === 'function' && snap.exists()) {
          const data = snap.data();
          if (data && Array.isArray(data.chatMessages) && data.chatMessages.length > 0) {
            safeLocalStorageSet(LOCAL_GEMINI_CHAT_STORAGE, JSON.stringify(data.chatMessages));
            callback(data.chatMessages);
          }
        }
      },
      (err: any) => {
        console.warn('Notice on chat history snapshot error:', err);
      }
    );
    return unsub;
  } catch (e) {
    console.warn('Could not setup Firestore chat history listener', e);
    return () => {};
  }
}

/**
 * Load Archived Chat Sessions from Firestore with localStorage fallback
 */
export async function loadCloudArchivedSessions(): Promise<ArchivedChatSession[] | null> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'gemini_archives'));
    if (snap && typeof snap.exists === 'function' && snap.exists()) {
      const data = snap.data();
      if (data && Array.isArray(data.archivedSessions) && data.archivedSessions.length > 0) {
        safeLocalStorageSet(LOCAL_GEMINI_ARCHIVES_STORAGE, JSON.stringify(data.archivedSessions));
        return data.archivedSessions;
      }
    }
  } catch (e) {
    console.warn('Notice loading archived sessions from Firestore (using local fallback):', e);
  }

  try {
    const raw = safeLocalStorageGet(LOCAL_GEMINI_ARCHIVES_STORAGE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load archives from local storage:', e);
  }
  return null;
}

/**
 * Save Archived Chat Sessions to Firestore and localStorage
 */
export async function saveCloudArchivedSessions(archives: ArchivedChatSession[]): Promise<void> {
  const trimmed = archives.slice(-30);

  // 1. Save locally
  try {
    safeLocalStorageSet(LOCAL_GEMINI_ARCHIVES_STORAGE, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Failed to save archives to local storage', e);
  }

  // 2. Persist to Firestore
  try {
    await setDoc(
      doc(db, 'settings', 'gemini_archives'),
      {
        archivedSessions: trimmed,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (e) {
    console.warn('Failed to sync archives to Firestore:', e);
  }
}

/**
 * Real-time subscription to Cloud Archived Sessions
 */
export function subscribeToCloudArchivedSessions(
  callback: (archives: ArchivedChatSession[]) => void
): () => void {
  try {
    const unsub = onSnapshot(
      doc(db, 'settings', 'gemini_archives'),
      (snap: any) => {
        if (snap && typeof snap.exists === 'function' && snap.exists()) {
          const data = snap.data();
          if (data && Array.isArray(data.archivedSessions)) {
            safeLocalStorageSet(LOCAL_GEMINI_ARCHIVES_STORAGE, JSON.stringify(data.archivedSessions));
            callback(data.archivedSessions);
          }
        }
      },
      (err: any) => {
        console.warn('Notice on archived sessions snapshot error:', err);
      }
    );
    return unsub;
  } catch (e) {
    console.warn('Could not setup Firestore archives listener', e);
    return () => {};
  }
}
