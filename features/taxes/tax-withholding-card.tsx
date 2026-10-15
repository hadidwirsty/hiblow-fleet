import * as React from "react"
import { RiFileList3Line, RiShieldCheckLine } from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

export interface WithholdingNotes {
  totalAmountFormatted: string
  tripCountText: string
  eligibleSchemesText: string
}

export function formatWithholdingNotes(
  amount: number,
  totalTrips: number
): WithholdingNotes {
  return {
    totalAmountFormatted: formatCurrency(amount),
    tripCountText: `${totalTrips} ritase`,
    eligibleSchemesText:
      "Dapat dikreditkan (mengurangi setoran) pada Skema Norma (29%) dan Pembukuan Riil (11%).",
  }
}

interface TaxWithholdingCardProps {
  tax1PctWithholding: number
  totalTrips: number
}

export function TaxWithholdingCard({
  tax1PctWithholding,
  totalTrips,
}: TaxWithholdingCardProps) {
  const notes = formatWithholdingNotes(tax1PctWithholding, totalTrips)

  return (
    <Card className="rounded-2xl border border-border/80 bg-card/75 shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <RiFileList3Line className="size-4" />
            </div>
            <CardTitle className="text-base font-semibold">
              Kredit Pajak PPh 1% Terpotong Pabrik
            </CardTitle>
          </div>
          <Badge
            variant="outline"
            className="w-fit border-emerald-500/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            <RiShieldCheckLine className="mr-1 size-3.5" />
            Bukti Potong Sah
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Akumulasi potongan PPh 1% langsung dari faktur tagihan pabrik semen
          non-Grobogan (SI Tuban, SI Rembang, SBI Tuban).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 text-sm">
        <div className="flex flex-col justify-between gap-2.5 rounded-xl border border-border/60 bg-background/50 p-3.5 sm:flex-row sm:items-center">
          <div>
            <div className="text-xs text-muted-foreground">
              Total Kredit Pajak Terakumulasi
            </div>
            <div className="text-xl font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
              {notes.totalAmountFormatted}
            </div>
          </div>
          <div className="text-xs text-muted-foreground sm:text-right">
            <div>Terpotong dari {notes.tripCountText}</div>
            <div className="mt-0.5 text-foreground/80">
              {notes.eligibleSchemesText}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
