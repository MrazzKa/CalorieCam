export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.3.6:3000';

export const URLS = {
  API_BASE_URL,
};

export const CONFIG = {
  API_BASE_URL,
  ENVIRONMENT: process.env.EXPO_PUBLIC_ENV || 'development',
  DISABLE_UPLOADS: process.env.EXPO_PUBLIC_DISABLE_UPLOADS === 'true',
};