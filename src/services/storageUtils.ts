// Shared storage backend supporting browser localStorage, Node test environments, and in-memory fallback
const memoryStorage: Record<string, string> = {};

export interface StorageBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function getStorageBackend(): StorageBackend {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
    try {
      (globalThis as any).localStorage.getItem('__probe__');
      return (globalThis as any).localStorage;
    } catch {
      // fallback to memory
    }
  }
  return {
    getItem: (key: string) => (key in memoryStorage ? memoryStorage[key] : null),
    setItem: (key: string, value: string) => {
      memoryStorage[key] = value;
    },
    removeItem: (key: string) => {
      delete memoryStorage[key];
    },
  };
}
