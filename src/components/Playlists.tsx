import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { getScrollWindow } from '../utils/scrollWindow';
import { useStore, type Song } from '../store/state';
import {
  getAllPlaylists,
  createPlaylist,
  deletePlaylist,
  renamePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  importYouTubePlaylist,
  type Playlist
} from '../services/playlists';
import { theme } from '../utils/theme';

type ViewMode = 'list' | 'create' | 'viewing' | 'addSong' | 'import';

const Playlists = () => {
  const { playSong, addToQueue, playPlaylist, shuffle, toggleShuffle, autoplay, toggleAutoplay } = useStore();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistIndex, setSelectedPlaylistIndex] = useState(0);
  const [selectedSongIndex, setSelectedSongIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [importUrl, setImportUrl] = useState('');
  const [importStatus, setImportStatus] = useState<{ loading: boolean; error?: string }>({ loading: false });
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [pendingSong, setPendingSong] = useState<Song | null>(null);

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = () => {
    const loaded = getAllPlaylists();
    setPlaylists(loaded);
    // Refresh currentPlaylist if it exists to avoid stale state
    if (currentPlaylist) {
      const updated = loaded.find(p => p.id === currentPlaylist.id);
      if (updated) {
        setCurrentPlaylist(updated);
      } else {
        // Playlist was deleted externally
        setCurrentPlaylist(null);
        setViewMode('list');
      }
    }
  };

  useInput((input, key) => {
    // Allow escaping from create/import modes
    if ((viewMode === 'create' || viewMode === 'import') && key.escape) {
      setViewMode('list');
      setNewPlaylistName('');
      setImportUrl('');
      setImportStatus({ loading: false });
      return;
    }

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
      if (input === 'i') {
        setViewMode('import');
        setImportUrl('');
        setImportStatus({ loading: false });
      }
      if (input === 'd' && playlists.length > 0) {
        const playlist = playlists[selectedPlaylistIndex];
        if (playlist) {
          deletePlaylist(playlist.id);
          const updated = getAllPlaylists();
          setPlaylists(updated);
          setSelectedPlaylistIndex(prev => Math.max(0, Math.min(prev, updated.length - 1)));
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
        // Play the selected song and queue the rest of the playlist
        playPlaylist(currentPlaylist.songs, selectedSongIndex, currentPlaylist.id);
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
          // Read fresh data directly from disk after mutation
          const freshPlaylists = getAllPlaylists();
          setPlaylists(freshPlaylists);
          const updated = freshPlaylists.find(p => p.id === currentPlaylist.id);
          if (updated) {
            setCurrentPlaylist(updated);
            setSelectedSongIndex(prev => Math.max(0, Math.min(prev, updated.songs.length - 1)));
          }
        }
      }
      // Toggle shuffle
      if (input === 's') {
        toggleShuffle();
      }
      // Toggle autoplay
      if (input === 'r') {
        toggleAutoplay();
      }
      // Play all from beginning
      if (input === 'p' && currentPlaylist.songs.length > 0) {
        playPlaylist(currentPlaylist.songs, 0, currentPlaylist.id);
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
      // Read fresh data directly so state is updated before switching view
      const freshPlaylists = getAllPlaylists();
      setPlaylists(freshPlaylists);
      setViewMode('list');
    }
  };

  const handleImportPlaylist = async (url: string) => {
    if (!url.trim()) return;

    setImportStatus({ loading: true });
    const result = await importYouTubePlaylist(url.trim());

    if (result.success) {
      loadPlaylists();
      setViewMode('list');
      setImportUrl('');
      setImportStatus({ loading: false });
    } else {
      setImportStatus({ loading: false, error: result.error });
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

  if (viewMode === 'import') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color={theme.secondary}>Import YouTube Playlist</Text>
        <Box marginTop={1}>
          <Text color={theme.accent}>Paste URL: </Text>
          <TextInput
            value={importUrl}
            onChange={setImportUrl}
            onSubmit={handleImportPlaylist}
            placeholder="https://youtube.com/playlist?list=..."
          />
        </Box>
        {importStatus.loading && (
          <Box marginTop={1}>
            <Text color={theme.active}>Importing playlist...</Text>
          </Box>
        )}
        {importStatus.error && (
          <Box marginTop={1}>
            <Text color="#ef4444">Error: {importStatus.error}</Text>
          </Box>
        )}
        <Box marginTop={1}>
          <Text color={theme.dim}>Press Enter to import, Esc to cancel</Text>
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

        <Box marginBottom={1}>
          <Text color={shuffle ? theme.active : theme.dim}>
            [S]huffle: {shuffle ? 'ON' : 'OFF'}
          </Text>
          <Text color={theme.muted}> | </Text>
          <Text color={autoplay ? theme.active : theme.dim}>
            Auto[P]lay: {autoplay ? 'ON' : 'OFF'}
          </Text>
        </Box>

        {currentPlaylist.songs.length === 0 ? (
          <Box marginTop={1}>
            <Text color={theme.muted}>No songs in this playlist yet.</Text>
            <Text color={theme.dim}>Search for songs and press 'P' to add them to a playlist.</Text>
          </Box>
        ) : (
          <Box flexDirection="column">
            {(() => {
              const { start, end } = getScrollWindow(currentPlaylist.songs.length, selectedSongIndex);
              return (
                <>
                  {start > 0 && <Text color={theme.dim}>  ↑ {start} more above</Text>}
                  {currentPlaylist.songs.slice(start, end).map((song, i) => {
                    const index = start + i;
                    return (
                      <Box key={song.id}>
                        <Text color={index === selectedSongIndex ? theme.active : theme.muted}>
                          {index === selectedSongIndex ? '> ' : '  '}
                          {index + 1}. {song.title} - {song.artist}
                        </Text>
                      </Box>
                    );
                  })}
                  {end < currentPlaylist.songs.length && <Text color={theme.dim}>  ↓ {currentPlaylist.songs.length - end} more below</Text>}
                </>
              );
            })()}
          </Box>
        )}

        <Box marginTop={1}>
          <Text color={theme.dim}>Enter: Play All | P: Play from Start | A: Queue | S: Shuffle | R: Autoplay | D: Delete | Esc: Back</Text>
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
        <Text color={theme.dim}>N: New | I: Import YouTube | Enter: View | D: Delete | Esc: Back</Text>
      </Box>
    </Box>
  );
};

export default Playlists;
