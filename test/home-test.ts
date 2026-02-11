
import { initializeApi, getApi } from '../src/api/ytmusic';

console.log('Testing Home Feed...');
try {
  await initializeApi();
  const api = getApi();

  // Try getHome (might fail without cookies)
  try {
    console.log('Fetching Home...');
    const home = await api.getHome();
    console.log('Home sections:', home.length);
    if (home.length > 0) {
        console.log('First section title:', home[0].title);
        console.log('First section contents:', home[0].contents.length);
    }
  } catch (e) {
      console.log('getHome failed (expected without cookies):', e.message);
  }

  // Try getArtist (usually works without cookies) to simulate "Recommendations" or just generic content
  console.log('Fetching Artist (Muse)...');
  const artist = await api.getArtist('UCggHbip77axVRWcnfoExqew');
  console.log('Artist name:', artist.name);
  console.log('Top songs:', artist.topSongs?.length);

} catch (error) {
  console.error('Test Failed:', error);
}
