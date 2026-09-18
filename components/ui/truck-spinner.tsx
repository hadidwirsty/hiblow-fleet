import { RiTruckLine } from "@remixicon/react"

import { cn } from "@/lib/utils"

export interface TruckSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl"
  label?: string
  description?: string
  className?: string
}

const sizeConfig = {
  sm: {
    container: "size-10",
    ring: "border-2",
    icon: "size-4.5",
    textTitle: "text-xs",
    textDesc: "text-[10px]",
  },
  md: {
    container: "size-14",
    ring: "border-[2.5px]",
    icon: "size-6",
    textTitle: "text-sm",
    textDesc: "text-xs",
  },
  lg: {
    container: "size-20",
    ring: "border-3",
    icon: "size-8",
    textTitle: "text-base font-semibold",
    textDesc: "text-xs",
  },
  xl: {
    container: "size-24",
    ring: "border-4",
    icon: "size-10",
    textTitle: "text-lg font-bold",
    textDesc: "text-sm",
  },
}

export function TruckSpinner({
  size = "lg",
  label,
  description,
  className,
}: TruckSpinnerProps) {
  const cfg = sizeConfig[size]

  return (
    <div
      className={cn("flex flex-col items-center justify-center p-4", className)}
    >
      <div
        className={cn(
          "relative flex items-center justify-center",
          cfg.container
        )}
      >
        <div
          className={cn(
            "size-full rounded-full border-emerald-500/20 dark:border-emerald-400/20",
            cfg.ring
          )}
        />
        <div
          className={cn(
            "absolute size-full animate-spin rounded-full border-emerald-600 border-t-transparent border-l-transparent dark:border-emerald-400 dark:border-t-transparent dark:border-l-transparent",
            cfg.ring
          )}
        />
        <div className="absolute size-3/4 rounded-full bg-emerald-500/10 blur-xs" />
        <div className="absolute flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <div className="animate-truck-rumble">
            <RiTruckLine className={cn(cfg.icon, "drop-shadow-xs")} />
          </div>
        </div>
      </div>
      {(label || description) && (
        <div className="mt-3.5 flex flex-col items-center gap-0.5 text-center">
          {label && (
            <span
              className={cn("tracking-tight text-foreground", cfg.textTitle)}
            >
              {label}
            </span>
          )}
          {description && (
            <span className={cn("text-muted-foreground", cfg.textDesc)}>
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
