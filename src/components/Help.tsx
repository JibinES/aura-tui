import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../utils/theme';

const K = ({ k, desc }: { k: string; desc: string }) => (
  <Text color={theme.text}><Text color={theme.active}>{k.padEnd(8)}</Text>{desc}</Text>
);

// OSC 8 hyperlink — makes text clickable in supported terminals
const Link = ({ url, children, color }: { url: string; children: string; color?: string }) => (
  <Text color={color}>{`\x1b]8;;${url}\x07${children}\x1b]8;;\x07`}</Text>
);

const Help = () => {
  return (
    <Box flexDirection="column" padding={1}>
      <Box alignItems="center" marginBottom={1}>
        <Text bold color={theme.secondary}>♪ AuraTUI  </Text>
        <Text color={theme.dim}>Keyboard Shortcuts & Controls</Text>
      </Box>

      <Box flexDirection="row" gap={4}>
        {/* Column 1 */}
        <Box flexDirection="column">
          <Text bold color={theme.primary}>Navigation</Text>
          <K k="1" desc="Home" />
          <K k="2 /" desc="Search" />
          <K k="3" desc="Queue" />
          <K k="4" desc="Playlists" />
          <K k="Y" desc="Lyrics" />
          <K k="?" desc="Help" />
          <K k="Esc" desc="Go Back" />
          <K k="Ctrl+Q" desc="Quit" />

          <Box marginTop={1}><Text bold color={theme.primary}>Playback</Text></Box>
          <K k="Space" desc="Play / Pause" />
          <K k="N" desc="Next Track" />
          <K k="P" desc="Previous Track" />
          <K k="+ / -" desc="Volume" />
          <K k=", / ." desc="Seek ±5s" />
          <K k="L" desc="Repeat: Off/All/One" />
        </Box>

        {/* Column 2 */}
        <Box flexDirection="column">
          <Text bold color={theme.primary}>Search</Text>
          <K k="Enter" desc="Search / Play" />
          <K k="Tab" desc="Exit Input" />
          <K k="A" desc="Add to Queue" />
          <K k="P" desc="Add to Playlist" />

          <Box marginTop={1}><Text bold color={theme.primary}>Queue</Text></Box>
          <K k="Enter" desc="Play Song" />
          <K k="Tab / H" desc="Queue / History" />
          <K k="K / J" desc="Move Up / Down" />
          <K k="X" desc="Remove" />

          <Box marginTop={1}><Text bold color={theme.primary}>Playlists</Text></Box>
          <K k="N" desc="New Playlist" />
          <K k="I" desc="Import YouTube" />
          <K k="P" desc="Play All" />
          <K k="S" desc="Shuffle" />
          <K k="R" desc="Autoplay" />
          <K k="D" desc="Delete" />
        </Box>
      </Box>

      <Box marginTop={1} flexDirection="column" alignItems="center">
        <Text color={theme.accent}>Made with ❤️ by Jacob Ashirwad and Jibin ES</Text>
        <Link url="https://github.com/JibinES/aura-tui" color={theme.dim}>github.com/JibinES/aura-tui</Link>
        <Box>
          <Text color={theme.dim}>Jacob: </Text>
          <Link url="https://github.com/irl-jacob" color={theme.dim}>github.com/irl-jacob</Link>
          <Text color={theme.dim}>  •  Jibin: </Text>
          <Link url="https://github.com/JibinES" color={theme.dim}>github.com/JibinES</Link>
        </Box>
      </Box>
    </Box>
  );
};

export default Help;
