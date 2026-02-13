
import { initializeApi, getApi } from '../src/api/ytmusic';

console.log('Testing Home Feed...');
try {
  await initializeApi();
  const api = getApi();

  // Try getHomeSections (might fail without cookies)
  try {
    console.log('Fetching Home Sections...');
    const home = await api.getHomeSections();
    console.log('Home sections:', home.length);
    if (home.length > 0) {
      const firstSection = home[0];
      if (firstSection) {
        console.log('First section title:', firstSection.title);
        console.log('First section contents:', firstSection.contents?.length);
      }
    }
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    console.log('getHomeSections failed (expected without cookies):', error.message);
  }

  // Try a search instead (usually works without cookies)
  console.log('Searching for Muse...');
  const searchResults = await api.search('Muse');
  console.log('Search results:', searchResults.length);
  if (searchResults.length > 0) {
    const firstResult = searchResults[0];
    if (firstResult) {
      console.log('First result:', firstResult.name);
    }
  }

} catch (error) {
  console.error('Test Failed:', error);
}
