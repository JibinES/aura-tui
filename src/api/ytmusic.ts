import YTMusic from 'ytmusic-api';
import { getCookie } from '../utils/config';

let apiInstance: YTMusic | null = null;

export const initializeApi = async (): Promise<YTMusic> => {
  if (apiInstance) return apiInstance;

  apiInstance = new YTMusic();
  const cookie = getCookie();

  // Initialize with options to help avoid blocks
  const initOptions: any = {};

  if (cookie && cookie.length > 0) {
    initOptions.cookies = cookie;
  }

  // Try to initialize
  try {
    await apiInstance.initialize(initOptions);
  } catch (error) {
    console.warn('Failed to initialize YTMusic API:', error);
    // Try without any options
    try {
      await apiInstance.initialize();
    } catch (fallbackError) {
      console.error('Failed to initialize in fallback mode:', fallbackError);
    }
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
