import React from 'react';
import { Box, Text } from 'ink';
import AlbumArt from '../utils/ascii-art';
import { useStore } from '../store/state';

const Player = () => {
  const { currentSong, isPlaying, volume, currentTime, duration } = useStore();

  if (!currentSong) {
    return (
      <Box borderStyle="round" borderColor="gray" padding={1} flexDirection="column">
        <Text color="gray">No music playing</Text>
        <Text color="gray">Press '/' to search or browse library</Text>
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
    <Box borderStyle="round" borderColor="green" padding={1} flexDirection="row">
        {/* Album Art Section */}
        {currentSong.thumbnail && (
            <Box marginRight={2} width={22} justifyContent="center" alignItems="center">
                 <AlbumArt url={currentSong.thumbnail} width={20} />
            </Box>
        )}

        {/* Controls Section */}
        <Box flexDirection="column" flexGrow={1}>
            <Box marginBottom={1}>
                <Text bold color="green">Now Playing: </Text>
                <Text>{currentSong.title}</Text>
            </Box>
            <Box marginBottom={1}>
                <Text color="blue">{currentSong.artist}</Text>
                <Text color="gray"> - {currentSong.album || 'Unknown Album'}</Text>
            </Box>

            <Box>
                <Text>{formatTime(currentTime)} </Text>
                <Text color="green">{progressBar}</Text>
                <Text> {formatTime(duration)}</Text>
            </Box>

            <Box marginTop={1} gap={2}>
                <Text>{isPlaying ? '▶ Playing' : '⏸ Paused'}</Text>
                <Text>Vol: {volume}%</Text>
            </Box>
      </Box>
    </Box>
  );
};

export default Player;
