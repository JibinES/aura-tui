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
  private songEndListeners: (() => void)[] = [];

  // Internal timer for progress tracking
  private progressTimer: any = null;
  // Flag to distinguish user-initiated stop from natural song end
  private manualStop: boolean = false;
  // Flag for repeat-one looping (suppresses song-end from timer)
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
      this.mpv = { on: () => { }, load: async () => { }, pause: async () => { }, resume: async () => { }, stop: async () => { }, volume: async () => { }, quit: async () => { }, seek: () => { }, goToPosition: () => { }, loop: () => { }, clearLoop: () => { }, getDuration: async () => 0 };
    }
  }

  private setupListeners() {
    // When song actually starts playing
    this.mpv.on('started', () => {
      this.manualStop = false;
      this.state.playing = true;
      this.state.position = 0;
      this.startProgressTimer();
      this.notifyListeners();
    });

    // When song stops — MPV fires this both for natural end and user stop
    this.mpv.on('stopped', () => {
      this.state.playing = false;
      this.stopProgressTimer();

      // Check if this was a natural song end (not a manual stop)
      // If we have a known duration, check if position is near the end
      // If duration is unknown (0), and this wasn't a manual stop, treat it as natural end
      // (the song played and MPV finished it)
      const nearEnd = this.state.duration > 0 &&
        (this.state.position >= this.state.duration - 3 || this.state.position >= this.state.duration);
      const unknownDurationEnd = this.state.duration === 0 && this.state.position > 5;
      const isNaturalEnd = !this.manualStop && (nearEnd || unknownDurationEnd);

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

  // Start our internal progress timer
  private startProgressTimer() {
    this.stopProgressTimer(); // Clear any existing timer

    this.progressTimer = setInterval(() => {
      if (this.state.playing) {
        this.state.position += 1;

        // If duration is known, check for song end
        if (this.state.duration > 0 && this.state.position >= this.state.duration) {
          if (this.looping) {
            // Repeat-one: reset position for visual loop, MPV handles actual replay
            this.state.position = 0;
            this.notifyListeners();
            return;
          }
          this.stopProgressTimer();
          this.state.playing = false;
          this.notifyListeners();
          this.notifySongEnd();
          return;
        }

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
      // Prevent stale 'stopped' event from previous song triggering autoplay
      this.manualStop = true;
      // Reset state — don't set playing=true yet, wait for MPV's 'started' event
      this.state.position = 0;
      this.state.duration = duration || 0;
      this.state.playing = false;
      this.stopProgressTimer();
      this.notifyListeners();

      await this.mpv.load(url);

      // If we don't have a duration from metadata, try to get it from MPV
      // MPV resolves the actual stream and knows the real duration
      if (!duration || duration <= 0) {
        setTimeout(async () => {
          try {
            const mpvDuration = await this.mpv.getDuration();
            if (mpvDuration && mpvDuration > 0) {
              this.state.duration = Math.floor(mpvDuration);
              this.notifyListeners();
            }
          } catch {
            // MPV may not have duration yet, that's ok — stopped event will handle end
          }
        }, 2000);
      }
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

  public seek(seconds: number) {
    try {
      this.mpv.seek(seconds);
      // Update internal position immediately for responsive UI
      this.state.position = Math.max(0,
        this.state.duration > 0
          ? Math.min(this.state.position + seconds, this.state.duration)
          : this.state.position + seconds
      );
      this.notifyListeners();
    } catch (error) {
      console.error('Error seeking:', error);
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
    } catch (error) {
      console.error('Error setting loop:', error);
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
      this.state.playing = false;
      this.notifyListeners();
    } catch (error) {
      console.error('Error stopping:', error);
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
