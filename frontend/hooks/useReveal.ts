'use client'
import { useEffect } from 'react'

export function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active')
            observer.unobserve(entry.target)
          }
        })
      },
      { 
        threshold: 0.05, 
        rootMargin: '0px 0px 100px 0px' // Trigger 100px before entering viewport
      }
    )

    const observeElements = () => {
      document.querySelectorAll('.reveal:not(.active)').forEach(el => observer.observe(el))
    }

    observeElements()
    
    // Fallback: Re-scan after a short delay to catch elements added by late renders
    const timer = setTimeout(observeElements, 1000)

    return () => {
      observer.disconnect()
      clearTimeout(timer)
    }
  }, [])
}
