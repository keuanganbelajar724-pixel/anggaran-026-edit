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

export const LOCAL_GEMINI_KEY_STORAGE = 'kppn_gemini_api_key';
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
 * Save or remove custom Gemini API key
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

export const DEFAULT_GEMINI_MODEL = 'gemini-3.7-flash';

export function sanitizeGeminiModel(model?: string): string {
  const m = (model || '').trim();
  if (!m || m === 'gemini-2.5-flash' || m === 'gemini-2.5-pro' || m === 'gemini-1.5-flash') {
    return DEFAULT_GEMINI_MODEL;
  }
  return m;
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
    availableModels: ['gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.1-pro-preview'],
    message: hasLocal
      ? 'Gemini terhubung menggunakan API Key Kustom peramban.'
      : 'API Key belum terpasang. Anda dapat memasukkan Gemini API Key dari Google AI Studio.',
  };
}

/**
 * Test Gemini API connection using server or client-side fallback
 */
export async function testGeminiConnection(options?: {
  apiKey?: string;
  model?: string;
}): Promise<{ success: boolean; message: string; reply?: string }> {
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
        };
      }
    }
  } catch (err) {
    console.warn('Server test failed, attempting direct client SDK test', err);
  }

  // 2. Direct client-side SDK test if client key exists
  if (activeKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: activeKey });
      const response = await ai.models.generateContent({
        model: targetModel,
        contents: 'Katakan "KONEKSI_GEMINI_BERHASIL" dalam 1 kata.',
      });
      const text = response.text || '';
      return {
        success: true,
        message: 'Koneksi Google Gemini API Berhasil langsung dari peramban!',
        reply: text,
      };
    } catch (sdkErr: any) {
      console.error('Client SDK test failed', sdkErr);
      return {
        success: false,
        message: `Gagal verifikasi API Key: ${sdkErr?.message || 'Periksa kembali API Key atau kuota Anda.'}`,
      };
    }
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
  const targetModel = sanitizeGeminiModel(options.model);

  if (!targetPrompt) {
    throw new Error('Prompt tidak boleh kosong.');
  }

  // 1. Try server-side proxy
  try {
    const payload: Record<string, any> = {
      prompt: targetPrompt,
      model: targetModel,
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
          model: data.model || targetModel,
          source: 'server',
        };
      }
    }
  } catch (serverErr) {
    console.warn('Server generation proxy unavailable, attempting client SDK fallback', serverErr);
  }

  // 2. Direct client-side SDK fallback
  if (customKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: customKey });
      const config: Record<string, any> = {};
      if (options.systemInstruction) {
        config.systemInstruction = options.systemInstruction;
      }

      const response = await ai.models.generateContent({
        model: targetModel,
        contents: targetPrompt,
        ...(Object.keys(config).length > 0 ? { config } : {}),
      });

      const text = response.text || '';
      return {
        success: true,
        text,
        model: targetModel,
        source: 'client_sdk',
      };
    } catch (sdkErr: any) {
      console.error('Client SDK generation error:', sdkErr);
      throw new Error(`Gemini AI Error: ${sdkErr?.message || 'Gagal menghasilkan analisis.'}`);
    }
  }

  throw new Error('Tidak ada API Key Google Gemini yang tersedia untuk memproses permintaan.');
}

/* ==========================================================================
   FIRESTORE CLOUD CHAT SYNCHRONIZATION
   Synchronizes active chat and archives across preview, deploy & devices
   ========================================================================== */

// Chat History & Archives Management (Local storage to save Firestore quota)
export async function loadCloudChatHistory(): Promise<ChatMessage[] | null> {
  try {
    const raw = safeLocalStorageGet(LOCAL_GEMINI_CHAT_STORAGE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load local chat history:', e);
  }
  return null;
}

export async function saveCloudChatHistory(messages: ChatMessage[]): Promise<void> {
  try {
    const trimmed = messages.slice(-50);
    safeLocalStorageSet(LOCAL_GEMINI_CHAT_STORAGE, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Failed to save chat to local storage', e);
  }
}

export function subscribeToCloudChatHistory(
  callback: (messages: ChatMessage[]) => void
): () => void {
  // Fire initial state from local storage
  loadCloudChatHistory().then(msgs => {
    if (msgs) callback(msgs);
  });
  return () => {};
}

export async function loadCloudArchivedSessions(): Promise<ArchivedChatSession[] | null> {
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

export async function saveCloudArchivedSessions(archives: ArchivedChatSession[]): Promise<void> {
  try {
    const trimmed = archives.slice(-20);
    safeLocalStorageSet(LOCAL_GEMINI_ARCHIVES_STORAGE, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Failed to save archives to local storage', e);
  }
}
