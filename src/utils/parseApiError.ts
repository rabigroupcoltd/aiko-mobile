import { AxiosError } from 'axios';

const NETWORK_ERROR_MESSAGE = 'Connection error, please try again';
const DEFAULT_ERROR_MESSAGE = 'Something went wrong, please try again';

interface ApiErrorBody {
  code?: number;
  message?: unknown;
  error?: unknown;
}

const isErrorBody = (value: unknown): value is ApiErrorBody =>
  typeof value === 'object' && value !== null;

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
    if (!error.response) return true;
  }

  return error instanceof Error && error.message === 'Network Error';
};

const extractMessage = (error: unknown): string | null => {
  if (error instanceof AxiosError) {
    const body = error.response?.data;

    if (isErrorBody(body)) {
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

  if (isNetworkError(error)) return NETWORK_ERROR_MESSAGE;

  const message = extractMessage(error) ?? fallback;
  return prefix ? `${prefix}${message}` : message;
};

export const extractSoftErrorMessage = (body: unknown): string | null => {
  if (!isErrorBody(body)) return null;
  if (typeof body.code !== 'number' || body.code < 400) return null;

  return stringify(body.error) ?? stringify(body.message) ?? DEFAULT_ERROR_MESSAGE;
};
