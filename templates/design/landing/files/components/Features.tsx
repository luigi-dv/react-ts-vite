import {
  BoltIcon,
  CubeTransparentIcon,
  ShieldCheckIcon,
  SwatchIcon,
} from '@heroicons/react/24/outline'
import type { ComponentType, SVGProps } from 'react'

type Feature = {
  name: string
  description: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

const features: Feature[] = [
  {
    name: 'Instant feedback',
    description: 'Vite serves your app in milliseconds and Vitest runs your tests as you type.',
    icon: BoltIcon,
  },
  {
    name: 'Architecture that scales',
    description:
      'Switch between classic, feature-based, FSD, clean or atomic folder structures without rewriting imports.',
    icon: CubeTransparentIcon,
  },
  {
    name: 'Design tokens',
    description:
      'One brand palette drives every template. Change a few CSS variables and the whole UI follows.',
    icon: SwatchIcon,
  },
  {
    name: 'Guard rails',
    description:
      'Strict TypeScript, ESLint, Prettier and import-direction checks keep the codebase clean as it grows.',
    icon: ShieldCheckIcon,
  },
]

export function Features() {
  return (
    <section id="features" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-brand-600 dark:text-brand-400">
            Everything you need
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Opinionated where it matters, flexible everywhere else
          </p>
        </div>
        <dl className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
          {features.map((feature) => (
            <div key={feature.name} className="relative pl-16">
              <dt className="text-base font-semibold leading-7">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600">
                  <feature.icon aria-hidden="true" className="h-6 w-6 text-white" />
                </div>
                {feature.name}
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600 dark:text-gray-400">
                {feature.description}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
