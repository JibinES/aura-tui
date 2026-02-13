import NodeMPV from 'node-mpv';

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
    volume: 50,
    muted: false,
    position: 0,
    duration: 0
  };
  private listeners: ((state: PlayerState) => void)[] = [];

  // Internal timer for progress tracking
  private progressTimer: any = null;

  constructor() {
    this.mpv = new NodeMPV({
      audio_only: true,
      verbose: false,
    });

    this.setupListeners();
  }

  private setupListeners() {
    // When song actually starts playing
    this.mpv.on('started', () => {
      this.state.playing = true;
      this.state.position = 0;
      this.startProgressTimer();
      this.notifyListeners();
    });

    // When song stops
    this.mpv.on('stopped', () => {
      this.state.playing = false;
      this.stopProgressTimer();
      this.state.position = 0;
      this.notifyListeners();
    });

    // When paused
    this.mpv.on('paused', () => {
      this.state.playing = false;
      this.stopProgressTimer();
      this.notifyListeners();
    });

    // When resumed
    this.mpv.on('resumed', () => {
      this.state.playing = true;
      this.startProgressTimer();
      this.notifyListeners();
    });
  }

  // Start our internal progress timer
  private startProgressTimer() {
    this.stopProgressTimer(); // Clear any existing timer

    this.progressTimer = setInterval(() => {
      if (this.state.playing && this.state.position < this.state.duration) {
        this.state.position += 1;
        this.notifyListeners();
      } else if (this.state.position >= this.state.duration && this.state.duration > 0) {
        // Song ended
        this.stopProgressTimer();
        this.state.playing = false;
        this.notifyListeners();
      }
    }, 1000);
  }

  // Stop the progress timer
  private stopProgressTimer() {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }

  public async play(url: string, duration?: number) {
    try {
      // Reset state
      this.state.position = 0;
      this.state.duration = duration || 0;
      this.state.playing = true;
      this.notifyListeners();

      await this.mpv.load(url);
    } catch (error) {
      console.error('Error playing track:', error);
      this.state.playing = false;
      this.stopProgressTimer();
      this.notifyListeners();
    }
  }

  // Set duration from external source (yt-dlp metadata)
  public setDuration(duration: number) {
    this.state.duration = duration;
    this.notifyListeners();
  }

  public async pause() {
    try {
      await this.mpv.pause();
      this.state.playing = false;
      this.stopProgressTimer();
      this.notifyListeners();
    } catch (error) {
      console.error('Error pausing:', error);
    }
  }

  public async resume() {
    try {
      await this.mpv.resume();
      this.state.playing = true;
      this.startProgressTimer();
      this.notifyListeners();
    } catch (error) {
      console.error('Error resuming:', error);
    }
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
    try {
      await this.mpv.volume(vol);
      this.state.volume = vol;
      this.notifyListeners();
    } catch (error) {
      console.error('Error setting volume:', error);
    }
  }

  public getVolume(): number {
    return this.state.volume;
  }

  public getState(): PlayerState {
    return { ...this.state };
  }

  public subscribe(listener: (state: PlayerState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener({ ...this.state }));
  }

  public async stop() {
    try {
      await this.mpv.stop();
      this.stopProgressTimer();
      this.state.position = 0;
      this.state.playing = false;
      this.notifyListeners();
    } catch (error) {
      console.error('Error stopping:', error);
    }
  }
}

export const player = new PlayerService();
