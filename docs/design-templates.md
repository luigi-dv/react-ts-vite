# Design templates

Design templates are complete pages built with **Tailwind CSS 3**, **Headless UI v2** and **Heroicons**. They share the project's design tokens (`brand-*` colour scale, class-based dark mode), are accessible out of the box and come with a smoke test. They live in `templates/design/<id>/` and are copied into your project's pages folder on demand, so they become _your_ code.

```bash
npm run templates -- list                       # catalogue and what is applied
npm run templates -- add dashboard auth         # copy pages, write smoke tests, generate App.tsx
npm run templates -- add landing --remove-example   # also delete the starter ExampleComponent
npm run templates -- remove auth                # delete the page folder and its test
npm run templates -- apply                      # re-create missing files / regenerate App.tsx
```

## Gallery

| Template    | Page component | Default route | What is inside                                                                                                                                                                                                    |
| ----------- | -------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `landing`   | `Landing`      | `/`           | Absolute header with brand mark and `@const/navigation` links, mobile menu in a Headless UI `Dialog`, gradient hero with two CTAs, four-feature grid with Heroicons, footer.                                      |
| `dashboard` | `Dashboard`    | `/dashboard`  | Fixed sidebar (desktop) / `Dialog` drawer (mobile), sticky top bar with search, light/dark toggle (`useTheme`), notifications and a Headless UI `Menu`; four `StatCard`s and an `ActivityTable` fed by `data.ts`. |
| `auth`      | `Auth`         | `/login`      | Split layout with brand panel, `SignInForm`/`SignUpForm` switching in place, reusable `TextField` with `aria-describedby` errors, tiny validators, `role="status"` feedback.                                      |
| `blank`     | `Home`         | `/`           | Centred card listing the stack with links to the docs. The smallest possible start.                                                                                                                               |
| `not-found` | `NotFound`     | fallback      | 404 page used by the generated `App.tsx` for unknown paths (`fallback: true`).                                                                                                                                    |

## Where pages go

Pages are copied into the **pages folder of the active architecture** (`npm run arch -- current` shows it):

| Architecture                          | Pages folder                     |
| ------------------------------------- | -------------------------------- |
| `classic`, `feature`, `fsd`, `atomic` | `src/pages/<Page>/`              |
| `clean`                               | `src/presentation/pages/<Page>/` |

Every page gets `__tests__/pages/<Page>.test.tsx` asserting its `h1`, and `src/App.tsx` is regenerated as a dependency-free route switch:

```tsx
const routes: Record<string, ComponentType> = {
  '/': Landing,
  '/dashboard': Dashboard,
  '/login': Auth,
}

export default function App() {
  const Page = routes[currentPath()] ?? NotFound
  return <Page />
}
```

The first selected template becomes the home route unless another one claims `/`; two templates claiming the same route are disambiguated by page name (`/home`). Replace the switch with a router (React Router, TanStack Router) whenever you need nested routes or data loading — the pages do not care. A hand-written `App.tsx` is never overwritten unless you pass `--force`.

## Theming

All templates use the `brand-*` scale and Tailwind greys. Change the palette once in `src/index.css`:

```css
:root {
  --brand-500: 99 102 241; /* RGB triplets, so bg-brand-500/50 keeps working */
  --brand-600: 79 70 229;
  /* … */
}
```

Dark mode is class-based (`darkMode: 'class'`); the dashboard's `useTheme` hook toggles `dark` on `<html>` and persists the choice. Promote it to `@hooks/useTheme` when another page needs it.

## Writing your own template

1. Create `templates/design/<id>/template.json`:

   ```json
   {
     "id": "pricing",
     "order": 6,
     "title": "Pricing",
     "description": "Three-tier pricing table with a billing toggle.",
     "page": "Pricing",
     "route": "/pricing",
     "heading": "Simple, transparent pricing",
     "tags": ["marketing"],
     "uses": ["@headlessui/react", "@heroicons/react"]
   }
   ```

   `page` is the folder and component name (PascalCase), `heading` is the `h1` text the generated smoke test checks, `fallback: true` marks a page as the unknown-route fallback.

2. Put the page in `files/index.tsx` (default export, exactly one `h1`) with page-local parts under `files/components/`. Import siblings with `./…` or the slice alias (`@pages/Pricing/data`) — never `../`, the ESLint rule forbids it so pages stay movable between architectures. Shared code comes from aliases (`@components`, `@const`).

3. Follow the design-system rule: utilities + tokens, `dark:` variants, Headless UI for interactive patterns, Heroicons with `aria-hidden`, visible focus styles.

4. Add `__tests__/templates/<id>.test.tsx` rendering `templates/design/<id>/files/index` and asserting behaviour (see the existing tests), then `npm run check`. The CI smoke job applies every template in every architecture.

Projects created with `npx react-ts-vite create` keep the `templates/` folder, so teams can grow their own catalogue and share it through the repository.
