'use client';
import { Component, type ReactNode, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Send, User, Shield } from 'lucide-react'
import { getApiBaseUrl } from '../../config/apiBase'
import { adminApiFetch } from '../api/adminSession'

type Customer = {
  id: number
  name?: string
  email?: string
}

type ChatMessage = {
  id: number
  sender_type: 'customer' | 'admin'
  body: string
  impersonated: boolean
  sent_at: string
}

type Chat = {
  id: number
  status: string
  customer: Customer
  messages: ChatMessage[]
}

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
}

class ChatErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error('AdminChatConversation crashed', { error, info })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-rose-700/70 bg-rose-950/60 px-3 py-2 text-xs text-rose-100">
          Something went wrong in this chat view. Please refresh or return to the chats list.
        </div>
      )
    }

    return this.props.children
  }
}

function AdminChatConversationInner({ chatId }: { chatId?: string }) {
  const params = useParams()
  const routeId = params && typeof params.id === 'string' ? params.id : ''
  const id = chatId || routeId
  const router = useRouter()
  const [chat, setChat] = useState<Chat | null>(null)
  const [input, setInput] = useState('')
  const [asCustomer, setAsCustomer] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const apiBaseUrl = getApiBaseUrl()

  useEffect(() => {
    if (!id) return

    let cancelled = false

    const fetchChat = async (showLoading: boolean) => {
      try {
        if (showLoading) {
          setLoading(true)
        }
        setError(null)

        const response = await adminApiFetch(`${apiBaseUrl}/api/admin/chats/${id}`)

        if (!response.ok) {
          throw new Error('Failed to load conversation')
        }

        const data = (await response.json()) as Chat
        if (!cancelled) {
          setChat(data)
        }
      } catch (err) {
        if (cancelled) return
        console.error('Failed to load conversation', err)
        const message = err instanceof Error ? err.message : 'Something went wrong'
        setError(message)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void fetchChat(true)
    const intervalId = window.setInterval(() => {
      void fetchChat(false)
    }, 5000)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [apiBaseUrl, id])

  const handleSend = async () => {
    if (!chat || !input.trim() || sending) return

    try {
      setSending(true)
      setError(null)

      const response = await adminApiFetch(`${apiBaseUrl}/api/admin/chats/${chat.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: input.trim(),
          as_customer: asCustomer,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const newMessage = (await response.json()) as ChatMessage

      setChat((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, newMessage],
            }
          : prev,
      )

      setInput('')
    } catch (err) {
      console.error('Failed to send message', err)
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <div className="text-xs text-slate-400">Loading conversation…</div>
  }

  if (!chat) {
    return (
      <div className="space-y-3">
        <button
          onClick={() => router.push('/admin/chats')}
          className="inline-flex items-center gap-2 text-xs text-sky-300 hover:text-sky-200"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to chats
        </button>
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 px-4 py-6 text-xs text-slate-300">
          Conversation not found.
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-200px)] flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/chats')}
            className="rounded-full border border-slate-800/80 p-1.5 text-slate-400 hover:border-sky-500/60 hover:text-sky-200"
          >
            <ArrowLeft className="h-3 w-3" />
          </button>
          <div>
            <div className="text-sm font-semibold text-slate-50">
              {chat.customer.name || chat.customer.email || `Customer #${chat.customer.id}`}
            </div>
            <div className="text-[11px] text-slate-400">
              {chat.customer.email || 'Email unknown'} · Chat #{chat.id}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/70 px-3 py-1 text-[11px] text-slate-200">
            <input
              type="checkbox"
              checked={asCustomer}
              onChange={(e) => setAsCustomer(e.target.checked)}
              className="h-3 w-3 rounded border-slate-600 bg-slate-900 text-sky-500 focus:ring-sky-500"
            />
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>Send as customer</span>
            </span>
          </label>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-700/70 bg-emerald-900/40 px-2.5 py-1 text-[10px] text-emerald-200">
            <Shield className="h-3 w-3" />
            Impersonation actions are logged
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-700/70 bg-rose-950/60 px-3 py-2 text-xs text-rose-100">
          {error}
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-slate-800/80 bg-slate-950/70 p-4">
        {chat.messages.length === 0 ? (
          <div className="text-center text-xs text-slate-500">No messages yet.</div>
        ) : (
          chat.messages.map((message) => {
            const isAdmin = message.sender_type === 'admin'

            return (
              <div
                key={message.id}
                className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-3 py-2 text-xs ${
                    isAdmin
                      ? 'rounded-br-sm bg-sky-600 text-white'
                      : 'rounded-bl-sm bg-slate-800/80 text-slate-50'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.body}</p>
                  <div className="mt-1 flex items-center justify-between gap-2 text-[10px] opacity-80">
                    <span>
                      {new Date(message.sent_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {message.impersonated && (
                      <span className="rounded-full bg-emerald-900/60 px-1.5 py-0.5 text-[9px]">
                        Sent as customer
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            asCustomer
              ? 'Type a message as the customer…'
              : 'Type a message as admin…'
          }
          rows={2}
          className="flex-1 resize-none rounded-2xl border border-slate-700/80 bg-slate-900/70 px-3 py-2 text-xs text-slate-100 outline-none focus:border-sky-500/70"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="inline-flex h-10 items-center justify-center rounded-2xl bg-sky-600 px-4 text-xs font-semibold text-white shadow-lg shadow-sky-900/40 hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send className="mr-1 h-3 w-3" />
          Send
        </button>
      </div>
    </div>
  )
}

interface AdminChatConversationProps {
  chatId?: string;
}

export default function AdminChatConversation({ chatId }: AdminChatConversationProps) {
  return (
    <ChatErrorBoundary>
      <AdminChatConversationInner chatId={chatId} />
    </ChatErrorBoundary>
  )
}
