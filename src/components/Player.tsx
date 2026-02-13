import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
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

// Equalizer component with animation
const Equalizer = ({ isPlaying }: { isPlaying: boolean }) => {
  const [bars, setBars] = useState([3, 5, 2, 6, 4, 7, 3, 5]);
  const barCount = 8;
  const maxHeight = 7;

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setBars(prev => prev.map(() => Math.floor(Math.random() * maxHeight) + 1));
    }, 200);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Build equalizer bars vertically
  const renderBars = () => {
    const lines: string[] = [];
    for (let row = maxHeight; row >= 1; row--) {
      let line = '';
      for (let col = 0; col < barCount; col++) {
        line += bars[col] >= row ? '█' : ' ';
        line += ' '; // spacing between bars
      }
      lines.push(line);
    }
    return lines;
  };

  const equalizerLines = renderBars();

  return (
    <Box flexDirection="column" alignItems="center" paddingX={1}>
      {equalizerLines.map((line, i) => (
        <Text key={i} color={i < 2 ? '#d8b4fe' : i < 4 ? '#a855f7' : '#7c3aed'}>
          {line}
        </Text>
      ))}
      <Text color="#581c87">▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔</Text>
    </Box>
  );
};

const Player = () => {
  const { currentSong, isPlaying, volume, currentTime, duration } = useStore();

  if (!currentSong) {
    return (
      <Box borderStyle="round" borderColor={theme.dim} padding={1} flexDirection="column">
        <Text color={theme.muted}>No music playing</Text>
        <Text color={theme.dim}>Press '/' to search or browse library</Text>
      </Box>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
  const progressBarWidth = 40;
  const filledWidth = Math.round((progress / 100) * progressBarWidth);
  const emptyWidth = progressBarWidth - filledWidth;
  const progressBar = '█'.repeat(filledWidth) + '░'.repeat(emptyWidth);

  return (
    <Box borderStyle="round" borderColor={theme.primary} padding={1} flexDirection="row">

      {/* Controls Section */}
      <Box flexDirection="column" flexGrow={1}>
        <Box marginBottom={1}>
          <Text bold color={theme.secondary}>Now Playing: </Text>
          <Text color={theme.text}>{currentSong.title}</Text>
        </Box>
        <Box marginBottom={1}>
          <Text color={theme.accent}>{currentSong.artist}</Text>
          <Text color={theme.muted}> - {currentSong.album || 'Unknown Album'}</Text>
        </Box>

        <Box>
          <Text color={theme.text}>{formatTime(currentTime)} </Text>
          <Text color={theme.primary}>{progressBar}</Text>
          <Text color={theme.text}> {formatTime(duration)}</Text>
        </Box>

        <Box marginTop={1} gap={2}>
          <Text color={isPlaying ? theme.active : theme.muted}>
            {isPlaying ? '▶ Playing' : '⏸ Paused'}
          </Text>
          <Text color={theme.accent}>Vol: {volume}%</Text>
          <Text color={theme.dim}> | Space: Play/Pause | n: Next | p: Prev | +/-: Volume</Text>
        </Box>
      </Box>

      {/* Equalizer Animation */}
      <Box marginLeft={2} justifyContent="center" alignItems="center">
        <Equalizer isPlaying={isPlaying} />
      </Box>
    </Box>
  );
};

export default Player;
