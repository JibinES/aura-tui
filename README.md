# AuraTUI

A terminal-based YouTube Music player. Search, stream, queue, and enjoy music — right from your terminal.

## Features

- Search and stream music from YouTube
- Queue management with shuffle and repeat
- Synced lyrics display
- Playlist creation and management
- YouTube Mix / radio mode for endless playback
- Built-in ad blocking
- Keyboard-driven interface

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [MPV](https://mpv.io/) media player
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- [curl](https://curl.se/)

### Install prerequisites

**macOS:**
```bash
brew install mpv yt-dlp curl
```

**Linux (Debian/Ubuntu):**
```bash
sudo apt install mpv curl
pip install yt-dlp
```

## Install

```bash
npm install -g aura-tui
```

## Usage

```bash
aura
```

That's it. Use the keyboard shortcuts shown in the help screen (`?`) to navigate and control playback.

## Authors

- **Jacob Ashirwad** — [github.com/irl-jacob](https://github.com/irl-jacob)
- **Jibin ES** — [github.com/JibinES](https://github.com/JibinES)

## License

MIT
