# Skills Required for YouTube Music TUI

## 1. Bun.js Expertise

### Core Concepts
- **Fast runtime**: Leverage Bun's speed for responsive TUI
- **Built-in APIs**: Use `Bun.file()`, `Bun.write()`, native fetch
- **TypeScript**: Full TypeScript support out of the box
- **Package management**: `bun install`, `bun add`, `bun run`

### Best Practices
```typescript
// Use Bun's native file APIs
const config = await Bun.file('~/.ytmusic-tui/config.json').json();

// Fast HTTP requests
const response = await fetch(url, {
  headers: { 'Cookie': cookie }
});

// Process streaming data efficiently
for await (const chunk of stream) {
  // Handle audio stream
}
```

## 2. TUI Development with Ink/Blessed

### Ink (React-based)
```typescript
import React, { useState, useEffect } from 'react';
import { render, Box, Text, useInput } from 'ink';

const Player = () => {
  const [playing, setPlaying] = useState(false);
  
  useInput((input, key) => {
    if (input === ' ') setPlaying(!playing);
    if (key.rightArrow) skip();
  });
  
  return (
    <Box flexDirection="column">
      <Text color="cyan">Now Playing</Text>
      <Text>{playing ? '▶' : '⏸'} Song Title</Text>
    </Box>
  );
};
```

### Blessed (Node-curses-based)
```typescript
import blessed from 'blessed';

const screen = blessed.screen({
  smartCSR: true,
  title: 'YouTube Music TUI'
});

const nowPlaying = blessed.box({
  top: 'center',
  left: 'center',
  width: '50%',
  height: '50%',
  border: { type: 'line' },
  style: {
    border: { fg: 'cyan' }
  }
});

screen.append(nowPlaying);
screen.key(['q', 'C-c'], () => process.exit(0));
screen.render();
```

### Key Considerations
- **Performance**: Minimize re-renders, use memoization
- **Responsiveness**: Handle terminal resize events
- **Accessibility**: Support screen readers where possible
- **Color support**: Detect and use appropriate color depth

## 3. YouTube Music API Integration

### Unofficial API Libraries
```typescript
import YTMusic from 'ytmusic-api';

const ytmusic = new YTMusic();
await ytmusic.initialize({
  cookies: parsedCookies // Cookie header parsed to object
});

// Search
const results = await ytmusic.search('artist name');

// Get song info
const song = await ytmusic.getSong(videoId);

// Get recommendations
const recommendations = await ytmusic.getRecommendations();

// User library
const playlists = await ytmusic.getLibraryPlaylists();
```

### Custom API Implementation
```typescript
class YouTubeMusicAPI {
  private cookie: string;
  private baseURL = 'https://music.youtube.com/youtubei/v1';
  
  async search(query: string) {
    const response = await fetch(`${this.baseURL}/search`, {
      method: 'POST',
      headers: {
        'Cookie': this.cookie,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0...'
      },
      body: JSON.stringify({
        query,
        context: this.getContext()
      })
    });
    
    return this.parseSearchResults(await response.json());
  }
  
  private getContext() {
    return {
      client: {
        clientName: 'WEB_REMIX',
        clientVersion: '1.20240101.01.00'
      }
    };
  }
}
```

### Cookie Management
```typescript
interface CookieStore {
  save(cookie: string): Promise<void>;
  load(): Promise<string>;
  isValid(): Promise<boolean>;
  refresh(): Promise<string>;
}

class SecureCookieStore implements CookieStore {
  private configPath = '~/.ytmusic-tui/credentials';
  
  async save(cookie: string) {
    // Encrypt before saving
    const encrypted = await this.encrypt(cookie);
    await Bun.write(this.configPath, encrypted);
  }
  
  async load(): Promise<string> {
    const encrypted = await Bun.file(this.configPath).text();
    return await this.decrypt(encrypted);
  }
}
```

## 4. Audio Playback with MPV

### MPV Integration
```typescript
import mpv from 'node-mpv';

class AudioPlayer {
  private player: any;
  private currentTrack: Track | null = null;
  
  async initialize() {
    this.player = new mpv({
      audio_only: true,
      volume: 70
    });
    
    await this.player.start();
    this.setupEventHandlers();
  }
  
  private setupEventHandlers() {
    this.player.on('timeposition', (seconds: number) => {
      this.updateProgress(seconds);
    });
    
    this.player.on('stopped', () => {
      this.playNext();
    });
  }
  
  async play(url: string) {
    await this.player.load(url);
  }
  
  async pause() {
    await this.player.pause();
  }
  
  async seek(seconds: number) {
    await this.player.seek(seconds);
  }
  
  async setVolume(level: number) {
    await this.player.volume(level);
  }
}
```

### Stream URL Extraction
```typescript
async function getStreamURL(videoId: string, cookie: string): Promise<string> {
  const response = await fetch(
    `https://www.youtube.com/watch?v=${videoId}`,
    { headers: { 'Cookie': cookie } }
  );
  
  const html = await response.text();
  
  // Extract streaming data from player response
  const playerResponse = extractPlayerResponse(html);
  const formats = playerResponse.streamingData.adaptiveFormats;
  
  // Find highest quality audio-only format
  const audioFormat = formats
    .filter((f: any) => f.mimeType.includes('audio'))
    .sort((a: any, b: any) => b.bitrate - a.bitrate)[0];
  
  return audioFormat.url;
}
```

## 5. Ad Blocking Implementation

### Detection Strategy
```typescript
interface AdDetector {
  isAd(video: VideoInfo): boolean;
  hasAdMarkers(streamData: StreamData): boolean;
  filterAds<T>(items: T[]): T[];
}

class YouTubeAdBlocker implements AdDetector {
  isAd(video: VideoInfo): boolean {
    // Check for ad indicators
    if (video.isAdvertisement) return true;
    if (video.videoId?.startsWith('ad-')) return true;
    if (video.title?.toLowerCase().includes('advertisement')) return true;
    
    return false;
  }
  
  hasAdMarkers(streamData: StreamData): boolean {
    return streamData.playerAds?.length > 0;
  }
  
  filterAds<T extends { isAd?: boolean }>(items: T[]): T[] {
    return items.filter(item => !this.isAd(item as any));
  }
}
```

### Playback Ad Skipping
```typescript
class AdBlockingPlayer extends AudioPlayer {
  private adMarkers: TimeRange[] = [];
  
  async play(url: string, metadata: VideoMetadata) {
    this.adMarkers = this.extractAdMarkers(metadata);
    await super.play(url);
  }
  
  private setupAdSkipping() {
    this.player.on('timeposition', (position: number) => {
      const inAdRange = this.adMarkers.some(
        range => position >= range.start && position <= range.end
      );
      
      if (inAdRange) {
        const nextSafeTime = this.findNextSafeTime(position);
        this.seek(nextSafeTime);
      }
    });
  }
  
  private extractAdMarkers(metadata: VideoMetadata): TimeRange[] {
    return metadata.playerAds?.map(ad => ({
      start: ad.startTime,
      end: ad.endTime
    })) || [];
  }
}
```

## 6. State Management

### Zustand Store
```typescript
import create from 'zustand';

interface MusicState {
  // Playback state
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  progress: number;
  volume: number;
  
  // UI state
  currentView: 'home' | 'library' | 'search' | 'player';
  searchQuery: string;
  
  // User data
  playlists: Playlist[];
  likedSongs: Track[];
  
  // Actions
  play: (track: Track) => void;
  pause: () => void;
  addToQueue: (track: Track) => void;
  setVolume: (level: number) => void;
  navigateTo: (view: string) => void;
}

const useMusicStore = create<MusicState>((set, get) => ({
  currentTrack: null,
  queue: [],
  isPlaying: false,
  progress: 0,
  volume: 70,
  currentView: 'home',
  searchQuery: '',
  playlists: [],
  likedSongs: [],
  
  play: (track) => set({ currentTrack: track, isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  addToQueue: (track) => set(state => ({ 
    queue: [...state.queue, track] 
  })),
  setVolume: (level) => set({ volume: level }),
  navigateTo: (view) => set({ currentView: view as any })
}));
```

## 7. Keyboard Shortcuts & Input Handling

### Global Shortcuts
```typescript
const keyBindings = {
  // Playback
  ' ': 'togglePlay',
  'n': 'next',
  'p': 'previous',
  '+': 'volumeUp',
  '-': 'volumeDown',
  
  // Navigation
  '/': 'focusSearch',
  '1': 'goHome',
  '2': 'goLibrary',
  '3': 'goSearch',
  
  // Queue
  'a': 'addToQueue',
  'l': 'like',
  's': 'shuffle',
  'r': 'repeat',
  
  // App
  'q': 'quit',
  '?': 'help'
};

function setupKeyboardHandlers(store: MusicState) {
  useInput((input, key) => {
    const action = keyBindings[input as keyof typeof keyBindings];
    
    switch (action) {
      case 'togglePlay':
        store.isPlaying ? store.pause() : store.play();
        break;
      case 'volumeUp':
        store.setVolume(Math.min(100, store.volume + 5));
        break;
      // ... handle other actions
    }
  });
}
```

## 8. Caching & Performance

### Smart Caching Layer
```typescript
class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private maxAge = 5 * 60 * 1000; // 5 minutes
  
  async get<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.maxAge) {
      return cached.data as T;
    }
    
    const data = await fetcher();
    this.cache.set(key, { data, timestamp: Date.now() });
    
    return data;
  }
  
  invalidate(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

// Usage
const cache = new CacheManager();

async function getRecommendations() {
  return cache.get('recommendations', async () => {
    return await ytmusic.getRecommendations();
  });
}
```

### Lazy Loading
```typescript
function LazyList({ items }: { items: Track[] }) {
  const [visibleCount, setVisibleCount] = useState(20);
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (visibleCount < items.length) {
        setVisibleCount(prev => prev + 20);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [visibleCount, items.length]);
  
  return (
    <Box flexDirection="column">
      {items.slice(0, visibleCount).map(item => (
        <TrackItem key={item.id} track={item} />
      ))}
    </Box>
  );
}
```

## 9. ASCII Art & Visual Polish

### Album Art Rendering
```typescript
import { createCanvas, loadImage } from 'canvas';

async function generateASCIIArt(imageUrl: string, width = 40): Promise<string> {
  const response = await fetch(imageUrl);
  const buffer = await response.arrayBuffer();
  
  const img = await loadImage(Buffer.from(buffer));
  const aspectRatio = img.height / img.width;
  const height = Math.floor(width * aspectRatio * 0.5); // Adjust for character aspect
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);
  
  const imageData = ctx.getImageData(0, 0, width, height);
  const chars = ' .:-=+*#%@';
  
  let ascii = '';
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const r = imageData.data[offset];
      const g = imageData.data[offset + 1];
      const b = imageData.data[offset + 2];
      const brightness = (r + g + b) / 3;
      const charIndex = Math.floor((brightness / 255) * (chars.length - 1));
      ascii += chars[charIndex];
    }
    ascii += '\n';
  }
  
  return ascii;
}
```

### Progress Bar
```typescript
function ProgressBar({ current, total }: { current: number; total: number }) {
  const percentage = (current / total) * 100;
  const filled = Math.floor(percentage / 2);
  const empty = 50 - filled;
  
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  const time = `${formatTime(current)} / ${formatTime(total)}`;
  
  return (
    <Box>
      <Text color="cyan">{bar}</Text>
      <Text color="gray"> {time}</Text>
    </Box>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
```

## 10. Error Handling & Resilience

### Graceful Degradation
```typescript
class ResilientYTMusicClient {
  private retryAttempts = 3;
  private retryDelay = 1000;
  
  async fetchWithRetry<T>(
    fetcher: () => Promise<T>,
    onError?: (error: Error) => void
  ): Promise<T> {
    for (let i = 0; i < this.retryAttempts; i++) {
      try {
        return await fetcher();
      } catch (error) {
        if (i === this.retryAttempts - 1) {
          onError?.(error as Error);
          throw error;
        }
        
        await new Promise(resolve => 
          setTimeout(resolve, this.retryDelay * (i + 1))
        );
      }
    }
    
    throw new Error('Max retries exceeded');
  }
  
  async search(query: string): Promise<SearchResults> {
    return this.fetchWithRetry(
      () => this.api.search(query),
      (error) => {
        console.error('Search failed:', error.message);
        // Return cached results or empty state
      }
    );
  }
}
```

### User Feedback
```typescript
function ErrorBoundary({ error }: { error: Error }) {
  return (
    <Box flexDirection="column" padding={1}>
      <Text color="red" bold>⚠ Error</Text>
      <Text>{error.message}</Text>
      <Text color="gray">Press R to retry or Q to quit</Text>
    </Box>
  );
}

function LoadingSpinner({ text = 'Loading...' }: { text?: string }) {
  const [frame, setFrame] = useState(0);
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % frames.length);
    }, 80);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <Text color="cyan">{frames[frame]} {text}</Text>
  );
}
```

## 11. Configuration & Persistence

### Config Schema
```typescript
interface AppConfig {
  version: string;
  cookie: string;
  preferences: {
    theme: 'dark' | 'light';
    audioQuality: 'low' | 'medium' | 'high';
    adBlock: boolean;
    autoplay: boolean;
  };
  keybindings: Record<string, string>;
  cache: {
    enabled: boolean;
    maxAge: number;
  };
}

class ConfigManager {
  private configPath = '~/.ytmusic-tui/config.json';
  
  async load(): Promise<AppConfig> {
    try {
      return await Bun.file(this.configPath).json();
    } catch {
      return this.getDefaults();
    }
  }
  
  async save(config: AppConfig): Promise<void> {
    await Bun.write(
      this.configPath,
      JSON.stringify(config, null, 2)
    );
  }
  
  private getDefaults(): AppConfig {
    return {
      version: '1.0.0',
      cookie: '',
      preferences: {
        theme: 'dark',
        audioQuality: 'high',
        adBlock: true,
        autoplay: true
      },
      keybindings: { /* defaults */ },
      cache: {
        enabled: true,
        maxAge: 300000
      }
    };
  }
}
```

## 12. Testing Strategies

### Unit Tests
```typescript
import { describe, it, expect, mock } from 'bun:test';

describe('AudioPlayer', () => {
  it('should play track', async () => {
    const player = new AudioPlayer();
    await player.initialize();
    
    const track = { id: '123', url: 'https://...' };
    await player.play(track.url);
    
    expect(player.isPlaying()).toBe(true);
  });
  
  it('should skip ads', async () => {
    const player = new AdBlockingPlayer();
    const metadata = {
      playerAds: [{ startTime: 10, endTime: 20 }]
    };
    
    await player.play('url', metadata);
    player.seek(15); // Seek into ad
    
    // Should auto-skip past ad
    expect(player.getCurrentTime()).toBeGreaterThan(20);
  });
});
```

### Integration Tests
```typescript
describe('YouTube Music API Integration', () => {
  it('should authenticate with cookie', async () => {
    const api = new YouTubeMusicAPI(testCookie);
    const result = await api.getLibrary();
    
    expect(result).toBeDefined();
    expect(result.playlists).toBeArray();
  });
});
```

## Summary

This TUI project requires:
- **Bun.js proficiency** for fast, modern JavaScript runtime
- **TUI framework mastery** (Ink/Blessed) for beautiful terminal interfaces  
- **API reverse engineering** to work with YouTube Music's unofficial API
- **Audio playback** expertise with MPV integration
- **Ad blocking** implementation with detection and filtering
- **State management** for complex application state
- **Performance optimization** through caching and lazy loading
- **UX polish** with keyboard shortcuts and visual feedback
- **Error handling** for resilient network operations
- **Security awareness** for cookie and credential management

The key to success is balancing feature richness with terminal constraints while maintaining performance and user experience.
