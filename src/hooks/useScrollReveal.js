import { useEffect } from 'react'

export default function useScrollReveal() {
 useEffect(() => {
   const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
   const root = document.getElementById('root')
   if (!root) return undefined
   const revealed = new WeakSet()
   const observed = new WeakSet()


  const show = (element) => {
   element.classList.add('is-visible')
   revealed.add(element)
  }

  if (reduceMotion) {
    root.querySelectorAll('[data-reveal]').forEach(show)

   return undefined
  }

  const observer = new IntersectionObserver(
   (entries) => {
    entries.forEach((entry) => {
     if (!entry.isIntersecting) return
     show(entry.target)
     observer.unobserve(entry.target)
    })
   },
   { rootMargin: '0px 0px -10% 0px', threshold: 0.14 }
  )

  const observeNewElements = () => {
    root.querySelectorAll('[data-reveal]').forEach((element) => {

    if (revealed.has(element)) return
    const rect = element.getBoundingClientRect()
    const isInViewport = rect.top < window.innerHeight * 0.96 && rect.bottom > 0
    if (isInViewport) {
     show(element)
     return
    }
    if (observed.has(element)) return
    observer.observe(element)
    observed.add(element)
   })
  }

  observeNewElements()

  const mutationObserver = new MutationObserver(observeNewElements)
   mutationObserver.observe(root, { childList: true, subtree: true })


  return () => {
   mutationObserver.disconnect()
   observer.disconnect()
  }
 }, [])
}
