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

export function parseCurrencyInput(value: string): string {
  const cleaned = value.trim()
  if (!cleaned) return ""

  if (cleaned.includes(",")) {
    const parts = cleaned.split(",")
    const intPart = parts[0].replace(/\D/g, "")
    const decPart = parts.slice(1).join("").replace(/\D/g, "")
    if (cleaned.endsWith(",")) {
      return `${intPart}.`
    }
    return decPart ? `${intPart}.${decPart}` : intPart
  }

  if (cleaned.includes(".")) {
    const parts = cleaned.split(".")
    if (parts.length === 2 && parts[0].length > 3 && parts[1].length <= 2) {
      return cleaned
    }
    return cleaned.replace(/\./g, "").replace(/\D/g, "")
  }

  return cleaned.replace(/\D/g, "")
}

export function formatCurrencyInput(value: string): string {
  if (!value) return ""

  let intPart = ""
  let decPart = ""
  const hasCommaEnding = value.endsWith(".") || value.endsWith(",")

  if (value.includes(".")) {
    const parts = value.split(".")
    intPart = parts[0].replace(/\D/g, "")
    decPart = parts[1] === "00" || parts[1] === "0" ? "" : parts[1]
  } else {
    intPart = value.replace(/\D/g, "")
  }

  if (!intPart && !decPart) return ""
  const formattedInt = intPart
    ? new Intl.NumberFormat("id-ID").format(Number(intPart))
    : "0"

  if (hasCommaEnding) {
    return `${formattedInt},`
  }
  return decPart ? `${formattedInt},${decPart}` : formattedInt
}
