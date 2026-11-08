import { vi } from 'vite-plus/test'

export const mockStorage: any = {
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
