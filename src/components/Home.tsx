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
  const [selectedSection, setSelectedSection] = useState(0);
  const [selectedItem, setSelectedItem] = useState(0);
  const [activeLayer, setActiveLayer] = useState<'sections' | 'items'>('sections');

  const { playSong } = useStore();

  useEffect(() => {
    const fetchHome = async () => {
      try {
        const api = getApi();
        const results = await api.getHomeSections();
        setSections(results);
      } catch (error) {
        console.error('Failed to fetch home:', error);
        useStore.getState().setError('Failed to load home feed. Check internet or cookie.');
      } finally {
        setLoading(false);
      }
    };
    fetchHome();
  }, []);

  useInput((input, key) => {
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

        if (key.return) {
          const item = items[selectedItem];
          if (item.videoId) {
            const song: Song = {
              id: item.videoId,
              title: item.name,
              artist: item.artist?.name || 'Unknown',
              album: item.album?.name,
              duration: item.duration ? Math.round(item.duration / 1000) : 0,
              thumbnail: item.thumbnails?.[0]?.url
            };
            await playSong(song, true);
          }
        }
      }
    })().catch(err => console.error('Input handler error:', err));
  });

  if (loading) {
    return <Text color={theme.secondary}>Loading Home Feed...</Text>;
  }

  if (sections.length === 0) {
    return <Text color="#ef4444">No home sections found. Check internet or cookie.</Text>;
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
