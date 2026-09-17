import { useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'

export function useUrlFilters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const q = searchParams.get('q') ?? ''
  const [draft, setDraft] = useState<{ value: string; locationKey: string } | null>(null)
  const searchInput = draft?.locationKey === location.key ? draft.value : q
  const pageValue = Number(searchParams.get('page') ?? '1')
  const page = Number.isSafeInteger(pageValue) && pageValue > 0 ? pageValue : 1

  function updateParams(updates: Record<string, string | undefined>, resetPage = true) {
    setDraft(null)
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous)
      for (const [key, value] of Object.entries(updates)) {
        if (value) next.set(key, value)
        else next.delete(key)
      }
      if (resetPage) next.delete('page')
      return next
    })
  }

  useEffect(() => {
    if (!draft || draft.locationKey !== location.key || draft.value === q) return
    const timer = window.setTimeout(() => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          if (draft.value.trim()) next.set('q', draft.value.trim())
          else next.delete('q')
          next.delete('page')
          return next
        },
        { replace: true },
      )
    }, 400)
    return () => window.clearTimeout(timer)
  }, [draft, location.key, q, setSearchParams])

  return {
    searchParams,
    q,
    page,
    searchInput,
    updateParams,
    setSearchInput: (value: string) => setDraft({ value, locationKey: location.key }),
    submitSearch: () => updateParams({ q: searchInput.trim() || undefined }),
    clearFilters: () => {
      setDraft(null)
      setSearchParams({})
    },
  }
}
