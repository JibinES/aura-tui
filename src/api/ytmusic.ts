import YTMusic from 'ytmusic-api';
import { getCookie } from '../utils/config';

let apiInstance: YTMusic | null = null;

export const initializeApi = async (): Promise<YTMusic> => {
  if (apiInstance) return apiInstance;

  apiInstance = new YTMusic();
  const cookie = getCookie();

  // Even if no cookie is present, we can initialize, but some features might be limited
  // However, ytmusic-api usually requires initialization to work properly
  try {
    await apiInstance.initialize({ cookies: cookie });
  } catch (error) {
    console.warn('Failed to initialize YTMusic API with cookie:', error);
    // Fallback to guest mode if possible, or just re-throw if critical
    await apiInstance.initialize();
  }

  return apiInstance;
};

export const getApi = (): YTMusic => {
  if (!apiInstance) {
    throw new Error('API not initialized. Call initializeApi() first.');
  }
  return apiInstance;
};

export const isAuthenticated = (): boolean => {
  return !!getCookie();
};
