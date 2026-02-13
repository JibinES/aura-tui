import React from 'react';
import { Box, Text } from 'ink';

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

const Help = () => {
  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor={theme.border}>
      <Text bold underline color={theme.secondary} marginBottom={1}>Keybindings & Help</Text>

      <Box flexDirection="column" gap={1}>
        <Box>
          <Text bold color={theme.primary}>Navigation:</Text>
          <Box flexDirection="column" marginLeft={2}>
            <Text color={theme.text}>1: Home View</Text>
            <Text color={theme.text}>2: Search View</Text>
            <Text color={theme.text}>3: Library View</Text>
            <Text color={theme.text}>4: Queue View</Text>
            <Text color={theme.text}>?: Help View</Text>
            <Text color={theme.text}>q: Quit (from Home) or Back</Text>
            <Text color={theme.text}>/: Search</Text>
            <Text color={theme.text}>Tab: Switch tabs (e.g. Queue/History)</Text>
          </Box>
        </Box>

        <Box>
          <Text bold color={theme.primary}>Playback:</Text>
          <Box flexDirection="column" marginLeft={2}>
            <Text color={theme.text}>Space: Play/Pause</Text>
            <Text color={theme.text}>n: Next Track</Text>
            <Text color={theme.text}>p: Previous Track</Text>
            <Text color={theme.text}>+/-: Volume Up/Down</Text>
          </Box>
        </Box>

        <Box>
          <Text bold color={theme.primary}>Search/Lists:</Text>
          <Box flexDirection="column" marginLeft={2}>
            <Text color={theme.text}>Up/Down: Navigate items</Text>
            <Text color={theme.text}>Enter: Select/Play</Text>
            <Text color={theme.text}>Esc: Exit focus / Back</Text>
          </Box>
        </Box>

        <Box>
          <Text bold color={theme.primary}>Settings:</Text>
          <Box flexDirection="column" marginLeft={2}>
            <Text color={theme.text}>Ctrl+R: Reset cookie (re-authenticate)</Text>
          </Box>
        </Box>
      </Box>

      <Box marginTop={1}>
        <Text dimColor color={theme.dim}>Press any navigation key (1-4) to exit help.</Text>
      </Box>
    </Box>
  );
};

export default Help;
