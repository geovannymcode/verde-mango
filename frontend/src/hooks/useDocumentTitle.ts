import { useEffect } from 'react'

/** Native metadata: every routed page replaces both values to avoid stale descriptions. */
export function useDocumentTitle(title: string, description: string) {
  useEffect(() => {
    document.title = `${title} | Verde Mango`
    let meta = document.head.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'description'
      document.head.appendChild(meta)
    }
    meta.content = description
  }, [title, description])
}
