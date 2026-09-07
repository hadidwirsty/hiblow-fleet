import {
  RiBankCardLine,
  RiFileListLine,
  RiMoneyDollarCircleLine,
  RiToolsLine,
} from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

import type { ExpensesSummary as ExpensesSummaryType } from "./expenses.queries"

interface ExpensesSummaryProps {
  summary: ExpensesSummaryType
}

export function ExpensesSummary({ summary }: ExpensesSummaryProps) {
  const adminFeePercentage =
    summary.totalExpenses > 0
      ? ((summary.totalAdminFee / summary.totalExpenses) * 100).toFixed(1)
      : "0.0"

  return (
    <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
      {/* 1. Total Catatan Pengeluaran */}
      <Card className="flex h-full flex-col justify-between border-border bg-card/60 shadow-xs backdrop-blur-xs transition-all hover:border-primary/50">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs font-medium text-muted-foreground">
            Total Catatan Pengeluaran
          </CardDescription>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {summary.totalCount.toLocaleString("id-ID")} Transaksi
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className="gap-1 border-primary/30 bg-primary/10 text-xs font-medium text-primary"
            >
              <RiFileListLine className="size-3" />
              Nota Beban
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 pt-2 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-primary">
            <span>Transaksi beban tercatat</span>
          </div>
          <div className="text-muted-foreground">
            Unit armada W 8187 UA & H 8133 OF
          </div>
        </CardFooter>
      </Card>

      {/* 2. Total Beban Operasional Keseluruhan */}
      <Card className="flex h-full flex-col justify-between border-border bg-card/60 shadow-xs backdrop-blur-xs transition-all hover:border-destructive/50">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs font-medium text-muted-foreground">
            Total Beban Operasional
          </CardDescription>
          <CardTitle className="text-2xl font-bold tracking-tight text-rose-600 tabular-nums dark:text-rose-400">
            {formatCurrency(summary.totalExpenses)}
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className="gap-1 border-rose-500/30 bg-rose-500/10 text-xs font-medium text-rose-600 dark:text-rose-400"
            >
              <RiMoneyDollarCircleLine className="size-3" />
              Total Beban
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 pt-2 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-rose-600 dark:text-rose-400">
            <span>Akumulasi nominal + admin bank</span>
          </div>
          <div className="text-muted-foreground">
            Komponen pengurang laba bagi hasil
          </div>
        </CardFooter>
      </Card>

      {/* 3. Biaya Pokok Belanja / Servis */}
      <Card className="flex h-full flex-col justify-between border-border bg-card/60 shadow-xs backdrop-blur-xs transition-all hover:border-amber-500/50">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs font-medium text-muted-foreground">
            Biaya Pokok Servis & Part
          </CardDescription>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {formatCurrency(summary.totalAmount)}
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className="gap-1 border-amber-500/30 bg-amber-500/10 text-xs font-medium text-amber-600 dark:text-amber-400"
            >
              <RiToolsLine className="size-3" />
              Servis & Part
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 pt-2 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
            <span>Beban belanja sebelum admin</span>
          </div>
          <div className="text-muted-foreground">
            Onderdil, servis bengkel, solar & lain-lain
          </div>
        </CardFooter>
      </Card>

      {/* 4. Total Biaya Admin Bank */}
      <Card className="flex h-full flex-col justify-between border-border bg-card/60 shadow-xs backdrop-blur-xs transition-all hover:border-blue-500/50">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs font-medium text-muted-foreground">
            Biaya Admin Transfer
          </CardDescription>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {formatCurrency(summary.totalAdminFee)}
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className="gap-1 border-blue-500/30 bg-blue-500/10 text-xs font-medium text-blue-600 dark:text-blue-400"
            >
              <RiBankCardLine className="size-3" />
              {adminFeePercentage}% rasio
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 pt-2 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400">
            <span>Akumulasi admin perbankan</span>
          </div>
          <div className="text-muted-foreground">
            Dicatat per transaksi transfer m-banking
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
