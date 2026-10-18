import { ArrowDownRightIcon, ArrowUpRightIcon } from '@heroicons/react/20/solid'

export type Stat = {
  name: string
  value: string
  change: string
  trend: 'up' | 'down'
}

export function StatCard({ name, value, change, trend }: Stat) {
  const positive = trend === 'up'
  return (
    <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow ring-1 ring-gray-900/5 dark:bg-gray-900 dark:ring-white/10 sm:p-6">
      <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">{name}</dt>
      <dd className="mt-1 flex items-baseline justify-between">
        <span className="text-2xl font-semibold tracking-tight">{value}</span>
        <span
          className={[
            'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium',
            positive
              ? 'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400'
              : 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400',
          ].join(' ')}
        >
          {positive ? (
            <ArrowUpRightIcon aria-hidden="true" className="h-3 w-3" />
          ) : (
            <ArrowDownRightIcon aria-hidden="true" className="h-3 w-3" />
          )}
          <span className="sr-only">{positive ? 'Increased by' : 'Decreased by'}</span>
          {change}
        </span>
      </dd>
    </div>
  )
}
