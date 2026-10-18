import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import App from '@/App'

describe('<App />', () => {
  test('renders the landing hero', () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Data to enrich your online business',
    )
  })

  test('exposes the global navigation', () => {
    render(<App />)

    expect(screen.getAllByRole('navigation', { name: 'Global' }).length).toBeGreaterThan(0)
  })
})
