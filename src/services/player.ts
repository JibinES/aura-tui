import NodeMPV from 'node-mpv';

interface PlayerState {
  playing: boolean;
  volume: number;
  muted: boolean;
  position: number;
  precisePosition: number; // Float position for lyrics sync
  duration: number;
  transitioning: boolean; // True while switching songs
}

class PlayerService {
  private mpv: any;
  private state: PlayerState = {
    playing: false,
    volume: 50,
    muted: false,
    position: 0,
    precisePosition: 0,
    duration: 0,
    transitioning: false,
  };
  private listeners: ((state: PlayerState) => void)[] = [];
  private songEndListeners: (() => void)[] = [];

  // Internal timer for polling MPV's real position
  private progressTimer: any = null;
  // Flag to distinguish user-initiated stop from natural song end
  private manualStop: boolean = false;
  // Flag for repeat-one looping
  private looping: boolean = false;

  constructor() {
    try {
      this.mpv = new NodeMPV({
        audio_only: true,
        verbose: false,
      });
      this.setupListeners();
    } catch (error) {
      console.error(
        '\n❌ Failed to initialize MPV player.\n' +
        '   Make sure mpv is installed:\n' +
        '   • macOS: brew install mpv\n' +
        '   • Linux: sudo apt install mpv\n'
      );
      // Create a dummy mpv so the app doesn't crash on method calls
      this.mpv = { on: () => { }, load: async () => { }, pause: async () => { }, resume: async () => { }, stop: async () => { }, volume: async () => { }, quit: async () => { }, seek: () => { }, goToPosition: () => { }, loop: () => { }, clearLoop: () => { }, getDuration: async () => 0, getProperty: async () => 0 };
    }
  }

  private setupListeners() {
    // When song actually starts playing
    this.mpv.on('started', () => {
      this.manualStop = false;
      this.state.playing = true;
      this.state.position = 0;
      this.state.precisePosition = 0;
      this.state.transitioning = false;
      this.startProgressTimer();
      this.notifyListeners();
    });

    // When song stops — MPV fires this both for natural end and user stop
    // This is the SOLE trigger for song-end detection (no timer-based detection)
    this.mpv.on('stopped', () => {
      this.state.playing = false;
      this.stopProgressTimer();

      // If this wasn't a manual stop, it's a natural song end
      const isNaturalEnd = !this.manualStop && this.state.position > 5;

      this.notifyListeners();

      if (isNaturalEnd) {
        this.notifySongEnd();
      }
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

  // Start polling MPV for real playback position (UI updates only, no end detection)
  // Polls at 200ms for precise lyrics sync; only notifies UI when floored second changes
  private startProgressTimer() {
    this.stopProgressTimer(); // Clear any existing timer
    let lastFlooredPos = -1;

    this.progressTimer = setInterval(async () => {
      if (this.state.playing) {
        try {
          const timePos = await this.mpv.getProperty('time-pos');
          if (timePos != null && Number.isFinite(timePos)) {
            this.state.precisePosition = timePos;
            this.state.position = Math.floor(timePos);
          }

          // Also sync duration from MPV if we don't have one yet
          if (this.state.duration <= 0) {
            const dur = await this.mpv.getProperty('duration');
            if (dur != null && Number.isFinite(dur) && dur > 0) {
              this.state.duration = Math.floor(dur);
            }
          }
        } catch {
          // MPV may not be ready yet — fall back to incrementing
          this.state.precisePosition += 0.2;
          this.state.position = Math.floor(this.state.precisePosition);
        }

        // Always notify so lyrics get the precise position updates
        const flooredPos = this.state.position;
        if (flooredPos !== lastFlooredPos) {
          lastFlooredPos = flooredPos;
        }
        this.notifyListeners();
      }
    }, 200);
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
      // Stop the currently playing song immediately
      this.manualStop = true;
      this.state.transitioning = true;
      this.stopProgressTimer();
      try { await this.mpv.stop(); } catch { /* may not be playing */ }

      // Reset state — don't set playing=true yet, wait for MPV's 'started' event
      this.state.position = 0;
      this.state.precisePosition = 0;
      this.state.duration = duration || 0;
      this.state.playing = false;
      this.notifyListeners();

      await this.mpv.load(url);
      // Duration will be synced from MPV by the progress timer
      // transitioning will be cleared by the 'started' event
    } catch (error) {
      this.state.playing = false;
      this.state.transitioning = false;
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
    } catch {
      // MPV may not be in a pausable state
    }
  }

  public async resume() {
    try {
      await this.mpv.resume();
      this.state.playing = true;
      this.startProgressTimer();
      this.notifyListeners();
    } catch {
      // MPV may not be in a resumable state
    }
  }

  public async togglePlay() {
    if (this.state.playing) {
      await this.pause();
    } else {
      await this.resume();
    }
  }

  public seek(seconds: number) {
    try {
      this.mpv.seek(seconds);
      // Update internal position immediately for responsive UI
      const newPos = Math.max(0,
        this.state.duration > 0
          ? Math.min(this.state.precisePosition + seconds, this.state.duration)
          : this.state.precisePosition + seconds
      );
      this.state.precisePosition = newPos;
      this.state.position = Math.floor(newPos);
      this.notifyListeners();
    } catch {
      // Seek may fail if no track is loaded
    }
  }

  public setLoop(enable: boolean) {
    try {
      this.looping = enable;
      if (enable) {
        this.mpv.loop('inf');
      } else {
        this.mpv.clearLoop();
      }
    } catch {
      // Loop setting may fail if MPV isn't ready
    }
  }

  public async setVolume(volume: number) {
    const vol = Math.max(0, Math.min(100, volume));
    try {
      await this.mpv.volume(vol);
      this.state.volume = vol;
      this.notifyListeners();
    } catch {
      // Volume setting may fail if MPV isn't ready
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

  // Subscribe to song-end events (for autoplay)
  public onSongEnd(listener: () => void) {
    this.songEndListeners.push(listener);
    return () => {
      this.songEndListeners = this.songEndListeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener({ ...this.state }));
  }

  private notifySongEnd() {
    this.songEndListeners.forEach(listener => listener());
  }

  public async stop() {
    try {
      this.manualStop = true;
      await this.mpv.stop();
      this.stopProgressTimer();
      this.state.position = 0;
      this.state.precisePosition = 0;
      this.state.playing = false;
      this.state.transitioning = false;
      this.notifyListeners();
    } catch {
      // Stop may fail if nothing is playing
    }
  }

  public async destroy() {
    this.stopProgressTimer();
    try {
      await this.mpv.quit();
    } catch { }
  }
}

export const player = new PlayerService();
