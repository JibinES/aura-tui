import NodeMPV from 'node-mpv';
import { getConfig } from '../utils/config';

// Define MPV instance type if not available
// node-mpv types might be incomplete or missing, so we use any for the instance if needed
// or we can try to define a basic interface based on documentation

interface PlayerState {
  playing: boolean;
  volume: number;
  muted: boolean;
  position: number;
  duration: number;
}

class PlayerService {
  private mpv: any;
  private state: PlayerState = {
    playing: false,
    volume: 100,
    muted: false,
    position: 0,
    duration: 0
  };
  private listeners: ((state: PlayerState) => void)[] = [];

  constructor() {
    this.mpv = new NodeMPV({
      audio_only: true,
      // ipc_socket: '/tmp/mpv-socket', // Optional: for IPC control if needed
    });

    this.setupListeners();
  }

  private setupListeners() {
    this.mpv.on('status', (status: any) => {
      // Update internal state based on MPV status events
      // Note: status object structure depends on mpv events
    });

    this.mpv.on('started', () => {
      this.state.playing = true;
      this.notifyListeners();
    });

    this.mpv.on('stopped', () => {
      this.state.playing = false;
      this.notifyListeners();
    });

    this.mpv.on('paused', () => {
      this.state.playing = false;
      this.notifyListeners();
    });

    this.mpv.on('resumed', () => {
      this.state.playing = true;
      this.notifyListeners();
    });

    this.mpv.on('timeposition', (seconds: number) => {
        this.state.position = seconds;
        this.notifyListeners();
    });
  }

  public async play(url: string) {
    try {
      await this.mpv.load(url);
      this.state.playing = true;
      this.notifyListeners();
    } catch (error) {
      console.error('Error playing track:', error);
    }
  }

  public async pause() {
    await this.mpv.pause();
    this.state.playing = false;
    this.notifyListeners();
  }

  public async resume() {
    await this.mpv.resume();
    this.state.playing = true;
    this.notifyListeners();
  }

  public async togglePlay() {
    if (this.state.playing) {
      await this.pause();
    } else {
      await this.resume();
    }
  }

  public async setVolume(volume: number) {
    const vol = Math.max(0, Math.min(100, volume));
    await this.mpv.volume(vol);
    this.state.volume = vol;
    this.notifyListeners();
  }

  public getVolume(): number {
      return this.state.volume;
  }

  public subscribe(listener: (state: PlayerState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  public async stop() {
      await this.mpv.stop();
  }
}

export const player = new PlayerService();
