export interface LyricLine {
  time: number; // seconds
  text: string;
}

interface CachedLyrics {
  synced: LyricLine[] | null;
  plain: string | null;
}

// In-memory cache keyed by song ID (capped at 100 entries, evicts oldest)
const MAX_CACHE_SIZE = 100;
const cache = new Map<string, CachedLyrics>();

const cacheSet = (key: string, value: CachedLyrics) => {
  if (cache.size >= MAX_CACHE_SIZE) {
    // Delete the oldest entry (first key in Map iteration order)
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, value);
};

/**
 * Clean YouTube video title to extract just the song name.
 */
const cleanTitle = (title: string): string => {
  let clean = title;
  clean = clean.replace(/[\(\[]\s*(official\s*(music\s*)?video|official\s*audio|lyric\s*video|lyrics?|audio|visualizer|hd|hq|mv|ft\.?.*?|feat\.?.*?|music\s*video|video\s*oficial)\s*[\)\]]/gi, '');
  clean = clean.replace(/\s*\|.*$/, '');
  clean = clean.replace(/^.+?\s*[-–—]\s*/, '');
  clean = clean.replace(/[\(\[]\s*[\)\]]/g, '');
  clean = clean.replace(/\s+/g, ' ').trim();
  return clean || title;
};

/**
 * Clean artist/channel name for better matching.
 */
const cleanArtist = (artist: string): string => {
  let clean = artist;
  clean = clean.replace(/\s*[-–]\s*Topic$/i, '');
  clean = clean.replace(/VEVO$/i, '');
  clean = clean.replace(/\s*(Official|Music|Records|Entertainment)\s*$/i, '');
  return clean.trim() || artist;
};

/**
 * Parse LRC format lyrics into timestamped lines.
 * Format: [MM:SS.CC] lyric text
 */
export const parseLRC = (lrc: string): LyricLine[] => {
  const lines: LyricLine[] = [];
  const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]\s*(.*)/;

  for (const rawLine of lrc.split('\n')) {
    const match = rawLine.match(regex);
    if (!match) continue;

    const min = match[1] || '0';
    const sec = match[2] || '0';
    const ms = match[3] || '0';
    const text = match[4] || '';
    const time = parseInt(min) * 60 + parseInt(sec) + parseInt(ms.padEnd(3, '0')) / 1000;

    if (text.trim()) {
      lines.push({ time, text: text.trim() });
    }
  }

  return lines.sort((a, b) => a.time - b.time);
};

/**
 * Fetch plain lyrics from lyrics.ovh (free, no auth, works from any network).
 */
const fetchFromLyricsOvh = async (
  cleanedTitle: string,
  cleanedArtist: string
): Promise<CachedLyrics> => {
  const result: CachedLyrics = { synced: null, plain: null };

  const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(cleanedArtist)}/${encodeURIComponent(cleanedTitle)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, { signal: controller.signal });

    if (res.ok) {
      const data = (await res.json()) as { lyrics?: string };
      if (data.lyrics && typeof data.lyrics === 'string' && data.lyrics.trim()) {
        let lyrics = data.lyrics.trim();
        lyrics = lyrics.replace(/^Paroles de la chanson .+ par .+\n*/i, '');
        result.plain = lyrics.trim();
      }
    }
  } finally {
    clearTimeout(timeout);
  }

  return result;
};

/**
 * Fetch synced lyrics from LRCLIB using curl subprocess
 * (Bun's fetch can't connect to lrclib.net due to TLS/network issues).
 */
const fetchFromLRCLib = async (
  cleanedTitle: string,
  cleanedArtist: string,
  durationSec: number
): Promise<CachedLyrics> => {
  const result: CachedLyrics = { synced: null, plain: null };
  const { spawn } = await import('child_process');

  const curlFetch = (url: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      let settled = false;
      const proc = spawn('curl', ['-s', '-k', '-L', '--max-time', '5', url]);
      let stdout = '';

      // Safety timeout: kill curl if Promise hasn't settled after 8s
      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          try { proc.kill('SIGTERM'); } catch { /* process may already be dead */ }
          reject(new Error('curl timeout'));
        }
      }, 8000);

      proc.stdout.on('data', (d: Buffer) => { stdout += d.toString(); });
      proc.on('close', (code: number | null) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        if (code !== 0 || !stdout.trim()) { reject(new Error('curl fail')); return; }
        try {
          const parsed = JSON.parse(stdout);
          // LRCLIB returns error objects like {"code":404,"name":"NotFound"}
          if (parsed && parsed.code && parsed.code >= 400) {
            reject(new Error(`API error ${parsed.code}`));
            return;
          }
          resolve(parsed);
        } catch { reject(new Error('json parse failed')); }
      });
      proc.on('error', (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        reject(err);
      });
    });
  };

  const fillResult = (data: any) => {
    if (!data || typeof data !== 'object') return;
    if (typeof data.syncedLyrics === 'string' && data.syncedLyrics.trim()) {
      result.synced = parseLRC(data.syncedLyrics);
    }
    if (typeof data.plainLyrics === 'string' && data.plainLyrics.trim()) {
      result.plain = data.plainLyrics;
    }
  };

  // 1. Exact match
  try {
    const params = new URLSearchParams({
      track_name: cleanedTitle,
      artist_name: cleanedArtist,
      duration: String(Math.round(durationSec)),
    });
    const data = await curlFetch(`https://lrclib.net/api/get?${params}`);
    fillResult(data);
  } catch {}

  // 2. Search
  if (!result.synced && !result.plain) {
    try {
      const params = new URLSearchParams({ q: `${cleanedTitle} ${cleanedArtist}` });
      const results = await curlFetch(`https://lrclib.net/api/search?${params}`);
      if (Array.isArray(results) && results[0]) fillResult(results[0]);
    } catch {}
  }

  return result;
};

/**
 * Fetch lyrics using multiple providers with fallback.
 * Order: LRCLIB (synced, via curl) -> lyrics.ovh (plain text, via fetch)
 */
export const fetchLyrics = async (
  title: string,
  artist: string,
  durationSec: number,
  songId: string
): Promise<CachedLyrics> => {
  const noLyrics: CachedLyrics = { synced: null, plain: null };

  try {
    const cached = cache.get(songId);
    if (cached) return cached;

    const cleanedTitle = cleanTitle(title);
    const cleanedArtist = cleanArtist(artist);

    let result: CachedLyrics = { synced: null, plain: null };

    // Try LRCLIB first (may fail if blocked by network)
    try {
      result = await fetchFromLRCLib(cleanedTitle, cleanedArtist, durationSec);
    } catch {}

    // Fallback to lyrics.ovh for plain text
    if (!result.synced && !result.plain) {
      try {
        result = await fetchFromLyricsOvh(cleanedTitle, cleanedArtist);
      } catch {}
    }

    cacheSet(songId, result);
    return result;
  } catch {
    // Never crash the app over lyrics
    return noLyrics;
  }
};

/**
 * Find the active lyric line index for a given time.
 */
export const getActiveLyricIndex = (lyrics: LyricLine[], currentTime: number): number => {
  let index = -1;
  for (let i = 0; i < lyrics.length; i++) {
    const line = lyrics[i];
    if (line && line.time <= currentTime) {
      index = i;
    } else {
      break;
    }
  }
  return index;
};

/**
 * Clear the lyrics cache (e.g., on app reset).
 */
export const clearLyricsCache = () => {
  cache.clear();
};
