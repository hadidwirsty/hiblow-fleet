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
  formatTripsForExport,
  getTripsExportFilename,
  type TripExportFilter,
} from "@/features/trips/trips.export"
import { buildCsvString } from "@/lib/export/csv-builder"
import { triggerBlobDownload, triggerTextDownload } from "@/lib/export/download"
import { buildExcelWorkbookBlob } from "@/lib/export/excel-builder"
import type { TripRecord } from "@/features/trips/trips-table"

interface TripsExportButtonProps {
  trips: TripRecord[]
  filter?: TripExportFilter
}

export function TripsExportButton({ trips, filter }: TripsExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const hasData = trips.length > 0

  const handleExportExcel = () => {
    if (!hasData) return
    setIsExporting(true)
    try {
      const sheetData = formatTripsForExport(trips)
      const blob = buildExcelWorkbookBlob({ sheets: [sheetData] })
      const filename = getTripsExportFilename(filter, "xlsx")
      triggerBlobDownload(blob, filename)
      toast.success(`Laporan ritase berhasil diunduh (${filename})`)
    } catch {
      toast.error("Gagal mengekspor laporan ritase ke Excel")
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportCsv = () => {
    if (!hasData) return
    setIsExporting(true)
    try {
      const sheetData = formatTripsForExport(trips)
      const csv = buildCsvString({
        headers: sheetData.headers,
        rows: sheetData.rows,
      })
      const filename = getTripsExportFilename(filter, "csv")
      triggerTextDownload(csv, filename)
      toast.success(`Laporan ritase berhasil diunduh (${filename})`)
    } catch {
      toast.error("Gagal mengekspor laporan ritase ke CSV")
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
            className="h-8 gap-1.5 px-2.5 text-xs shadow-xs"
          >
            <RiDownloadLine className="size-3.5 text-muted-foreground" />
            <span>Export Data</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={handleExportExcel}
          className="flex cursor-pointer items-center gap-2 text-xs"
        >
          <RiFileExcelLine className="size-4 text-emerald-600 dark:text-emerald-400" />
          <span>Download Excel (.xlsx)</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleExportCsv}
          className="flex cursor-pointer items-center gap-2 text-xs"
        >
          <RiFileLine className="size-4 text-sky-600 dark:text-sky-400" />
          <span>Download CSV (.csv)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
