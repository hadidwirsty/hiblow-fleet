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

export interface TripRow {
  id: string
  tripNumber: string
  date: string
  truck: string
  driver: string
  origin: string
  destination: string
  tonnage: number
  sangu: number
  omset: number
  status: "completed" | "in_transit" | "loading"
}

const DEFAULT_DATA: TripRow[] = [
  {
    id: "trip-1",
    tripNumber: "HW-2026-0601",
    date: "30 Jun 2026",
    truck: "W 8187 UA",
    driver: "Pak Tris",
    origin: "SBI Tuban",
    destination: "Batching Plant Gresik",
    tonnage: 28.5,
    sangu: 1650000,
    omset: 3705000,
    status: "completed",
  },
  {
    id: "trip-2",
    tripNumber: "HW-2026-0602",
    date: "29 Jun 2026",
    truck: "H 8133 OF",
    driver: "Mas Didik",
    origin: "Semen Indonesia Tuban",
    destination: "Proyek Tol Solo-Yogya",
    tonnage: 31.2,
    sangu: 2100000,
    omset: 4680000,
    status: "completed",
  },
  {
    id: "trip-3",
    tripNumber: "HW-2026-0603",
    date: "28 Jun 2026",
    truck: "W 8187 UA",
    driver: "Pak Tris",
    origin: "SBI Tuban",
    destination: "Precast Mojokerto",
    tonnage: 29.0,
    sangu: 1800000,
    omset: 3915000,
    status: "completed",
  },
  {
    id: "trip-4",
    tripNumber: "HW-2026-0604",
    date: "27 Jun 2026",
    truck: "H 8133 OF",
    driver: "Mas Didik",
    origin: "Semen Grobogan",
    destination: "Waskita Semarang",
    tonnage: 30.5,
    sangu: 1500000,
    omset: 3660000,
    status: "completed",
  },
  {
    id: "trip-5",
    tripNumber: "HW-2026-0605",
    date: "26 Jun 2026",
    truck: "W 8187 UA",
    driver: "Pak Tris",
    origin: "SBI Tuban",
    destination: "Varia Usaha Sidoarjo",
    tonnage: 27.8,
    sangu: 1750000,
    omset: 3614000,
    status: "completed",
  },
]

export function DataTable({ data = DEFAULT_DATA }: { data?: TripRow[] }) {
  const [filter, setFilter] = React.useState("")

  const filtered = data.filter(
    (item) =>
      item.tripNumber.toLowerCase().includes(filter.toLowerCase()) ||
      item.truck.toLowerCase().includes(filter.toLowerCase()) ||
      item.driver.toLowerCase().includes(filter.toLowerCase()) ||
      item.destination.toLowerCase().includes(filter.toLowerCase())
  )

  const formatRupiah = (value: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value)

  return (
    <Card className="border-border bg-card/60 shadow-xs backdrop-blur-xs">
      <CardHeader className="flex flex-col gap-4 px-6 pt-6 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base font-semibold">
            Rekap Ritase Armada Terakhir
          </CardTitle>
          <CardDescription className="text-xs">
            Aktivitas pengangkutan semen curah hi-blow terbaru dari pabrik ke
            tujuan
          </CardDescription>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="relative w-48 sm:w-64">
            <RiSearchLine className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari truk, supir, rute..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-9 pl-8 text-xs shadow-none"
            />
          </div>
          <Link
            href="/trips"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "h-9 gap-1 text-xs shadow-none",
            })}
          >
            <span>Semua Ritase</span>
            <RiArrowRightUpLine className="size-3.5" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-6">
        <div className="overflow-hidden rounded-lg border border-border">
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
                    Tidak ada ritase yang cocok dengan kata kunci &quot;{filter}
                    &quot;.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => (
                  <TableRow
                    key={row.id}
                    className="text-xs transition-colors hover:bg-muted/40"
                  >
                    <TableCell className="font-mono font-medium">
                      <span>{row.tripNumber}</span>
                      <span className="block text-[11px] font-normal text-muted-foreground">
                        {row.date}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono font-bold text-foreground">
                        {row.truck}
                      </span>
                      <span className="block text-[11px] text-muted-foreground">
                        {row.driver}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-foreground">
                        {row.destination}
                      </span>
                      <span className="block text-[11px] text-muted-foreground">
                        Asal: {row.origin}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium tabular-nums">
                      {row.tonnage.toFixed(1)} Ton
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium text-foreground tabular-nums">
                      {formatRupiah(row.sangu)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
                      {formatRupiah(row.omset)}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.status === "completed" ? (
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
      </CardContent>
    </Card>
  )
}
