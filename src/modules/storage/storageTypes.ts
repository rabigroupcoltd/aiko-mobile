import type { StorageProvider } from '@/modules/shared/apiTypes';

export interface StorageProviderInfo {
  active: StorageProvider;
  available: StorageProvider[];
}
