import type { AuthUser } from '@/modules/auth/authTypes';

export type User = AuthUser;

export interface UpdateUserPayload {
  name?: string;
  phone?: string;
}

export interface UpdateUserVariables extends UpdateUserPayload {
  id: string;
}
