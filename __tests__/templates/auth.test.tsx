import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import Auth from '../../templates/design/auth/files/index'

describe('auth template', () => {
  test('validates the sign-in form before submitting', () => {
    render(<Auth />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Sign in to your account')
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByText('Email address is required.')).toBeInTheDocument()
    expect(screen.getByText('Password is required.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email address')).toHaveAttribute('aria-invalid', 'true')
  })

  test('announces a successful sign-in through a live region', () => {
    render(<Auth />)

    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'ada@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByRole('status')).toHaveTextContent('Demo: would sign in ada@example.com.')
  })

  test('switches to the create-account form', () => {
    render(<Auth />)

    fireEvent.click(screen.getByRole('button', { name: 'Create an account' }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Create your account')
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'short' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
    expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument()
  })
})
