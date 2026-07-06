import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      TextEncoder?: typeof TextEncoder
      TextDecoder?: typeof TextDecoder
    }
  }
}

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder as typeof global.TextDecoder
}
