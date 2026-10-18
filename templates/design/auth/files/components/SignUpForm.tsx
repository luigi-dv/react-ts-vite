import { type FormEvent, useState } from 'react'

import { TextField } from './TextField'
import { isEmail, minLength, required } from './validation'

export type SignUpValues = {
  name: string
  email: string
  password: string
}

type SignUpFormProps = {
  onSubmit: (values: SignUpValues) => void
}

export function SignUpForm({ onSubmit }: SignUpFormProps) {
  const [values, setValues] = useState<SignUpValues>({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof SignUpValues, string>>>({})

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = {
      name: required(values.name, 'Name'),
      email: isEmail(values.email),
      password: minLength(values.password, 8, 'Password'),
    }
    setErrors(nextErrors)
    if (!nextErrors.name && !nextErrors.email && !nextErrors.password) onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <TextField
        id="name"
        label="Full name"
        autoComplete="name"
        value={values.name}
        error={errors.name}
        onChange={(e) => setValues({ ...values, name: e.target.value })}
      />
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
        autoComplete="new-password"
        value={values.password}
        error={errors.password}
        onChange={(e) => setValues({ ...values, password: e.target.value })}
      />
      <button
        type="submit"
        className="flex w-full justify-center rounded-md bg-brand-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        Create account
      </button>
    </form>
  )
}
