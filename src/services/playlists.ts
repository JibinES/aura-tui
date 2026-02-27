import Conf from 'conf';
import path from 'path';
import YouTube from 'youtube-sr';
import type { Song } from '../store/state';

export interface Playlist {
  id: string;
  name: string;
  songs: Song[];
  createdAt: number;
  updatedAt: number;
}

const playlistsConfig = new Conf<{ playlists: Playlist[] }>({
  projectName: 'aura-tui',
  configName: 'playlists',
  defaults: {
    playlists: []
  }
});

export const getAllPlaylists = (): Playlist[] => {
  return playlistsConfig.get('playlists');
};

export const getPlaylist = (id: string): Playlist | undefined => {
  const playlists = getAllPlaylists();
  return playlists.find(p => p.id === id);
};

export const createPlaylist = (name: string): Playlist => {
  const playlists = getAllPlaylists();

  const newPlaylist: Playlist = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name,
    songs: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  playlists.push(newPlaylist);
  playlistsConfig.set('playlists', playlists);

  return newPlaylist;
};

export const deletePlaylist = (id: string): boolean => {
  const playlists = getAllPlaylists();
  const filtered = playlists.filter(p => p.id !== id);

  if (filtered.length === playlists.length) {
    return false; // Playlist not found
  }

  playlistsConfig.set('playlists', filtered);
  return true;
};

export const renamePlaylist = (id: string, newName: string): boolean => {
  const playlists = getAllPlaylists();
  const playlist = playlists.find(p => p.id === id);

  if (!playlist) return false;

  playlist.name = newName;
  playlist.updatedAt = Date.now();

  playlistsConfig.set('playlists', playlists);
  return true;
};

export const addSongToPlaylist = (playlistId: string, song: Song): boolean => {
  const playlists = getAllPlaylists();
  const playlist = playlists.find(p => p.id === playlistId);

  if (!playlist) return false;

  // Check if song already exists in playlist
  const exists = playlist.songs.some(s => s.id === song.id);
  if (exists) return false;

  playlist.songs.push(song);
  playlist.updatedAt = Date.now();

  playlistsConfig.set('playlists', playlists);
  return true;
};

export const removeSongFromPlaylist = (playlistId: string, songId: string): boolean => {
  const playlists = getAllPlaylists();
  const playlist = playlists.find(p => p.id === playlistId);

  if (!playlist) return false;

  const originalLength = playlist.songs.length;
  playlist.songs = playlist.songs.filter(s => s.id !== songId);

  if (playlist.songs.length === originalLength) {
    return false; // Song not found
  }

  playlist.updatedAt = Date.now();
  playlistsConfig.set('playlists', playlists);
  return true;
};

export const getPlaylistPath = (): string => {
  return playlistsConfig.path;
};

// Extract playlist ID from YouTube/YouTube Music URL
const extractPlaylistId = (url: string): string | null => {
  const patterns = [
    /[?&]list=([a-zA-Z0-9_-]+)/,
    /playlist\?list=([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};

// Import a YouTube playlist by URL
export const importYouTubePlaylist = async (
  url: string,
  playlistName?: string
): Promise<{ success: boolean; playlist?: Playlist; error?: string }> => {
  try {
    const playlistId = extractPlaylistId(url);
    if (!playlistId) {
      return { success: false, error: 'Invalid playlist URL' };
    }

    const ytPlaylist = await YouTube.getPlaylist(url);
    if (!ytPlaylist || !ytPlaylist.videos || ytPlaylist.videos.length === 0) {
      return { success: false, error: 'Could not fetch playlist or playlist is empty' };
    }

    const name = playlistName || ytPlaylist.title || 'Imported Playlist';
    const songs: Song[] = ytPlaylist.videos.map((video) => ({
      id: video.id || '',
      title: video.title || 'Unknown Title',
      artist: video.channel?.name || 'Unknown Artist',
      duration: video.duration ? Math.round(video.duration / 1000) : 0,
      thumbnail: video.thumbnail?.url || '',
    }));

    // Create new playlist with imported songs
    const playlists = getAllPlaylists();
    const newPlaylist: Playlist = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
      name,
      songs,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    playlists.push(newPlaylist);
    playlistsConfig.set('playlists', playlists);

    return { success: true, playlist: newPlaylist };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import playlist'
    };
  }
};
