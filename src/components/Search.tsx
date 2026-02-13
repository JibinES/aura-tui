import React, { useState, useEffect } from 'react';
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
        addSongToPlaylist(playlist.id, pendingSong);
        setFocusMode('results');
        setPendingSong(null);
      }
    }
  });

  const handleSubmit = async (value: string) => {
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
  };

  return (
    <Box flexDirection="column" padding={1}>
      {focusMode === 'selectPlaylist' && pendingSong ? (
        <Box flexDirection="column">
          <Text bold color={theme.secondary}>Add to Playlist</Text>
          <Box marginTop={1}>
            <Text color={theme.text}>Song: {pendingSong.title} - {pendingSong.artist}</Text>
          </Box>
          <Box marginTop={1}>
            <Text color={theme.accent}>Select playlist:</Text>
          </Box>
          <Box flexDirection="column" marginTop={1}>
            {playlists.map((playlist, index) => (
              <Box key={playlist.id}>
                <Text color={index === selectedPlaylistIndex ? theme.active : theme.muted}>
                  {index === selectedPlaylistIndex ? '> ' : '  '}
                  {playlist.name} ({playlist.songs.length} songs)
                </Text>
              </Box>
            ))}
          </Box>
          <Box marginTop={1}>
            <Text color={theme.dim}>Enter: Add | Esc: Cancel</Text>
          </Box>
        </Box>
      ) : (
        <>
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
              {focusMode === 'input' ? 'Press Enter to search, Tab/Down to browse results' : 'Enter: Play | A: Add to Queue | P: Add to Playlist | Up/Esc: Return'}
            </Text>
          </Box>
        </>
      )}
    </Box>
  );
};

export default Search;
