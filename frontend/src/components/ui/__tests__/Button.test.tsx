import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('triggers onClick', () => {
    const onClick = jest.fn()
    render(<Button onClick={onClick}>Click</Button>)
    fireEvent.click(screen.getByRole('button', { name: 'Click' }))
    expect(onClick).toHaveBeenCalled()
  })

  it('shows loading state', () => {
    render(
      <Button isLoading>
        Save
      </Button>,
    )
    expect(screen.getByRole('button', { name: /loading/i })).toBeDisabled()
  })
})

