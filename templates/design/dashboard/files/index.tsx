import { useState } from 'react'

import { ActivityTable } from './components/ActivityTable'
import { Sidebar } from './components/Sidebar'
import { StatCard } from './components/StatCard'
import { TopBar } from './components/TopBar'
import { activity, stats } from './data'
import { useTheme } from './hooks/useTheme'

/**
 * Dashboard shell — sidebar + top bar layout with a stats row and a table.
 * Replace the mock data in `./data.ts` with a hook that reads from `@services`.
 */
export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-72">
        <TopBar
          onOpenSidebar={() => setSidebarOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Key numbers for the last 30 days. Figures are mock data.
            </p>

            <dl className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <StatCard key={stat.name} {...stat} />
              ))}
            </dl>

            <section aria-labelledby="activity-heading" className="mt-10">
              <h2 id="activity-heading" className="text-base font-semibold leading-7">
                Recent activity
              </h2>
              <ActivityTable rows={activity} />
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
