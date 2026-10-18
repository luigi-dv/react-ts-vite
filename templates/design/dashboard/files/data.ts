import type { ActivityRow } from './components/ActivityTable'
import type { Stat } from './components/StatCard'

export type { ActivityRow, Stat }

export const stats: Stat[] = [
  { name: 'Revenue', value: '$48,212', change: '+12.4%', trend: 'up' },
  { name: 'Active users', value: '2,318', change: '+3.1%', trend: 'up' },
  { name: 'Conversion', value: '4.7%', change: '-0.8%', trend: 'down' },
  { name: 'Avg. session', value: '6m 12s', change: '+1.9%', trend: 'up' },
]

export const activity: ActivityRow[] = [
  {
    id: 1,
    customer: 'Ada Lovelace',
    email: 'ada@example.com',
    amount: '$1,200.00',
    status: 'Paid',
    date: '2026-10-14',
  },
  {
    id: 2,
    customer: 'Grace Hopper',
    email: 'grace@example.com',
    amount: '$320.00',
    status: 'Pending',
    date: '2026-10-13',
  },
  {
    id: 3,
    customer: 'Linus Torvalds',
    email: 'linus@example.com',
    amount: '$89.00',
    status: 'Refunded',
    date: '2026-10-12',
  },
  {
    id: 4,
    customer: 'Margaret Hamilton',
    email: 'margaret@example.com',
    amount: '$2,450.00',
    status: 'Paid',
    date: '2026-10-11',
  },
  {
    id: 5,
    customer: 'Tim Berners-Lee',
    email: 'tim@example.com',
    amount: '$640.00',
    status: 'Paid',
    date: '2026-10-10',
  },
]
