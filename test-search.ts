import YTMusic from 'ytmusic-api';

async function testSearch() {
  const api = new YTMusic();

  try {
    console.log('Initializing API...');
    await api.initialize();
    console.log('API initialized successfully');

    console.log('\nSearching for "Shape of You"...');
    const results = await api.search('Shape of You', 'song');

    console.log('\nFound ' + results.length + ' results:');
    for (let i = 0; i < Math.min(5, results.length); i++) {
      const item = results[i] as any;
      console.log((i + 1) + '. ' + item.name + ' - ' + (item.artist?.name || 'Unknown'));
    }

    if (results.length === 0) {
      console.log('No results found - API may be blocked or rate limited');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testSearch();
