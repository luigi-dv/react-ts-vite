export type ActivityRow = {
  id: number
  customer: string
  email: string
  amount: string
  status: 'Paid' | 'Pending' | 'Refunded'
  date: string
}

const statusStyles: Record<ActivityRow['status'], string> = {
  Paid: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400',
  Pending:
    'bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-500/10 dark:text-yellow-400',
  Refunded: 'bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-500/10 dark:text-gray-400',
}

type ActivityTableProps = {
  rows: ActivityRow[]
}

export function ActivityTable({ rows }: ActivityTableProps) {
  return (
    <div className="mt-4 overflow-hidden rounded-lg bg-white shadow ring-1 ring-gray-900/5 dark:bg-gray-900 dark:ring-white/10">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
        <thead className="bg-gray-50 dark:bg-gray-900/60">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold sm:pl-6">
              Customer
            </th>
            <th
              scope="col"
              className="hidden px-3 py-3.5 text-left text-sm font-semibold sm:table-cell"
            >
              Date
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold">
              Status
            </th>
            <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold">
              Amount
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                <div className="font-medium">{row.customer}</div>
                <div className="text-gray-500 dark:text-gray-400">{row.email}</div>
              </td>
              <td className="hidden px-3 py-4 text-sm text-gray-500 dark:text-gray-400 sm:table-cell">
                <time dateTime={row.date}>{row.date}</time>
              </td>
              <td className="px-3 py-4 text-sm">
                <span
                  className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[row.status]}`}
                >
                  {row.status}
                </span>
              </td>
              <td className="px-3 py-4 text-right text-sm font-medium tabular-nums">
                {row.amount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
