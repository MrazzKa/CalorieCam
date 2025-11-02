export const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeout: number = 30000 // Increased to 30 seconds
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error(`[fetchWithTimeout] Request timeout after ${timeout}ms: ${url}`);
    controller.abort();
  }, timeout);

  try {
    console.log(`[fetchWithTimeout] Starting request to: ${url}`);
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    console.log(`[fetchWithTimeout] Response received: ${response.status} from ${url}`);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`[fetchWithTimeout] Request failed: ${url}`, error);
    throw error;
  }
};