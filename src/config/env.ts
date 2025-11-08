declare const __DEV__: boolean | undefined;

const isDebug =
  (typeof __DEV__ !== 'undefined' && __DEV__) ||
  process.env.EXPO_PUBLIC_ENV === 'development';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://172.20.10.2:3000';
export const DEV_TOKEN = process.env.EXPO_PUBLIC_DEV_TOKEN || '';
export const DEV_REFRESH_TOKEN = process.env.EXPO_PUBLIC_DEV_REFRESH_TOKEN || '';

if (isDebug) {
  // eslint-disable-next-line no-console
  console.log('[env.ts] API_BASE_URL', API_BASE_URL);
}

export const URLS = {
  API_BASE_URL,
};

export const CONFIG = {
  API_BASE_URL,
  ENVIRONMENT: process.env.EXPO_PUBLIC_ENV || 'development',
  DISABLE_UPLOADS: process.env.EXPO_PUBLIC_DISABLE_UPLOADS === 'true',
};