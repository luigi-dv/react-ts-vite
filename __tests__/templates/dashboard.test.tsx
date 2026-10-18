import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'

import Dashboard from '../../templates/design/dashboard/files/index'

afterEach(() => {
  document.documentElement.classList.remove('dark')
  window.localStorage.clear()
})

describe('dashboard template', () => {
  test('renders the overview with stats and the activity table', () => {
    render(<Dashboard />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Overview')
    expect(screen.getByText('Revenue')).toBeInTheDocument()
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(6) // header + 5 activity rows
  })

  test('toggles dark mode through the class strategy and persists it', () => {
    render(<Dashboard />)

    const toggle = screen.getByRole('button', { name: /switch to dark mode/i })
    fireEvent.click(toggle)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(window.localStorage.getItem('theme')).toBe('dark')
    expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument()
  })

  test('opens the sidebar drawer on small screens', () => {
    render(<Dashboard />)

    fireEvent.click(screen.getByRole('button', { name: /open sidebar/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
