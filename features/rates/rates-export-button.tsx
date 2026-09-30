"use client"

import { useState } from "react"
import { RiDownloadLine, RiFileExcelLine, RiFileLine } from "@remixicon/react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  formatRatesForExport,
  getRatesExportFilename,
} from "@/features/rates/rates.export"
import { buildCsvString } from "@/lib/export/csv-builder"
import { triggerBlobDownload, triggerTextDownload } from "@/lib/export/download"
import { buildExcelWorkbookBlob } from "@/lib/export/excel-builder"
import type { RateReference } from "@/db/schema"

interface RatesExportButtonProps {
  rates: RateReference[]
}

export function RatesExportButton({ rates }: RatesExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const hasData = rates.length > 0

  const handleExportExcel = () => {
    if (!hasData) return
    setIsExporting(true)
    try {
      const sheetData = formatRatesForExport(rates)
      const blob = buildExcelWorkbookBlob({ sheets: [sheetData] })
      const filename = getRatesExportFilename("xlsx")
      triggerBlobDownload(blob, filename)
      toast.success(`Data referensi tarif berhasil diunduh (${filename})`)
    } catch {
      toast.error("Gagal mengekspor data tarif ke Excel")
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportCsv = () => {
    if (!hasData) return
    setIsExporting(true)
    try {
      const sheetData = formatRatesForExport(rates)
      const csv = buildCsvString({
        headers: sheetData.headers,
        rows: sheetData.rows,
      })
      const filename = getRatesExportFilename("csv")
      triggerTextDownload(csv, filename)
      toast.success(`Data referensi tarif berhasil diunduh (${filename})`)
    } catch {
      toast.error("Gagal mengekspor data tarif ke CSV")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            disabled={!hasData || isExporting}
            className="h-9 w-full gap-1.5 px-3.5 text-xs font-medium shadow-xs sm:w-auto"
          >
            <RiDownloadLine className="size-4 text-muted-foreground" />
            <span>Ekspor Data</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={handleExportExcel}
          className="flex cursor-pointer items-center gap-2 text-xs"
        >
          <RiFileExcelLine className="size-4 text-emerald-600 dark:text-emerald-400" />
          <span>Unduh Excel (.xlsx)</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleExportCsv}
          className="flex cursor-pointer items-center gap-2 text-xs"
        >
          <RiFileLine className="size-4 text-sky-600 dark:text-sky-400" />
          <span>Unduh CSV (.csv)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
