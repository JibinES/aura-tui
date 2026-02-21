import { spawn } from 'child_process';

export interface YtdlpSearchResult {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  thumbnail?: string;
  url?: string;
}

/**
 * Search for songs using yt-dlp
 */
// Ensure duration is always a valid positive number
const parseDuration = (value: any): number => {
  const num = Number(value);
  return (Number.isFinite(num) && num > 0) ? Math.floor(num) : 0;
};

export const searchSongs = async (query: string, limit: number = 15): Promise<YtdlpSearchResult[]> => {
  return new Promise((resolve, reject) => {
    const results: YtdlpSearchResult[] = [];

    // Search YouTube Music specifically
    const searchQuery = `ytsearch${limit}:${query} music`;

    const proc = spawn('yt-dlp', [
      searchQuery,
      '--dump-json',
      '--flat-playlist',
      '--no-warnings',
      '--quiet'
    ]);

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0 && results.length === 0) {
        reject(new Error(`yt-dlp search failed: ${stderr}`));
        return;
      }

      // Parse each JSON line
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
        } catch (e) {
          // Skip invalid JSON lines
        }
      }

      resolve(results);
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to run yt-dlp: ${err.message}. Make sure yt-dlp is installed (brew install yt-dlp)`));
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
      '-g', // Just print URL, don't download
      '--no-warnings',
      '--quiet',
      `https://music.youtube.com/watch?v=${videoId}`
    ]);

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
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

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
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
      } catch (e) {
        reject(new Error('Failed to parse video info'));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to run yt-dlp: ${err.message}`));
    });
  });
};

/**
 * Get recommendations based on a video using YouTube Mix (RD playlist)
 * This uses YouTube's auto-generated radio mix for a song — essentially
 * YouTube's own recommendation algorithm.
 */
export const getRecommendations = async (videoId: string, limit: number = 15): Promise<YtdlpSearchResult[]> => {
  return new Promise((resolve, reject) => {
    const results: YtdlpSearchResult[] = [];
    const mixUrl = `https://www.youtube.com/watch?v=${videoId}&list=RD${videoId}`;

    const proc = spawn('yt-dlp', [
      mixUrl,
      '--dump-json',
      '--flat-playlist',
      '--no-warnings',
      '--quiet',
      '--playlist-end', String(limit + 1) // +1 because the source song is included
    ]);

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0 && results.length === 0) {
        // Don't reject — just return empty array for recommendations
        // This is non-critical functionality
        resolve([]);
        return;
      }

      const lines = stdout.trim().split('\n').filter(line => line.length > 0);

      for (const line of lines) {
        try {
          const item = JSON.parse(line);
          // Skip the source video itself
          if (item.id === videoId) continue;

          results.push({
            id: item.id || item.url,
            title: item.title || 'Unknown Title',
            artist: item.channel || item.uploader || 'Unknown Artist',
            duration: parseDuration(item.duration),
            thumbnail: item.thumbnail || item.thumbnails?.[0]?.url
          });
        } catch (e) {
          // Skip invalid JSON lines
        }
      }

      resolve(results.slice(0, limit));
    });

    proc.on('error', (err) => {
      // Non-critical: resolve with empty array instead of rejecting
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

    proc.on('close', (code) => {
      resolve(code === 0);
    });

    proc.on('error', () => {
      resolve(false);
    });
  });
};
