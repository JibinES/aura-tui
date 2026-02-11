import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { getApi } from '../api/ytmusic';
import { useStore, Song } from '../store/state';

const Home = () => {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState(0);
  const [selectedItem, setSelectedItem] = useState(0);
  const [activeLayer, setActiveLayer] = useState<'sections' | 'items'>('sections');

  const { playSong } = useStore();

  useEffect(() => {
    const fetchHome = async () => {
      try {
        const api = getApi();
        // getHomeSections works better for unauthenticated/guest users too
        const results = await api.getHomeSections();
        setSections(results);
      } catch (error) {
        console.error('Failed to fetch home:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHome();
  }, []);

  useInput(async (input, key) => {
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
        // Items layer
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
            // If it's a song/video, play it
            // Note: Home API returns mixed content (playlists, albums, songs)
            // For now, let's try to play if it looks like a song or has a videoId
            if (item.videoId) {
                const song: Song = {
                    id: item.videoId,
                    title: item.name,
                    artist: item.artist?.name || 'Unknown', // artist might be nested differently
                    album: item.album?.name,
                    duration: 0,
                    thumbnail: item.thumbnails?.[0]?.url
                };
                await playSong(song);
            } else {
                // TODO: Handle playlists/albums navigation
                // For now just log
                // console.log('Selected non-song item:', item);
            }
        }
    }
  });

  if (loading) {
    return <Text>Loading Home Feed...</Text>;
  }

  if (sections.length === 0) {
      return <Text color="red">No home sections found. Check internet or cookie.</Text>;
  }

  // Render Logic
  // Show list of sections. If active, show expanded items for that section.

  // To keep it simple for TUI:
  // Show list of sections on the left (or top), and items of selected section
  // Let's go with a vertical list of sections, and when one is selected, show its items

  const currentSection = sections[selectedSection];
  const items = currentSection.contents || [];

  return (
    <Box flexDirection="row" height="100%" padding={1}>
        {/* Sections List */}
        <Box flexDirection="column" width="30%" borderStyle="round" borderColor={activeLayer === 'sections' ? 'green' : 'gray'}>
            <Text underline bold marginBottom={1}>Sections</Text>
            {sections.map((section, idx) => (
                <Text key={idx} color={selectedSection === idx ? 'cyan' : 'white'} wrap="truncate">
                    {selectedSection === idx ? '> ' : '  '}
                    {section.title}
                </Text>
            ))}
        </Box>

        {/* Items List */}
        <Box flexDirection="column" width="70%" borderStyle="round" borderColor={activeLayer === 'items' ? 'green' : 'gray'} marginLeft={1}>
            <Text underline bold marginBottom={1}>{currentSection.title}</Text>
            {items.length === 0 ? (
                <Text>No items in this section</Text>
            ) : (
                items.map((item: any, idx: number) => (
                    <Text key={idx} color={selectedItem === idx && activeLayer === 'items' ? 'cyan' : 'white'} wrap="truncate">
                        {selectedItem === idx && activeLayer === 'items' ? '> ' : '  '}
                        {item.name} {item.artist ? `- ${item.artist.name}` : ''}
                    </Text>
                ))
            )}
        </Box>
    </Box>
  );
};

export default Home;
