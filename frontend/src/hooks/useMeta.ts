
import { useEffect } from 'react'

type MetaTags = {
  title?: string
  description?: string
  keywords?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  ogUrl?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
}

export function useMeta(tags: MetaTags) {
  useEffect(() => {
    const originalState: {
      title: string
      metas: Map<string, { element: HTMLMetaElement; originalContent: string | null }>
    } = {
      title: document.title,
      metas: new Map(),
    }

    // Helper to get or create meta tag
    const getOrCreateMeta = (attr: 'name' | 'property', value: string): HTMLMetaElement => {
      const selector = `meta[${attr}="${value}"]`
      let meta = document.querySelector(selector) as HTMLMetaElement | null
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute(attr, value)
        document.head.appendChild(meta)
        originalState.metas.set(selector, { element: meta, originalContent: null })
      } else if (!originalState.metas.has(selector)) {
        originalState.metas.set(selector, { element: meta, originalContent: meta.content })
      }
      return meta
    }

    // Update title
    if (tags.title) {
      document.title = tags.title
    }

    // Update meta tags
    if (tags.description) {
      const meta = getOrCreateMeta('name', 'description')
      meta.content = tags.description
    }
    if (tags.keywords) {
      const meta = getOrCreateMeta('name', 'keywords')
      meta.content = tags.keywords
    }
    if (tags.ogTitle) {
      const meta = getOrCreateMeta('property', 'og:title')
      meta.content = tags.ogTitle
    }
    if (tags.ogDescription) {
      const meta = getOrCreateMeta('property', 'og:description')
      meta.content = tags.ogDescription
    }
    if (tags.ogImage) {
      const meta = getOrCreateMeta('property', 'og:image')
      meta.content = tags.ogImage
    }
    if (tags.ogUrl) {
      const meta = getOrCreateMeta('property', 'og:url')
      meta.content = tags.ogUrl
    }
    if (tags.twitterTitle) {
      const meta = getOrCreateMeta('name', 'twitter:title')
      meta.content = tags.twitterTitle
    }
    if (tags.twitterDescription) {
      const meta = getOrCreateMeta('name', 'twitter:description')
      meta.content = tags.twitterDescription
    }
    if (tags.twitterImage) {
      const meta = getOrCreateMeta('name', 'twitter:image')
      meta.content = tags.twitterImage
    }

    // Cleanup
    return () => {
      document.title = originalState.title
      originalState.metas.forEach(({ element, originalContent }) => {
        if (originalContent !== null) {
          element.content = originalContent
        }
      })
    }
  }, [
    tags.title,
    tags.description,
    tags.keywords,
    tags.ogTitle,
    tags.ogDescription,
    tags.ogImage,
    tags.ogUrl,
    tags.twitterTitle,
    tags.twitterDescription,
    tags.twitterImage,
  ])
}
