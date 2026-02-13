import YouTube from 'youtube-sr';
import { getCookie } from '../utils/config';

// Note: ytmusic-api is currently being blocked by YouTube with 400 errors
// We're using youtube-sr as a more reliable alternative

let isInitialized = false;

export const initializeApi = async (): Promise<void> => {
  if (isInitialized) return;

  const cookie = getCookie();

  // youtube-sr doesn't need explicit initialization
  // It works out of the box without authentication
  // Cookie is mainly for personalized features which we'll handle separately

  isInitialized = true;

  console.log('YouTube Search API initialized (using youtube-sr)');
  if (cookie && cookie.length > 100) {
    console.log('Cookie detected (length:', cookie.length, ') - personalized features available');
  } else {
    console.log('No cookie - using public search only');
  }
};

export interface SearchResult {
  id: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail?: string;
  type: 'video' | 'playlist' | 'channel';
}

export const searchVideos = async (query: string, limit: number = 20): Promise<SearchResult[]> => {
  try {
    const results = await YouTube.search(query, { limit });

    return results.map(video => ({
      id: video.id || '',
      title: video.title || 'Unknown Title',
      artist: video.channel?.name || 'Unknown Artist',
      duration: video.duration || 0,
      thumbnail: video.thumbnail?.url,
      type: 'video' as const
    }));
  } catch (error) {
    console.error('Search failed:', error);
    return [];
  }
};

export const getHomeSections = async () => {
  // For home sections, we'll create curated playlists
  // Since we can't access personalized YouTube Music data without working auth
  const sections = [
    { title: 'Trending Music', query: 'trending music 2024' },
    { title: 'Top Hits', query: 'top hits 2024' },
    { title: 'Rock Classics', query: 'rock classics' },
    { title: 'Pop Music', query: 'pop music hits' },
    { title: 'Lo-fi Beats', query: 'lofi hip hop' },
    { title: 'Electronic', query: 'electronic music' },
  ];

  const homeSections = await Promise.all(
    sections.map(async section => {
      const results = await searchVideos(section.query, 10);
      return {
        title: section.title,
        contents: results.map(r => ({
          videoId: r.id,
          name: r.title,
          artist: { name: r.artist },
          thumbnails: r.thumbnail ? [{ url: r.thumbnail }] : [],
          duration: r.duration
        }))
      };
    })
  );

  return homeSections;
};

export const getApi = () => {
  // For compatibility with existing code
  return {
    search: async (query: string, type: string = 'video') => {
      const results = await searchVideos(query, 20);
      return results.map(r => ({
        videoId: r.id,
        name: r.title,
        artist: { name: r.artist },
        thumbnails: r.thumbnail ? [{ url: r.thumbnail }] : [],
        duration: r.duration
      }));
    },
    searchSongs: async (query: string) => {
      const results = await searchVideos(query, 20);
      return results.map(r => ({
        videoId: r.id,
        name: r.title,
        artist: { name: r.artist },
        album: { name: '' },
        thumbnails: r.thumbnail ? [{ url: r.thumbnail }] : [],
        duration: r.duration
      }));
    },
    getHomeSections: getHomeSections,
  };
};

export const isAuthenticated = (): boolean => {
  const cookie = getCookie();
  return !!(cookie && cookie.length > 100);
};
