export function Hero() {
  return (
    <section className="relative isolate px-6 pt-14 lg:px-8">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -top-40 -z-10 overflow-hidden blur-3xl sm:-top-80"
      >
        <div className="mx-auto h-[36rem] w-[36rem] rounded-full bg-gradient-to-tr from-brand-400 to-pink-400 opacity-25 sm:h-[48rem] sm:w-[72rem]" />
      </div>

      <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
        <div className="hidden sm:mb-8 sm:flex sm:justify-center">
          <p className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20 dark:text-gray-400 dark:ring-gray-100/10">
            Built with react-ts-vite.{' '}
            <a href="#features" className="font-semibold text-brand-600 dark:text-brand-400">
              <span aria-hidden="true" className="absolute inset-0" />
              See what is inside <span aria-hidden="true">&rarr;</span>
            </a>
          </p>
        </div>
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Ship your next React app in hours, not weeks
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400">
            A typed, tested and themeable starting point. Pick an architecture, drop in the pages
            you need and spend your time on the product instead of the plumbing.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a
              href="/login"
              className="rounded-md bg-brand-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              Get started
            </a>
            <a href="#features" className="text-sm font-semibold leading-6">
              Learn more <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
