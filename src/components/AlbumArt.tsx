import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import terminalImage from 'terminal-image';

interface AlbumArtProps {
  url?: string;
  width?: number;
  height?: number;
}

const AlbumArt: React.FC<AlbumArtProps> = ({ url, width = 25, height = 12 }) => {
  const [image, setImage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      setError(true);
      return;
    }

    const loadImage = async () => {
      try {
        setLoading(true);
        setError(false);

        // Fetch the image
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch image');

        const buffer = Buffer.from(await response.arrayBuffer());

        // Convert to terminal image
        const termImg = await terminalImage.buffer(buffer, {
          width,
          height,
          preserveAspectRatio: true,
        });

        setImage(termImg);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load album art:', err);
        setError(true);
        setLoading(false);
      }
    };

    loadImage();
  }, [url, width, height]);

  if (loading) {
    return (
      <Box
        width={width}
        height={height}
        borderStyle="round"
        borderColor="#7c3aed"
        justifyContent="center"
        alignItems="center"
      >
        <Text color="#a855f7">Loading...</Text>
      </Box>
    );
  }

  if (error || !image) {
    // Fallback ASCII art when no image
    return (
      <Box
        width={width}
        borderStyle="round"
        borderColor="#581c87"
        justifyContent="center"
        alignItems="center"
        flexDirection="column"
      >
        <Text color="#6b21a8">    ♪  ♫  ♪</Text>
        <Text color="#8b5cf6">  ♪  ♫  ♪  ♫</Text>
        <Text color="#a855f7">♫  ♪  ♫  ♪  ♫</Text>
        <Text color="#8b5cf6">  ♪  ♫  ♪  ♫</Text>
        <Text color="#6b21a8">    ♪  ♫  ♪</Text>
      </Box>
    );
  }

  return (
    <Box
      borderStyle="round"
      borderColor="#a855f7"
      paddingX={1}
    >
      <Text>{image}</Text>
    </Box>
  );
};

export default AlbumArt;
