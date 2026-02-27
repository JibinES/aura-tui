import YouTube from 'youtube-sr';
import { getPlayHistory } from '../utils/config';
import { getRecommendations } from '../services/ytdlp';

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
    const results = await YouTube.search(query, { limit, type: 'video' });

    return results.map(video => ({
      id: video.id || '',
      title: video.title || 'Unknown Title',
      artist: video.channel?.name || 'Unknown Artist',
      duration: video.duration ? Math.round(video.duration / 1000) : 0,
      thumbnail: video.thumbnail?.url,
      type: 'video' as const
    }));
  } catch {
    return [];
  }
};

export const getHomeSections = async (): Promise<{ title: string; contents: any[]; personalized: boolean }[]> => {
  const history = getPlayHistory();

  // If we have play history, build personalized sections from YouTube Mix
  if (history.length > 0) {
    // Pick up to 5 unique artists, most recent first
    const seen = new Set<string>();
    const seeds: { id: string; title: string; artist: string }[] = [];

    for (const entry of [...history].reverse()) {
      const key = entry.artist.toLowerCase();
      if (!seen.has(key) && entry.id) {
        seen.add(key);
        seeds.push({ id: entry.id, title: entry.title, artist: entry.artist });
        if (seeds.length >= 5) break;
      }
    }

    // Fetch recommendations in parallel
    const results = await Promise.all(
      seeds.map(async seed => {
        try {
          const recs = await getRecommendations(seed.id, 10);
          return { seed, recs };
        } catch {
          return { seed, recs: [] };
        }
      })
    );

    // Deduplicate across all sections
    const usedIds = new Set<string>();
    const homeSections: { title: string; contents: any[]; personalized: boolean }[] = [];

    for (const { seed, recs } of results) {
      if (recs.length === 0) continue;

      const deduped = recs.filter(r => {
        if (usedIds.has(r.id)) return false;
        usedIds.add(r.id);
        return true;
      });

      if (deduped.length === 0) continue;

      homeSections.push({
        title: `Based on ${seed.title}`,
        personalized: true,
        contents: deduped.slice(0, 8).map(r => ({
          videoId: r.id,
          name: r.title,
          artist: { name: r.artist },
          thumbnails: r.thumbnail ? [{ url: r.thumbnail }] : [],
          duration: r.duration
        }))
      });
    }

    if (homeSections.length > 0) return homeSections;
    // Fall through to generic if all recommendations failed
  }

  // Fallback: generic search-based sections for new users or failed recs
  const sections = [
    { title: 'Trending Music', query: 'trending music 2025' },
    { title: 'Top Hits', query: 'top hits 2025' },
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
        personalized: false,
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
