const stack = ['React 19', 'TypeScript', 'Vite', 'Tailwind CSS', 'Vitest']

/** Minimal home page. Delete the content and start building. */
export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <div className="w-full max-w-lg rounded-2xl bg-white p-10 shadow-sm ring-1 ring-gray-900/5 dark:bg-gray-900 dark:ring-white/10">
        <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">react-ts-vite</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Start building</h1>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Edit{' '}
          <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm dark:bg-gray-800">
            src/App.tsx
          </code>{' '}
          and save to reload. Run{' '}
          <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm dark:bg-gray-800">
            npm run check
          </code>{' '}
          before you commit.
        </p>
        <ul className="mt-6 flex flex-wrap gap-2" aria-label="Stack">
          {stack.map((item) => (
            <li
              key={item}
              className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-600/20 dark:bg-brand-500/10 dark:text-brand-300"
            >
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-8 flex gap-4 text-sm font-semibold">
          <a
            href="https://github.com/luigi-dv/react-ts-vite#readme"
            className="text-brand-600 hover:text-brand-500 dark:text-brand-400"
          >
            Template docs <span aria-hidden="true">→</span>
          </a>
          <a
            href="https://tailwindcss.com/docs"
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            Tailwind docs <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </main>
  )
}
