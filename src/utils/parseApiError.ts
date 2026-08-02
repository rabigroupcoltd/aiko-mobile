import { AxiosError } from 'axios';

/**
 * Turns anything thrown by axios or the API into one line a user can read.
 *
 * The Aiko backend answers with `{ code, message, error }` on failure, where
 * `error` is either a string or the list of validation messages the pipe
 * flattened — so that field is checked before axios's own generic message,
 * which is always "Request failed with status code 400".
 */

const NETWORK_ERROR_MESSAGE = 'Connection error, please try again';
const DEFAULT_ERROR_MESSAGE = 'Something went wrong, please try again';

/** The failure half of the API envelope. */
interface ApiErrorBody {
  code?: number;
  message?: unknown;
  error?: unknown;
}

const isErrorBody = (value: unknown): value is ApiErrorBody =>
  typeof value === 'object' && value !== null;

/** Accepts a string or a list of validation messages; ignores anything else. */
const stringify = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (Array.isArray(value)) {
    const joined = value.filter((item): item is string => typeof item === 'string').join(', ');
    return joined.length > 0 ? joined : null;
  }

  return null;
};

const isNetworkError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') return true;
    // No response at all means the request never reached us — on a phone that
    // is nearly always a dead connection rather than a server fault.
    if (!error.response) return true;
  }

  return error instanceof Error && error.message === 'Network Error';
};

const extractMessage = (error: unknown): string | null => {
  if (error instanceof AxiosError) {
    const body = error.response?.data;

    if (isErrorBody(body)) {
      // `error` carries the useful detail; `message` is only the category.
      return stringify(body.error) ?? stringify(body.message);
    }

    return stringify(error.message);
  }

  if (isErrorBody(error)) {
    const fromBody = stringify(error.error) ?? stringify(error.message);
    if (fromBody) return fromBody;
  }

  if (error instanceof Error) return stringify(error.message);

  return stringify(error);
};

export interface ParseApiErrorOptions {
  fallback?: string;
  prefix?: string;
}

export const parseApiError = (error: unknown, options: ParseApiErrorOptions = {}): string => {
  const { fallback = DEFAULT_ERROR_MESSAGE, prefix } = options;

  // Checked first: a dead connection has no useful body to read.
  if (isNetworkError(error)) return NETWORK_ERROR_MESSAGE;

  const message = extractMessage(error) ?? fallback;
  return prefix ? `${prefix}${message}` : message;
};

/**
 * Catches a failure that arrived with a 2xx status line.
 *
 * The API's StatusInterceptor normally syncs the HTTP status to the `code` in
 * the body, so this should not fire — but a proxy that rewrites status codes,
 * or a handler that slips past the interceptor, would otherwise hand a client
 * an error envelope it treats as success. Cheap to check, expensive to miss.
 */
export const extractSoftErrorMessage = (body: unknown): string | null => {
  if (!isErrorBody(body)) return null;
  if (typeof body.code !== 'number' || body.code < 400) return null;

  return stringify(body.error) ?? stringify(body.message) ?? DEFAULT_ERROR_MESSAGE;
};
