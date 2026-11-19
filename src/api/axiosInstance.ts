import axios from 'axios';

export const BASE_URL = 'https://fakestoreapi.com';

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { Accept: 'application/json' },
});

/** Converts any thrown value into a short message that is safe to show to the user. */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') return 'The request timed out. Check your connection and try again.';
    if (!error.response) return 'Could not reach the server. Check your internet connection and try again.';
    return `The server returned an error (status ${error.response.status}). Try again in a moment.`;
  }
  if (error instanceof Error && error.message === 'Unexpected response format') {
    return 'The server sent data in an unexpected format.';
  }
  return 'Something went wrong. Please try again.';
}
