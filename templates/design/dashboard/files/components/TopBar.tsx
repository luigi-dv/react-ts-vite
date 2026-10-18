import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import {
  Bars3Icon,
  BellIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  SunIcon,
} from '@heroicons/react/24/outline'

type TopBarProps = {
  onOpenSidebar: () => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

/** Presentational top bar; theme state is owned by the page. */
export function TopBar({ onOpenSidebar, theme, onToggleTheme }: TopBarProps) {
  return (
    <div className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:gap-x-6 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-300 lg:hidden"
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon aria-hidden="true" className="h-6 w-6" />
      </button>

      <div aria-hidden="true" className="h-6 w-px bg-gray-200 dark:bg-gray-800 lg:hidden" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <form className="relative flex flex-1" action="#" method="GET" role="search">
          <label htmlFor="search-field" className="sr-only">
            Search
          </label>
          <MagnifyingGlassIcon
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400"
          />
          <input
            id="search-field"
            name="search"
            type="search"
            placeholder="Search…"
            className="block h-full w-full border-0 bg-transparent py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 dark:text-gray-100 sm:text-sm"
          />
        </form>

        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            {theme === 'dark' ? (
              <SunIcon aria-hidden="true" className="h-6 w-6" />
            ) : (
              <MoonIcon aria-hidden="true" className="h-6 w-6" />
            )}
          </button>
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <span className="sr-only">View notifications</span>
            <BellIcon aria-hidden="true" className="h-6 w-6" />
          </button>

          <div
            aria-hidden="true"
            className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200 dark:lg:bg-gray-800"
          />

          <Menu as="div" className="relative">
            <MenuButton className="-m-1.5 flex items-center p-1.5">
              <span className="sr-only">Open user menu</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                AL
              </span>
              <span className="hidden lg:flex lg:items-center">
                <span aria-hidden="true" className="ml-4 text-sm font-semibold leading-6">
                  Ada Lovelace
                </span>
              </span>
            </MenuButton>
            <MenuItems
              anchor="bottom end"
              className="z-50 mt-2.5 w-40 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none dark:bg-gray-800 dark:ring-white/10"
            >
              <MenuItem>
                <a
                  href="#"
                  className="block px-3 py-1 text-sm leading-6 data-[focus]:bg-gray-50 dark:data-[focus]:bg-gray-700"
                >
                  Your profile
                </a>
              </MenuItem>
              <MenuItem>
                <a
                  href="#"
                  className="block px-3 py-1 text-sm leading-6 data-[focus]:bg-gray-50 dark:data-[focus]:bg-gray-700"
                >
                  Sign out
                </a>
              </MenuItem>
            </MenuItems>
          </Menu>
        </div>
      </div>
    </div>
  )
}
