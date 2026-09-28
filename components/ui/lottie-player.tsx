"use client"

import * as React from "react"
import dynamic from "next/dynamic"

export interface LottiePlayerProps {
  animationData?: unknown
  src?: string | object
  loop?: boolean | number
  autoplay?: boolean
  style?: React.CSSProperties
  className?: string
}

export const LottiePlayer = dynamic(
  () =>
    import("lottie-react").then((mod) => {
      const Component = mod.Lottie
      return function LottieComponent({
        animationData,
        src,
        loop = false,
        autoplay = true,
        style,
        className,
      }: LottiePlayerProps) {
        const animSrc = src ?? (animationData as object)
        if (!animSrc) return null
        return (
          <Component
            src={animSrc}
            loop={loop}
            autoplay={autoplay}
            style={style}
            className={className}
          />
        )
      }
    }),
  { ssr: false }
)
