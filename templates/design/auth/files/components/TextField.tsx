import type { InputHTMLAttributes } from 'react'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string
  label: string
  error?: string
}

/** Labelled input with an accessible error message (styles from @tailwindcss/forms). */
export function TextField({ id, label, error, className = '', ...props }: TextFieldProps) {
  const errorId = `${id}-error`
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium leading-6">
        {label}
      </label>
      <div className="mt-2">
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={[
            'block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6',
            'bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100',
            error
              ? 'ring-red-400 focus:ring-red-500'
              : 'ring-gray-300 focus:ring-brand-600 dark:ring-gray-700',
            className,
          ].join(' ')}
          {...props}
        />
      </div>
      {error ? (
        <p id={errorId} className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  )
}
