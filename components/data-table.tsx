"use client"

import * as React from "react"
import Link from "next/link"
import {
  RiArrowRightUpLine,
  RiCheckLine,
  RiSearchLine,
  RiTimeLine,
} from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatDateIndonesian } from "@/lib/utils"
import type { RecentTripRow } from "@/features/dashboard/dashboard.queries"

export interface DataTableProps {
  trips: RecentTripRow[]
}

const DRIVER_MAP: Record<string, string> = {
  W8187UA: "Pak Tris (Sutrisno)",
  H8133OF: "Mas Didik (Nurhadi)",
}

export function DataTable({ trips = [] }: DataTableProps) {
  const [filter, setFilter] = React.useState("")

  const filtered = trips.filter((item) => {
    const q = filter.toLowerCase()
    const driver = DRIVER_MAP[item.truckId] ?? ""
    return (
      String(item.orderNumber).toLowerCase().includes(q) ||
      item.truckId.toLowerCase().includes(q) ||
      item.destinationCity.toLowerCase().includes(q) ||
      item.destinationName.toLowerCase().includes(q) ||
      driver.toLowerCase().includes(q)
    )
  })

  return (
    <Card className="border-border bg-card/60 shadow-xs backdrop-blur-xs">
      <CardHeader className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6 sm:pb-4">
        <div>
          <CardTitle className="text-base font-semibold">
            Rekap Ritase Armada Terakhir
          </CardTitle>
          <CardDescription className="text-xs">
            Aktivitas pengangkutan semen curah hi-blow terbaru dari pabrik ke
            tujuan
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-40 flex-1 sm:w-64 sm:flex-initial">
            <RiSearchLine className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari truk, rute, tujuan..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-9 w-full pl-8 text-xs shadow-none"
            />
          </div>
          <Link
            href="/trips"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "h-9 shrink-0 gap-1 text-xs shadow-none",
            })}
          >
            <span>Semua Ritase</span>
            <RiArrowRightUpLine className="size-3.5" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 sm:px-6 sm:pb-6">
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 text-xs">
                  <TableHead className="w-32 py-3 font-semibold text-foreground">
                    No. Trip
                  </TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">
                    Armada & Supir
                  </TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">
                    Rute Pengiriman
                  </TableHead>
                  <TableHead className="py-3 text-right font-semibold text-foreground">
                    Muatan
                  </TableHead>
                  <TableHead className="py-3 text-right font-semibold text-foreground">
                    Sangu Supir
                  </TableHead>
                  <TableHead className="py-3 text-right font-semibold text-foreground">
                    Omset Bruto
                  </TableHead>
                  <TableHead className="w-28 py-3 text-center font-semibold text-foreground">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-24 text-center text-xs text-muted-foreground"
                    >
                      {filter ? (
                        <>
                          Tidak ada ritase yang cocok dengan kata kunci &quot;
                          {filter}&quot;.
                        </>
                      ) : (
                        "Belum ada aktivitas ritase tercatat."
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((row) => (
                    <TableRow
                      key={row.id}
                      className="text-xs transition-colors hover:bg-muted/40"
                    >
                      <TableCell className="font-mono font-medium">
                        <span>DO #{row.orderNumber}</span>
                        <span className="block text-[11px] font-normal text-muted-foreground">
                          {formatDateIndonesian(row.orderDate, true)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono font-bold text-foreground">
                          {row.truckId}
                        </span>
                        <span className="block text-[11px] text-muted-foreground">
                          {DRIVER_MAP[row.truckId] ?? "Supir"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-foreground">
                          {row.destinationName}
                        </span>
                        <span className="block text-[11px] text-muted-foreground">
                          Kota: {row.destinationCity}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium tabular-nums">
                        {Number(row.unloadedTonnage).toFixed(1)} Ton
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium text-foreground tabular-nums">
                        {formatCurrency(Number(row.sangu))}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
                        {formatCurrency(Number(row.omset))}
                      </TableCell>
                      <TableCell className="text-center">
                        {row.unloadingDate ? (
                          <Badge
                            variant="outline"
                            className="gap-1 border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400"
                          >
                            <RiCheckLine className="size-3" /> Selesai
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="gap-1 border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400"
                          >
                            <RiTimeLine className="size-3" /> Di Jalan
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
