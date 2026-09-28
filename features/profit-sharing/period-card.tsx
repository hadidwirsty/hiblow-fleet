"use client"

import * as React from "react"
import {
  RiCalendarLine,
  RiDeleteBinLine,
  RiFileTextLine,
  RiHandCoinLine,
  RiLockLine,
  RiLockUnlockLine,
  RiUserLine,
} from "@remixicon/react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { useUIStore } from "@/stores/theme"
import { formatCurrency, formatDateIndonesian } from "@/lib/utils"

import { PeriodDetailSheet } from "./period-detail-sheet"
import { deleteProfitSharingPeriod } from "./profit-sharing.actions"
import type { ProfitSharingPeriodDetail } from "./profit-sharing.queries"

interface PeriodCardProps {
  period: ProfitSharingPeriodDetail
  readOnly?: boolean
  myPayoutAmount?: number
}

export function PeriodCard({
  period,
  readOnly = false,
  myPayoutAmount,
}: PeriodCardProps) {
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
  const { setModalDelete, setModalSuccess } = useUIStore()

  const isFinalized = period.status === "finalized"
  const grossBalance = parseFloat(period.grossBalance)
  const distributableProfit = parseFloat(period.distributableProfit)
  const managerTakeHome = parseFloat(period.managerTakeHome)

  const promptDeletePeriod = () => {
    setModalDelete({
      open: true,
      title: "Hapus Periode Bagi Hasil",
      message: `Periode "${period.title}" beserta seluruh rincian dividen pemodal di dalamnya akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.`,
      action: async () => {
        try {
          const res = await deleteProfitSharingPeriod(period.id)
          if (res.success) {
            setModalSuccess({
              open: true,
              title: "Periode Berhasil Dihapus",
              message: `Periode "${period.title}" telah dihapus dari sistem.`,
              actionMessage: "Tutup",
            })
          } else {
            toast.error(res.error || "Gagal menghapus periode")
          }
        } catch {
          toast.error("Terjadi kesalahan saat menghapus periode")
        }
      },
    })
  }

  return (
    <>
      <Card className="flex flex-col justify-between transition-all hover:border-primary/40 hover:shadow-md">
        <CardHeader className="p-4 pb-2 sm:p-5 sm:pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h3 className="line-clamp-1 text-sm font-bold tracking-tight text-foreground sm:text-base">
                {period.title}
              </h3>
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground sm:text-xs">
                <RiCalendarLine className="size-3.5" />
                {formatDateIndonesian(period.startDate, true)} –{" "}
                {formatDateIndonesian(period.endDate, true)}
              </p>
            </div>
            <Badge
              variant={isFinalized ? "default" : "outline"}
              className={`shrink-0 text-[10px] sm:text-[11px] ${
                isFinalized
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "text-muted-foreground"
              }`}
            >
              {isFinalized ? (
                <span className="flex items-center gap-1">
                  <RiLockLine className="size-3" />
                  Finalized
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <RiLockUnlockLine className="size-3" />
                  Draft
                </span>
              )}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 p-4 pt-1 pb-3 sm:p-5 sm:pt-2 sm:pb-3">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/40 p-2.5 sm:gap-2.5 sm:p-3">
            <div>
              <span className="block text-[10px] text-muted-foreground sm:text-[11px]">
                Laba Kotor (Gross)
              </span>
              <span
                className={`text-xs font-bold ${
                  grossBalance >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {formatCurrency(grossBalance)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-muted-foreground sm:text-[11px]">
                Laba Dibagi
              </span>
              <span className="text-xs font-bold text-primary">
                {formatCurrency(distributableProfit)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-muted-foreground sm:text-[11px]">
                Take Home Pengelola
              </span>
              <span className="text-xs font-bold text-foreground">
                {formatCurrency(managerTakeHome)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-muted-foreground sm:text-[11px]">
                Jumlah Investor
              </span>
              <span className="flex items-center gap-1 text-xs font-bold text-foreground">
                <RiUserLine className="size-3 text-muted-foreground" />
                {period.shares.length} Orang
              </span>
            </div>
          </div>

          {/* Sorotan Hak Dividen Personal Investor */}
          {myPayoutAmount !== undefined && myPayoutAmount > 0 && (
            <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
              <div className="flex items-center gap-1.5">
                <RiHandCoinLine className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  Hak Anda
                </span>
              </div>
              <span className="text-sm font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
                {formatCurrency(myPayoutAmount)}
              </span>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between gap-2 border-t p-4 pt-3 sm:p-5 sm:pt-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 text-xs"
            onClick={() => setIsDetailOpen(true)}
          >
            <RiFileTextLine className="size-3.5" />
            Rincian & Cetak
          </Button>
          {!readOnly && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={promptDeletePeriod}
              title="Hapus periode"
            >
              <RiDeleteBinLine className="size-4" />
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Detail & Print Sheet */}
      <PeriodDetailSheet
        period={period}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </>
  )
}
