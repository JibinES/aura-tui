import React from 'react';
import { Box, Text } from 'ink';

interface AlbumArtProps {
  url?: string;
  width?: number;
  height?: number;
}

const AlbumArt: React.FC<AlbumArtProps> = ({ url, width = 20, height = 20 }) => {
  if (!url) {
    return (
      <Box width={width} height={height / 2} borderStyle="single" justifyContent="center" alignItems="center">
        <Text>No Art</Text>
      </Box>
    );
  }

  // TODO: Implement Sixel or proper ASCII conversion here.
  // For now, just show a placeholder that indicates art is available.
  return (
    <Box width={width} height={height / 2} borderStyle="single" justifyContent="center" alignItems="center" borderColor="gray">
        <Text color="gray">Album Art</Text>
    </Box>
  );
};

export default AlbumArt;
