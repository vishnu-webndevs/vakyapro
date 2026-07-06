import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getApiBaseUrl } from '../config/apiBase'
import { consumeAdminRedirectPath, consumeAdminSessionReason } from './api/adminSession'

export default function AdminLogin() {
  const router = useRouter()
  const apiBaseUrl = getApiBaseUrl()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const reason = consumeAdminSessionReason()
    if (reason === 'inactivity') {
      setError('Your session expired due to inactivity. Please log in again.')
    } else if (reason === 'expired' || reason === 'invalid') {
      setError('Your session has expired. Please log in again.')
    } else if (reason === 'forbidden') {
      setError('You do not have access to that resource. Please log in with a different account.')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Login failed')
      }

      const data = await response.json()
      setToken(data.token)
      localStorage.setItem('vakya_admin_token', data.token as string)
      const redirectPath = consumeAdminRedirectPath()
      if (redirectPath && redirectPath.startsWith('/admin')) {
        router.push(redirectPath)
      } else {
        router.push('/admin/dashboard')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gradient-to-b from-gray-900/80 to-black/80 border border-gray-800 rounded-2xl p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">
            Vakyapro <span className="bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">Admin</span>
          </h1>
          <p className="text-gray-400 text-sm">
            Login with your admin credentials to access the backend APIs.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm text-gray-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-black/60 border border-gray-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm text-gray-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-black/60 border border-gray-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg font-semibold text-white hover:from-cyan-600 hover:to-blue-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login as Admin'}
          </button>
        </form>

        {token && (
          <div className="mt-6 text-xs text-gray-400 break-all bg-black/60 border border-gray-700 rounded-lg p-3">
            <div className="font-semibold text-gray-300 mb-1">API Token</div>
            <div>{token}</div>
          </div>
        )}
      </div>
    </div>
  )
}
