import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import Home from '../../templates/design/blank/files/index'
import NotFound from '../../templates/design/not-found/files/index'

describe('blank template', () => {
  test('renders the starting page with the stack list', () => {
    render(<Home />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Start building')
    expect(screen.getByRole('list', { name: 'Stack' }).children).toHaveLength(5)
  })
})

describe('not-found template', () => {
  test('renders the 404 page with a way home', () => {
    render(<NotFound />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Page not found')
    expect(screen.getByRole('link', { name: 'Go back home' })).toHaveAttribute('href', '/')
  })
})
