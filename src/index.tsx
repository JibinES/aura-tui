import React from 'react';
import { render } from 'ink';
import App from './components/App';
import { player } from './services/player';
import { cacheService } from './services/cache';

const clearScreen = () => process.stdout.write('\x1Bc');

// Ensure child processes (mpv, yt-dlp) are cleaned up on any exit
const cleanup = () => {
  cacheService.cleanup();
  player.destroy();
};

process.on('SIGINT', () => { cleanup(); process.exit(0); });
process.on('SIGTERM', () => { cleanup(); process.exit(0); });
process.on('SIGHUP', () => { cleanup(); process.exit(0); });
process.on('exit', cleanup);

// Clear screen before starting
clearScreen();

render(<App />);
