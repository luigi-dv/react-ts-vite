// Tiny, dependency-free validators. Swap for zod/valibot when forms grow.

export function required(value: string, label: string): string | undefined {
  return value.trim() ? undefined : `${label} is required.`
}

export function isEmail(value: string): string | undefined {
  if (!value.trim()) return 'Email address is required.'
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? undefined : 'Enter a valid email address.'
}

export function minLength(value: string, min: number, label: string): string | undefined {
  if (!value) return `${label} is required.`
  return value.length >= min ? undefined : `${label} must be at least ${min} characters.`
}
