# AuraTUI

A terminal-based YouTube Music client built with Bun and Ink.

## Features

- **Search**: Search for songs, artists, and albums
- **Playback**: Play audio using `mpv` (supports play/pause, volume, seek)
- **Queue**: Manage your playback queue and view history
- **Home**: View curated music sections (Trending, Top Hits, Rock Classics, etc.)
- **Ad Blocking**: Basic ad skipping logic included
- **Beautiful UI**: Violet-themed TUI with animated equalizer

## Installation

1. Ensure you have [Bun](https://bun.sh) and [mpv](https://mpv.io) installed.
   ```bash
   curl -fsSL https://bun.sh/install | bash
   # Install mpv via your package manager (e.g., brew install mpv, sudo apt install mpv)
   ```

2. Clone and install dependencies:
   ```bash
   git clone https://github.com/CipherSaber/AuraTUI.git
   cd AuraTUI
   bun install
   ```

3. Run the application:
   ```bash
   bun run dev
   ```

## Usage

### First Run
On first launch, AuraTUI will show:
1. **Startup Animation** (2.5 seconds)
2. **Setup Screen** where you can optionally paste your YouTube cookie
   - Press Enter to set up cookie (for personalized features)
   - Press 'S' to skip (public mode)

### Controls

- **Navigation**: `1` (Home), `2` (Search), `3` (Library), `4` (Queue), `?` (Help)
- **Search**: `/` to focus search bar
- **Playback**:
  - `Space`: Play/Pause
  - `n`: Next Track
  - `p`: Previous Track
  - `+` / `-`: Volume Up/Down
- **Lists**: `Up`/`Down` to navigate, `Enter` to select
- **Reset**: `Ctrl+R` to reset cookie and return to setup

## About the Cookie

**Note**: Due to YouTube actively blocking unofficial API access, the cookie is currently **not functional** for personalized features like your library, playlists, or recommendations.

The app works great without authentication using public YouTube search!

### How to get your cookie (for future use):

1. Open **music.youtube.com** in your browser and login
2. Open Developer Tools (F12)
3. Go to Network tab and refresh
4. Click any request to music.youtube.com
5. Copy the entire 'cookie' value from Request Headers
6. Paste when prompted in the setup screen

Your cookie will be securely stored at:
- Linux/Mac: `~/.config/ytmusic-tui-nodejs/config.json`
- Windows: `%APPDATA%\ytmusic-tui-nodejs\config.json`

## Technical Details

- **Runtime**: Bun.js
- **UI**: Ink (React for terminal)
- **API**: youtube-sr (for search), fallback from ytmusic-api due to YouTube blocking
- **Audio**: node-mpv with yt-dlp for playback
- **State**: Zustand

## Known Issues

- YouTube Music's unofficial API (`ytmusic-api`) is currently blocked by YouTube (400 errors)
- We use `youtube-sr` as a working alternative for search
- Personalized features (your library, playlists) are limited until we find a working auth solution
- All public features work perfectly: search, play, queue, trending music

## Contributing

Pull requests welcome! This is an active project and we're working on finding better YouTube Music API alternatives.

## License

MIT
