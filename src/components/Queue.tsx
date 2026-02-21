import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useStore } from '../store/state';
import { theme } from '../utils/theme';
import { getScrollWindow } from '../utils/scrollWindow';

const Queue = () => {
  const { queue, currentSong, playSong, history, setView, moveQueueItem, removeFromQueue } = useStore();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');

  useInput((input, key) => {
    if (key.escape || input === 'q') {
      setView('home');
    }

    if (input === 'h') setActiveTab('history');
    if (key.tab) {
      setActiveTab(prev => prev === 'queue' ? 'history' : 'queue');
      setSelectedIndex(0);
    }

    const list = activeTab === 'queue' ? queue : history;

    if (key.downArrow && list.length > 0) {
      setSelectedIndex(prev => Math.min(prev + 1, list.length - 1));
    }

    if (key.upArrow) {
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    }

    if (key.return && list.length > 0) {
      const song = list[selectedIndex];
      if (song && activeTab === 'queue') {
        // Remove the song from the queue before playing to avoid duplicates
        const newQueue = [...queue.slice(0, selectedIndex), ...queue.slice(selectedIndex + 1)];
        useStore.setState({ queue: newQueue });
        playSong(song);
      } else if (song) {
        playSong(song);
      }
    }

    // Queue reordering and removal (only in queue tab)
    if (activeTab === 'queue' && queue.length > 0) {
      if (input === 'k' && selectedIndex > 0) {
        moveQueueItem(selectedIndex, selectedIndex - 1);
        setSelectedIndex(selectedIndex - 1);
      }
      if (input === 'j' && selectedIndex < queue.length - 1) {
        moveQueueItem(selectedIndex, selectedIndex + 1);
        setSelectedIndex(selectedIndex + 1);
      }
      if (input === 'x') {
        removeFromQueue(selectedIndex);
        // Adjust selection if we removed the last item
        if (selectedIndex >= queue.length - 1) {
          setSelectedIndex(Math.max(0, queue.length - 2));
        }
      }
    }
  });

  const displayList = activeTab === 'queue' ? queue : history;

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold underline color={activeTab === 'queue' ? theme.active : theme.muted}>
          Queue ({queue.length})
        </Text>
        <Text color={theme.dim}> | </Text>
        <Text bold underline color={activeTab === 'history' ? theme.active : theme.muted}>
          History ({history.length})
        </Text>
        <Text dimColor color={theme.dim}> (Tab to switch)</Text>
      </Box>

      {currentSong && (
        <Box marginBottom={1} borderStyle="single" borderColor={theme.primary} paddingX={1}>
          <Text bold color={theme.secondary}>Now Playing: </Text>
          <Text color={theme.text}>{currentSong.title} - {currentSong.artist}</Text>
        </Box>
      )}

      <Box flexDirection="column">
        {displayList.length === 0 ? (
          <Text dimColor color={theme.muted}>No tracks in {activeTab}.</Text>
        ) : (
          (() => {
            const { start, end } = getScrollWindow(displayList.length, selectedIndex);
            return (
              <>
                {start > 0 && <Text color={theme.dim}>  ↑ {start} more above</Text>}
                {displayList.slice(start, end).map((song, i) => {
                  const index = start + i;
                  return (
                    <Box key={`${song.id}-${index}`}>
                      <Text color={index === selectedIndex ? theme.active : theme.muted}>
                        {index === selectedIndex ? '> ' : '  '}
                        {index + 1}. {song.title} - {song.artist}
                      </Text>
                    </Box>
                  );
                })}
                {end < displayList.length && <Text color={theme.dim}>  ↓ {displayList.length - end} more below</Text>}
              </>
            );
          })()
        )}
      </Box>

      <Box marginTop={1}>
        <Text color={theme.dim}>
          {activeTab === 'queue'
            ? 'Enter: Play | j/k: Reorder | x: Remove | Tab: History'
            : 'Enter: Play | Tab: Queue'}
        </Text>
      </Box>
    </Box>
  );
};

export default Queue;
