import React, { useEffect, useRef } from 'react';
import { Box, Text, useInput } from 'ink';
import { useStore } from '../store/state';
import { getActiveLyricIndex } from '../services/lyrics';
import { theme } from '../utils/theme';

const Lyrics = () => {
  const {
    currentSong,
    currentTime,
    currentLyrics,
    plainLyrics,
    lyricsLoading,
    fetchLyricsForSong,
    setView,
  } = useStore();

  const fetchedForId = useRef<string | null>(null);

  useEffect(() => {
    if (currentSong && currentSong.id !== fetchedForId.current && !lyricsLoading) {
      fetchedForId.current = currentSong.id;
      fetchLyricsForSong(currentSong);
    }
  }, [currentSong?.id, lyricsLoading]);

  useInput((input, key) => {
    if (key.escape || input === 'y') {
      setView('player');
    }
  });

  if (!currentSong) {
    return (
      <Box flexDirection="column" paddingX={4} paddingY={2}>
        <Text color={theme.muted}>No song playing. Play a song to see lyrics.</Text>
        <Box marginTop={1}><Text color={theme.dim}>Y/Esc: Back</Text></Box>
      </Box>
    );
  }

  if (lyricsLoading) {
    return (
      <Box flexDirection="column" paddingX={4} paddingY={2}>
        <Text bold color={theme.secondary}>{currentSong.title}</Text>
        <Text color={theme.muted}>{currentSong.artist}</Text>
        <Box marginTop={2}><Text color={theme.accent}>Fetching lyrics...</Text></Box>
      </Box>
    );
  }

  // Synced lyrics — 3-line teleprompter style
  if (currentLyrics && currentLyrics.length > 0) {
    const activeIndex = getActiveLyricIndex(currentLyrics, currentTime);

    const prevLine = activeIndex > 0 ? currentLyrics[activeIndex - 1] : null;
    const activeLine = currentLyrics[activeIndex] || null;
    const nextLine = activeIndex < currentLyrics.length - 1 ? currentLyrics[activeIndex + 1] : null;

    return (
      <Box flexDirection="column" paddingX={4} paddingY={1}>
        {/* Song info */}
        <Box marginBottom={1}>
          <Text bold color={theme.secondary}>{currentSong.title}</Text>
          <Text color={theme.muted}>  {currentSong.artist}</Text>
        </Box>

        {/* 3-line lyrics display */}
        <Box flexDirection="column" paddingX={2} paddingY={1}>
          {/* Previous line */}
          <Box marginBottom={1}>
            <Text color="#581c87" dimColor>
              {prevLine ? prevLine.text : ' '}
            </Text>
          </Box>

          {/* Active line — bold, bright, stands out */}
          <Box marginBottom={1}>
            <Text color="#ffffff" bold>
              {activeLine ? activeLine.text : ' '}
            </Text>
          </Box>

          {/* Next line */}
          <Box>
            <Text color="#581c87" dimColor>
              {nextLine ? nextLine.text : ' '}
            </Text>
          </Box>
        </Box>

        <Box marginTop={1} paddingX={2}>
          <Text color={theme.dim}>Y/Esc: Back</Text>
        </Box>
      </Box>
    );
  }

  // Plain text fallback
  if (plainLyrics) {
    const lines = plainLyrics.split('\n').filter(l => l.trim());

    return (
      <Box flexDirection="column" paddingX={4} paddingY={1}>
        <Box marginBottom={1}>
          <Text bold color={theme.secondary}>{currentSong.title}</Text>
          <Text color={theme.muted}>  {currentSong.artist}</Text>
        </Box>

        <Box marginBottom={1}>
          <Text color={theme.muted}>Plain text (no sync)</Text>
        </Box>

        <Box flexDirection="column" paddingX={2}>
          {lines.slice(0, 15).map((line, i) => (
            <Text key={i} color={theme.text} wrap="truncate">
              {line}
            </Text>
          ))}
          {lines.length > 15 && (
            <Text color={theme.dim}>... {lines.length - 15} more lines</Text>
          )}
        </Box>

        <Box marginTop={1} paddingX={2}>
          <Text color={theme.dim}>Y/Esc: Back</Text>
        </Box>
      </Box>
    );
  }

  // No lyrics found
  return (
    <Box flexDirection="column" paddingX={4} paddingY={2}>
      <Text bold color={theme.secondary}>{currentSong.title}</Text>
      <Text color={theme.muted}>{currentSong.artist}</Text>
      <Box marginTop={2}><Text color={theme.muted}>No lyrics found for this song.</Text></Box>
      <Box marginTop={1}><Text color={theme.dim}>Y/Esc: Back</Text></Box>
    </Box>
  );
};

export default Lyrics;
