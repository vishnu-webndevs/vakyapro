import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AdminPromptEngineer from '../AdminPromptEngineer'

function renderWithRouter() {
  return render(
    <MemoryRouter initialEntries={['/admin/prompts']}>
      <Routes>
        <Route path="/admin/prompts" element={<AdminPromptEngineer />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AdminPromptEngineer', () => {
  it('walks through questions and builds a final prompt', async () => {
    renderWithRouter()

    const [textarea] = screen.getAllByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Help me create landing page copy' } })

    fireEvent.click(screen.getByRole('button', { name: /Next question/i }))

    await waitFor(() => {
      expect(screen.getByText(/Audience & context/i)).toBeInTheDocument()
    })

    const promptPreview = screen.getByText(/Primary goal/i)
    expect(promptPreview).toBeInTheDocument()
  })

  it('copies the prompt to clipboard with feedback', async () => {
    const writeText = jest.fn()
    // @ts-expect-error clipboard not fully typed in jsdom
    global.navigator.clipboard = { writeText }

    renderWithRouter()

    const copyButton = screen.getByRole('button', { name: /Copy prompt/i })
    fireEvent.click(copyButton)

    await waitFor(() => {
      expect(writeText).toHaveBeenCalled()
    })
  })
})
