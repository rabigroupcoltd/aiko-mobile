import { AxiosError, AxiosHeaders } from 'axios';

import { omitKeys } from '@/constants/mainController';
import { extractSoftErrorMessage, parseApiError } from '@/utils/parseApiError';

/**
 * Covers the two pieces of the API layer that are pure and easy to get subtly
 * wrong: turning a backend failure into one readable line, and stripping path
 * params out of a request body.
 *
 * The body one matters because the API validates with `forbidNonWhitelisted` —
 * leaking an `id` into the body is a 400, not a field the server ignores.
 */

/** Builds an AxiosError the way axios actually shapes one. */
function axiosErrorWith(status: number, data: unknown): AxiosError {
  const error = new AxiosError('Request failed with status code ' + status);
  error.response = {
    status,
    statusText: '',
    data,
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
  };
  return error;
}

describe('parseApiError', () => {
  it('prefers the `error` field over axios’s generic message', () => {
    const error = axiosErrorWith(400, {
      code: 400,
      message: 'BAD REQUEST',
      error: 'amount must not be less than 1',
    });

    expect(parseApiError(error)).toBe('amount must not be less than 1');
  });

  it('joins the list of validation messages', () => {
    const error = axiosErrorWith(400, {
      code: 400,
      message: 'INVALID REQUEST',
      error: ['lat must be a latitude string or number', 'lng must be a longitude'],
    });

    expect(parseApiError(error)).toBe(
      'lat must be a latitude string or number, lng must be a longitude',
    );
  });

  it('falls back to `message` when there is no `error`', () => {
    expect(parseApiError(axiosErrorWith(404, { code: 404, message: 'NOT FOUND' }))).toBe(
      'NOT FOUND',
    );
  });

  it('reports a dead connection rather than the body', () => {
    const error = new AxiosError('Network Error');
    error.code = 'ERR_NETWORK';

    expect(parseApiError(error)).toBe('Connection error, please try again');
  });

  it('treats a response-less error as a network failure', () => {
    expect(parseApiError(new AxiosError('boom'))).toBe('Connection error, please try again');
  });

  it('handles a plain Error and an unknown throw', () => {
    expect(parseApiError(new Error('something specific'))).toBe('something specific');
    expect(parseApiError(undefined)).toBe('Something went wrong, please try again');
  });

  it('applies the prefix only to real messages', () => {
    const error = axiosErrorWith(409, { code: 409, message: 'CONFLICT', error: 'Already exists' });
    expect(parseApiError(error, { prefix: 'Sorry: ' })).toBe('Sorry: Already exists');
  });
});

describe('extractSoftErrorMessage', () => {
  it('catches an error envelope that arrived with a 2xx status line', () => {
    expect(
      extractSoftErrorMessage({ code: 403, message: 'FORBIDDEN', error: 'Not your address' }),
    ).toBe('Not your address');
  });

  it('passes a success envelope through untouched', () => {
    expect(extractSoftErrorMessage({ code: 200, message: 'SUCCESSFUL', data: { id: 'x' } })).toBe(
      null,
    );
  });

  it('ignores anything that is not an envelope', () => {
    expect(extractSoftErrorMessage(null)).toBe(null);
    expect(extractSoftErrorMessage('nope')).toBe(null);
    expect(extractSoftErrorMessage({ nothing: true })).toBe(null);
  });
});

describe('omitKeys', () => {
  it('strips a path param from the body', () => {
    const body = omitKeys<{ id: string; name: string }>('id')({ id: 'abc', name: 'Ada' });
    expect(body).toEqual({ name: 'Ada' });
  });

  it('strips several, and leaves the original untouched', () => {
    const variables = { id: 'a', photoId: 'b', reason: 'blurry' };
    const body = omitKeys<typeof variables>('id', 'photoId')(variables);

    expect(body).toEqual({ reason: 'blurry' });
    expect(variables).toEqual({ id: 'a', photoId: 'b', reason: 'blurry' });
  });

  it('keeps an explicit undefined out of the way of optional fields', () => {
    const body = omitKeys<{ id: string; reason?: string }>('id')({ id: 'a' });
    expect(body).toEqual({});
  });
});
