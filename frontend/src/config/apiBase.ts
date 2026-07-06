type GlobalWithApiBase = typeof globalThis & {
  __API_BASE_URL__?: string
}

declare const __API_BASE_URL__: string | undefined

export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  if (typeof __API_BASE_URL__ === 'string' && __API_BASE_URL__) {
    return __API_BASE_URL__
  }

  const globalWithApi = globalThis as GlobalWithApiBase
  if (globalWithApi.__API_BASE_URL__) {
    return globalWithApi.__API_BASE_URL__ as string
  }

  if (typeof window !== 'undefined') {
    const origin = window.location.origin
    const hostname = window.location.hostname

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://127.0.0.1:8000'
    }

    if (hostname === 'vakyapro.com' || hostname === 'www.vakyapro.com') {
      return 'https://api.vakyapro.com'
    }

    return origin
  }

  return 'http://127.0.0.1:8000'
}
