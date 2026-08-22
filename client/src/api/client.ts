import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { config } from '../config.js';

export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: unknown,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * In-memory CSRF token store.
 * Avoids relying on document.cookie read timing after logout/login cycles.
 * The server remains authoritative — it validates cookie vs header.
 * The client caches the most recently received token here and sends it in
 * the x-csrf-token header for state-changing requests.
 */
let _csrfToken: string | null = null;

/** Read the cached in-memory CSRF token. */
export function getCsrfToken(): string | null {
  return _csrfToken;
}

/**
 * Explicitly clear the cached CSRF token.
 * Call this during logout before re-bootstrapping so no stale token
 * can be sent during the gap between clear and refresh.
 */
export function clearCsrfToken(): void {
  _csrfToken = null;
}

const axiosInstance = axios.create({
  baseURL: config.apiUrl,
  withCredentials: true, // Crucial: Send HttpOnly session cookie
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
  },
});

// Request interceptor: automatically attach the in-memory CSRF token for
// state-changing operations. Using the in-memory store avoids document.cookie
// read-timing races after logout.
axiosInstance.interceptors.request.use((reqConfig) => {
  const method = (reqConfig.method ?? 'get').toUpperCase();
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && _csrfToken) {
    reqConfig.headers['x-csrf-token'] = _csrfToken;
  }
  return reqConfig;
});

// Response interceptor: update the in-memory CSRF store whenever any response
// carries a csrfToken. This covers: /csrf bootstrap, /login, /me, and any
// future endpoint that rotates the token.
axiosInstance.interceptors.response.use(
  (response) => {
    const data = response.data;
    if (
      data &&
      typeof data === 'object' &&
      'csrfToken' in data &&
      typeof data.csrfToken === 'string'
    ) {
      _csrfToken = data.csrfToken;
      if (typeof document !== 'undefined') {
        document.cookie = `csrf-token=${encodeURIComponent(data.csrfToken)}; path=/; SameSite=Lax`;
      }
    }
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      if (error.response.status === 401) {
        // Exclude authentication/bootstrap routes to avoid redirection loops
        const url = error.config?.url || '';
        const isAuthCheck =
          url.endsWith('/api/auth/me') ||
          url.endsWith('/api/auth/login') ||
          url.endsWith('/api/auth/signup') ||
          url.endsWith('/api/auth/csrf');

        if (!isAuthCheck) {
          if (typeof window !== 'undefined') {
            const currentPath =
              window.location.pathname + window.location.search;
            clearCsrfToken();
            window.location.href = `/login?redirectTo=${encodeURIComponent(currentPath)}`;
          }
        }
      }

      const data = error.response.data as Record<string, unknown> | undefined;
      const errorObj = data?.error as Record<string, unknown> | undefined;
      const message =
        (errorObj?.message as string | undefined) ||
        error.response.statusText ||
        'API request failed';
      const code = errorObj?.code as string | undefined;
      const details = errorObj?.details;
      return Promise.reject(
        new ApiError(message, error.response.status, code, details),
      );
    }
    return Promise.reject(error);
  },
);

export interface RequestOptions extends Omit<
  AxiosRequestConfig,
  'url' | 'baseURL'
> {
  params?: Record<string, string>;
  /**
   * Fetch API-style body string. Parsed as JSON and forwarded as `data`.
   * Prefer passing `data` directly for new code.
   */
  body?: string;
}

/**
 * Thin Axios-backed client for the backend core REST API.
 * Always import from here — never import axios directly in components.
 */
export async function apiClient<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, ...axiosOptions } = options;

  // body is a Fetch API-style backward compat alias for data
  if (body !== undefined && axiosOptions.data === undefined) {
    try {
      axiosOptions.data = JSON.parse(body) as unknown;
    } catch {
      axiosOptions.data = body;
    }
  }

  const response = await axiosInstance.request<T>({
    url: path,
    ...axiosOptions,
  });

  if (response.status === 204) {
    return {} as T;
  }

  return response.data;
}

export type { AxiosRequestConfig };
