import axios from 'axios';

import { API_BASE_URL, API_TIMEOUT_MS } from '@/config/env';


const Axios = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: API_TIMEOUT_MS,
});

export default Axios;
