import { create } from 'zustand';
import { player } from '../services/player';
import { adBlocker } from '../services/adblock';

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
  currentSong: Song | null;
  queue: Song[];
  history: Song[];
  volume: number;
  currentTime: number;
  duration: number;

  // UI State
  view: 'home' | 'search' | 'player' | 'queue' | 'help' | 'playlists';
  searchQuery: string;
  searchResults: Song[];
  isInputFocused: boolean;

  // Actions
  playSong: (song: Song) => Promise<void>;
  addToQueue: (song: Song) => void;
  nextTrack: () => Promise<void>;
  prevTrack: () => Promise<void>;
  setVolume: (vol: number) => void;
  togglePlay: () => void;
  setView: (view: AppState['view']) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: Song[]) => void;
  setInputFocused: (focused: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial State
  isPlaying: false,
  currentSong: null,
  queue: [],
  history: [],
  volume: 50,
  currentTime: 0,
  duration: 0,
  view: 'home',
  searchQuery: '',
  searchResults: [],
  isInputFocused: false,

  // Actions
  playSong: async (song: Song) => {
    try {
      if (adBlocker.isAd(song)) {
        console.log('Skipping ad:', song.title);
        const state = get();
        if (state.queue.length > 0) {
          state.nextTrack();
        }
        return;
      }

      // Update state first to show loading
      set({ currentSong: song, isPlaying: false, currentTime: 0, duration: song.duration });

      // Let mpv handle the URL directly - it uses yt-dlp internally
      const url = `https://www.youtube.com/watch?v=${song.id}`;

      // Set duration in player service (for internal timer)
      player.setDuration(song.duration);

      // Play - mpv will use yt-dlp to extract stream
      // The player's 'started' event will trigger the internal timer
      await player.play(url, song.duration);
    } catch (error) {
      console.error('Failed to play song:', error);
      set({ isPlaying: false });
    }
  },

  addToQueue: (song: Song) => {
    set((state) => ({ queue: [...state.queue, song] }));
  },

  nextTrack: async () => {
    const state = get();
    if (state.queue.length > 0) {
      const nextSong = state.queue[0];
      const remainingQueue = state.queue.slice(1);

      if (state.currentSong) {
        set((s) => ({ history: [...s.history, s.currentSong!] }));
      }

      await state.playSong(nextSong);
      set({ queue: remainingQueue });
    }
  },

  prevTrack: async () => {
      // Implement previous track logic (from history)
      const state = get();
      if (state.history.length > 0) {
          const prevSong = state.history[state.history.length - 1];
          const newHistory = state.history.slice(0, -1);

          if (state.currentSong) {
              set((s) => ({ queue: [s.currentSong!, ...s.queue] }));
          }

          await state.playSong(prevSong);
          set({ history: newHistory });
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

  setView: (view) => set({ view }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchResults: (results) => set({ searchResults: results }),
  setInputFocused: (focused) => set({ isInputFocused: focused }),
}));

// Sync player state with store
player.subscribe((state) => {
  useStore.setState({
    isPlaying: state.playing,
    currentTime: state.position,
    duration: state.duration,
    volume: state.volume,
  });
});
