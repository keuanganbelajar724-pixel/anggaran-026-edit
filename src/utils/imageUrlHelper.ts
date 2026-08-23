/**
 * Helper utility to handle and normalize image URLs from various providers,
 * especially Google Drive sharing links, Dropbox, and other cloud storages.
 */

/**
 * Extracts the Google Drive file ID from various URL formats:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 * - https://drive.google.com/uc?export=view&id=FILE_ID
 * - https://docs.google.com/file/d/FILE_ID/...
 */
export function extractGoogleDriveFileId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Pattern 1: /file/d/FILE_ID
  const matchFileD = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (matchFileD && matchFileD[1]) {
    return matchFileD[1];
  }

  // Pattern 2: id=FILE_ID parameter
  const matchIdParam = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
  if (matchIdParam && matchIdParam[1]) {
    return matchIdParam[1];
  }

  // Pattern 3: /d/FILE_ID
  const matchDirectD = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/i);
  if (matchDirectD && matchDirectD[1]) {
    return matchDirectD[1];
  }

  return null;
}

/**
 * Checks if a string is a Google Drive URL
 */
export function isGoogleDriveUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return /drive\.google\.com|docs\.google\.com|googleusercontent\.com/i.test(url);
}

/**
 * Normalizes an image URL so it can be directly embedded in an <img src="..." /> tag.
 * Automatically converts Google Drive share links to Google's high-speed CDN direct image URLs.
 */
export function normalizeImageUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // 1. Check if it's a Google Drive link
  if (isGoogleDriveUrl(trimmed)) {
    const fileId = extractGoogleDriveFileId(trimmed);
    if (fileId) {
      // Use lh3.googleusercontent.com/d/FILE_ID as primary high-res direct image embed
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
  }

  // 2. Check if it's a Dropbox link
  if (/dropbox\.com/i.test(trimmed)) {
    if (trimmed.includes('dl=0')) {
      return trimmed.replace('dl=0', 'raw=1');
    }
    if (!trimmed.includes('raw=1')) {
      const sep = trimmed.includes('?') ? '&' : '?';
      return `${trimmed}${sep}raw=1`;
    }
  }

  return trimmed;
}

/**
 * Gets a fallback URL if the primary direct URL fails (e.g. Google Drive thumbnail fallback)
 */
export function getAlternativeImageUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const fileId = extractGoogleDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1920`;
  }
  return null;
}
