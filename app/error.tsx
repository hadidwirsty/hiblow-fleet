"use client"

import { useEffect } from "react"
import { ErrorView } from "@/components/ui/error-view"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Global boundary caught:", error)
  }, [error])

  return (
    <ErrorView
      statusCode="500"
      title="Terjadi Kesalahan Internal"
      description="Maaf, sistem sedang mengalami kendala. Silakan coba beberapa saat lagi."
      animationPath="/animations/error500.json"
      actionLabel="Coba Lagi"
      onAction={() => reset()}
    />
  )
}
