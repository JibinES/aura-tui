import React, { useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { useStore } from '../store/state';
import { initializeApi } from '../api/ytmusic';
import Player from './Player';
import Home from './Home';
import Search from './Search';
import Queue from './Queue';
import Help from './Help';

const App = () => {
  const { view, setView, isInputFocused } = useStore();
  const { exit } = useApp();


  useEffect(() => {
    // Initialize API on startup
    initializeApi().catch(console.error);
  }, []);

  useInput((input, key) => {
    // Don't handle global shortcuts if input is focused
    if (isInputFocused) return;

    if (key.escape || (input === 'q' && view === 'home')) {
      // confirm exit?
      exit();
    }

    // Navigation
    if (input === '1') setView('home');
    if (input === '2') setView('search');
    if (input === '3') setView('library');
    if (input === '4') setView('queue');
    if (input === '?') setView('help');
    if (input === '/') setView('search');

    // Playback Controls
    const { togglePlay, nextTrack, prevTrack, setVolume, volume } = useStore.getState();

    if (input === ' ') togglePlay();
    if (input === 'n') nextTrack();
    if (input === 'p') prevTrack();
    if (input === '+' || input === '=') setVolume(Math.min(100, volume + 5));
    if (input === '-' || input === '_') setVolume(Math.max(0, volume - 5));
  });

  const renderView = () => {
    switch (view) {
      case 'home': return <Home />;
      case 'search': return <Search />;
      case 'library': return <Library />;
      case 'queue': return <Queue />;
      case 'help': return <Help />;
      default: return <Home />;
    }
  };

  return (
    <Box flexDirection="column" height="100%">
      <Box borderStyle="classic" borderColor="cyan" paddingX={1}>
        <Text bold>AuraTUI</Text>
        <Box marginLeft={2}>
            <Text color={view === 'home' ? 'green' : 'white'}>[1] Home </Text>
            <Text color={view === 'search' ? 'green' : 'white'}>[2] Search </Text>
            <Text color={view === 'library' ? 'green' : 'white'}>[3] Library </Text>
            <Text color={view === 'queue' ? 'green' : 'white'}>[4] Queue </Text>
            <Text color={view === 'help' ? 'green' : 'white'}>[?] Help</Text>
        </Box>
      </Box>

      <Box flexGrow={1}>
        {renderView()}
      </Box>

      <Player />
    </Box>
  );
};

export default App;
