import Conf from 'conf';

export interface HistoryEntry {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  thumbnail?: string;
}

export interface ConfigSchema {
  adBlock: boolean;
  setupCompleted: boolean;
  playHistory: HistoryEntry[];
}

const defaultConfig: ConfigSchema = {
  adBlock: true,
  setupCompleted: false,
  playHistory: [],
};

const config = new Conf<ConfigSchema>({
  projectName: 'aura-tui',
  defaults: defaultConfig
});

export const getConfig = (): ConfigSchema => config.store;
export const setConfig = (key: keyof ConfigSchema, value: any) => config.set(key, value);

// Persistent play history
export const getPlayHistory = (): HistoryEntry[] => config.get('playHistory') || [];
export const savePlayHistory = (history: HistoryEntry[]) => {
  // Keep only last 50 entries
  const trimmed = history.slice(-50);
  config.set('playHistory', trimmed);
};

export const isFirstRun = (): boolean => {
  return !config.get('setupCompleted');
};

export const markSetupCompleted = () => config.set('setupCompleted', true);

export default config;
