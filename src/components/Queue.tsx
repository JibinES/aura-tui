import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useStore } from '../store/state';

const Queue = () => {
  const { queue, currentSong, playSong, history, setView } = useStore();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');

  useInput((input, key) => {
    if (key.escape || input === 'q') {
      setView('home'); // Go back to home or previous view
    }

    if (input === 'h') setActiveTab('history');
    if (input === 'q' && activeTab === 'history') setActiveTab('queue'); // Toggle back to queue if 'q' is pressed? No, 'q' is usually quit/back.
    // Let's use tab to toggle
    if (key.tab) {
        setActiveTab(prev => prev === 'queue' ? 'history' : 'queue');
        setSelectedIndex(0);
    }

    const list = activeTab === 'queue' ? queue : history;

    if (key.downArrow) {
      setSelectedIndex(prev => Math.min(prev + 1, list.length - 1));
    }

    if (key.upArrow) {
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    }

    if (key.return && list.length > 0) {
        // Play the selected song
        // If it's queue, we might want to jump to it.
        // If history, play it again.
        const song = list[selectedIndex];
        playSong(song);
    }
  });

  const displayList = activeTab === 'queue' ? queue : history;

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold underline color={activeTab === 'queue' ? 'green' : 'white'}>Queue ({queue.length})</Text>
        <Text> | </Text>
        <Text bold underline color={activeTab === 'history' ? 'green' : 'white'}>History ({history.length})</Text>
        <Text dimColor> (Tab to switch)</Text>
      </Box>

      {currentSong && (
        <Box marginBottom={1} borderStyle="single" borderColor="green" paddingX={1}>
            <Text bold>Now Playing: </Text>
            <Text>{currentSong.title} - {currentSong.artist}</Text>
        </Box>
      )}

      <Box flexDirection="column">
        {displayList.length === 0 ? (
            <Text dimColor>No tracks in {activeTab}.</Text>
        ) : (
            displayList.map((song, index) => (
                <Box key={`${song.id}-${index}`}>
                    <Text color={index === selectedIndex ? 'cyan' : 'white'}>
                        {index === selectedIndex ? '> ' : '  '}
                        {index + 1}. {song.title} - {song.artist}
                    </Text>
                </Box>
            ))
        )}
      </Box>
    </Box>
  );
};

export default Queue;
