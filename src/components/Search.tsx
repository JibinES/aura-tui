import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { useStore } from '../store/state';
import { searchSongs } from '../services/ytdlp';

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

const Search = () => {
  const {
    setSearchQuery,
    setSearchResults,
    searchResults,
    playSong,
    setInputFocused
  } = useStore();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [focusMode, setFocusMode] = useState<'input' | 'results'>('input');

  useEffect(() => {
    setInputFocused(focusMode === 'input');
    return () => setInputFocused(false);
  }, [focusMode, setInputFocused]);

  useInput(async (input, key) => {
    if (focusMode === 'input') {
      if (key.downArrow && searchResults.length > 0) {
        setFocusMode('results');
        setSelectedIndex(0);
      }
      return;
    }

    if (focusMode === 'results') {
      if (key.upArrow) {
        if (selectedIndex === 0) {
          setFocusMode('input');
        } else {
          setSelectedIndex(prev => prev - 1);
        }
      }

      if (key.downArrow) {
        setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1));
      }

      if (key.return) {
        const song = searchResults[selectedIndex];
        if (song) {
          await playSong(song);
        }
      }

      if (key.escape || input === '/') {
        setFocusMode('input');
      }
    }
  });

  const handleSubmit = async (value: string) => {
    if (!value.trim()) return;

    setLoading(true);
    setSearchQuery(value);
    try {
      // Use yt-dlp for search
      const results = await searchSongs(value, 15);

      const mappedResults = results.map((item) => ({
        id: item.id,
        title: item.title,
        artist: item.artist,
        album: item.album,
        duration: item.duration || 0,
        thumbnail: item.thumbnail
      }));

      setSearchResults(mappedResults);
      setSelectedIndex(0);
      if (mappedResults.length > 0) {
        setFocusMode('results');
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box>
        <Text bold color={focusMode === 'input' ? theme.active : theme.muted}>Search: </Text>
        <TextInput
          value={query}
          onChange={setQuery}
          onSubmit={handleSubmit}
          placeholder="Type song name..."
          focus={focusMode === 'input'}
        />
      </Box>

      {loading && <Text color={theme.secondary}>Searching...</Text>}

      {!loading && searchResults.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text underline color={theme.secondary} marginBottom={1}>Results:</Text>
          {searchResults.map((song, index) => (
            <Box key={song.id}>
              <Text color={focusMode === 'results' && index === selectedIndex ? theme.active : theme.muted}>
                {focusMode === 'results' && index === selectedIndex ? '> ' : '  '}
                {song.title} - {song.artist}
              </Text>
            </Box>
          ))}
        </Box>
      )}

      <Box marginTop={1}>
        <Text color={theme.dim} dimColor>
          {focusMode === 'input' ? 'Press Enter to search, Down to browse results' : 'Press Enter to play, Up/Esc to return to search'}
        </Text>
      </Box>
    </Box>
  );
};

export default Search;
