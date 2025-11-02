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
    const url = `${URLS.API_BASE_URL}/health`;
    console.log(`[Ping] ========================================`);
    console.log(`[Ping] Checking API at: ${url}`);
    console.log(`[Ping] URLS.API_BASE_URL: ${URLS.API_BASE_URL}`);
    console.log(`[Ping] process.env.EXPO_PUBLIC_API_BASE_URL: ${process.env.EXPO_PUBLIC_API_BASE_URL}`);
    console.log(`[Ping] Full URL: ${url}`);
    console.log(`[Ping] ========================================`);
    
    const startTime = Date.now();
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }, 30000); // 30 seconds timeout
    
    const duration = Date.now() - startTime;
    console.log(`[Ping] Response received in ${duration}ms, status: ${response.status}`);

    return {
      ok: response.ok,
      status: response.status,
      url: URLS.API_BASE_URL,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error: any) {
    console.error(`[Ping] ========================================`);
    console.error(`[Ping] FAILED to connect to ${URLS.API_BASE_URL}`);
    console.error(`[Ping] Error type: ${error.constructor.name}`);
    console.error(`[Ping] Error message: ${error.message}`);
    console.error(`[Ping] Error stack: ${error.stack}`);
    console.error(`[Ping] ========================================`);
    return {
      ok: false,
      status: 0,
      url: URLS.API_BASE_URL,
      error: error.message || 'Network error',
    };
  }
};