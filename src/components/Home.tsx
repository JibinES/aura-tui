import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { getApi } from '../api/ytmusic';
import { useStore, type Song } from '../store/state';
import { theme } from '../utils/theme';
import { getScrollWindow } from '../utils/scrollWindow';

interface HomeSection {
  title: string;
  personalized?: boolean;
  contents: Array<{
    videoId?: string;
    name: string;
    artist?: { name: string };
    album?: { name: string };
    duration?: number;
    thumbnails?: Array<{ url: string }>;
  }>;
}

const Home = () => {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState(0);
  const [selectedItem, setSelectedItem] = useState(0);
  const [activeLayer, setActiveLayer] = useState<'sections' | 'items'>('sections');
  const [actionLock, setActionLock] = useState(false);

  const { playSong } = useStore();

  const fetchHome = async () => {
    setLoading(true);
    setError(null);
    try {
      const api = getApi();
      // Race the fetch against a 20s timeout so UI never hangs forever
      const results = await Promise.race([
        api.getHomeSections(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 20000)
        ),
      ]);
      setSections(results);
    } catch {
      setError('Could not connect to the internet. Press R to retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHome(); }, []);

  useInput((input, key) => {
    // Allow retry even while showing error
    if (error && (input === 'r' || input === 'R') && !loading) {
      fetchHome();
      return;
    }

    (async () => {
      if (loading || sections.length === 0) return;

      if (activeLayer === 'sections') {
        if (key.downArrow) {
          setSelectedSection(prev => Math.min(prev + 1, sections.length - 1));
          setSelectedItem(0);
        }
        if (key.upArrow) {
          setSelectedSection(prev => Math.max(prev - 1, 0));
          setSelectedItem(0);
        }
        if (key.rightArrow || key.return) {
          setActiveLayer('items');
        }
      } else {
        const currentSection = sections[selectedSection];
        const items = currentSection.contents || [];

        if (key.leftArrow || key.escape) {
          setActiveLayer('sections');
        }

        if (key.downArrow) {
          setSelectedItem(prev => Math.min(prev + 1, items.length - 1));
        }

        if (key.upArrow) {
          setSelectedItem(prev => Math.max(prev - 1, 0));
        }

        if (key.return && !actionLock) {
          const item = items[selectedItem];
          if (item?.videoId) {
            const song: Song = {
              id: item.videoId,
              title: item.name,
              artist: item.artist?.name || 'Unknown',
              album: item.album?.name,
              duration: item.duration ? Math.round(item.duration / 1000) : 0,
              thumbnail: item.thumbnails?.[0]?.url
            };
            setActionLock(true);
            try { await playSong(song, true); } finally { setActionLock(false); }
          }
        }
      }
    })().catch(() => {});
  });

  if (loading) {
    return (
      <Box padding={1}>
        <Text color={theme.secondary}>Loading Home Feed...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color={theme.error}>{error}</Text>
        <Box marginTop={1}>
          <Text color={theme.dim}>Navigation still works — try Search [2] or Playlists [4]</Text>
        </Box>
      </Box>
    );
  }

  if (sections.length === 0) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color={theme.muted}>No home sections found. Press R to retry.</Text>
        <Box marginTop={1}>
          <Text color={theme.dim}>Navigation still works — try Search [2] or Playlists [4]</Text>
        </Box>
      </Box>
    );
  }

  const currentSection = sections[selectedSection];
  const items = currentSection.contents || [];
  const isPersonalized = sections.some(s => s.personalized);

  return (
    <Box flexDirection="row" height="100%" padding={1}>
      {/* Sections List */}
      <Box
        flexDirection="column"
        width="30%"
        borderStyle="round"
        borderColor={activeLayer === 'sections' ? theme.primary : theme.dim}
      >
        <Box marginBottom={1}><Text underline bold color={theme.secondary}>{isPersonalized ? 'For You' : 'Discover'}</Text></Box>
        {(() => {
          const { start, end } = getScrollWindow(sections.length, selectedSection);
          return (
            <>
              {start > 0 && <Text color={theme.dim}>  ↑ {start} more</Text>}
              {sections.slice(start, end).map((section, i) => {
                const idx = start + i;
                return (
                  <Text
                    key={idx}
                    color={selectedSection === idx ? theme.active : theme.muted}
                    wrap="truncate"
                  >
                    {selectedSection === idx ? '> ' : '  '}
                    {section.title}
                  </Text>
                );
              })}
              {end < sections.length && <Text color={theme.dim}>  ↓ {sections.length - end} more</Text>}
            </>
          );
        })()}
      </Box>

      {/* Items List */}
      <Box
        flexDirection="column"
        width="70%"
        borderStyle="round"
        borderColor={activeLayer === 'items' ? theme.primary : theme.dim}
        marginLeft={1}
      >
        <Box marginBottom={1}><Text underline bold color={theme.secondary}>{currentSection.title}</Text></Box>
        {items.length === 0 ? (
          <Text color={theme.muted}>No items in this section</Text>
        ) : (
          (() => {
            const { start, end } = getScrollWindow(items.length, selectedItem);
            return (
              <>
                {start > 0 && <Text color={theme.dim}>  ↑ {start} more</Text>}
                {items.slice(start, end).map((item: any, i: number) => {
                  const idx = start + i;
                  return (
                    <Text
                      key={idx}
                      color={selectedItem === idx && activeLayer === 'items' ? theme.active : theme.muted}
                      wrap="truncate"
                    >
                      {selectedItem === idx && activeLayer === 'items' ? '> ' : '  '}
                      {item.name} {item.artist ? `- ${item.artist.name}` : ''}
                    </Text>
                  );
                })}
                {end < items.length && <Text color={theme.dim}>  ↓ {items.length - end} more</Text>}
              </>
            );
          })()
        )}
      </Box>
    </Box>
  );
};

export default Home;
