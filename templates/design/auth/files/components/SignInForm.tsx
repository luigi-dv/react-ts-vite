import { type FormEvent, useState } from 'react'

import { TextField } from './TextField'
import { isEmail, required } from './validation'

export type SignInValues = {
  email: string
  password: string
  remember: boolean
}

type SignInFormProps = {
  onSubmit: (values: SignInValues) => void
}

export function SignInForm({ onSubmit }: SignInFormProps) {
  const [values, setValues] = useState<SignInValues>({ email: '', password: '', remember: true })
  const [errors, setErrors] = useState<Partial<Record<keyof SignInValues, string>>>({})

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = {
      email: isEmail(values.email),
      password: required(values.password, 'Password'),
    }
    setErrors(nextErrors)
    if (!nextErrors.email && !nextErrors.password) onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <TextField
        id="email"
        label="Email address"
        type="email"
        autoComplete="email"
        value={values.email}
        error={errors.email}
        onChange={(e) => setValues({ ...values, email: e.target.value })}
      />
      <TextField
        id="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        value={values.password}
        error={errors.password}
        onChange={(e) => setValues({ ...values, password: e.target.value })}
      />

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm leading-6">
          <input
            type="checkbox"
            name="remember"
            checked={values.remember}
            onChange={(e) => setValues({ ...values, remember: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-600"
          />
          Remember me
        </label>
        <a href="#" className="text-sm font-semibold leading-6 text-brand-600 hover:text-brand-500">
          Forgot password?
        </a>
      </div>

      <button
        type="submit"
        className="flex w-full justify-center rounded-md bg-brand-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        Sign in
      </button>
    </form>
  )
}
