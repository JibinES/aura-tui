import Conf from 'conf';

export interface Keybindings {
  play: string;
  next: string;
  prev: string;
  volumeUp: string;
  volumeDown: string;
  search: string;
  quit: string;
}

export interface HistoryEntry {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  thumbnail?: string;
}

export interface ConfigSchema {
  cookie: string;
  theme: 'dark' | 'light';
  audioQuality: 'low' | 'high';
  adBlock: boolean;
  keybindings: Keybindings;
  setupCompleted: boolean;
  playHistory: HistoryEntry[];
}

const defaultConfig: ConfigSchema = {
  cookie: '',
  theme: 'dark',
  audioQuality: 'high',
  adBlock: true,
  keybindings: {
    play: 'space',
    next: 'n',
    prev: 'p',
    volumeUp: '+',
    volumeDown: '-',
    search: '/',
    quit: 'q'
  },
  setupCompleted: false,
  playHistory: [],
};

const config = new Conf<ConfigSchema>({
  projectName: 'ytmusic-tui',
  defaults: defaultConfig
});

export const getConfig = (): ConfigSchema => config.store;
export const setConfig = (key: keyof ConfigSchema, value: any) => config.set(key, value);
export const getCookie = (): string => config.get('cookie');
export const setCookie = (cookie: string) => config.set('cookie', cookie);
export const getKeybindings = (): Keybindings => config.get('keybindings');

// Persistent play history
export const getPlayHistory = (): HistoryEntry[] => config.get('playHistory') || [];
export const savePlayHistory = (history: HistoryEntry[]) => {
  // Keep only last 50 entries
  const trimmed = history.slice(-50);
  config.set('playHistory', trimmed);
};

// Check if this is the first run (no cookie set and never skipped setup)
export const isFirstRun = (): boolean => {
  const cookie = config.get('cookie');
  const setupCompleted = config.get('setupCompleted');
  return !cookie && !setupCompleted;
};

export const markSetupCompleted = () => config.set('setupCompleted', true);

// Reset cookie and setup state
export const resetCookie = () => {
  config.set('cookie', '');
  config.set('setupCompleted', false);
};

// Clear all config
export const resetAllConfig = () => {
  config.clear();
};

export default config;
