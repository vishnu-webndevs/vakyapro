import { adminApiFetch, consumeAdminRedirectPath, consumeAdminSessionReason } from '../adminSession'

describe('adminSession', () => {
  const apiUrl = 'http://127.0.0.1:8000/api/admin/test'

  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('vakya_admin_token', 'test-token')
    ;(global as unknown as { fetch: jest.Mock }).fetch = jest.fn()
  })

  afterEach(() => {
    localStorage.clear()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global as any).fetch = undefined
    jest.restoreAllMocks()
  })

  it('attaches Authorization header and returns response on success', async () => {
    const mockedFetch = global.fetch as jest.Mock
    mockedFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({ ok: true }),
    })

    const response = await adminApiFetch(apiUrl)

    expect(mockedFetch).toHaveBeenCalledWith(
      apiUrl,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
          Accept: 'application/json',
        }),
      }),
    )
    expect(response.ok).toBe(true)
  })

  it('handles 401 by storing reason and redirect path', async () => {
    const mockedFetch = global.fetch as jest.Mock
    mockedFetch.mockResolvedValueOnce({
      status: 401,
      ok: false,
    })

    delete (window as unknown as { location: unknown }).location
    ;(window as unknown as { location: { assign: jest.Mock; pathname: string; search: string } }).location =
      {
        assign: jest.fn(),
        pathname: '/admin/dashboard',
        search: '',
      }

    await expect(adminApiFetch(apiUrl)).rejects.toThrow('Admin session has expired.')

    const reason = consumeAdminSessionReason()
    const redirect = consumeAdminRedirectPath()

    expect(reason).toBe('expired')
    expect(redirect).toBe('/admin/dashboard')
  })
})
