import { spawn, type ChildProcess } from 'child_process';
import { existsSync, mkdirSync, unlinkSync, readdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import type { Song } from '../store/state';

const CACHE_DIR = join(tmpdir(), 'auratui-cache');
const WINDOW_SIZE = 5;
const MAX_CONCURRENT = 3;
const DOWNLOAD_TIMEOUT_MS = 120000; // 2 minutes per download

type CacheStatus = 'downloading' | 'ready' | 'error';

interface CacheEntry {
    songId: string;
    filePath: string;
    status: CacheStatus;
}

class CacheService {
    private cache: Map<string, CacheEntry> = new Map();
    private activeDownloads: Map<string, ChildProcess> = new Map();
    private downloadQueue: string[] = [];
    private currentWindowIds: Set<string> = new Set();

    constructor() {
        this.ensureCacheDir();
    }

    private ensureCacheDir() {
        if (!existsSync(CACHE_DIR)) {
            mkdirSync(CACHE_DIR, { recursive: true });
        }
    }

    /**
     * Update the cache window based on the current queue.
     * Caches songs at positions 0..(WINDOW_SIZE-1) of the queue.
     * Deletes cached songs that are no longer in the window.
     */
    public updateWindow(queue: Song[]) {
        const songsToCache = queue.slice(0, WINDOW_SIZE);
        const newWindowIds = new Set(songsToCache.map(s => s.id));

        // 1. Cancel downloads and delete files for songs no longer in window
        for (const [songId, entry] of this.cache.entries()) {
            if (!newWindowIds.has(songId)) {
                this.removeCacheEntry(songId);
            }
        }

        // Cancel any active downloads not in new window
        for (const [songId, proc] of this.activeDownloads.entries()) {
            if (!newWindowIds.has(songId)) {
                proc.kill('SIGTERM');
                this.activeDownloads.delete(songId);
            }
        }

        // Remove from download queue if no longer needed
        this.downloadQueue = this.downloadQueue.filter(id => newWindowIds.has(id));

        this.currentWindowIds = newWindowIds;

        // 2. Start caching songs that aren't cached yet
        for (const song of songsToCache) {
            if (!this.cache.has(song.id) && !this.activeDownloads.has(song.id)) {
                this.downloadQueue.push(song.id);
                // Store a placeholder entry so we know it's queued
                this.cache.set(song.id, {
                    songId: song.id,
                    filePath: this.getFilePath(song.id),
                    status: 'downloading',
                });
                this.startDownload(song);
            }
        }
    }

    /**
     * Get the local file path for a cached song, or null if not ready.
     */
    public getCachedPath(songId: string): string | null {
        const entry = this.cache.get(songId);
        if (entry && entry.status === 'ready' && existsSync(entry.filePath)) {
            return entry.filePath;
        }
        return null;
    }

    /**
     * Check if a song is currently being cached.
     */
    public isCaching(songId: string): boolean {
        const entry = this.cache.get(songId);
        return entry?.status === 'downloading' || false;
    }

    /**
     * Get the file path where a song would be cached.
     */
    private getFilePath(songId: string): string {
        return join(CACHE_DIR, `${songId}.audio`);
    }

    /**
     * Start downloading a song's audio using yt-dlp.
     */
    private startDownload(song: Song) {
        // Respect concurrency limit
        if (this.activeDownloads.size >= MAX_CONCURRENT) {
            // Will be picked up when a current download finishes
            return;
        }

        const filePath = this.getFilePath(song.id);
        const url = `https://www.youtube.com/watch?v=${song.id}`;

        const proc = spawn('yt-dlp', [
            '-f', 'bestaudio',
            '--no-warnings',
            '--quiet',
            '--no-playlist',
            '-o', filePath,
            url,
        ]);

        this.activeDownloads.set(song.id, proc);

        // Kill download if it takes too long (no internet, stuck process)
        const downloadTimer = setTimeout(() => {
            if (this.activeDownloads.has(song.id)) {
                try { proc.kill('SIGTERM'); } catch {}
            }
        }, DOWNLOAD_TIMEOUT_MS);

        proc.on('close', (code) => {
            clearTimeout(downloadTimer);
            this.activeDownloads.delete(song.id);

            // Only update if this song is still in our window
            if (this.currentWindowIds.has(song.id)) {
                const entry = this.cache.get(song.id);
                if (entry) {
                    if (code === 0 && existsSync(filePath)) {
                        entry.status = 'ready';
                    } else {
                        entry.status = 'error';
                        // Clean up partial file
                        try { if (existsSync(filePath)) unlinkSync(filePath); } catch { }
                    }
                }
            } else {
                // Song is no longer needed, clean up
                try { if (existsSync(filePath)) unlinkSync(filePath); } catch { }
                this.cache.delete(song.id);
            }

            // Start next queued download
            this.processQueue();
        });

        proc.on('error', () => {
            clearTimeout(downloadTimer);
            this.activeDownloads.delete(song.id);
            const entry = this.cache.get(song.id);
            if (entry) {
                entry.status = 'error';
            }
            this.processQueue();
        });
    }

    /**
     * Process the download queue — start downloads up to concurrency limit.
     */
    private processQueue() {
        while (this.activeDownloads.size < MAX_CONCURRENT && this.downloadQueue.length > 0) {
            const songId = this.downloadQueue.shift();
            if (!songId) break;

            // Skip if no longer in window or already downloading/ready
            if (!this.currentWindowIds.has(songId)) continue;
            if (this.activeDownloads.has(songId)) continue;

            const entry = this.cache.get(songId);
            if (entry && entry.status === 'ready') continue;

            // Create a minimal Song object for the download
            this.startDownload({ id: songId, title: '', artist: '', duration: 0 });
        }
    }

    /**
     * Remove a single cache entry — kill download, delete file.
     */
    private removeCacheEntry(songId: string) {
        // Kill active download if any
        const proc = this.activeDownloads.get(songId);
        if (proc) {
            proc.kill('SIGTERM');
            this.activeDownloads.delete(songId);
        }

        // Delete cached file
        const entry = this.cache.get(songId);
        if (entry) {
            try { if (existsSync(entry.filePath)) unlinkSync(entry.filePath); } catch { }
            this.cache.delete(songId);
        }
    }

    /**
     * Cancel all active downloads.
     */
    public cancelAll() {
        for (const [songId, proc] of this.activeDownloads.entries()) {
            proc.kill('SIGTERM');
        }
        this.activeDownloads.clear();
        this.downloadQueue = [];
    }

    /**
     * Clean up entire cache directory. Call on app exit.
     */
    public cleanup() {
        this.cancelAll();
        this.cache.clear();
        try {
            if (existsSync(CACHE_DIR)) {
                rmSync(CACHE_DIR, { recursive: true, force: true });
            }
        } catch { }
    }

    /**
     * Get cache stats for debugging / UI display.
     */
    public getStats(): { total: number; ready: number; downloading: number } {
        let ready = 0;
        let downloading = 0;
        for (const entry of this.cache.values()) {
            if (entry.status === 'ready') ready++;
            if (entry.status === 'downloading') downloading++;
        }
        return { total: this.cache.size, ready, downloading };
    }
}

export const cacheService = new CacheService();
