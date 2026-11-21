import { type Mock, vi } from 'vite-plus/test'

import type { StorageAdapter } from '../src/storage'

declare global {
  /**
   * Set by inline-script handlers in tests, which can't close over test
   * variables because they run as source code.
   */
  var __inlineThemeResult: unknown
}

type MockStorage = {
  [K in keyof StorageAdapter]-?: Mock<NonNullable<StorageAdapter[K]>>
}

export const mockStorage: MockStorage = {
  get: vi.fn(),
  set: vi.fn(),
  broadcast: vi.fn(),
  watch: vi.fn(),
}

export function setSystemColorScheme(colorScheme: 'light' | 'dark') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => {
      return {
        matches: colorScheme === 'dark',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }
    }),
  })
}
