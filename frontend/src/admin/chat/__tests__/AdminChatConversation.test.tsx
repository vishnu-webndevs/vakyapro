import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AdminChatConversation from '../AdminChatConversation'

const mockChat = {
  id: 1,
  status: 'open',
  customer: {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
  },
  messages: [
    {
      id: 1,
      sender_type: 'customer' as const,
      body: 'Hello, I need help with prompts.',
      impersonated: false,
      sent_at: new Date().toISOString(),
    },
  ],
}

describe('AdminChatConversation', () => {
  const apiBaseUrl = 'http://127.0.0.1:8000'

  beforeEach(() => {
    localStorage.setItem('vakya_admin_token', 'test-token')
    ;(global as unknown as { fetch: jest.Mock }).fetch = jest.fn()
    jest
      .spyOn(window, 'setInterval')
      .mockImplementation((((): number => 1) as unknown as typeof setInterval))
    jest.spyOn(window, 'clearInterval').mockImplementation(jest.fn())
  })

  afterEach(() => {
    localStorage.clear()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global as any).fetch = undefined
    jest.restoreAllMocks()
  })

  const renderWithRouter = () =>
    render(
      <MemoryRouter initialEntries={['/admin/chats/1']}>
        <Routes>
          <Route path="/admin/chats/:id" element={<AdminChatConversation />} />
        </Routes>
      </MemoryRouter>,
    )

  it('loads and displays an existing conversation', async () => {
    const mockedFetch = global.fetch as jest.Mock
    mockedFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockChat,
    })

    renderWithRouter()

    expect(await screen.findByText(/Test User/i)).toBeInTheDocument()
    expect(screen.getByText(/Hello, I need help with prompts/i)).toBeInTheDocument()

    expect(mockedFetch).toHaveBeenCalledWith(
      `${apiBaseUrl}/api/admin/chats/1`,
      expect.anything(),
    )
  })

  it('sends a new admin prompt message and appends it to the thread', async () => {
    const mockedFetch = global.fetch as jest.Mock
    mockedFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockChat,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 2,
          sender_type: 'admin',
          body: 'This is a new prompt from admin',
          impersonated: false,
          sent_at: new Date().toISOString(),
        }),
      })

    renderWithRouter()

    const textarea = await screen.findByPlaceholderText('Type a message as admin…')
    fireEvent.change(textarea, { target: { value: 'This is a new prompt from admin' } })

    const sendButton = screen.getByRole('button', { name: /send/i })
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(
        screen.getByText('This is a new prompt from admin', { exact: false }),
      ).toBeInTheDocument()
    })
    const [, firstCallInit] = mockedFetch.mock.calls[0]
    const [, secondCallInit] = mockedFetch.mock.calls[1]

    expect(firstCallInit).toBeDefined()
    expect(secondCallInit).toBeDefined()

    expect(secondCallInit.method).toBe('POST')
    const headers = secondCallInit.headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer test-token')
  })

  it('allows sending as customer and updates placeholder', async () => {
    const mockedFetch = global.fetch as jest.Mock
    mockedFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockChat,
    })

    renderWithRouter()

    const checkbox = await screen.findByRole('checkbox', { name: /send as customer/i })
    fireEvent.click(checkbox)

    const textarea = screen.getByPlaceholderText('Type a message as the customer…')
    fireEvent.change(textarea, { target: { value: 'Customer-style prompt' } })

    expect((textarea as HTMLTextAreaElement).value).toBe('Customer-style prompt')
  })

  it('shows a friendly error message if loading fails', async () => {
    const mockedFetch = global.fetch as jest.Mock
    mockedFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Failed to load conversation' }),
    })

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText(/Conversation not found/i)).toBeInTheDocument()
    })
  })
})
