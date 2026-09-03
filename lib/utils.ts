import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

import type { ClassValue } from "clsx"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as Indonesian Rupiah currency string.
 * Example: 1250000 -> "Rp 1.250.000"
 */
export function formatCurrency(amount: number): string {
  if (isNaN(amount)) return "Rp 0"
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace(/\s+/g, " ")
}

/**
 * Formats date into Indonesian readable format.
 * Example: "2026-09-03" -> "3 September 2026" or "3 Sep 2026"
 */
export function formatDateIndonesian(
  dateInput: string | Date | null | undefined,
  short = false
): string {
  if (!dateInput) return "-"
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput
  if (isNaN(d.getTime())) return "-"

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: short ? "short" : "long",
    year: "numeric",
  }).format(d)
}
