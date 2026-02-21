import { create } from 'zustand';
import { player } from '../services/player';
import { adBlocker } from '../services/adblock';
import { cacheService } from '../services/cache';
import { getRecommendations } from '../services/ytdlp';
import { getPlayHistory, savePlayHistory } from '../utils/config';

export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  thumbnail?: string;
  url?: string; // Streaming URL if resolved
}

export interface AppState {
  // Playback State
  isPlaying: boolean;
  isLoading: boolean;
  currentSong: Song | null;
  queue: Song[];
  history: Song[];
  volume: number;
  currentTime: number;
  duration: number;

  // Playlist playback state
  autoplay: boolean;
  shuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  isRadioMode: boolean;
  currentPlaylistId: string | null;

  // UI State
  view: 'home' | 'search' | 'player' | 'queue' | 'help' | 'playlists';
  searchQuery: string;
  searchResults: Song[];
  isInputFocused: boolean;
  errorMessage: string | null;

  // Actions
  playSong: (song: Song, fetchMix?: boolean) => Promise<void>;
  addToQueue: (song: Song) => void;
  nextTrack: () => Promise<void>;
  prevTrack: () => Promise<void>;
  setVolume: (vol: number) => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  setView: (view: AppState['view']) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: Song[]) => void;
  setInputFocused: (focused: boolean) => void;
  toggleAutoplay: () => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  moveQueueItem: (fromIndex: number, toIndex: number) => void;
  removeFromQueue: (index: number) => void;
  setError: (msg: string | null) => void;
  fetchRecommendations: (videoId: string) => Promise<void>;
  playPlaylist: (songs: Song[], startIndex?: number, playlistId?: string) => Promise<void>;
}

// Fisher-Yates shuffle algorithm
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const useStore = create<AppState>((set, get) => ({
  // Initial State
  isPlaying: false,
  isLoading: false,
  currentSong: null,
  queue: [],
  history: getPlayHistory() as Song[],
  volume: 50,
  currentTime: 0,
  duration: 0,
  autoplay: true,
  shuffle: false,
  repeatMode: 'off',
  isRadioMode: false,
  currentPlaylistId: null,
  view: 'home',
  searchQuery: '',
  searchResults: [],
  isInputFocused: false,
  errorMessage: null,

  // Actions
  playSong: async (song: Song, fetchMix: boolean = false) => {
    try {
      if (adBlocker.isAd(song)) {
        console.log('Skipping ad:', song.title);
        const state = get();
        if (state.queue.length > 0) {
          state.nextTrack();
        }
        return;
      }

      // Check cache for instant playback
      const cachedPath = cacheService.getCachedPath(song.id);

      // Update state — show loading only if not cached
      // Reset radio mode when user manually plays a song (not from radio queue)
      const currentState = get();
      set({
        currentSong: song,
        isPlaying: false,
        isLoading: !cachedPath,
        currentTime: 0,
        duration: song.duration,
        // Keep radio mode if we're advancing through radio queue
        isRadioMode: currentState.isRadioMode && currentState.queue.length > 0,
      });

      // Use cached file or YouTube URL
      const url = cachedPath || `https://www.youtube.com/watch?v=${song.id}`;

      // Set duration in player service (for internal timer)
      player.setDuration(song.duration);

      // Play — cached files load instantly, URLs go through yt-dlp
      await player.play(url, song.duration);

      // Safety timeout: if isLoading is still true after 15s, clear it
      // This handles cases where MPV loads but never fires 'started' event
      setTimeout(() => {
        const s = get();
        if (s.isLoading && s.currentSong?.id === song.id) {
          set({ isLoading: false });
          // If still not playing after timeout, try next track
          if (!s.isPlaying && s.queue.length > 0) {
            s.nextTrack();
          }
        }
      }, 15000);

      // Proactively fetch YouTube Mix in the background when playing from search
      // This ensures the queue is pre-populated so the next song is always ready
      if (fetchMix && currentState.queue.length === 0 && currentState.autoplay) {
        getRecommendations(song.id).then(recommendations => {
          if (recommendations.length > 0) {
            const state = get();
            // Only populate if queue is still empty (user hasn't manually queued songs)
            if (state.queue.length === 0 && state.currentSong?.id === song.id) {
              const songs = recommendations.map(r => ({
                id: r.id,
                title: r.title,
                artist: r.artist,
                album: r.album,
                duration: r.duration,
                thumbnail: r.thumbnail,
              }));
              const queuedSongs = state.shuffle ? shuffleArray(songs) : songs;
              set({ queue: queuedSongs, isRadioMode: true });
              cacheService.updateWindow(queuedSongs);
            }
          }
        }).catch(() => {
          // Non-critical: mix fetch failed, onSongEnd will retry
        });
      }

      // Slide cache window based on current queue
      const state = get();
      cacheService.updateWindow(state.queue);
    } catch (error) {
      console.error('Failed to play song:', error);
      set({ isPlaying: false, isLoading: false });
      get().setError('Failed to play song. Check your connection.');
    }
  },

  addToQueue: (song: Song) => {
    set((state) => ({ queue: [...state.queue, song] }));
  },

  nextTrack: async () => {
    const state = get();
    if (state.queue.length > 0) {
      const nextSong = state.queue[0];
      if (!nextSong) return;
      const remainingQueue = state.queue.slice(1);

      if (state.currentSong) {
        set((s) => ({ history: s.currentSong ? [...s.history, s.currentSong] : s.history }));
        savePlayHistory(get().history);
      }

      set({ queue: remainingQueue });
      await state.playSong(nextSong);
    }
  },

  prevTrack: async () => {
    // Implement previous track logic (from history)
    const state = get();
    if (state.history.length > 0) {
      const prevSong = state.history[state.history.length - 1];
      if (!prevSong) return;
      const newHistory = state.history.slice(0, -1);

      if (state.currentSong) {
        set((s) => ({ queue: s.currentSong ? [s.currentSong, ...s.queue] : s.queue }));
      }

      await state.playSong(prevSong);
      set({ history: newHistory });
      savePlayHistory(get().history);
    }
  },

  setVolume: (vol: number) => {
    set({ volume: vol });
    player.setVolume(vol);
  },

  togglePlay: () => {
    const isPlaying = !get().isPlaying;
    set({ isPlaying });
    player.togglePlay();
  },

  seek: (seconds: number) => {
    player.seek(seconds);
  },

  cycleRepeatMode: () => {
    const current = get().repeatMode;
    const next = current === 'off' ? 'all' : current === 'all' ? 'one' : 'off';
    set({ repeatMode: next });
    // repeat-one: tell MPV to loop the current track
    player.setLoop(next === 'one');
  },

  moveQueueItem: (fromIndex: number, toIndex: number) => {
    const queue = [...get().queue];
    if (fromIndex < 0 || fromIndex >= queue.length || toIndex < 0 || toIndex >= queue.length) return;
    const [item] = queue.splice(fromIndex, 1);
    if (item) {
      queue.splice(toIndex, 0, item);
      set({ queue });
    }
  },

  removeFromQueue: (index: number) => {
    const queue = [...get().queue];
    if (index < 0 || index >= queue.length) return;
    queue.splice(index, 1);
    set({ queue });
  },

  setError: (msg: string | null) => {
    set({ errorMessage: msg });
    if (msg) {
      setTimeout(() => {
        const current = get().errorMessage;
        if (current === msg) {
          set({ errorMessage: null });
        }
      }, 5000);
    }
  },

  setView: (view) => set({ view }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchResults: (results) => set({ searchResults: results }),
  setInputFocused: (focused) => set({ isInputFocused: focused }),

  toggleAutoplay: () => {
    set((state) => ({ autoplay: !state.autoplay }));
  },

  fetchRecommendations: async (videoId: string) => {
    try {
      const recommendations = await getRecommendations(videoId);
      if (recommendations.length > 0) {
        const state = get();
        const songs = recommendations.map(r => ({
          id: r.id,
          title: r.title,
          artist: r.artist,
          album: r.album,
          duration: r.duration,
          thumbnail: r.thumbnail,
        }));

        const queuedSongs = state.shuffle ? shuffleArray(songs) : songs;
        set({ queue: queuedSongs, isRadioMode: true });

        // Start caching the recommendation queue
        cacheService.updateWindow(queuedSongs);

        // Auto-play the first recommended song
        const nextSong = queuedSongs[0];
        if (nextSong) {
          set(s => ({
            queue: s.queue.slice(1),
            history: s.currentSong ? [...s.history, s.currentSong] : s.history,
          }));
          savePlayHistory(get().history);
          await state.playSong(nextSong);
        }
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      get().setError('Failed to fetch recommendations.');
    }
  },

  toggleShuffle: () => {
    const state = get();
    const newShuffle = !state.shuffle;

    // If enabling shuffle, shuffle the current queue
    if (newShuffle && state.queue.length > 0) {
      set({ shuffle: true, queue: shuffleArray(state.queue) });
    } else {
      set({ shuffle: newShuffle });
    }
  },

  playPlaylist: async (songs: Song[], startIndex: number = 0, playlistId?: string) => {
    if (songs.length === 0) return;

    const state = get();
    const songsToQueue = [...songs];

    // Get the song to play first
    const songToPlay = songsToQueue[startIndex];
    if (!songToPlay) return;

    // Remove the song we're playing from the queue
    const remainingSongs = [
      ...songsToQueue.slice(0, startIndex),
      ...songsToQueue.slice(startIndex + 1)
    ];

    // Shuffle remaining songs if shuffle is enabled
    const queuedSongs = state.shuffle ? shuffleArray(remainingSongs) : remainingSongs;

    // Set the queue and playlist context, reset radio mode
    set({
      queue: queuedSongs,
      isRadioMode: false,
      currentPlaylistId: playlistId || null
    });

    // Start caching the initial window
    cacheService.updateWindow(queuedSongs);

    // Play the first song
    await state.playSong(songToPlay);
  },
}));

// Sync player state with store (UI updates only)
player.subscribe((state) => {
  const updates: any = {
    isPlaying: state.playing,
    currentTime: state.position,
    duration: state.duration,
    volume: state.volume,
  };

  // Clear loading state when MPV actually starts playing
  if (state.playing) {
    updates.isLoading = false;
  }

  useStore.setState(updates);
});

// Track if we're already handling song end to prevent duplicate calls
let isHandlingSongEnd = false;

// Auto-advance to next track when song ends (reliable callback, no race condition)
player.onSongEnd(() => {
  if (isHandlingSongEnd) return;

  const currentStoreState = useStore.getState();

  // Repeat-one is handled by MPV's loop property — timer resets position, no action needed
  if (currentStoreState.repeatMode === 'one') return;

  if (currentStoreState.autoplay) {
    isHandlingSongEnd = true;

    // Safety timeout: reset flag after 30s no matter what, so autoplay can't get permanently stuck
    const safetyTimeout = setTimeout(() => {
      isHandlingSongEnd = false;
    }, 30000);

    const cleanup = () => {
      isHandlingSongEnd = false;
      clearTimeout(safetyTimeout);
    };

    if (currentStoreState.queue.length > 0) {
      // Queue has songs — play next
      currentStoreState.nextTrack().then(cleanup, cleanup);
    } else if (currentStoreState.repeatMode === 'all' && currentStoreState.history.length > 0) {
      // Repeat-all: replay history as a new queue
      const historySongs = [...currentStoreState.history];
      if (currentStoreState.currentSong) {
        historySongs.push(currentStoreState.currentSong);
      }
      const firstSong = historySongs[0];
      if (firstSong) {
        useStore.setState({ queue: historySongs.slice(1), history: [] });
        currentStoreState.playSong(firstSong).then(cleanup, cleanup);
      } else {
        cleanup();
      }
    } else if (currentStoreState.currentSong) {
      // Queue empty — fetch recommendations (radio mode)
      currentStoreState.fetchRecommendations(currentStoreState.currentSong.id).then(cleanup, cleanup);
    } else {
      cleanup();
    }
  }
});
