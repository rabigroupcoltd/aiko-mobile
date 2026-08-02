import type { StorageProvider } from '@/modules/shared/apiTypes';

/** Which backend uploads are currently going to. Admin only. */
export interface StorageProviderInfo {
  /** Resolved from STORAGE_PROVIDER at boot. */
  active: StorageProvider;
  /** Every provider this build supports. */
  available: StorageProvider[];
}
