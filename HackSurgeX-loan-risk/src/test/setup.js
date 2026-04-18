/**
 * Test setup file for Vitest
 * Configures global test environment
 */

import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock IndexedDB for tests
global.indexedDB = {
  open: () => ({
    onsuccess: null,
    onerror: null,
    result: {
      createObjectStore: () => ({}),
      transaction: () => ({
        objectStore: () => ({
          add: () => ({}),
          get: () => ({}),
          put: () => ({}),
          delete: () => ({})
        })
      })
    }
  })
};
