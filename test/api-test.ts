
import { initializeApi, getApi } from '../src/api/ytmusic';
import { getCookie, setCookie, getConfig } from '../src/utils/config';

console.log('Testing Config...');
const initialConfig = getConfig();
console.log('Initial Config:', initialConfig);

// Test setting a dummy cookie
console.log('Setting dummy cookie...');
setCookie('test-cookie=123');
console.log('New Cookie:', getCookie());

// Initialize API
console.log('Initializing API...');
try {
  await initializeApi();
  const api = getApi();
  console.log('API initialized successfully');

  // Try a simple search (guest mode if cookie invalid, but might fail if strict)
  // Note: ytmusic-api might require real cookies for some things, but search usually works as guest
  console.log('Running search for "Never Gonna Give You Up"...');
  const results = await api.search('Never Gonna Give You Up');
  console.log(`Found ${results.length} results`);
  if (results.length > 0) {
    console.log('First result:', results[0].name);
  }
} catch (error) {
  console.error('API Test Failed:', error);
}

// Restore cookie if needed (optional for this test)
// setCookie(initialConfig.cookie);
