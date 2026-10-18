import { Dialog, DialogPanel } from '@headlessui/react'
import {
  ChartBarIcon,
  Cog6ToothIcon,
  FolderIcon,
  HomeIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import type { ComponentType, SVGProps } from 'react'

type NavItem = {
  name: string
  href: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  current?: boolean
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, current: true },
  { name: 'Customers', href: '#', icon: UsersIcon },
  { name: 'Projects', href: '#', icon: FolderIcon },
  { name: 'Reports', href: '#', icon: ChartBarIcon },
  { name: 'Settings', href: '#', icon: Cog6ToothIcon },
]

type SidebarProps = {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile drawer */}
      <Dialog open={open} onClose={onClose} className="relative z-50 lg:hidden">
        <div className="fixed inset-0 bg-gray-900/80" aria-hidden="true" />
        <div className="fixed inset-0 flex">
          <DialogPanel className="relative mr-16 flex w-full max-w-xs flex-1">
            <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
              <button type="button" onClick={onClose} className="-m-2.5 p-2.5">
                <span className="sr-only">Close sidebar</span>
                <XMarkIcon aria-hidden="true" className="h-6 w-6 text-white" />
              </button>
            </div>
            <SidebarContent />
          </DialogPanel>
        </div>
      </Dialog>

      {/* Desktop static sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-72 lg:flex-col">
        <SidebarContent />
      </div>
    </>
  )
}

function SidebarContent() {
  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-4 ring-1 ring-white/10">
      <div className="flex h-16 shrink-0 items-center gap-2 text-white">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold">
          A
        </span>
        <span className="font-semibold">Acme Admin</span>
      </div>
      <nav className="flex flex-1 flex-col" aria-label="Sidebar">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    aria-current={item.current ? 'page' : undefined}
                    className={[
                      'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6',
                      item.current
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white',
                    ].join(' ')}
                  >
                    <item.icon aria-hidden="true" className="h-6 w-6 shrink-0" />
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </li>
          <li className="mt-auto text-xs text-gray-500">v0.1.0 · react-ts-vite</li>
        </ul>
      </nav>
    </div>
  )
}
