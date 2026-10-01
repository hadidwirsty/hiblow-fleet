import * as React from "react"
import Link from "next/link"

import { Button, buttonVariants } from "@/components/ui/button"
import { LottiePlayer } from "@/components/ui/lottie-player"

interface ErrorViewProps {
  statusCode: string
  title: string
  description: string
  animationPath: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
}

export function ErrorView({
  statusCode,
  title,
  description,
  animationPath,
  actionLabel = "Kembali ke Beranda",
  actionHref = "/",
  onAction,
}: ErrorViewProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[url('/images/background_light.jpg')] bg-cover bg-center p-4 text-center dark:bg-[url('/images/background_dark.jpg')]">
      {/* Optional overlay to ensure text readability against background image */}
      <div className="absolute inset-0 z-0 bg-background/80 backdrop-blur-[2px]"></div>

      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center justify-center">
        <div className="relative mb-6 h-64 w-64 sm:h-80 sm:w-80">
          <LottiePlayer src={animationPath} loop autoplay />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground drop-shadow-md sm:text-5xl">
          {statusCode}
        </h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground drop-shadow-md sm:text-2xl">
          {title}
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground drop-shadow-sm sm:text-base">
          {description}
        </p>
        <div className="mt-8">
          {onAction ? (
            <Button size="lg" onClick={onAction}>
              {actionLabel}
            </Button>
          ) : (
            <Link href={actionHref} className={buttonVariants({ size: "lg" })}>
              {actionLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
