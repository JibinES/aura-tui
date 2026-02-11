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

export interface ConfigSchema {
  cookie: string;
  theme: 'dark' | 'light';
  audioQuality: 'low' | 'high';
  adBlock: boolean;
  keybindings: Keybindings;
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
  }
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

export default config;
