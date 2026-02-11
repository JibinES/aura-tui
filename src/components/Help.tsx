import React from 'react';
import { Box, Text } from 'ink';

const Help = () => {
  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor="white">
      <Text bold underline marginBottom={1}>Keybindings & Help</Text>

      <Box flexDirection="column" gap={1}>
        <Box>
            <Text bold color="green">Navigation:</Text>
            <Box flexDirection="column" marginLeft={2}>
                <Text>1: Home View</Text>
                <Text>2: Search View</Text>
                <Text>3: Library View</Text>
                <Text>4: Queue View</Text>
                <Text>?: Help View</Text>
                <Text>q: Quit (from Home) or Back</Text>
                <Text>/: Search</Text>
                <Text>Tab: Switch tabs (e.g. Queue/History)</Text>
            </Box>
        </Box>

        <Box>
            <Text bold color="green">Playback:</Text>
            <Box flexDirection="column" marginLeft={2}>
                <Text>Space: Play/Pause</Text>
                <Text>n: Next Track</Text>
                <Text>p: Previous Track</Text>
                <Text>+/-: Volume Up/Down</Text>
            </Box>
        </Box>

        <Box>
            <Text bold color="green">Search/Lists:</Text>
            <Box flexDirection="column" marginLeft={2}>
                <Text>Up/Down: Navigate items</Text>
                <Text>Enter: Select/Play</Text>
                <Text>Esc: Exit focus / Back</Text>
            </Box>
        </Box>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>Press any navigation key (1-4) to exit help.</Text>
      </Box>
    </Box>
  );
};

export default Help;
