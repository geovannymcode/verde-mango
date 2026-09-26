import type { ComponentProps, ReactElement, ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { createTestQueryClient } from './state'
interface Options extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: ComponentProps<typeof MemoryRouter>['initialEntries']
  initialIndex?: number
  userOptions?: Parameters<typeof userEvent.setup>[0]
}
/** Global setup resets stores before each test, so tests can seed auth/cart before rendering.
 * Each call owns a fresh client. With fake timers pass userOptions.advanceTimers explicitly. */
export function renderWithProviders(
  ui: ReactElement,
  { initialEntries = ['/'], initialIndex, userOptions, ...options }: Options = {},
) {
  const queryClient = createTestQueryClient()
  const user = userEvent.setup(userOptions)
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
          {children}
        </MemoryRouter>
      </QueryClientProvider>
    )
  }
  return { ...render(ui, { ...options, wrapper: Wrapper }), user, queryClient }
}
