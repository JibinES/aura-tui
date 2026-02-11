
import { initializeApi, getApi } from '../src/api/ytmusic';

console.log('Testing Home Sections...');
await initializeApi();
const api = getApi();

try {
  // getHomeSections likely requires authentication, but let's check
  const home = await api.getHomeSections();
  console.log('Home sections:', home.length);
  home.forEach(section => {
      console.log(`Section: ${section.title}`);
      console.log(`Contents: ${section.contents?.length}`);
  });
} catch (e) {
  console.log('getHomeSections failed:', e.message);
}
