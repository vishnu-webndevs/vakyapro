import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SiteHeader } from '../SiteHeader'

describe('SiteHeader', () => {
  it('renders brand name and navigation links', () => {
    render(
      <MemoryRouter>
        <SiteHeader
          brandName="Vakyapro"
          navItems={[
            { label: 'Product', to: '/#product' },
            { label: 'Pricing', to: '/#pricing' },
          ]}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText('Vakyapro')).toBeInTheDocument()
    expect(screen.getByText('Product')).toBeInTheDocument()
    expect(screen.getByText('Pricing')).toBeInTheDocument()
  })

  it('calls onSignIn when login button is clicked', () => {
    const onSignIn = jest.fn()

    render(
      <MemoryRouter>
        <SiteHeader onSignIn={onSignIn} />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('Login'))
    expect(onSignIn).toHaveBeenCalled()
  })
})
