import { useEffect, useState } from 'react'

/** 极简 hash 路由：#/goods/g3?from=home */
export function parseHash() {
  const raw = (location.hash || '').replace(/^#/, '')
  const [pathPart, queryPart] = raw.split('?')
  const segs = (pathPart || '/').split('/').filter(Boolean)
  const query = Object.fromEntries(new URLSearchParams(queryPart || ''))
  return { segs, query, path: '/' + segs.join('/'), hash: location.hash }
}

export function go(hash) {
  if (location.hash === hash) {
    window.scrollTo({ top: 0 })
    return
  }
  location.hash = hash
}

export function useRoute() {
  const [route, setRoute] = useState(parseHash)
  useEffect(() => {
    const on = () => {
      setRoute(parseHash())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}
