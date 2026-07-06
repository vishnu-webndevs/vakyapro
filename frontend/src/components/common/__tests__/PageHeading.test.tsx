import { render, screen } from '@testing-library/react'
import { PageHeading } from '../PageHeading'

describe('PageHeading', () => {
  it('renders title and subtitle', () => {
    render(<PageHeading title="Dashboard" subtitle="Overview of activity" />)

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByText('Overview of activity')).toBeInTheDocument()
  })

  it('renders breadcrumbs with current page', () => {
    render(
      <PageHeading
        title="Overview"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Overview', isCurrent: true },
        ]}
      />,
    )

    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument()
  })
})
