// jest.setup.js
import '@testing-library/jest-dom'
import 'whatwg-fetch'

// Polyfill for setImmediate
global.setImmediate = global.setImmediate || ((fn, ...args) => setTimeout(fn, 0, ...args))
global.clearImmediate = global.clearImmediate || clearTimeout

// Custom Jest matchers
expect.extend({
  toBeOneOf(received, validOptions) {
    const pass = validOptions.includes(received)
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${validOptions}`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be one of ${validOptions}`,
        pass: false,
      }
    }
  },
})

// Global test setup
beforeEach(() => {
  // Reset fetch mock
  if (global.fetch && typeof global.fetch.mockClear === 'function') {
    global.fetch.mockClear()
  }
})

// Suppress console errors in tests unless specifically testing error handling
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (args[0]?.includes && (
      args[0].includes('Warning:') || 
      args[0].includes('validateDOMNesting') ||
      args[0].includes('ReactDOMTestUtils')
    )) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
