import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { useStore, type Song } from '../store/state';
import {
  getAllPlaylists,
  createPlaylist,
  deletePlaylist,
  renamePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  type Playlist
} from '../services/playlists';

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

type ViewMode = 'list' | 'create' | 'viewing' | 'addSong';

const Playlists = () => {
  const { playSong, addToQueue } = useStore();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistIndex, setSelectedPlaylistIndex] = useState(0);
  const [selectedSongIndex, setSelectedSongIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [pendingSong, setPendingSong] = useState<Song | null>(null);

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = () => {
    const loaded = getAllPlaylists();
    setPlaylists(loaded);
  };

  useInput((input, key) => {
    if (viewMode === 'list') {
      if (key.upArrow) {
        setSelectedPlaylistIndex(prev => Math.max(prev - 1, 0));
      }
      if (key.downArrow) {
        setSelectedPlaylistIndex(prev => Math.min(prev + 1, playlists.length - 1));
      }
      if (key.return && playlists.length > 0) {
        const playlist = playlists[selectedPlaylistIndex];
        if (playlist) {
          setCurrentPlaylist(playlist);
          setSelectedSongIndex(0);
          setViewMode('viewing');
        }
      }
      if (input === 'n') {
        setViewMode('create');
        setNewPlaylistName('');
      }
      if (input === 'd' && playlists.length > 0) {
        const playlist = playlists[selectedPlaylistIndex];
        if (playlist) {
          deletePlaylist(playlist.id);
          loadPlaylists();
          setSelectedPlaylistIndex(prev => Math.max(0, Math.min(prev, playlists.length - 2)));
        }
      }
    } else if (viewMode === 'viewing' && currentPlaylist) {
      if (key.escape) {
        setViewMode('list');
        setCurrentPlaylist(null);
      }
      if (key.upArrow) {
        setSelectedSongIndex(prev => Math.max(prev - 1, 0));
      }
      if (key.downArrow) {
        setSelectedSongIndex(prev => Math.min(prev + 1, currentPlaylist.songs.length - 1));
      }
      if (key.return && currentPlaylist.songs.length > 0) {
        const song = currentPlaylist.songs[selectedSongIndex];
        if (song) {
          playSong(song);
        }
      }
      if (input === 'a' && currentPlaylist.songs.length > 0) {
        const song = currentPlaylist.songs[selectedSongIndex];
        if (song) {
          addToQueue(song);
        }
      }
      if (input === 'd' && currentPlaylist.songs.length > 0) {
        const song = currentPlaylist.songs[selectedSongIndex];
        if (song) {
          removeSongFromPlaylist(currentPlaylist.id, song.id);
          loadPlaylists();
          const updated = getAllPlaylists().find(p => p.id === currentPlaylist.id);
          if (updated) {
            setCurrentPlaylist(updated);
            setSelectedSongIndex(prev => Math.max(0, Math.min(prev, updated.songs.length - 1)));
          }
        }
      }
    } else if (viewMode === 'addSong') {
      if (key.escape) {
        setViewMode('list');
        setPendingSong(null);
      }
      if (key.upArrow) {
        setSelectedPlaylistIndex(prev => Math.max(prev - 1, 0));
      }
      if (key.downArrow) {
        setSelectedPlaylistIndex(prev => Math.min(prev + 1, playlists.length - 1));
      }
      if (key.return && playlists.length > 0 && pendingSong) {
        const playlist = playlists[selectedPlaylistIndex];
        if (playlist) {
          addSongToPlaylist(playlist.id, pendingSong);
          loadPlaylists();
          setPendingSong(null);
          setViewMode('list');
        }
      }
    }
  });

  const handleCreatePlaylist = (name: string) => {
    if (name.trim()) {
      createPlaylist(name.trim());
      loadPlaylists();
      setViewMode('list');
    }
  };

  if (viewMode === 'create') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color={theme.secondary}>Create New Playlist</Text>
        <Box marginTop={1}>
          <Text color={theme.accent}>Name: </Text>
          <TextInput
            value={newPlaylistName}
            onChange={setNewPlaylistName}
            onSubmit={handleCreatePlaylist}
            placeholder="My Playlist"
          />
        </Box>
        <Box marginTop={1}>
          <Text color={theme.dim}>Press Enter to create, Esc to cancel</Text>
        </Box>
      </Box>
    );
  }

  if (viewMode === 'viewing' && currentPlaylist) {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Text bold color={theme.secondary}>Playlist: </Text>
          <Text color={theme.active}>{currentPlaylist.name}</Text>
          <Text color={theme.muted}> ({currentPlaylist.songs.length} songs)</Text>
        </Box>

        {currentPlaylist.songs.length === 0 ? (
          <Box marginTop={1}>
            <Text color={theme.muted}>No songs in this playlist yet.</Text>
            <Text color={theme.dim}>Search for songs and press 'P' to add them to a playlist.</Text>
          </Box>
        ) : (
          <Box flexDirection="column">
            {currentPlaylist.songs.map((song, index) => (
              <Box key={song.id}>
                <Text color={index === selectedSongIndex ? theme.active : theme.muted}>
                  {index === selectedSongIndex ? '> ' : '  '}
                  {index + 1}. {song.title} - {song.artist}
                </Text>
              </Box>
            ))}
          </Box>
        )}

        <Box marginTop={1}>
          <Text color={theme.dim}>Enter: Play | A: Add to Queue | D: Delete | Esc: Back</Text>
        </Box>
      </Box>
    );
  }

  if (viewMode === 'addSong' && pendingSong) {
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
            <Box key={playlist.id}>
              <Text color={index === selectedPlaylistIndex ? theme.active : theme.muted}>
                {index === selectedPlaylistIndex ? '> ' : '  '}
                {playlist.name} ({playlist.songs.length} songs)
              </Text>
            </Box>
          ))}
        </Box>
        <Box marginTop={1}>
          <Text color={theme.dim}>Enter: Add to selected | Esc: Cancel</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color={theme.secondary} underline>Your Playlists</Text>

      {playlists.length === 0 ? (
        <Box marginTop={1} flexDirection="column">
          <Text color={theme.muted}>No playlists yet.</Text>
          <Text color={theme.dim}>Press 'N' to create your first playlist!</Text>
        </Box>
      ) : (
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
      )}

      <Box marginTop={1}>
        <Text color={theme.dim}>N: New Playlist | Enter: View | D: Delete | Esc: Back</Text>
      </Box>
    </Box>
  );
};

export default Playlists;
