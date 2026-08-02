import axios from 'axios';

import { API_BASE_URL, API_TIMEOUT_MS } from '@/config/env';

/**
 * Unauthenticated axios instance.
 *
 * Used by the handful of endpoints that run before there is a token —
 * `POST /api/auth/firebase` above all — and by anything genuinely public, such
 * as the pricing rate cards the booking screen renders before sign-in.
 */
const Axios = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: API_TIMEOUT_MS,
});

export default Axios;
