"use client"

import { useEffect, useState } from "react"
import { RiMoonLine, RiSunLine } from "@remixicon/react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

interface ModeToggleProps {
  className?: string
}

export function ModeToggle({ className }: ModeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={className}
        disabled
        aria-label="Toggle tema"
      >
        <span className="size-4" />
      </Button>
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <Button
      variant="outline"
      size="icon"
      className={className}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
      aria-label="Toggle tema"
    >
      {isDark ? (
        <RiSunLine className="size-4 text-amber-400 transition-transform duration-200 hover:rotate-45" />
      ) : (
        <RiMoonLine className="size-4 text-slate-700 transition-transform duration-200 hover:-rotate-12" />
      )}
    </Button>
  )
}
