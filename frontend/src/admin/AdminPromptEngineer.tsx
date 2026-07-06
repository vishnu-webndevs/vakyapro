import { useMemo, useState } from 'react'
import { PageHeading } from '../components/common/PageHeading'
import { Card } from '../components/ui/Card'

type StepId =
  | 'objective'
  | 'audience'
  | 'context'
  | 'output'
  | 'tone'
  | 'constraints'
  | 'success'

type Answers = Partial<Record<StepId, string>>

type StepConfig = {
  id: StepId
  title: string
  description: string
  getQuestion: (answers: Answers) => string
  placeholder: string
}

const steps: StepConfig[] = [
  {
    id: 'objective',
    title: 'Goal',
    description: 'Clarify exactly what you want the AI to achieve.',
    getQuestion: () => 'What do you want the AI to do? Describe the main goal in 1–3 sentences.',
    placeholder: 'Example: Generate 10 headline variations for my landing page focused on conversions...',
  },
  {
    id: 'audience',
    title: 'Audience & context',
    description: 'Capture who this is for and where it will be used.',
    getQuestion: (answers) => {
      const base = 'Who is the target audience and where will this output be used?'
      if (answers.objective) {
        return `${base} Reference your goal: "${answers.objective}".`
      }
      return base
    },
    placeholder: 'Example: B2B SaaS founders reading our weekly newsletter...',
  },
  {
    id: 'context',
    title: 'Background',
    description: 'Share any domain knowledge, constraints, or existing material.',
    getQuestion: () =>
      'What background or domain-specific context should the AI know before responding?',
    placeholder: 'Example: Our product helps teams manage async standups across timezones...',
  },
  {
    id: 'output',
    title: 'Output format',
    description: 'Define the structure, length, and formatting.',
    getQuestion: () =>
      'What should the output look like? Specify format, length, and structure.',
    placeholder:
      'Example: A numbered list of 10 options, each < 80 characters, with a short rationale...',
  },
  {
    id: 'tone',
    title: 'Tone & style',
    description: 'Lock in voice and writing style.',
    getQuestion: () =>
      'What tone, style, and voice should the AI use? Include any examples if helpful.',
    placeholder: 'Example: Friendly but authoritative, similar to Stripe’s developer docs...',
  },
  {
    id: 'constraints',
    title: 'Constraints',
    description: 'Specify must-haves and must-avoid guidelines.',
    getQuestion: () =>
      'Are there any hard constraints, red lines, or rules the AI must follow?',
    placeholder:
      'Example: Do not mention pricing. Avoid technical jargon. Always include a clear call-to-action...',
  },
  {
    id: 'success',
    title: 'Success criteria',
    description: 'Describe what a “great” answer looks like.',
    getQuestion: () =>
      'How will you judge if the AI’s response is successful? Be as concrete as possible.',
    placeholder:
      'Example: I know it’s successful if I can paste the output directly into our campaign with minimal editing...',
  },
]

function buildPrompt(answers: Answers): string {
  const sections: { label: string; value?: string }[] = [
    { label: 'Primary goal', value: answers.objective },
    { label: 'Audience and context', value: answers.audience },
    { label: 'Background information', value: answers.context },
    { label: 'Desired output format', value: answers.output },
    { label: 'Tone and style', value: answers.tone },
    { label: 'Constraints and guardrails', value: answers.constraints },
    { label: 'Success criteria', value: answers.success },
  ]

  const lines: string[] = []

  lines.push(
    'You are an expert assistant and prompt engineer. Use the details below to produce the best possible answer to the user.',
  )
  lines.push('')

  sections.forEach((section) => {
    if (section.value && section.value.trim().length > 0) {
      lines.push(`## ${section.label}`)
      lines.push(section.value.trim())
      lines.push('')
    }
  })

  lines.push(
    'When responding, strictly follow the constraints above and optimize for clarity, usefulness, and alignment with the success criteria.',
  )

  return lines.join('\n')
}

export default function AdminPromptEngineer() {
  const [answers, setAnswers] = useState<Answers>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [touched, setTouched] = useState(false)
  const [copied, setCopied] = useState(false)

  const currentStep = steps[currentIndex]
  const totalSteps = steps.length
  const isLastStep = currentIndex === totalSteps - 1

  const finalPrompt = useMemo(() => buildPrompt(answers), [answers])

  const handleNext = () => {
    setTouched(true)
    if (!inputValue.trim()) return

    setAnswers((prev) => ({
      ...prev,
      [currentStep.id]: inputValue.trim(),
    }))

    setInputValue('')
    setTouched(false)
    setCopied(false)

    if (!isLastStep) {
      setCurrentIndex((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentIndex === 0) return
    const previousIndex = currentIndex - 1
    const previousStep = steps[previousIndex]
    setCurrentIndex(previousIndex)
    setInputValue(answers[previousStep.id] ?? '')
    setTouched(false)
    setCopied(false)
  }

  const handleInputChange = (value: string) => {
    setInputValue(value)
    if (!touched) {
      setTouched(true)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(finalPrompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const progressPercent = ((currentIndex + 1) / totalSteps) * 100

  return (
    <div className="space-y-6">
      <PageHeading
        title="Prompt engineer"
        subtitle="Collaboratively craft high-quality prompts using an interactive counter-question workflow."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Prompts', isCurrent: true },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card
          title="Interactive prompt session"
          subtitle="Answer a small set of focused questions. We assemble the final Pro-Vakya for you."
        >
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                <span>
                  Step {currentIndex + 1} of {totalSteps}
                </span>
                <span>{Math.round(progressPercent)}% complete</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <div className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-sky-400">
                  Counter-question {currentIndex + 1}
                </div>
                <h2 className="text-sm font-semibold text-slate-50">{currentStep.title}</h2>
                <p className="text-xs text-slate-400">{currentStep.description}</p>
              </div>
              <div className="rounded-xl border border-sky-700/60 bg-sky-950/30 p-3 text-xs text-sky-100">
                {currentStep.getQuestion(answers)}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs text-slate-300">Your answer</label>
              <textarea
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={currentStep.placeholder}
                rows={4}
                className="w-full resize-none rounded-xl border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
              {touched && !inputValue.trim() && (
                <p className="text-[11px] text-rose-400">Please add an answer before continuing.</p>
              )}
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentIndex === 0}
                className="inline-flex items-center rounded-xl border border-slate-700/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-sky-500/70 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-sky-600 hover:to-indigo-600"
              >
                {isLastStep ? 'Finish and assemble prompt' : 'Next question'}
              </button>
            </div>
          </div>
        </Card>

        <Card
          title="Final prompt"
          subtitle="Copy the assembled Pro-Vakya into your favorite AI tool."
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400">
              Prompt is updated as you answer more questions.
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center rounded-xl border border-emerald-500/70 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/20"
            >
              {copied ? 'Copied!' : 'Copy prompt'}
            </button>
          </div>
          <div className="max-h-[420px] overflow-auto rounded-xl border border-slate-800/80 bg-slate-950/80 p-3 text-xs leading-relaxed text-slate-100">
            <pre className="whitespace-pre-wrap font-mono text-[11px]">{finalPrompt}</pre>
          </div>
        </Card>
      </div>
    </div>
  )
}

