import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

// Wizard with wand down
const wizardNormal = `
                   ____
                 .'* *.'
              __/_*_*(_
             / _______ \\
            _\\_)/___\\(_/_
           / _((\\- -/))_ \\
           \\ \\())(-)(()/ /
            ' \\(((()))/ '
           / ' \\)).))/ ' \\
          / _ \\ - | - /_  \\
         (   ( .;''';. .'  )
         _\\"__ /    )\\ __"/_
           \\/  \\   ' /  \\/
            .'  '...' ' )
             / /  |  \\ \\
            / .   .   . \\
           /   .     .   \\
          /   /   |   \\   \\
        .'   /    b    '.  '.
    _.-'    /     Bb     '-. '-._
_.-'       |      BBb       '-.  '-.
(________mrf\\____.dBBBb.________)____)
`;

// Wizard waving wand (arm raised)
const wizardWaving = `
                   ____
                 .'* *.'     ✨
              __/_*_*(_        *
             / _______ \\      ★
            _\\_)/___\\(_/_
           / _((\\ o o/))_ \\
           \\ \\())(_)(()/ /
            ' \\(((()))/ '    /
           / ' \\)).))/ '    /
          / _ \\ - | - /    🌟
         (   ( .;''';.'.)
         _\\"__ /    )\\ __"/_
           \\/  \\   ' /  \\/
            .'  '...' ' )
             / /  |  \\ \\
            / .   .   . \\
           /   .     .   \\
          /   /   |   \\   \\
        .'   /    b    '.  '.
    _.-'    /     Bb     '-. '-._
_.-'       |      BBb       '-.  '-.
(________mrf\\____.dBBBb.________)____)
`;

// Star patterns for different phases
const starPatterns = [
  '           ✨                    ',
  '       ✨      ★               ',
  '   ★       ✨      ★           ',
  '       ★      ✨      ★   ✨   ',
  '   ✨      ★      ✨      ★     ',
  '       ★  ✨  ★  ✨  ★         ',
];

const loadingTexts = [
  'Summoning music spirits...',
  'Casting playlist spells...',
  'Enchanting the queue...',
  'Preparing magical melodies...',
  'Almost ready...',
];

interface StartupAnimationProps {
  onComplete: () => void;
  duration?: number;
}

const StartupAnimation: React.FC<StartupAnimationProps> = ({
  onComplete,
  duration = 3000
}) => {
  const [isWaving, setIsWaving] = useState(false);
  const [starPattern, setStarPattern] = useState(0);
  const [textIndex, setTextIndex] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    // Wand waving animation
    const waveInterval = setInterval(() => {
      setIsWaving(true);
      setTimeout(() => setIsWaving(false), 400);
    }, 800);

    // Star pattern animation
    const starInterval = setInterval(() => {
      setStarPattern(prev => (prev + 1) % starPatterns.length);
    }, 300);

    // Loading text animation
    const textInterval = setInterval(() => {
      setTextIndex(prev => (prev + 1) % loadingTexts.length);
    }, 600);

    // Dots animation
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 250);

    // Complete animation
    const timeout = setTimeout(() => {
      clearInterval(waveInterval);
      clearInterval(starInterval);
      clearInterval(textInterval);
      clearInterval(dotsInterval);
      onComplete();
    }, duration);

    return () => {
      clearInterval(waveInterval);
      clearInterval(starInterval);
      clearInterval(textInterval);
      clearInterval(dotsInterval);
      clearTimeout(timeout);
    };
  }, [onComplete, duration]);

  return (
    <Box
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100%"
      padding={1}
    >
      <Box flexDirection="column" alignItems="center">
        {/* Stars above wizard */}
        <Box marginBottom={1}>
          <Text color="#fbbf24">{starPatterns[starPattern]}</Text>
        </Box>

        {/* Wizard ASCII art */}
        <Text color="#c084fc">{isWaving ? wizardWaving : wizardNormal}</Text>

        {/* App title */}
        <Box marginTop={1}>
          <Text bold color="#a855f7">♪ </Text>
          <Text bold color="#d8b4fe">A</Text>
          <Text bold color="#c084fc">u</Text>
          <Text bold color="#a855f7">r</Text>
          <Text bold color="#8b5cf6">a</Text>
          <Text bold color="#7c3aed">T</Text>
          <Text bold color="#6d28d9">U</Text>
          <Text bold color="#5b21b6">I</Text>
          <Text bold color="#a855f7"> ♪</Text>
        </Box>

        {/* Tagline */}
        <Box marginTop={1}>
          <Text color="#9333ea">YouTube Music in your terminal</Text>
        </Box>

        {/* Loading bar */}
        <Box marginTop={2}>
          <Text color="#7c3aed">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</Text>
        </Box>

        {/* Loading text */}
        <Box marginTop={1}>
          <Text color="#8b5cf6">
            {loadingTexts[textIndex]}{dots}
          </Text>
        </Box>

        {/* Magic sparkles */}
        <Box marginTop={1}>
          <Text color="#fbbf24">✨ ★ ✨</Text>
        </Box>
      </Box>
    </Box>
  );
};

export default StartupAnimation;
