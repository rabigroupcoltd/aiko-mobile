import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import type { AxiosInstance, AxiosResponse } from 'axios';

import type { ApiResponse } from '@/modules/shared/apiTypes';
import { extractSoftErrorMessage, parseApiError } from '@/utils/parseApiError';
import showToast from '@/utils/toast';
import Axios from './api_management/MyHttpHelper';
import AxiosWithToken from './api_management/MyHttpHelperWithToken';



type HttpMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ApiManagerOptions<TVariables> {
  /** A path, or a function of the variables for endpoints with path params. */
  endpoint: EndpointResolver<TVariables>;
  /** Picks the request body. Defaults to sending the variables as-is. */
  getBody?: BodySelector<TVariables>;
  /** Query keys to invalidate on success. A string is treated as one key. */
  queryKey?: string | string[];
  method?: HttpMethod;
  /** True sends the bearer token. */
  isAuth?: boolean;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  /** Set null for multipart (a FormData body is detected automatically too). */
  contentType?: string | null;
}


export type BodySelector<TVariables> = (details: TVariables) => unknown;

/** Drops the named keys, for the common case of stripping path params. */
export function omitKeys<TVariables extends object>(
  ...keys: (keyof TVariables)[]
): BodySelector<TVariables> {
  return (details) => {
    const body = { ...details };
    keys.forEach((key) => delete body[key]);
    return body;
  };
}

interface ApiManagerReturn<TData, TError, TVariables> {
  callApi: (details: TVariables) => Promise<ApiResponse<TData>>;
  /** The unwrapped `data` field. */
  data: TData | undefined;
  /** The whole envelope, when you need `code` or `message`. */
  response: ApiResponse<TData> | undefined;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: TError | null;
  reset: () => void;
  mutation: UseMutationResult<ApiResponse<TData>, TError, TVariables>;
}


export type EndpointResolver<TVariables> = string | ((details: TVariables) => string);

const useApiManager = <TData = unknown, TError = Error, TVariables = unknown>({
  endpoint,
  getBody,
  queryKey,
  method = 'POST',
  isAuth = true,
  showSuccessToast = false,
  showErrorToast = true,
  contentType = 'application/json',
}: ApiManagerOptions<TVariables>): ApiManagerReturn<TData, TError, TVariables> => {
  const queryClient = useQueryClient();
  const axiosInstance: AxiosInstance = isAuth ? AxiosWithToken : Axios;

  const apiController = async (details: TVariables): Promise<ApiResponse<TData>> => {
    const url = typeof endpoint === 'function' ? endpoint(details) : endpoint;
    const body = getBody ? getBody(details) : details;
    const isMultipart = contentType === null || body instanceof FormData;
    // Multipart must override the instance's JSON default explicitly. Leaving
    // the header unset lets `application/json` through, and axios then
    // serialises the FormData to JSON — the file never reaches the server.
    // React Native's networking layer appends the boundary itself.
    const config = isMultipart
      ? {
          headers: { 'Content-Type': 'multipart/form-data' },
          transformRequest: (data: unknown) => data,
        }
      : { headers: contentType ? { 'Content-Type': contentType } : undefined };

    try {
      let response: AxiosResponse<ApiResponse<TData>>;

      switch (method) {
        case 'POST':
          response = await axiosInstance.post(url, body, config);
          break;
        case 'PUT':
          response = await axiosInstance.put(url, body, config);
          break;
        case 'PATCH':
          response = await axiosInstance.patch(url, body, config);
          break;
        case 'DELETE':
          response = await axiosInstance.delete(url, { ...config, data: body });
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      // Belt and braces — see extractSoftErrorMessage.
      const softError = extractSoftErrorMessage(response.data);
      if (softError) throw new Error(softError);

      return response.data;
    } catch (error) {
      // Rethrown as a plain Error so every consumer gets a readable `message`
      // instead of having to dig through an AxiosError.
      throw new Error(parseApiError(error));
    }
  };

  const mutation = useMutation<ApiResponse<TData>, TError, TVariables>({
    mutationFn: apiController,
    onSuccess: (response) => {
      if (showSuccessToast && response.message) showToast.success(response.message);

      if (queryKey) {
        const keys = Array.isArray(queryKey) ? queryKey : [queryKey];
        keys.forEach((key) => {
          if (key) queryClient.invalidateQueries({ queryKey: [key] });
        });
      }
    },
    onError: (error: TError) => {
      if (showErrorToast) showToast.error(parseApiError(error));
    },
  });

  return {
    callApi: (details: TVariables) => mutation.mutateAsync(details),
    data: mutation.data?.data,
    response: mutation.data,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
    mutation,
  };
};

export default useApiManager;
