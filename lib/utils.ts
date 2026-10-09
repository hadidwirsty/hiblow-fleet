import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

import type { ClassValue } from "clsx"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as Indonesian Rupiah currency string without space after "Rp".
 * - Integer numbers: "Rp1.946.661" (no ,00)
 * - Decimal numbers: "Rp62.795,50" (formatted with 2 decimal places)
 */
export function formatCurrency(amount: number): string {
  if (isNaN(amount)) return "Rp0"
  const hasFraction = Math.abs(amount % 1) > 0.0001
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  })
    .format(amount)
    .replace(/Rp[\s\u00a0]+/g, "Rp")
}

/**
 * Formats a percentage value into Indonesian readable format.
 * Examples:
 * - 0.52 or "0.52" -> "52%"
 * - 0.5258552 or "0.5258552" -> "52,58552%"
 * - 0.4780845 or "0.4780845" -> "47,80845%"
 * - 0.5 -> "50%"
 * - 52.58552 -> "52,58552%"
 */
export function formatPercentage(
  rateValue: number | string | null | undefined
): string {
  if (rateValue === "" || rateValue === null || rateValue === undefined) {
    return "0%"
  }
  const cleanStr =
    typeof rateValue === "string"
      ? rateValue.trim().replace(/%/g, "").replace(",", ".")
      : String(rateValue)
  const num = parseFloat(cleanStr)
  if (isNaN(num)) return "0%"

  const pct = num <= 1 && num > 0 ? num * 100 : num
  const rounded = Number(pct.toFixed(5))
  const formattedStr = rounded.toString().replace(".", ",")
  return `${formattedStr}%`
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

  const sanitized = cleaned.replace(/[^0-9,]/g, "")
  if (!sanitized) return ""

  const commaIdx = sanitized.indexOf(",")
  if (commaIdx !== -1) {
    const intPart = sanitized.slice(0, commaIdx)
    const decPart = sanitized
      .slice(commaIdx + 1)
      .replace(/,/g, "")
      .slice(0, 2)
    if (sanitized.endsWith(",") && decPart.length === 0) {
      return `${intPart || "0"}.`
    }
    return decPart ? `${intPart || "0"}.${decPart}` : intPart || "0"
  }

  return sanitized
}

export function formatCurrencyInput(value: string): string {
  if (!value) return ""

  const str = value.trim()
  if (!str) return ""

  if (str.includes(".")) {
    const [intStr, decStr] = str.split(".")
    const formattedInt = intStr
      ? new Intl.NumberFormat("id-ID").format(Number(intStr))
      : "0"

    if (decStr === undefined || decStr === "") {
      return `${formattedInt},`
    }
    if (/^0+$/.test(decStr)) {
      return formattedInt
    }

    return `${formattedInt},${decStr}`
  }

  const num = Number(str)
  if (isNaN(num)) return str
  return new Intl.NumberFormat("id-ID").format(num)
}

/**
 * Menggabungkan nama kota dan kode tujuan (city code).
 * Contoh: "BANJARNEGARA", "BC35" -> "BANJARNEGARA (BC35)"
 * Jika kota sudah memuat kode tujuan di dalamnya, hindari duplikasi tanda kurung.
 */
export function formatCityWithCode(
  city: string,
  cityCode?: string | null
): string {
  if (!cityCode || !cityCode.trim()) return city
  const trimmedCode = cityCode.trim().toUpperCase()
  const trimmedCity = city.trim()
  if (
    trimmedCity.toUpperCase().includes(`(${trimmedCode})`) ||
    trimmedCity.toUpperCase().endsWith(` ${trimmedCode}`)
  ) {
    return trimmedCity
  }
  return `${trimmedCity} (${trimmedCode})`
}
