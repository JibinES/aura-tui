import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { useStore } from '../store/state';
import { searchSongs } from '../services/ytdlp';
import { getAllPlaylists, addSongToPlaylist } from '../services/playlists';

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

// Memoized result item component to prevent unnecessary re-renders
const ResultItem = React.memo(({ song, isSelected, focusMode }: any) => (
  <Box>
    <Text color={focusMode === 'results' && isSelected ? theme.active : theme.muted}>
      {focusMode === 'results' && isSelected ? '> ' : '  '}
      {song.title} - {song.artist}
    </Text>
  </Box>
));

// Memoized playlist item component
const PlaylistItem = React.memo(({ playlist, isSelected, index }: any) => (
  <Box>
    <Text color={isSelected ? theme.active : theme.muted}>
      {isSelected ? '> ' : '  '}
      {playlist.name} ({playlist.songs.length} songs)
    </Text>
  </Box>
));

const Search = () => {
  const {
    setSearchQuery,
    setSearchResults,
    searchResults,
    playSong,
    addToQueue,
    setInputFocused
  } = useStore();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [focusMode, setFocusMode] = useState<'input' | 'results' | 'selectPlaylist'>('input');
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [selectedPlaylistIndex, setSelectedPlaylistIndex] = useState(0);
  const [pendingSong, setPendingSong] = useState<any>(null);

  useEffect(() => {
    setInputFocused(focusMode === 'input');
    return () => setInputFocused(false);
  }, [focusMode, setInputFocused]);

  // Memoize the search submission handler
  const handleSubmit = useCallback(async (value: string) => {
    if (!value.trim()) return;

    setLoading(true);
    setSearchQuery(value);
    try {
      // Use yt-dlp for search - only videos
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
  }, [setSearchQuery, setSearchResults]);

  useInput(async (input, key) => {
    if (focusMode === 'input') {
      // Tab key to escape search input
      if (key.tab || key.escape) {
        setFocusMode('results');
        if (searchResults.length > 0) {
          setSelectedIndex(0);
        }
        return;
      }
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

      // 'a' key to add to queue
      if (input === 'a') {
        const song = searchResults[selectedIndex];
        if (song) {
          addToQueue(song);
        }
      }

      // 'p' key to add to playlist
      if (input === 'p') {
        const song = searchResults[selectedIndex];
        if (song) {
          const allPlaylists = getAllPlaylists();
          if (allPlaylists.length === 0) {
            // Show message - no playlists
            return;
          }
          setPendingSong(song);
          setPlaylists(allPlaylists);
          setSelectedPlaylistIndex(0);
          setFocusMode('selectPlaylist');
        }
      }

      if (key.escape || input === '/') {
        setFocusMode('input');
      }
    }

    if (focusMode === 'selectPlaylist') {
      if (key.escape) {
        setFocusMode('results');
        setPendingSong(null);
      }

      if (key.upArrow) {
        setSelectedPlaylistIndex(prev => Math.max(prev - 1, 0));
      }

      if (key.downArrow) {
        setSelectedPlaylistIndex(prev => Math.min(prev + 1, playlists.length - 1));
      }

      if (key.return && pendingSong) {
        const playlist = playlists[selectedPlaylistIndex];
        if (playlist) {
          addSongToPlaylist(playlist.id, pendingSong);
          setFocusMode('results');
          setPendingSong(null);
        }
      }
    }
  });

  // Memoize the results rendering to avoid re-rendering on every keystroke
  const resultsDisplay = useMemo(() => {
    if (loading) {
      return <Text color={theme.secondary}>Searching...</Text>;
    }

    if (searchResults.length === 0) {
      return null;
    }

    return (
      <Box flexDirection="column" marginTop={1}>
        <Box marginBottom={1}><Text underline color={theme.secondary}>Results:</Text></Box>
        {searchResults.map((song, index) => (
          <ResultItem
            key={song.id}
            song={song}
            isSelected={index === selectedIndex}
            focusMode={focusMode}
          />
        ))}
      </Box>
    );
  }, [searchResults, selectedIndex, focusMode, loading]);

  // Memoize the help text to prevent re-rendering
  const helpText = useMemo(() => {
    return focusMode === 'input'
      ? 'Press Enter to search, Tab/Down to browse results'
      : 'Enter: Play | A: Add to Queue | P: Add to Playlist | Up/Esc: Return';
  }, [focusMode]);

  if (focusMode === 'selectPlaylist' && pendingSong) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color={theme.secondary}>Add to Playlist</Text>
        <Box marginTop={1}>
          <Text color={theme.text}>Song: {pendingSong.title} - {pendingSong.artist}</Text>
        </Box>
        <Box marginTop={1}>
          <Text color={theme.accent}>Select playlist:</Text>
        </Box>
        <Box flexDirection="column" marginTop={1}>
          {playlists.map((playlist, index) => (
            <PlaylistItem
              key={playlist.id}
              playlist={playlist}
              isSelected={index === selectedPlaylistIndex}
              index={index}
            />
          ))}
        </Box>
        <Box marginTop={1}>
          <Text color={theme.dim}>Enter: Add | Esc: Cancel</Text>
        </Box>
      </Box>
    );
  }

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

      {resultsDisplay}

      <Box marginTop={1}>
        <Text color={theme.dim} dimColor>
          {helpText}
        </Text>
      </Box>
    </Box>
  );
};

export default Search;
