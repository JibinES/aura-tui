import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../utils/theme';

const Help = () => {
  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor={theme.border}>
      <Box flexDirection="column" alignItems="center" marginBottom={1}>
        <Text bold underline color={theme.secondary}>♪ AuraTUI - Keyboard Shortcuts ♪</Text>
        <Text color={theme.dim} dimColor>YouTube Music in your terminal</Text>
      </Box>

      <Box flexDirection="row" gap={2}>
        {/* Left Column */}
        <Box flexDirection="column" flexGrow={1}>
          <Box flexDirection="column" marginBottom={1}>
            <Text bold color={theme.primary}>━━━ Navigation ━━━</Text>
            <Box flexDirection="column" marginLeft={2} marginTop={1}>
              <Text color={theme.text}><Text color={theme.active}>1</Text> - Home View</Text>
              <Text color={theme.text}><Text color={theme.active}>2</Text> - Search View</Text>
              <Text color={theme.text}><Text color={theme.active}>3</Text> - Queue View</Text>
              <Text color={theme.text}><Text color={theme.active}>4</Text> - Playlists View</Text>
              <Text color={theme.text}><Text color={theme.active}>?</Text> - Help View (this screen)</Text>
              <Text color={theme.text}><Text color={theme.active}>/</Text> - Quick Search</Text>
              <Text color={theme.text}><Text color={theme.active}>Esc</Text> - Go Back / Exit Input</Text>
              <Text color={theme.text}><Text color={theme.active}>Ctrl+Q</Text> - Quit Application</Text>
            </Box>
          </Box>

          <Box flexDirection="column" marginBottom={1}>
            <Text bold color={theme.primary}>━━━ Playback Controls ━━━</Text>
            <Box flexDirection="column" marginLeft={2} marginTop={1}>
              <Text color={theme.text}><Text color={theme.active}>Space</Text> - Play / Pause</Text>
              <Text color={theme.text}><Text color={theme.active}>N</Text> - Next Track</Text>
              <Text color={theme.text}><Text color={theme.active}>P</Text> - Previous Track</Text>
              <Text color={theme.text}><Text color={theme.active}>+ / =</Text> - Volume Up (+5%)</Text>
              <Text color={theme.text}><Text color={theme.active}>- / _</Text> - Volume Down (-5%)</Text>
              <Text color={theme.text}><Text color={theme.active}>,</Text> - Seek Backward 5s</Text>
              <Text color={theme.text}><Text color={theme.active}>.</Text> - Seek Forward 5s</Text>
              <Text color={theme.text}><Text color={theme.active}>L</Text> - Cycle Repeat (Off / All / One)</Text>
            </Box>
          </Box>

          <Box flexDirection="column">
            <Text bold color={theme.primary}>━━━ Search View ━━━</Text>
            <Box flexDirection="column" marginLeft={2} marginTop={1}>
              <Text color={theme.text}><Text color={theme.active}>Enter</Text> - Submit Search / Play Song</Text>
              <Text color={theme.text}><Text color={theme.active}>Tab</Text> - Exit Search Input</Text>
              <Text color={theme.text}><Text color={theme.active}>↑ / ↓</Text> - Navigate Results</Text>
              <Text color={theme.text}><Text color={theme.active}>A</Text> - Add to Queue</Text>
              <Text color={theme.text}><Text color={theme.active}>P</Text> - Add to Playlist</Text>
            </Box>
          </Box>
        </Box>

        {/* Right Column */}
        <Box flexDirection="column" flexGrow={1}>
          <Box flexDirection="column" marginBottom={1}>
            <Text bold color={theme.primary}>━━━ Playlists View ━━━</Text>
            <Box flexDirection="column" marginLeft={2} marginTop={1}>
              <Text color={theme.text}><Text color={theme.active}>N</Text> - Create New Playlist</Text>
              <Text color={theme.text}><Text color={theme.active}>I</Text> - Import YouTube Playlist</Text>
              <Text color={theme.text}><Text color={theme.active}>Enter</Text> - Play Playlist (auto-queue)</Text>
              <Text color={theme.text}><Text color={theme.active}>P</Text> - Play All from Start</Text>
              <Text color={theme.text}><Text color={theme.active}>S</Text> - Toggle Shuffle Mode</Text>
              <Text color={theme.text}><Text color={theme.active}>R</Text> - Toggle Autoplay (auto-advance to next)</Text>
              <Text color={theme.text}><Text color={theme.active}>A</Text> - Add Song to Queue</Text>
              <Text color={theme.text}><Text color={theme.active}>D</Text> - Delete Playlist / Song</Text>
              <Text color={theme.text}><Text color={theme.active}>↑ / ↓</Text> - Navigate Items</Text>
              <Text color={theme.text}><Text color={theme.active}>Esc</Text> - Back to Playlist List</Text>
            </Box>
          </Box>

          <Box flexDirection="column" marginBottom={1}>
            <Text bold color={theme.primary}>━━━ Queue View ━━━</Text>
            <Box flexDirection="column" marginLeft={2} marginTop={1}>
              <Text color={theme.text}><Text color={theme.active}>↑ / ↓</Text> - Navigate Queue</Text>
              <Text color={theme.text}><Text color={theme.active}>Enter</Text> - Play Selected Song</Text>
              <Text color={theme.text}><Text color={theme.active}>Tab</Text> - Switch Queue / History</Text>
              <Text color={theme.text}><Text color={theme.active}>J</Text> - Move Song Down</Text>
              <Text color={theme.text}><Text color={theme.active}>K</Text> - Move Song Up</Text>
              <Text color={theme.text}><Text color={theme.active}>X</Text> - Remove from Queue</Text>
            </Box>
          </Box>

          <Box flexDirection="column" marginBottom={1}>
            <Text bold color={theme.primary}>━━━ Advanced ━━━</Text>
            <Box flexDirection="column" marginLeft={2} marginTop={1}>
              <Text color={theme.text}><Text color={theme.active}>Ctrl+R</Text> - Reset Cookie (Re-setup)</Text>
            </Box>
          </Box>

          <Box flexDirection="column">
            <Text bold color={theme.primary}>━━━ Features ━━━</Text>
            <Box flexDirection="column" marginLeft={2} marginTop={1}>
              <Text color={theme.accent}>✓ YouTube Music Search</Text>
              <Text color={theme.accent}>✓ Audio Playback (mpv + yt-dlp)</Text>
              <Text color={theme.accent}>✓ Unlimited Local Playlists</Text>
              <Text color={theme.accent}>✓ Queue Management</Text>
              <Text color={theme.accent}>✓ Autoplay & Shuffle</Text>
              <Text color={theme.accent}>✓ Auto Radio (YouTube Mix)</Text>
              <Text color={theme.accent}>✓ Ad Detection & Skipping</Text>
              <Text color={theme.accent}>✓ Seek / Scrub Controls</Text>
              <Text color={theme.accent}>✓ Repeat Modes (Off / All / One)</Text>
              <Text color={theme.accent}>✓ Queue Reordering</Text>
              <Text color={theme.accent}>✓ Persistent Play History</Text>
              <Text color={theme.accent}>✓ Beautiful Violet UI Theme</Text>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box marginTop={1} borderStyle="single" borderColor={theme.dim} paddingX={1}>
        <Text color={theme.secondary}>💡 Tip: </Text>
        <Text color={theme.text}>Press any navigation key (1-4) to exit help | Built with ♪ for terminal music lovers</Text>
      </Box>
    </Box>
  );
};

export default Help;
