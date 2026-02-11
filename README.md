# AuraTUI

A terminal-based YouTube Music client built with Bun and Ink.

## Features

- **Search**: Search for songs, artists, and albums
- **Playback**: Play audio using `mpv` (supports play/pause, volume, seek)
- **Queue**: Manage your playback queue and view history
- **Library**: Access your playlists (requires cookie)
- **Home**: View personalized recommendations and charts
- **Ad Blocking**: Basic ad skipping logic included

## Installation

1. Ensure you have [Bun](https://bun.sh) and [mpv](https://mpv.io) installed.
   ```bash
   curl -fsSL https://bun.sh/install | bash
   # Install mpv via your package manager (e.g., brew install mpv, sudo apt install mpv)
   ```

2. Clone and install dependencies:
   ```bash
   bun install
   ```

3. Build the project:
   ```bash
   bun run build
   ```

## Usage

Run the application:
```bash
bun run dist/index.js
```

### Controls

- **Navigation**: `1` (Home), `2` (Search), `3` (Library), `4` (Queue), `?` (Help)
- **Search**: `/` to focus search bar
- **Playback**:
  - `Space`: Play/Pause
  - `n`: Next Track
  - `p`: Previous Track
  - `+` / `-`: Volume Up/Down
- **Lists**: `Up`/`Down` to navigate, `Enter` to select

## Configuration

To access your personal library, create `~/.ytmusic-tui/config.json` with your cookie:

```json
{
  "cookie": "YOUR_COOKIE_HERE"
}
```
