# YouTube Music TUI - Claude Code Guide

## Project Overview

A terminal-based user interface (TUI) clone of YouTube Music built with Bun.js. This application provides a complete YouTube Music experience directly in the terminal, with full feature parity including playback controls, playlists, search, recommendations, and a built-in ad blocker.

## Tech Stack

- **Runtime**: Bun.js (for fast execution and built-in utilities)
- **UI Framework**: ink (React-based TUI framework) or blessed/blessed-contrib
- **API**: YouTube Music unofficial API via cookie authentication
- **Audio**: node-mpv or mpv CLI wrapper for playback
- **State Management**: Zustand or custom context
- **HTTP Client**: Bun's native fetch

## Core Features to Implement

### 1. Authentication & Session Management
- Cookie-based authentication using YouTube Music cookies
- Session persistence and refresh
- Secure credential storage

### 2. Navigation & UI
- Home feed with personalized recommendations
- Library view (songs, albums, artists, playlists)
- Search interface with autocomplete
- Now playing view with album art (using ASCII art or sixel)
- Queue management
- Tabbed navigation system

### 3. Playback Features
- Play/pause, skip, previous controls
- Volume control
- Seek/scrub through tracks
- Shuffle and repeat modes
- Lyrics display (synced if available)
- Audio quality selection

### 4. Content Discovery
- Personalized recommendations
- Trending music
- Charts (top songs, albums)
- Genre exploration
- Related artists/songs

### 5. Library Management
- Create, edit, delete playlists
- Like/unlike songs
- Add to library
- Download for offline (optional)
- Recently played history

### 6. Ad Blocking
- Detect and skip video ads automatically
- Filter ad content from API responses
- Seamless playback without interruptions

## Architecture

```
src/
├── api/
│   ├── ytmusic.ts          # YouTube Music API client
│   ├── auth.ts             # Cookie authentication
│   └── parser.ts           # Response parsing utilities
├── components/
│   ├── Player.tsx          # Now playing component
│   ├── Library.tsx         # Library view
│   ├── Search.tsx          # Search interface
│   ├── Queue.tsx           # Queue management
│   ├── Home.tsx            # Home feed
│   └── shared/             # Reusable UI components
├── services/
│   ├── player.ts           # Audio playback service
│   ├── cache.ts            # Caching layer
│   └── adblock.ts          # Ad detection & blocking
├── store/
│   └── state.ts            # Global state management
├── utils/
│   ├── keyboard.ts         # Keyboard shortcuts
│   ├── ascii-art.ts        # Album art rendering
│   └── config.ts           # Configuration management
└── index.tsx               # Main entry point
```

## Key Implementation Details

### Cookie Authentication
```typescript
// User provides their youtube.com cookie header
// Format: "cookie1=value1; cookie2=value2; ..."
// Store securely and use for all API requests
```

### Ad Blocking Strategy
1. Detect ad segments in video metadata
2. Skip playback during ad timestamps
3. Filter promotional content from recommendations
4. Block ad-related API endpoints

### API Integration
- Use unofficial YouTube Music API libraries (ytmusic-api or custom implementation)
- Parse innertube API responses
- Handle rate limiting and errors gracefully

### TUI Considerations
- Support terminal emulators with 256 colors
- Responsive layout for different terminal sizes
- Efficient rendering to prevent flickering
- Keyboard-only navigation

## Development Workflow

### Phase 1: Foundation
1. Set up Bun project with TypeScript
2. Implement cookie authentication
3. Create basic API client for YouTube Music
4. Test authentication and API calls

### Phase 2: Core Playback
1. Integrate MPV for audio playback
2. Build player controls (play, pause, seek)
3. Implement queue system
4. Add ad blocking logic

### Phase 3: UI Development
1. Create main navigation structure
2. Build home feed view
3. Implement search interface
4. Design now playing screen

### Phase 4: Library Features
1. Display user's library
2. Playlist CRUD operations
3. Like/unlike functionality
4. History tracking

### Phase 5: Polish
1. Add keyboard shortcuts
2. Implement ASCII album art
3. Optimize performance
4. Error handling and recovery
5. Configuration system

## Configuration

Create a `~/.ytmusic-tui/config.json`:
```json
{
  "cookie": "YOUR_YOUTUBE_COOKIE",
  "theme": "dark",
  "audioQuality": "high",
  "adBlock": true,
  "keybindings": {
    "play": "space",
    "next": "n",
    "prev": "p",
    "volumeUp": "+",
    "volumeDown": "-"
  }
}
```

## Dependencies

```json
{
  "dependencies": {
    "ink": "^4.x",
    "ink-text-input": "^5.x",
    "react": "^18.x",
    "zustand": "^4.x",
    "ytmusic-api": "^5.x",
    "node-mpv": "^2.x",
    "conf": "^12.x",
    "chalk": "^5.x",
    "cli-spinners": "^2.x"
  },
  "devDependencies": {
    "@types/react": "^18.x",
    "bun-types": "latest"
  }
}
```

## Running the Application

```bash
# Development
bun run dev

# Production
bun run build
bun run start

# With specific cookie
YOUTUBE_COOKIE="your-cookie" bun run start
```

## Security Considerations

- Never commit cookies to git (add to .gitignore)
- Encrypt stored credentials
- Clear sensitive data on exit
- Warn users about cookie security

## Testing Strategy

- Unit tests for API parsing
- Integration tests for player controls
- Manual testing for UI/UX
- Test ad blocking effectiveness

## Common Issues & Solutions

### Issue: Cookies expire
**Solution**: Implement cookie refresh or prompt user to re-authenticate

### Issue: MPV not found
**Solution**: Check for MPV installation and provide installation instructions

### Issue: Terminal compatibility
**Solution**: Detect terminal capabilities and gracefully degrade features

### Issue: Rate limiting
**Solution**: Implement exponential backoff and request caching

## Future Enhancements

- Offline mode with downloads
- Social features (share playlists)
- Equalizer controls
- Plugin system
- Multiple account support
- Crossfade between tracks
- Gapless playback
- Radio stations
