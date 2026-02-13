import React, { useEffect, useState } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { useStore } from '../store/state';
import { initializeApi } from '../api/ytmusic';
import { isFirstRun, markSetupCompleted, resetCookie } from '../utils/config';
import Player from './Player';
import Home from './Home';
import Search from './Search';
import Queue from './Queue';
import Help from './Help';
import Playlists from './Playlists';
import StartupAnimation from './StartupAnimation';
import Setup from './Setup';

// Violet theme colors
const theme = {
  primary: '#a855f7',      // Purple 500
  secondary: '#c084fc',    // Purple 400
  accent: '#8b5cf6',       // Violet 500
  highlight: '#7c3aed',    // Violet 600
  muted: '#6b21a8',        // Purple 800
  text: '#e9d5ff',         // Purple 200
  border: '#9333ea',       // Purple 600
  active: '#d8b4fe',       // Purple 300
  dim: '#581c87',          // Purple 900
};

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

type AppState = 'startup' | 'setup' | 'main';

const App = () => {
  const { view, setView, isInputFocused } = useStore();
  const { exit } = useApp();
  const [appState, setAppState] = useState<AppState>('startup');

  useEffect(() => {
    // Initialize API on startup (after setup is complete)
    if (appState === 'main') {
      initializeApi().catch(console.error);
    }
  }, [appState]);

  const handleStartupComplete = () => {
    if (isFirstRun()) {
      setAppState('setup');
    } else {
      setAppState('main');
    }
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
      exit();
    }

    // Navigation
    if (input === '1') setView('home');
    if (input === '2') setView('search');
    if (input === '4') setView('queue');
    if (input === '5') setView('playlists');
    if (input === '?') setView('help');
    if (input === '/') setView('search');

    // Reset cookie - press Ctrl+R to reset and go back to setup
    if (input === 'r' && key.ctrl) {
      resetCookie();
      setAppState('setup');
    }

    // Playback Controls
    const { togglePlay, nextTrack, prevTrack, setVolume, volume } = useStore.getState();

    if (input === ' ') togglePlay();
    if (input === 'n') nextTrack();
    if (input === 'p') prevTrack();
    if (input === '+' || input === '=') setVolume(Math.min(100, volume + 5));
    if (input === '-' || input === '_') setVolume(Math.max(0, volume - 5));
  });

  // Show startup animation
  if (appState === 'startup') {
    return <StartupAnimation onComplete={handleStartupComplete} duration={2500} />;
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
          <Text color={view === 'queue' ? theme.active : theme.muted}>[4] Queue </Text>
          <Text color={view === 'playlists' ? theme.active : theme.muted}>[5] Playlists </Text>
          <Text color={view === 'help' ? theme.active : theme.muted}>[?] Help</Text>
          <Text color={theme.dim}> | Ctrl+Q: Quit</Text>
        </Box>
      </Box>

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
