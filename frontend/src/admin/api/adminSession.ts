const ADMIN_TOKEN_KEY = 'vakya_admin_token'
const REDIRECT_KEY = 'vakya_post_login_redirect'
const REASON_KEY = 'vakya_session_expired_reason'

type ExpireReason = 'expired' | 'forbidden' | 'invalid' | 'inactivity'

let inactivityWatcherStarted = false
let inactivityIntervalId: number | null = null

const INACTIVITY_LIMIT_MS = 30 * 60 * 1000
const INACTIVITY_CHECK_MS = 60 * 1000

let lastActivityAt = Date.now()

function setLastActivityNow() {
  lastActivityAt = Date.now()
}

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY)
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY)
}

export function handleAdminSessionExpired(reason: ExpireReason) {
  const currentPath = window.location.pathname + window.location.search

  localStorage.setItem(REDIRECT_KEY, currentPath)
  localStorage.setItem(REASON_KEY, reason)

  clearAdminToken()

  if (window.location.pathname !== '/admin') {
    window.location.assign('/admin')
  }
}

type AdminFetchOptions = RequestInit & {
  skipAuth?: boolean
}

export async function adminApiFetch(input: RequestInfo | URL, options: AdminFetchOptions = {}) {
  const { skipAuth, ...init } = options

  const headers = new Headers(init.headers ?? {})

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  if (!skipAuth) {
    const token = getAdminToken()
    if (!token) {
      handleAdminSessionExpired('invalid')
      throw new Error('Admin session is missing.')
    }
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(input, { ...init, headers })

  if (response.status === 401) {
    handleAdminSessionExpired('expired')
    throw new Error('Admin session has expired.')
  }

  if (response.status === 403) {
    handleAdminSessionExpired('forbidden')
    throw new Error('Admin access is forbidden.')
  }

  return response
}

export function startAdminInactivityWatcher() {
  if (inactivityWatcherStarted) return
  inactivityWatcherStarted = true

  const events: (keyof WindowEventMap)[] = [
    'mousemove',
    'mousedown',
    'keydown',
    'scroll',
    'focus',
    'touchstart',
  ]

  const handleActivity = () => {
    setLastActivityNow()
  }

  events.forEach((eventName) => {
    window.addEventListener(eventName, handleActivity)
  })

  inactivityIntervalId = window.setInterval(() => {
    const token = getAdminToken()
    if (!token) {
      return
    }

    const now = Date.now()
    const idleFor = now - lastActivityAt

    if (idleFor >= INACTIVITY_LIMIT_MS) {
      handleAdminSessionExpired('inactivity')
    }
  }, INACTIVITY_CHECK_MS)
}

export function stopAdminInactivityWatcher() {
  if (!inactivityWatcherStarted) return
  inactivityWatcherStarted = false

  if (inactivityIntervalId !== null) {
    window.clearInterval(inactivityIntervalId)
    inactivityIntervalId = null
  }
}

export function consumeAdminSessionReason(): string | null {
  const reason = localStorage.getItem(REASON_KEY)
  if (reason) {
    localStorage.removeItem(REASON_KEY)
  }
  return reason
}

export function consumeAdminRedirectPath(): string | null {
  const path = localStorage.getItem(REDIRECT_KEY)
  if (path) {
    localStorage.removeItem(REDIRECT_KEY)
  }
  return path
}

