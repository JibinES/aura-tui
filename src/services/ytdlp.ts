import { spawn, type ChildProcess } from 'child_process';

export interface YtdlpSearchResult {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  thumbnail?: string;
  url?: string;
}

// Ensure duration is always a valid positive number
const parseDuration = (value: any): number => {
  const num = Number(value);
  return (Number.isFinite(num) && num > 0) ? Math.floor(num) : 0;
};

/**
 * Helper: wrap a spawned process with a timeout.
 * Kills the process and rejects/resolves if it exceeds the limit.
 */
const withTimeout = (proc: ChildProcess, ms: number, onTimeout: () => void) => {
  let settled = false;
  const timer = setTimeout(() => {
    if (!settled) {
      settled = true;
      try { proc.kill('SIGTERM'); } catch {}
      onTimeout();
    }
  }, ms);
  const clear = () => { if (!settled) { settled = true; clearTimeout(timer); } };
  return { clear, isSettled: () => settled };
};

/**
 * Search for songs using yt-dlp
 */
export const searchSongs = async (query: string, limit: number = 15): Promise<YtdlpSearchResult[]> => {
  return new Promise((resolve, reject) => {
    const searchQuery = `ytsearch${limit}:${query} music`;

    const proc = spawn('yt-dlp', [
      searchQuery,
      '--dump-json',
      '--flat-playlist',
      '--no-warnings',
      '--quiet'
    ]);

    const timeout = withTimeout(proc, 15000, () => reject(new Error('Search timed out')));

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      if (timeout.isSettled()) return;
      timeout.clear();

      const results: YtdlpSearchResult[] = [];
      const lines = stdout.trim().split('\n').filter(line => line.length > 0);

      for (const line of lines) {
        try {
          const item = JSON.parse(line);
          results.push({
            id: item.id || item.url,
            title: item.title || 'Unknown Title',
            artist: item.channel || item.uploader || 'Unknown Artist',
            duration: parseDuration(item.duration),
            thumbnail: item.thumbnail || item.thumbnails?.[0]?.url
          });
        } catch {
          // Skip invalid JSON lines
        }
      }

      if (code !== 0 && results.length === 0) {
        reject(new Error(`yt-dlp search failed: ${stderr}`));
        return;
      }

      resolve(results);
    });

    proc.on('error', (err) => {
      if (timeout.isSettled()) return;
      timeout.clear();
      reject(new Error(`Failed to run yt-dlp: ${err.message}`));
    });
  });
};

/**
 * Get the audio stream URL for a video (no download, just the URL)
 */
export const getStreamUrl = async (videoId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const proc = spawn('yt-dlp', [
      '-f', 'bestaudio',
      '-g',
      '--no-warnings',
      '--quiet',
      `https://music.youtube.com/watch?v=${videoId}`
    ]);

    const timeout = withTimeout(proc, 10000, () => reject(new Error('yt-dlp timed out')));

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      if (timeout.isSettled()) return;
      timeout.clear();

      if (code !== 0) {
        reject(new Error(`Failed to get stream URL: ${stderr}`));
        return;
      }

      const url = stdout.trim();
      if (!url) {
        reject(new Error('No stream URL returned'));
        return;
      }

      resolve(url);
    });

    proc.on('error', (err) => {
      if (timeout.isSettled()) return;
      timeout.clear();
      reject(new Error(`Failed to run yt-dlp: ${err.message}`));
    });
  });
};

/**
 * Get detailed info about a video
 */
export const getVideoInfo = async (videoId: string): Promise<YtdlpSearchResult> => {
  return new Promise((resolve, reject) => {
    const proc = spawn('yt-dlp', [
      '--dump-json',
      '--no-warnings',
      '--quiet',
      `https://music.youtube.com/watch?v=${videoId}`
    ]);

    const timeout = withTimeout(proc, 10000, () => reject(new Error('Video info fetch timed out')));

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      if (timeout.isSettled()) return;
      timeout.clear();

      if (code !== 0) {
        reject(new Error(`Failed to get video info: ${stderr}`));
        return;
      }

      try {
        const item = JSON.parse(stdout);
        resolve({
          id: item.id,
          title: item.title || 'Unknown Title',
          artist: item.channel || item.uploader || 'Unknown Artist',
          album: item.album,
          duration: parseDuration(item.duration),
          thumbnail: item.thumbnail
        });
      } catch {
        reject(new Error('Failed to parse video info'));
      }
    });

    proc.on('error', (err) => {
      if (timeout.isSettled()) return;
      timeout.clear();
      reject(new Error(`Failed to run yt-dlp: ${err.message}`));
    });
  });
};

/**
 * Get recommendations based on a video using YouTube Mix (RD playlist)
 */
export const getRecommendations = async (videoId: string, limit: number = 15): Promise<YtdlpSearchResult[]> => {
  return new Promise((resolve) => {
    const mixUrl = `https://www.youtube.com/watch?v=${videoId}&list=RD${videoId}`;

    const proc = spawn('yt-dlp', [
      mixUrl,
      '--dump-json',
      '--flat-playlist',
      '--no-warnings',
      '--quiet',
      '--playlist-end', String(limit + 1)
    ]);

    // Non-critical: resolve with empty on timeout instead of rejecting
    const timeout = withTimeout(proc, 15000, () => resolve([]));

    let stdout = '';

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    // Ignore stderr for recommendations

    proc.on('close', (code) => {
      if (timeout.isSettled()) return;
      timeout.clear();

      const results: YtdlpSearchResult[] = [];

      if (code !== 0) {
        resolve([]);
        return;
      }

      const lines = stdout.trim().split('\n').filter(line => line.length > 0);

      for (const line of lines) {
        try {
          const item = JSON.parse(line);
          if (item.id === videoId) continue;

          results.push({
            id: item.id || item.url,
            title: item.title || 'Unknown Title',
            artist: item.channel || item.uploader || 'Unknown Artist',
            duration: parseDuration(item.duration),
            thumbnail: item.thumbnail || item.thumbnails?.[0]?.url
          });
        } catch {
          // Skip invalid JSON lines
        }
      }

      resolve(results.slice(0, limit));
    });

    proc.on('error', () => {
      if (timeout.isSettled()) return;
      timeout.clear();
      resolve([]);
    });
  });
};

/**
 * Check if yt-dlp is installed
 */
export const isYtdlpInstalled = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    const proc = spawn('yt-dlp', ['--version']);

    const timeout = withTimeout(proc, 5000, () => resolve(false));

    proc.on('close', (code) => {
      if (timeout.isSettled()) return;
      timeout.clear();
      resolve(code === 0);
    });

    proc.on('error', () => {
      if (timeout.isSettled()) return;
      timeout.clear();
      resolve(false);
    });
  });
};
