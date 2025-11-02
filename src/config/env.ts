// Log environment variables loading
console.log('[env.ts] Loading environment variables...');
console.log('[env.ts] EXPO_PUBLIC_API_BASE_URL from process.env:', process.env.EXPO_PUBLIC_API_BASE_URL);

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://172.20.10.2:3000';
export const DEV_TOKEN = process.env.EXPO_PUBLIC_DEV_TOKEN || '';
export const DEV_REFRESH_TOKEN = process.env.EXPO_PUBLIC_DEV_REFRESH_TOKEN || '';

console.log('[env.ts] Final API_BASE_URL:', API_BASE_URL);

export const URLS = {
  API_BASE_URL,
};

export const CONFIG = {
  API_BASE_URL,
  ENVIRONMENT: process.env.EXPO_PUBLIC_ENV || 'development',
  DISABLE_UPLOADS: process.env.EXPO_PUBLIC_DISABLE_UPLOADS === 'true',
};