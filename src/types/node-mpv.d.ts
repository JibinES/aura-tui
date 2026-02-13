declare module 'node-mpv' {
  interface NodeMPVOptions {
    audio_only?: boolean;
    verbose?: boolean;
    debug?: boolean;
    socket?: string;
    time_update?: number;
    auto_restart?: boolean;
    binary?: string;
  }

  interface NodeMPVState {
    playing: boolean;
    paused: boolean;
    mute: boolean;
    volume: number;
    duration: number | null;
    time: number | null;
    filename: string | null;
    filepath: string | null;
    'media-title': string | null;
  }

  type NodeMPVEvent = 'started' | 'stopped' | 'paused' | 'resumed' | 'seek' | 'timeposition' | 'statuschange';

  export default class NodeMPV {
    constructor(options?: NodeMPVOptions);
    
    load(file: string, mode?: 'replace' | 'append' | 'append-play'): Promise<void>;
    play(): Promise<void>;
    pause(): Promise<void>;
    togglePlay(): Promise<void>;
    stop(): Promise<void>;
    quit(): Promise<void>;
    
    seek(time: number, mode?: 'absolute' | 'relative', option?: 'seconds' | 'percentage'): Promise<void>;
    
    volume(vol: number): Promise<void>;
    adjustVolume(adjustment: number): Promise<void>;
    mute(): Promise<void>;
    unmute(): Promise<void>;
    toggleMute(): Promise<void>;
    
    getDuration(): Promise<number | null>;
    getTimePosition(): Promise<number | null>;
    
    loadStream(url: string): Promise<void>;
    
    on(event: NodeMPVEvent, callback: (...args: any[]) => void): void;
    once(event: NodeMPVEvent, callback: (...args: any[]) => void): void;
    off(event: NodeMPVEvent, callback: (...args: any[]) => void): void;
    
    isRunning(): boolean;
    isPlaying(): boolean;
    isPaused(): boolean;
    isMuted(): boolean;
    
    getProperty(property: string): Promise<any>;
    setProperty(property: string, value: any): Promise<void>;
    
    observeProperty(property: string, id: number): Promise<void>;
    unobserveProperty(id: number): Promise<void>;
  }
}
