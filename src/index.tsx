import React from 'react';
import { render } from 'ink';
import App from './components/App';

const clearScreen = () => process.stdout.write('\x1Bc');

// Clear screen before starting
clearScreen();

render(<App />);
