"use client"

import { useEffect } from "react"

export function PWAInstaller() {
  useEffect(() => {
    // Register Service Worker for PWA
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/service-worker.js")
          .then((registration) => {
            console.log("[PWA] Service Worker registered:", registration.scope)
          })
          .catch((error) => {
            console.error("[PWA] Service Worker registration failed:", error)
          })
      })
    }
  }, [])

  return null
}
