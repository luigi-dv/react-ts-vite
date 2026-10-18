import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import Landing from '../../templates/design/landing/files/index'

describe('landing template', () => {
  test('renders the hero heading and the global navigation', () => {
    render(<Landing />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Ship your next React app in hours, not weeks',
    )
    expect(screen.getByRole('navigation', { name: 'Global' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Footer' })).toBeInTheDocument()
  })

  test('opens the mobile menu as an accessible dialog', () => {
    render(<Landing />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /open main menu/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /close menu/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
