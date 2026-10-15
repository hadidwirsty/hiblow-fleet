"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  RiCloseLine,
  RiFileExcel2Line,
  RiFilterLine,
  RiPrinterLine,
} from "@remixicon/react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { TaxAccountingData } from "@/features/taxes/taxes.queries"

interface TaxesFilterBarProps {
  data: TaxAccountingData
  onExportExcel?: () => void
}

const MONTHS = [
  { value: "ALL", label: "Semua Bulan (Setahun Penuh)" },
  { value: "1", label: "Januari" },
  { value: "2", label: "Februari" },
  { value: "3", label: "Maret" },
  { value: "4", label: "April" },
  { value: "5", label: "Mei" },
  { value: "6", label: "Juni" },
  { value: "7", label: "Juli" },
  { value: "8", label: "Agustus" },
  { value: "9", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
]

const YEARS = ["2026", "2025", "2024"]

const TRUCKS = [
  { value: "ALL", label: "Semua Armada" },
  { value: "W8187UA", label: "Triyono - W 8187 UA" },
  { value: "H8133OF", label: "Khoirul - H 8133 OF" },
]

export function TaxesFilterBar({ data, onExportExcel }: TaxesFilterBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentYear = searchParams.get("year") || String(data.period.year)
  const currentMonth = searchParams.get("month") || "ALL"
  const currentTruck = searchParams.get("truckId") || "ALL"

  const isFiltered =
    currentMonth !== "ALL" ||
    currentTruck !== "ALL" ||
    currentYear !== String(new Date().getFullYear())

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "ALL") {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleResetFilters = () => {
    router.push(pathname)
  }

  const handlePrint = () => {
    window.print()
  }

  // Label display helpers untuk mencegah tampilnya teks mentah "ALL"
  const monthDisplayLabel =
    currentMonth === "ALL"
      ? "Semua Bulan"
      : (MONTHS.find((m) => m.value === currentMonth)?.label ?? "Semua Bulan")

  const truckDisplayLabel =
    currentTruck === "ALL"
      ? "Semua Armada"
      : (TRUCKS.find((t) => t.value === currentTruck)?.label ?? "Semua Armada")

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card/75 p-3 shadow-2xs backdrop-blur-xs transition-all lg:flex-row lg:items-center lg:justify-between lg:px-4 lg:py-2.5 print:hidden">
      {/* Group Filter Dropdowns */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
        {/* Label Filter */}
        <div className="flex items-center justify-between sm:justify-start sm:gap-1.5 sm:pr-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <RiFilterLine className="size-3.5 text-primary" />
            <span>Filter Pembukuan:</span>
          </div>
          {isFiltered && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex cursor-pointer items-center gap-1 text-[11px] font-medium text-destructive hover:underline sm:hidden"
            >
              <RiCloseLine className="size-3" />
              <span>Atur Ulang</span>
            </button>
          )}
        </div>

        {/* 1. Filter Tahun */}
        <div className="flex items-center gap-1.5">
          <Select
            value={currentYear}
            onValueChange={(val) => val && updateFilters("year", val)}
          >
            <SelectTrigger className="h-8.5 w-full rounded-lg border-border/60 bg-background px-2.5 text-xs font-medium text-foreground shadow-2xs hover:bg-accent/50 sm:h-8 sm:w-28">
              <SelectValue>Tahun {currentYear}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={y} className="text-xs">
                  Tahun {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 2. Filter Bulan */}
        <div className="flex items-center gap-1.5">
          <Select
            value={currentMonth}
            onValueChange={(val) => val && updateFilters("month", val)}
          >
            <SelectTrigger className="h-8.5 w-full rounded-lg border-border/60 bg-background px-2.5 text-xs font-medium text-foreground shadow-2xs hover:bg-accent/50 sm:h-8 sm:w-44">
              <SelectValue>{monthDisplayLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value} className="text-xs">
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 3. Filter Armada */}
        <div className="flex items-center gap-1.5">
          <Select
            value={currentTruck}
            onValueChange={(val) => val && updateFilters("truckId", val)}
          >
            <SelectTrigger className="h-8.5 w-full rounded-lg border-border/60 bg-background px-2.5 text-xs font-medium text-foreground shadow-2xs hover:bg-accent/50 sm:h-8 sm:w-48">
              <SelectValue>{truckDisplayLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TRUCKS.map((t) => (
                <SelectItem key={t.value} value={t.value} className="text-xs">
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tombol Reset Filter di Layar Besar */}
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="hidden h-8 cursor-pointer items-center gap-1 px-2 text-xs font-medium text-muted-foreground hover:text-destructive sm:inline-flex"
          >
            <RiCloseLine className="size-3.5" />
            <span>Atur Ulang</span>
          </Button>
        )}
      </div>

      {/* Action Buttons: Cetak & Ekspor Excel */}
      <div className="flex items-center gap-2 border-t border-border/40 pt-1 sm:self-auto sm:border-t-0 sm:pt-0">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="h-8 flex-1 cursor-pointer gap-1.5 rounded-lg border-border/60 bg-background px-3 text-xs font-medium shadow-2xs hover:bg-accent/50 sm:flex-none"
        >
          <RiPrinterLine className="size-3.5 text-muted-foreground" />
          <span>Cetak Dokumen</span>
        </Button>

        {onExportExcel && (
          <Button
            variant="default"
            size="sm"
            onClick={onExportExcel}
            className="h-8 flex-1 cursor-pointer gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-medium text-white shadow-2xs hover:bg-emerald-700 sm:flex-none"
          >
            <RiFileExcel2Line className="size-3.5" />
            <span>Ekspor Excel</span>
          </Button>
        )}
      </div>
    </div>
  )
}
