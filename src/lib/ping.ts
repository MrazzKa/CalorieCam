import { URLS } from '../config/env';
import { fetchWithTimeout } from './fetchWithTimeout';

export interface PingResult {
  ok: boolean;
  status: number;
  url: string;
  error?: string;
}

export const ping = async (): Promise<PingResult> => {
  try {
    const response = await fetchWithTimeout(`${URLS.API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }, 5000);

    return {
      ok: response.ok,
      status: response.status,
      url: URLS.API_BASE_URL,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error: any) {
    return {
      ok: false,
      status: 0,
      url: URLS.API_BASE_URL,
      error: error.message || 'Network error',
    };
  }
};