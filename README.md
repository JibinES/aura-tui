# AuraTUI

A terminal-based YouTube Music client built with Bun and Ink.

## Features

- **Search**: Search for songs/videos with yt-dlp integration
- **Playback**: Play audio using `mpv` with yt-dlp for stream extraction
- **Queue**: Manage your playback queue and view history
- **Playlists**: Create and manage unlimited local playlists
- **Home**: View curated music sections (Trending, Top Hits, Rock Classics, etc.)
- **Beautiful UI**: Violet-themed TUI with animated equalizer

## Installation

1. **Prerequisites**: Install [Bun](https://bun.sh), [mpv](https://mpv.io), and [yt-dlp](https://github.com/yt-dlp/yt-dlp)
   ```bash
   # Install Bun
   curl -fsSL https://bun.sh/install | bash

   # Install mpv (choose your package manager)
   brew install mpv          # macOS
   sudo apt install mpv      # Ubuntu/Debian
   sudo pacman -S mpv        # Arch

   # Install yt-dlp
   pip install yt-dlp
   # or
   brew install yt-dlp       # macOS
   ```

2. Clone and install:
   ```bash
   git clone https://github.com/CipherSaber/AuraTUI.git
   cd AuraTUI
   bun install
   ```

3. Run:
   ```bash
   bun run dev
   ```

## Usage

### First Run
1. **Startup Animation** (2.5 seconds)
2. **Setup Screen** - Optional cookie setup (currently limited due to API blocks)
   - Press Enter to set up (optional)
   - Press 'S' to skip (recommended - app works great without it!)

### Keyboard Controls

#### Navigation
- `1` - Home feed
- `2` - Search
- `3` - Queue
- `4` - **Playlists** (local playlists!)
- `?` - Help
- `/` - Quick search
- `Ctrl+Q` - Quit application

#### Search View
- `Enter` - Submit search / Play selected song
- `Tab` or `Esc` - Exit search input and browse results
- `↑/↓` - Navigate results
- `A` - **Add to Queue**
- `P` - **Add to Playlist** (shows playlist selector)

#### Playlists View
- `N` - Create new playlist
- `Enter` - View/Play playlist
- `D` - Delete playlist or song (context-sensitive)
- `A` - Add song to queue (when viewing playlist)
- `Esc` - Go back

#### Playback
- `Space` - Play/Pause
- `N` - Next Track
- `P` - Previous Track
- `+/-` - Volume Up/Down

### Playlist System

AuraTUI features a **fully local** playlist system:
- Create unlimited playlists
- Add any song from search results
- Playlists stored in `~/.config/ytmusic-tui/playlists.json`
- No cloud sync needed - complete privacy!

**Workflow:**
1. Press `4` to go to Playlists
2. Press `N` to create a new playlist
3. Go to Search (`2`), find songs
4. Press `P` on any song to add to a playlist
5. Navigate playlists with arrow keys, play with `Enter`

## Technical Details

- **Runtime**: Bun.js
- **UI**: Ink (React for terminal)
- **Search**: yt-dlp via youtube-sr fallback
- **Audio**: node-mpv with yt-dlp for stream extraction
- **State**: Zustand
- **Storage**: Local config files via Conf

## Configuration

Config files are stored at:
- **Linux/Mac**: `~/.config/ytmusic-tui-nodejs/`
  - `config.json` - App settings
  - `playlists.json` - Your playlists
- **Windows**: `%APPDATA%\ytmusic-tui-nodejs\`

## Known Limitations

- YouTube Music's unofficial API is blocked (400 errors)
- Library/personalized features limited without working auth
- **All public features work**: search, play, queue, playlists!

## Troubleshooting

### "mpv not found"
Install mpv: `brew install mpv` (macOS) or `sudo apt install mpv` (Linux)

### "yt-dlp not found"
Install yt-dlp: `pip install yt-dlp` or `brew install yt-dlp`

### Search not working
Make sure yt-dlp is installed and accessible from your PATH.

## Contributing

Pull requests welcome! Areas for improvement:
- Better YouTube Music API alternative
- Playlist import/export
- Lyrics display
- More themes

## License

MIT

---

**Made with ♪ for music lovers who live in the terminal**
