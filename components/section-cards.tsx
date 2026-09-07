"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  RiArrowUpLine,
  RiCheckLine,
  RiGasStationLine,
  RiMoneyDollarCircleLine,
} from "@remixicon/react"

export function SectionCards() {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
      {/* Card 1: Omset Ritase */}
      <Card className="flex h-full flex-col justify-between border-border bg-card/60 shadow-xs backdrop-blur-xs transition-all hover:border-primary/50">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs font-medium text-muted-foreground">
            Omset Ritase Berjalan
          </CardDescription>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            Rp 148.500.000
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-xs font-medium text-emerald-600 dark:text-emerald-400"
            >
              <RiArrowUpLine className="size-3" />
              +14.2%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 pt-2 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
            <span>Tren naik dibanding Mei</span>
            <RiArrowUpLine className="size-3.5" />
          </div>
          <div className="text-muted-foreground">
            Akumulasi ritase PT Semen Indonesia & SBI
          </div>
        </CardFooter>
      </Card>

      {/* Card 2: Ritase Selesai */}
      <Card className="flex h-full flex-col justify-between border-border bg-card/60 shadow-xs backdrop-blur-xs transition-all hover:border-primary/50">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs font-medium text-muted-foreground">
            Ritase Selesai
          </CardDescription>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            42 Rit
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className="gap-1 border-blue-500/30 bg-blue-500/10 text-xs font-medium text-blue-600 dark:text-blue-400"
            >
              <RiCheckLine className="size-3" />
              +8 rit
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 pt-2 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400">
            <span>Target 50 rit/bulan tercapai 84%</span>
          </div>
          <div className="text-muted-foreground">
            W 8187 UA (24 rit) & H 8133 OF (18 rit)
          </div>
        </CardFooter>
      </Card>

      {/* Card 3: Sangu Supir & Solar */}
      <Card className="flex h-full flex-col justify-between border-border bg-card/60 shadow-xs backdrop-blur-xs transition-all hover:border-primary/50">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs font-medium text-muted-foreground">
            Sangu Supir & Solar Jatah
          </CardDescription>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            Rp 64.200.000
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className="gap-1 border-amber-500/30 bg-amber-500/10 text-xs font-medium text-amber-600 dark:text-amber-400"
            >
              <RiGasStationLine className="size-3" />
              43.2%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 pt-2 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
            <span>Rasio pengeluaran operasional aman</span>
          </div>
          <div className="text-muted-foreground">
            Total biaya jalan langsung supir & solar
          </div>
        </CardFooter>
      </Card>

      {/* Card 4: Estimasi Laba Bersih */}
      <Card className="flex h-full flex-col justify-between border-border bg-card/60 shadow-xs backdrop-blur-xs transition-all hover:border-primary/50">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs font-medium text-muted-foreground">
            Estimasi Laba Berjalan
          </CardDescription>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            Rp 84.300.000
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-xs font-medium text-emerald-600 dark:text-emerald-400"
            >
              <RiMoneyDollarCircleLine className="size-3" />
              56.8%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 pt-2 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
            <span>Margin sebelum biaya servis bengkel</span>
          </div>
          <div className="text-muted-foreground">
            Siap rekonsiliasi saat tutup buku bulanan
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
