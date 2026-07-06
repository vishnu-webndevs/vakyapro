import { runExpertInterviewTurn, type InterviewContext, type InterviewMessage } from '../expertInterview'

function createContext(
  overrides: Partial<InterviewContext> = {},
  callModelImpl?: InterviewContext['callModel'],
): InterviewContext {
  const messageHistory: InterviewMessage[] =
    overrides.messageHistory ?? [{ role: 'user', content: 'create logo for travel app' }]

  const callModel =
    callModelImpl ??
    (async () => {
      return 'QUESTION: Brand name?'
    })

  return {
    sessionId: 'test-session',
    messageHistory,
    questionCount: overrides.questionCount ?? 0,
    smsLimit: overrides.smsLimit ?? 160,
    callModel,
    maxQuestions: overrides.maxQuestions ?? 4,
  }
}

test('asks a question when under question budget', async () => {
  const context = createContext()
  const result = await runExpertInterviewTurn(context)
  expect(result.kind).toBe('question')
  expect(result.done).toBe(false)
  expect(result.questionCount).toBe(1)
  expect(result.message.length).toBeLessThanOrEqual(160)
})

test('forces summary when no questions remaining', async () => {
  const context = createContext(
    { questionCount: 4 },
    async () => 'QUESTION: This should be treated as summary.',
  )

  const result = await runExpertInterviewTurn(context)
  expect(result.kind).toBe('summary')
  expect(result.done).toBe(true)
  expect(result.questionCount).toBe(4)
})

test('truncates SMS overflow while preserving limit', async () => {
  const longQuestion = 'QUESTION: ' + 'A'.repeat(500)
  const context = createContext(
    {},
    async () => longQuestion,
  )

  const result = await runExpertInterviewTurn(context)
  expect(result.kind).toBe('question')
  expect(result.message.length).toBeLessThanOrEqual(160)
})

test('handles LLM timeout or failure with fallback summary', async () => {
  const context = createContext(
    {},
    async () => {
      throw new Error('timeout')
    },
  )

  const result = await runExpertInterviewTurn(context)
  expect(result.kind).toBe('summary')
  expect(result.done).toBe(true)
  expect(result.message.length).toBeLessThanOrEqual(160)
})

