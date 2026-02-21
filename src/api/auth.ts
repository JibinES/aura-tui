import { getCookie, setCookie } from '../utils/config';
import { initializeApi } from './ytmusic';

export const saveCookie = async (cookie: string): Promise<boolean> => {
  try {
    // Basic validation of cookie format
    if (!cookie || cookie.trim().length === 0) {
      console.error('Cookie is empty');
      return false;
    }

    setCookie(cookie.trim());

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
