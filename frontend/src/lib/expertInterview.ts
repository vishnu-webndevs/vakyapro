export type InterviewRole = 'user' | 'assistant'

export interface InterviewMessage {
  role: InterviewRole
  content: string
}

export interface InterviewContext {
  sessionId: string
  messageHistory: InterviewMessage[]
  questionCount: number
  smsLimit: number
  callModel: LlmCaller
  maxQuestions?: number
}

export type InterviewTurnKind = 'question' | 'summary'

export interface InterviewTurnResult {
  sessionId: string
  kind: InterviewTurnKind
  message: string
  questionCount: number
  done: boolean
}

export interface LlmCallerArgs {
  sessionId: string
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
  mode: 'interview' | 'final'
}

export type LlmCaller = (args: LlmCallerArgs) => Promise<string>

function buildSystemPrompt(maxQuestions: number, smsLimit: number): string {
  return [
    'You are a senior domain expert texting from a phone.',
    'Infer the user context from their first message.',
    'Ask at most ' + maxQuestions + ' high-impact questions.',
    'Each reply must be a single line, <= ' + smsLimit + ' chars.',
    'Tone is curious, concise, authoritative, no greetings.',
    'When you need more info, respond as:',
    'QUESTION: <single short question>',
    'When you have enough info, respond as:',
    'SUMMARY: <final expert summary or prompt>',
    'Never send more than one question or summary at a time.',
  ].join(' ')
}

function truncateSms(text: string, limit: number): string {
  const trimmed = text.trim()
  if (trimmed.length <= limit) return trimmed
  const slice = trimmed.slice(0, limit)
  const punctuationIndex = Math.max(
    slice.lastIndexOf('.'),
    slice.lastIndexOf('!'),
    slice.lastIndexOf('?'),
  )
  if (punctuationIndex > 20) {
    return slice.slice(0, punctuationIndex + 1)
  }
  const spaceIndex = slice.lastIndexOf(' ')
  if (spaceIndex > 20) {
    return slice.slice(0, spaceIndex)
  }
  return slice
}

function parseLlmResponse(raw: string): { kind: InterviewTurnKind; content: string } {
  const trimmed = raw.trim()
  const questionMatch = /^QUESTION:\s*(.+)$/is.exec(trimmed)
  if (questionMatch && questionMatch[1]) {
    return { kind: 'question', content: questionMatch[1].trim() }
  }
  const summaryMatch = /^SUMMARY:\s*(.+)$/is.exec(trimmed)
  if (summaryMatch && summaryMatch[1]) {
    return { kind: 'summary', content: summaryMatch[1].trim() }
  }
  const endsWithQuestionMark = trimmed.endsWith('?')
  if (endsWithQuestionMark) {
    return { kind: 'question', content: trimmed }
  }
  return { kind: 'summary', content: trimmed }
}

/**
 * Orchestrates one expert-interview turn by calling the LLM, enforcing SMS limits,
 * tracking the number of questions, and deciding when to switch to final output mode.
 */
export async function runExpertInterviewTurn(
  context: InterviewContext,
): Promise<InterviewTurnResult> {
  const maxQuestions = context.maxQuestions ?? 4
  const smsLimit = context.smsLimit || 160
  const exhausted = context.questionCount >= maxQuestions
  const mode: 'interview' | 'final' = exhausted ? 'final' : 'interview'

  const systemPrompt = buildSystemPrompt(maxQuestions, smsLimit)

  const messages: LlmCallerArgs['messages'] = [
    { role: 'system', content: systemPrompt },
    ...context.messageHistory.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  ]

  if (mode === 'final') {
    messages.push({
      role: 'user',
      content:
        'You must now respond with SUMMARY only. Do not ask further questions.',
    })
  } else {
    messages.push({
      role: 'user',
      content:
        'Respond with either QUESTION or SUMMARY as described. Decide based on info so far.',
    })
  }

  let raw: string

  try {
    raw = await context.callModel({
      sessionId: context.sessionId,
      messages,
      mode,
    })
  } catch {
    const fallback =
      'Could not reach the AI backend. Use the chat history directly for now.'
    return {
      sessionId: context.sessionId,
      kind: 'summary',
      message: truncateSms(fallback, smsLimit),
      questionCount: context.questionCount,
      done: true,
    }
  }

  const parsed = parseLlmResponse(raw)

  let kind: InterviewTurnKind = parsed.kind
  if (mode === 'final' && kind === 'question') {
    kind = 'summary'
  }

  const nextQuestionCount =
    kind === 'question' && !exhausted ? context.questionCount + 1 : context.questionCount

  const done = kind === 'summary' || nextQuestionCount >= maxQuestions

  const message = truncateSms(parsed.content, smsLimit)

  return {
    sessionId: context.sessionId,
    kind,
    message,
    questionCount: nextQuestionCount,
    done,
  }
}

