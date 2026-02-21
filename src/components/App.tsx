import React, { useEffect, useState } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { useStore } from '../store/state';
import { initializeApi } from '../api/ytmusic';
import { isFirstRun, markSetupCompleted, resetCookie } from '../utils/config';
import { cacheService } from '../services/cache';
import { player } from '../services/player';
import { execSync } from 'child_process';
import Player from './Player';
import Home from './Home';
import Search from './Search';
import Queue from './Queue';
import Help from './Help';
import Playlists from './Playlists';
import StartupAnimation from './StartupAnimation';
import Setup from './Setup';
import { theme } from '../utils/theme';

// Anime girl ASCII art - always visible in the TUI
const animeGirl = `
               ____
             .'* *.'
          __/_*_*(_
         / _______ \\
        _\\_)/___\\(_/_
       / _((\\- -/))_ \\
       \\ \\())(-)(()/ /
        ' \\(((()))/ '
       / ' \\)).))/ ' \\
      / _ \\ - | - /_  \\
     (   ( .;''';. .'  )
     _\\"__ /    )\\ __"/_
       \\/  \\   ' /  \\/
        .'  '...' ' )
         / /  |  \\ \\
        / .   .   . \\
       /   .     .   \\
      /   /   |   \\   \\
    .'   /    b    '.  '.
_.-'    /     Bb     '-. '-._
`;

type AppPhase = 'startup' | 'depcheck' | 'setup' | 'main';

const App = () => {
  const { view, setView, isInputFocused, errorMessage } = useStore();
  const { exit } = useApp();
  const [appState, setAppState] = useState<AppPhase>('startup');
  const [missingDeps, setMissingDeps] = useState<string[]>([]);

  useEffect(() => {
    // Initialize API on startup (after setup is complete)
    if (appState === 'main') {
      initializeApi().catch(console.error);
    }
  }, [appState]);

  // Dependency check
  useEffect(() => {
    if (appState !== 'depcheck') return;

    const missing: string[] = [];
    try { execSync('which mpv', { stdio: 'ignore' }); } catch { missing.push('mpv'); }
    try { execSync('which yt-dlp', { stdio: 'ignore' }); } catch { missing.push('yt-dlp'); }

    if (missing.length > 0) {
      setMissingDeps(missing);
    } else {
      if (isFirstRun()) {
        setAppState('setup');
      } else {
        setAppState('main');
      }
    }
  }, [appState]);

  const handleStartupComplete = () => {
    setAppState('depcheck');
  };

  const handleSetupComplete = () => {
    markSetupCompleted();
    setAppState('main');
  };

  useInput((input, key) => {
    // Only handle input in main app state
    if (appState !== 'main') return;

    // Don't handle global shortcuts if input is focused
    if (isInputFocused) return;

    // Quit with Ctrl+Q
    if (input === 'q' && key.ctrl) {
      cacheService.cleanup();
      player.destroy();
      exit();
    }

    // Navigation
    if (input === '1') setView('home');
    if (input === '2') setView('search');
    if (input === '3') setView('queue');
    if (input === '4') setView('playlists');
    if (input === '?') setView('help');
    if (input === '/') setView('search');

    // Reset cookie - press Ctrl+R to reset and go back to setup
    if (input === 'r' && key.ctrl) {
      resetCookie();
      setAppState('setup');
    }

    // Playback Controls
    const { togglePlay, nextTrack, prevTrack, setVolume, volume, view, seek, cycleRepeatMode } = useStore.getState();

    if (input === ' ') togglePlay();
    // Only bind n/p for track navigation when not in views that use those keys
    if (view !== 'playlists' && view !== 'search') {
      if (input === 'n') nextTrack();
      if (input === 'p') prevTrack();
    }
    if (input === '+' || input === '=') setVolume(Math.min(100, volume + 5));
    if (input === '-' || input === '_') setVolume(Math.max(0, volume - 5));

    // Seek controls
    if (input === ',') seek(-5);
    if (input === '.') seek(5);

    // Repeat mode
    if (input === 'l') cycleRepeatMode();
  });

  // Show startup animation
  if (appState === 'startup') {
    return <StartupAnimation onComplete={handleStartupComplete} duration={2500} />;
  }

  // Show dependency check / missing deps screen
  if (appState === 'depcheck' && missingDeps.length > 0) {
    return (
      <Box flexDirection="column" padding={2} borderStyle="round" borderColor={theme.error}>
        <Text bold color={theme.error}>Missing Dependencies</Text>
        <Box marginTop={1} flexDirection="column">
          {missingDeps.includes('mpv') && (
            <Box flexDirection="column" marginBottom={1}>
              <Text color={theme.warning}>mpv is not installed.</Text>
              <Text color={theme.text}>  macOS:  brew install mpv</Text>
              <Text color={theme.text}>  Ubuntu: sudo apt install mpv</Text>
              <Text color={theme.text}>  Arch:   sudo pacman -S mpv</Text>
            </Box>
          )}
          {missingDeps.includes('yt-dlp') && (
            <Box flexDirection="column" marginBottom={1}>
              <Text color={theme.warning}>yt-dlp is not installed.</Text>
              <Text color={theme.text}>  pip install yt-dlp</Text>
              <Text color={theme.text}>  or: brew install yt-dlp</Text>
            </Box>
          )}
        </Box>
        <Box marginTop={1}>
          <Text color={theme.dim}>Install the missing tools and restart AuraTUI.</Text>
        </Box>
        <Box marginTop={1}>
          <Text color={theme.dim}>Press Ctrl+C to exit.</Text>
        </Box>
      </Box>
    );
  }

  // Show setup screen for first run
  if (appState === 'setup') {
    return <Setup onComplete={handleSetupComplete} />;
  }

  const renderView = () => {
    switch (view) {
      case 'home': return <Home />;
      case 'search': return <Search />;
      case 'queue': return <Queue />;
      case 'playlists': return <Playlists />;
      case 'help': return <Help />;
      default: return <Home />;
    }
  };

  return (
    <Box flexDirection="column" height="100%">
      {/* Header with navigation */}
      <Box borderStyle="round" borderColor={theme.border} paddingX={1}>
        <Text bold color={theme.secondary}>AuraTUI</Text>
        <Box marginLeft={2}>
          <Text color={view === 'home' ? theme.active : theme.muted}>[1] Home </Text>
          <Text color={view === 'search' ? theme.active : theme.muted}>[2] Search </Text>
          <Text color={view === 'queue' ? theme.active : theme.muted}>[3] Queue </Text>
          <Text color={view === 'playlists' ? theme.active : theme.muted}>[4] Playlists </Text>
          <Text color={view === 'help' ? theme.active : theme.muted}>[?] Help</Text>
          <Text color={theme.dim}> | Ctrl+Q: Quit</Text>
        </Box>
      </Box>

      {/* Error banner */}
      {errorMessage && (
        <Box paddingX={1}>
          <Text color={theme.error} bold>Error: {errorMessage}</Text>
        </Box>
      )}

      {/* Main content area with anime girl on the left */}
      <Box flexGrow={1} flexDirection="row">
        {/* Anime girl sidebar */}
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor={theme.highlight}
          paddingX={1}
          width={36}
          alignItems="center"
        >
          <Text color={theme.secondary}>{animeGirl}</Text>
          <Text bold color={theme.active}>♪ AuraTUI ♪</Text>
        </Box>

        {/* Main view content */}
        <Box flexGrow={1}>
          {renderView()}
        </Box>
      </Box>

      {/* Player at the bottom */}
      <Player />
    </Box>
  );
};

export default App;
