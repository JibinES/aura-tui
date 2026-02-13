import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

// Wizard ASCII art (static)
const wizard = `
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

const loadingTexts = [
  'Summoning music spirits...',
  'Casting playlist spells...',
  'Enchanting the queue...',
  'Preparing magical melodies...',
  'Almost ready...',
];

interface Star {
  x: number;
  y: number;
  speed: number;
}

interface StartupAnimationProps {
  onComplete: () => void;
  duration?: number;
}

const StartupAnimation: React.FC<StartupAnimationProps> = ({
  onComplete,
  duration = 3000
}) => {
  const [textIndex, setTextIndex] = useState(0);
  const [dots, setDots] = useState('');
  const [stars, setStars] = useState<Star[]>([]);

  const width = 80;
  const height = 30;

  useEffect(() => {
    // Initialize stars
    const initialStars: Star[] = [];
    for (let i = 0; i < 50; i++) {
      initialStars.push({
        x: Math.floor(Math.random() * width),
        y: Math.floor(Math.random() * height),
        speed: Math.random() * 0.5 + 0.3
      });
    }
    setStars(initialStars);

    // Star rain animation
    const starInterval = setInterval(() => {
      setStars(prevStars =>
        prevStars.map(star => ({
          ...star,
          y: star.y + star.speed > height ? 0 : star.y + star.speed
        }))
      );
    }, 100);

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
      clearInterval(starInterval);
      clearInterval(textInterval);
      clearInterval(dotsInterval);
      onComplete();
    }, duration);

    return () => {
      clearInterval(starInterval);
      clearInterval(textInterval);
      clearInterval(dotsInterval);
      clearTimeout(timeout);
    };
  }, [onComplete, duration]);

  // Render stars background
  const renderStars = () => {
    const lines: string[] = [];
    for (let row = 0; row < height; row++) {
      let line = '';
      for (let col = 0; col < width; col++) {
        // Check if there's a star at this position
        const hasStar = stars.some(
          star => Math.floor(star.x) === col && Math.floor(star.y) === row
        );
        line += hasStar ? '*' : ' ';
      }
      lines.push(line);
    }
    return lines;
  };

  const starBackground = renderStars();

  return (
    <Box
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100%"
      padding={1}
    >
      {/* Star rain background */}
      <Box position="absolute" width={width} height={height}>
        {starBackground.map((line, i) => (
          <Text key={i} color="#6b21a8">
            {line}
          </Text>
        ))}
      </Box>

      {/* Main content */}
      <Box flexDirection="column" alignItems="center">
        {/* Wizard ASCII art */}
        <Text color="#c084fc">{wizard}</Text>

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
      </Box>
    </Box>
  );
};

export default StartupAnimation;
