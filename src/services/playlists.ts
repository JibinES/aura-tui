import Conf from 'conf';
import path from 'path';
import type { Song } from '../store/state';

export interface Playlist {
  id: string;
  name: string;
  songs: Song[];
  createdAt: number;
  updatedAt: number;
}

const playlistsConfig = new Conf<{ playlists: Playlist[] }>({
  projectName: 'ytmusic-tui',
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
