import type { ReactNode } from 'react'

type AuthLayoutProps = {
  title: string
  children: ReactNode
  footer: ReactNode
}

export function AuthLayout({ title, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <a href="/" className="inline-flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              A
            </span>
            <span className="font-semibold">Acme</span>
          </a>
          <h1 className="mt-8 text-2xl font-bold leading-9 tracking-tight">{title}</h1>
          <div className="mt-8">{children}</div>
          <p className="mt-6 text-sm text-gray-600 dark:text-gray-400">{footer}</p>
        </div>
      </div>
      <div className="relative hidden w-0 flex-1 lg:block" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-700 to-gray-900" />
        <div className="absolute inset-0 flex items-end p-16">
          <blockquote className="max-w-lg text-white">
            <p className="text-2xl font-semibold leading-snug">
              “We replaced three weeks of setup with one command. The architecture checks keep the
              team honest.”
            </p>
            <footer className="mt-6 text-sm text-brand-100">— A happy engineering team</footer>
          </blockquote>
        </div>
      </div>
    </div>
  )
}
