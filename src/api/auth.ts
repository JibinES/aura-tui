import { getCookie, setCookie } from '../utils/config';
import { initializeApi } from './ytmusic';

export const saveCookie = async (cookie: string): Promise<boolean> => {
  try {
    // Basic validation of cookie format
    if (!cookie || !cookie.includes('COOKIE')) {
      // Depending on format, sometimes people paste the whole header line
      // We might want to parse it or just store it if it looks like a cookie string
    }

    setCookie(cookie);

    // Re-initialize API with new cookie
    await initializeApi();

    return true;
  } catch (error) {
    console.error('Failed to save cookie:', error);
    return false;
  }
};

export const clearSession = () => {
  setCookie('');
  // We might need to reload the app or re-init API here
};
