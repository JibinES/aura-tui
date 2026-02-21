import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { setCookie } from '../utils/config';

interface SetupProps {
  onComplete: () => void;
}

const Setup: React.FC<SetupProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'welcome' | 'cookie' | 'confirm'>('welcome');
  const [cookie, setCookieValue] = useState('');

  useInput((input, key) => {
    if (step === 'welcome') {
      if (key.return || input === 'y' || input === 'Y') {
        setStep('cookie');
      }
      if (input === 's' || input === 'S') {
        onComplete();
      }
    }

    if (step === 'confirm') {
      if (key.return || input === 'y' || input === 'Y') {
        onComplete();
      }
      if (input === 'n' || input === 'N') {
        setStep('cookie');
        setCookieValue('');
      }
    }
  });

  const handleCookieSubmit = (value: string) => {
    if (value.trim()) {
      setCookie(value.trim());
      setStep('confirm');
    }
  };

  return (
    <Box
      flexDirection="column"
      padding={2}
      borderStyle="round"
      borderColor="#a855f7"
    >
      {step === 'welcome' && (
        <Box flexDirection="column" alignItems="center">
          <Text bold color="#c084fc">
            ╔═══════════════════════════════════════╗
          </Text>
          <Text bold color="#c084fc">
            ║     Welcome to AuraTUI Setup!         ║
          </Text>
          <Text bold color="#c084fc">
            ╚═══════════════════════════════════════╝
          </Text>

          <Box marginTop={2} flexDirection="column">
            <Text color="#a855f7">
              To access your personal library, playlists, and recommendations,
            </Text>
            <Text color="#a855f7">
              you'll need to provide your YouTube Music cookie.
            </Text>
          </Box>

          <Box marginTop={2} flexDirection="column" borderStyle="single" borderColor="#7c3aed" padding={1}>
            <Text bold color="#8b5cf6" underline>How to get your cookie:</Text>
            <Box marginTop={1} flexDirection="column">
              <Text color="#9333ea">1. Open music.youtube.com in your browser</Text>
              <Text color="#9333ea">2. Login to your account</Text>
              <Text color="#9333ea">3. Open Developer Tools (F12 or Cmd+Option+I)</Text>
              <Text color="#9333ea">4. Go to Network tab</Text>
              <Text color="#9333ea">5. Refresh the page</Text>
              <Text color="#9333ea">6. Click any request to music.youtube.com</Text>
              <Text color="#9333ea">7. Copy the 'cookie' value from Request Headers</Text>
            </Box>
          </Box>

          <Box marginTop={2}>
            <Text color="#a855f7">[Enter/Y] Setup cookie   </Text>
            <Text color="#6b21a8">[S] Skip (limited features)</Text>
          </Box>
        </Box>
      )}

      {step === 'cookie' && (
        <Box flexDirection="column">
          <Text bold color="#c084fc">Enter your YouTube Music cookie:</Text>
          <Text dimColor color="#7c3aed">(Paste the entire cookie string)</Text>

          <Box marginTop={1}>
            <Text color="#a855f7">Cookie: </Text>
            <TextInput
              value={cookie}
              onChange={setCookieValue}
              onSubmit={handleCookieSubmit}
              placeholder="Paste your cookie here..."
            />
          </Box>

          <Box marginTop={2}>
            <Text dimColor color="#6b21a8">Press Enter to save</Text>
          </Box>
        </Box>
      )}

      {step === 'confirm' && (
        <Box flexDirection="column" alignItems="center">
          <Text bold color="#22c55e">Cookie saved successfully!</Text>

          <Box marginTop={1}>
            <Text color="#a855f7">Cookie length: {cookie.length} characters</Text>
          </Box>

          <Box marginTop={2}>
            <Text color="#c084fc">[Enter/Y] Continue to AuraTUI   </Text>
            <Text color="#6b21a8">[N] Re-enter cookie</Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Setup;
