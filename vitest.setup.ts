import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import { supabase } from './src/services/supabase';

// Provide default environment variables
declare const process: { env: Record<string, string | undefined> };
if (typeof process !== 'undefined' && process.env) {
  process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
  process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
}

// Mock global fetch to prevent any external network calls in unit tests
if (typeof globalThis.fetch === 'function') {
  globalThis.fetch = vi.fn().mockImplementation((_input, _init) => {
    return Promise.resolve(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });
}

// Mock supabase RPC and Auth by default to avoid unhandled network requests
vi.spyOn(supabase, 'rpc').mockResolvedValue({ data: [], error: null } as any);
vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({ data: { user: null }, error: null } as any);
vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({ data: { session: null }, error: null } as any);

// Mock maplibre-gl globally for JSDOM
vi.mock('maplibre-gl', () => {
  class MockMap {
    setCenter = vi.fn();
    resize = vi.fn();
    on = vi.fn();
    off = vi.fn();
    once = vi.fn();
    remove = vi.fn();
    getSource = vi.fn();
    addSource = vi.fn();
    addLayer = vi.fn();
    isStyleLoaded = vi.fn().mockReturnValue(true);
    flyTo = vi.fn();
    easeTo = vi.fn();
    getCanvas = vi.fn().mockReturnValue({ style: { cursor: '' } });
  }

  class MockMarker {
    setLngLat = vi.fn().mockReturnThis();
    addTo = vi.fn().mockReturnThis();
    remove = vi.fn();
  }

  return {
    Map: MockMap,
    Marker: MockMarker,
  };
});

// Mock idb/build/index.js so indexedDB is not required in Node/JSDOM
vi.mock('idb/build/index.js', () => {
  const store = new Map();
  const mockDb = {
    count: vi.fn().mockImplementation(async () => store.size),
    getAll: vi.fn().mockImplementation(async () => Array.from(store.values())),
    getFromIndex: vi.fn().mockImplementation(async (_s: string, _idx: string, val: string) => {
      return Array.from(store.values()).find((item: any) => item?.slug === val) || null;
    }),
    clear: vi.fn().mockImplementation(async () => store.clear()),
    transaction: vi.fn().mockImplementation(() => {
      const storeObj = {
        put: vi.fn().mockImplementation(async (item: any) => {
          store.set(item.id, item);
        }),
        openCursor: vi.fn().mockImplementation(async () => {
          const items = Array.from(store.values());
          if (items.length === 0) return null;
          const createCursor = (idx: number): any => {
            if (idx >= items.length) return null;
            return {
              value: items[idx],
              continue: vi.fn().mockImplementation(async () => createCursor(idx + 1)),
            };
          };
          return createCursor(0);
        }),
      };
      return {
        store: storeObj,
        objectStore: vi.fn().mockReturnValue(storeObj),
        done: Promise.resolve(),
      };
    }),
  };
  return {
    openDB: vi.fn().mockResolvedValue(mockDb),
  };
});

// Global browser mocks for jsdom
if (typeof window !== 'undefined') {
  window.scrollTo = vi.fn();
  window.alert = vi.fn();
  window.confirm = vi.fn(() => true);

  if (!navigator.geolocation) {
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: vi.fn(),
        watchPosition: vi.fn(),
        clearWatch: vi.fn(),
      },
      writable: true,
      configurable: true,
    });
  }

  if (!URL.createObjectURL) {
    URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  }
  if (!URL.revokeObjectURL) {
    URL.revokeObjectURL = vi.fn();
  }
}
