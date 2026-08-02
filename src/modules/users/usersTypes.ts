import type { AuthUser } from '@/modules/auth/authTypes';

/** Public user columns. The password hash is never selected server-side. */
export type User = AuthUser;

/** `PATCH /api/users/{id}` — a user may only update their own record. */
export interface UpdateUserPayload {
  name?: string;
  /** 7-15 digits, optional leading +. */
  phone?: string;
}

/** Carries the path id alongside the body, for the mutation manager. */
export interface UpdateUserVariables extends UpdateUserPayload {
  id: string;
}
