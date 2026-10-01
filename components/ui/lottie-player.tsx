"use client"

import * as React from "react"
import dynamic from "next/dynamic"

import type { LottieHandle } from "lottie-react"

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
        loop = true,
        autoplay = true,
        style,
        className,
      }: LottiePlayerProps) {
        const lottieRef = React.useRef<LottieHandle>(null)
        const animSrc = src ?? (animationData as object)
        if (!animSrc) return null

        return (
          <Component
            lottieRef={lottieRef}
            src={animSrc}
            loop={loop}
            autoplay={false}
            subscriptions={{
              ready: () => {
                if (autoplay) {
                  lottieRef.current?.play()
                }
              },
            }}
            style={style}
            className={className}
          />
        )
      }
    }),
  { ssr: false }
)
