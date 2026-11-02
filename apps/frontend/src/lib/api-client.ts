import { ApiResponse } from '@industrial-bakery/shared-types';
import { getApiBaseUrl } from './utils';

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const baseUrl = getApiBaseUrl();
  let cleanEndpoint = endpoint.replace(/^https?:\/\/(localhost|127\.0\.0\.1):4000/i, '');
  while (cleanEndpoint.includes('/api/v1/api/v1')) {
    cleanEndpoint = cleanEndpoint.replace('/api/v1/api/v1', '/api/v1');
  }
  if (cleanEndpoint.startsWith('/api/v1/')) {
    cleanEndpoint = cleanEndpoint.replace('/api/v1/', '/');
  } else if (cleanEndpoint.startsWith('/api/')) {
    cleanEndpoint = cleanEndpoint.replace('/api/', '/');
  }
  const url = `${baseUrl}${cleanEndpoint.startsWith('/') ? cleanEndpoint : `/${cleanEndpoint}`}`;
  
  const headers = new Headers(options.headers || {});
  if (options.body instanceof FormData) {
    headers.delete('Content-Type');
  } else if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const json: ApiResponse<T> = await response.json();
  if (!response.ok && !json.error) {
    throw new Error(`HTTP ${response.status}: Yêu cầu không thành công`);
  }

  return json;
}
