import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { isAuthenticated, getApi } from '../api/ytmusic';
import { getCookie } from '../utils/config';

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

const Library = () => {
  const [authed, setAuthed] = useState(false);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const isAuthed = isAuthenticated();
      setAuthed(isAuthed);

      if (isAuthed) {
        setLoading(true);
        try {
          const api = getApi();
        } catch (error) {
          console.error('Library fetch failed:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    checkAuth();
  }, []);

  if (!authed) {
    return (
      <Box flexDirection="column" padding={1} borderStyle="round" borderColor={theme.highlight}>
        <Text bold color={theme.secondary} underline>Authentication Required</Text>
        <Box marginTop={1} flexDirection="column">
          <Text color={theme.text}>To access your library, you need to provide your YouTube Music cookie.</Text>
          <Text color={theme.accent}>1. Open music.youtube.com in your browser</Text>
          <Text color={theme.accent}>2. Open Developer Tools (F12) -> Network</Text>
          <Text color={theme.accent}>3. Refresh the page and look for a request to 'browse' or 'music'</Text>
          <Text color={theme.accent}>4. Copy the 'cookie' value from Request Headers</Text>
          <Text color={theme.accent}>5. Edit ~/.ytmusic-tui/config.json and paste it there</Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor color={theme.dim}>Current Cookie: {getCookie() ? 'Present (Invalid?)' : 'Missing'}</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold underline color={theme.secondary}>Your Library</Text>
      <Text color={theme.muted}>Library features coming soon...</Text>
    </Box>
  );
};

export default Library;
