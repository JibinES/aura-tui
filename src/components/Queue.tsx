import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useStore } from '../store/state';

// Violet theme colors
const theme = {
  primary: '#a855f7',
  secondary: '#c084fc',
  accent: '#8b5cf6',
  highlight: '#7c3aed',
  muted: '#6b21a8',
  text: '#e9d5ff',
  border: '#9333ea',
  active: '#d8b4fe',
  dim: '#581c87',
};

const Queue = () => {
  const { queue, currentSong, playSong, history, setView } = useStore();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');

  useInput((input, key) => {
    if (key.escape || input === 'q') {
      setView('home');
    }

    if (input === 'h') setActiveTab('history');
    if (key.tab) {
      setActiveTab(prev => prev === 'queue' ? 'history' : 'queue');
      setSelectedIndex(0);
    }

    const list = activeTab === 'queue' ? queue : history;

    if (key.downArrow) {
      setSelectedIndex(prev => Math.min(prev + 1, list.length - 1));
    }

    if (key.upArrow) {
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    }

    if (key.return && list.length > 0) {
      const song = list[selectedIndex];
      playSong(song);
    }
  });

  const displayList = activeTab === 'queue' ? queue : history;

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold underline color={activeTab === 'queue' ? theme.active : theme.muted}>
          Queue ({queue.length})
        </Text>
        <Text color={theme.dim}> | </Text>
        <Text bold underline color={activeTab === 'history' ? theme.active : theme.muted}>
          History ({history.length})
        </Text>
        <Text dimColor color={theme.dim}> (Tab to switch)</Text>
      </Box>

      {currentSong && (
        <Box marginBottom={1} borderStyle="single" borderColor={theme.primary} paddingX={1}>
          <Text bold color={theme.secondary}>Now Playing: </Text>
          <Text color={theme.text}>{currentSong.title} - {currentSong.artist}</Text>
        </Box>
      )}

      <Box flexDirection="column">
        {displayList.length === 0 ? (
          <Text dimColor color={theme.muted}>No tracks in {activeTab}.</Text>
        ) : (
          displayList.map((song, index) => (
            <Box key={`${song.id}-${index}`}>
              <Text color={index === selectedIndex ? theme.active : theme.muted}>
                {index === selectedIndex ? '> ' : '  '}
                {index + 1}. {song.title} - {song.artist}
              </Text>
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
};

export default Queue;
