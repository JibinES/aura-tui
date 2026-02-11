import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { isAuthenticated, getApi } from '../api/ytmusic';
import { getCookie } from '../utils/config';

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
          // Note: getLibraryPlaylists might return empty if not fully initialized or wrong cookie
          // Assuming getLibraryPlaylists exists in ytmusic-api based on common methods,
          // but I saw 'getPlaylist' in the inspect output, not explicitly 'getLibraryPlaylists'
          // However, 'getLibraryPlaylists' is standard in many wrappers.
          // Let's try 'getPlaylists' or just list 'getLibrary' if available.
          // Based on inspection, we saw 'getPlaylist', 'searchPlaylists'.
          // Usually library access requires more specific calls.
          // Let's try to just use 'getLibraryPlaylists' assuming it exists or fallback.

          // Re-checking inspection output:
          // "getSearchSuggestions", "search", ... "getPlaylist", "getHomeSections"
          // It seems this specific library version might not have a direct 'getLibrary' exposed in the prototype names I saw?
          // Or maybe I missed it.
          // Let's stick to a safe message for now if we can't find it, or try catch.

          // For now, let's just show the auth status and instructions.
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
      <Box flexDirection="column" padding={1} borderStyle="round" borderColor="yellow">
        <Text bold color="yellow" underline>Authentication Required</Text>
        <Box marginTop={1} flexDirection="column">
            <Text>To access your library, you need to provide your YouTube Music cookie.</Text>
            <Text>1. Open music.youtube.com in your browser</Text>
            <Text>2. Open Developer Tools (F12) -> Network</Text>
            <Text>3. Refresh the page and look for a request to 'browse' or 'music'</Text>
            <Text>4. Copy the 'cookie' value from Request Headers</Text>
            <Text>5. Edit ~/.ytmusic-tui/config.json and paste it there</Text>
        </Box>
        <Box marginTop={1}>
             <Text dimColor>Current Cookie: {getCookie() ? 'Present (Invalid?)' : 'Missing'}</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold underline>Your Library</Text>
      <Text color="gray">Library features coming soon...</Text>
      {/*
      <Box marginTop={1}>
        <Text>Playlists</Text>
        {playlists.map(p => <Text key={p.playlistId}>{p.name}</Text>)}
      </Box>
      */}
    </Box>
  );
};

export default Library;
