/**
 * Client-Side Gemini Service Proxy
 * Communicates with the Full-Stack server (/api/gemini/*) to ensure secure,
 * environment-backed, and seamless AI operations across both Google AI Studio
 * development preview and deployed Cloud Run environments.
 */

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
}

export interface GeminiServerStatus {
  connected: boolean;
  hasServerKey: boolean;
  defaultModel: string;
  availableModels: string[];
  message: string;
}

export const LOCAL_GEMINI_KEY_STORAGE = 'kppn_gemini_api_key';

export function getClientStoredApiKey(): string {
  try {
    return localStorage.getItem(LOCAL_GEMINI_KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

export function saveClientStoredApiKey(key: string): void {
  try {
    if (!key || !key.trim()) {
      localStorage.removeItem(LOCAL_GEMINI_KEY_STORAGE);
    } else {
      localStorage.setItem(LOCAL_GEMINI_KEY_STORAGE, key.trim());
    }
  } catch (e) {
    console.warn('Failed to save Gemini API key in localStorage', e);
  }
}

/**
 * Check backend Gemini connection and availability of server-side GEMINI_API_KEY
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
    console.warn('Failed to query /api/gemini/status', e);
  }
  return {
    connected: false,
    hasServerKey: false,
    defaultModel: 'gemini-2.5-flash',
    availableModels: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3.7-flash'],
    message: 'Server offline atau belum terhubung.',
  };
}

/**
 * Test Gemini API connection using server or custom user key
 */
export async function testGeminiConnection(options?: {
  apiKey?: string;
  model?: string;
}): Promise<{ success: boolean; message: string; reply?: string }> {
  try {
    const customKey = options?.apiKey?.trim() || getClientStoredApiKey();
    const res = await fetch('/api/gemini/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: customKey || undefined,
        model: options?.model || 'gemini-2.5-flash',
      }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return {
        success: true,
        message: data.message || 'Koneksi ke Google Gemini AI Berhasil!',
        reply: data.reply,
      };
    } else {
      return {
        success: false,
        message: data.error || 'Tes koneksi gagal. Periksa kembali API Key atau kuota Anda.',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Gagal menghubungi server endpoint /api/gemini/test',
    };
  }
}

/**
 * Call Gemini AI text generation via full-stack server proxy
 */
export async function generateGeminiContent(
  options: GeminiGenerateOptions
): Promise<GeminiGenerateResponse> {
  const customKey = options.apiKey?.trim() || getClientStoredApiKey();
  const targetPrompt = options.prompt || options.contents || '';

  if (!targetPrompt) {
    throw new Error('Prompt tidak boleh kosong.');
  }

  const payload: Record<string, any> = {
    prompt: targetPrompt,
    model: options.model || 'gemini-2.5-flash',
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

  const data = await res.json();

  if (!res.ok || !data.success) {
    const errorMessage = data?.error || `Server error (${res.status}): Gagal memproses permintaan Gemini AI.`;
    throw new Error(errorMessage);
  }

  return {
    success: true,
    text: data.text || '',
    model: data.model || options.model,
  };
}
