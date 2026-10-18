import { useState } from 'react'

import { AuthLayout } from './components/AuthLayout'
import { SignInForm } from './components/SignInForm'
import { SignUpForm } from './components/SignUpForm'

type Mode = 'sign-in' | 'sign-up'

/**
 * Authentication page. Forms are controlled, validated inline and call
 * `onSubmit` with typed values — connect them to your auth service.
 */
export default function Auth() {
  const [mode, setMode] = useState<Mode>('sign-in')
  const [message, setMessage] = useState<string | null>(null)

  const announce = (text: string) => setMessage(text)

  return (
    <AuthLayout
      title={mode === 'sign-in' ? 'Sign in to your account' : 'Create your account'}
      footer={
        mode === 'sign-in' ? (
          <>
            New here?{' '}
            <button
              type="button"
              onClick={() => setMode('sign-up')}
              className="font-semibold text-brand-600 hover:text-brand-500"
            >
              Create an account
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => setMode('sign-in')}
              className="font-semibold text-brand-600 hover:text-brand-500"
            >
              Sign in
            </button>
          </>
        )
      }
    >
      {mode === 'sign-in' ? (
        <SignInForm onSubmit={(values) => announce(`Demo: would sign in ${values.email}.`)} />
      ) : (
        <SignUpForm
          onSubmit={(values) => announce(`Demo: would create an account for ${values.email}.`)}
        />
      )}
      <p
        role="status"
        aria-live="polite"
        className="mt-6 min-h-6 text-center text-sm text-gray-600 dark:text-gray-400"
      >
        {message}
      </p>
    </AuthLayout>
  )
}
