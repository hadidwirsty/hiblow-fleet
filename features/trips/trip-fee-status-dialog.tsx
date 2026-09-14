"use client"

import * as React from "react"
import { RiCheckLine, RiHandCoinLine, RiLoaderLine } from "@remixicon/react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateTripFeeStatus } from "@/features/trips/trips.actions"
import { formatCurrency, formatDateIndonesian } from "@/lib/utils"
import type { TripRecord } from "@/features/trips/trips-table"

interface TripFeeStatusDialogProps {
  trip: TripRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface FeeStatusFormContentProps {
  trip: TripRecord
  onClose: () => void
}

function FeeStatusFormContent({ trip, onClose }: FeeStatusFormContentProps) {
  const [thirdPartyStatus, setThirdPartyStatus] = React.useState(
    trip.thirdPartyStatus ?? ""
  )
  const [incentiveStatus, setIncentiveStatus] = React.useState(
    trip.incentiveStatus ?? ""
  )
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const feeAmount = parseFloat(trip.thirdPartyFee || "0")
  const hasThirdPartyFee = feeAmount > 0 || Boolean(trip.thirdPartyName)

  const handleMarkPaidToday = () => {
    const today = new Date().toISOString().split("T")[0]
    const formattedDate = formatDateIndonesian(today)
    setThirdPartyStatus(`Sudah dibayar ${formattedDate}`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await updateTripFeeStatus({
        tripId: trip.id,
        thirdPartyStatus: thirdPartyStatus.trim() || null,
        incentiveStatus: incentiveStatus.trim() || null,
      })

      if (res.success) {
        toast.success("Status pembayaran DO berhasil diperbarui!")
        onClose()
      } else {
        toast.error(res.error || "Gagal memperbarui status pembayaran")
      }
    } catch {
      toast.error("Terjadi kendala jaringan saat memperbarui status")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Info Card Ringkasan Fee */}
      <div className="space-y-2 rounded-lg border bg-muted/40 p-3 text-xs">
        <div className="flex justify-between text-muted-foreground">
          <span>Pabrik Tujuan:</span>
          <span className="font-medium text-foreground">
            {trip.destinationName}
          </span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Nama Pihak Ketiga:</span>
          <span className="font-medium text-foreground">
            {trip.thirdPartyName || "Tidak ada nama"}
          </span>
        </div>
        <div className="flex justify-between border-t border-border pt-2">
          <span className="font-semibold text-foreground">
            Kewajiban Fee DO:
          </span>
          <span className="font-mono font-bold text-primary">
            {formatCurrency(feeAmount)}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Third Party Status Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">
              Status Pembayaran Fee DO
            </Label>
            {hasThirdPartyFee && (
              <button
                type="button"
                onClick={handleMarkPaidToday}
                className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
              >
                <RiCheckLine className="size-3" />
                <span>Tandai Lunas Hari Ini</span>
              </button>
            )}
          </div>
          <Input
            type="text"
            value={thirdPartyStatus}
            onChange={(e) => setThirdPartyStatus(e.target.value)}
            placeholder="Contoh: Sudah dibayar 25 Jun 25 5rit / Lunas"
            className="h-8 text-xs font-medium"
          />
          {/* Quick Suggestions */}
          <div className="flex flex-wrap gap-1 pt-0.5">
            <button
              type="button"
              onClick={() => setThirdPartyStatus("Lunas")}
              className="rounded-md border bg-card px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted"
            >
              Lunas
            </button>
            <button
              type="button"
              onClick={() => setThirdPartyStatus("Belum Dibayar")}
              className="rounded-md border bg-card px-2 py-0.5 text-[10px] text-amber-600 hover:bg-muted dark:text-amber-400"
            >
              Belum Dibayar
            </button>
            <button
              type="button"
              onClick={() => setThirdPartyStatus("")}
              className="rounded-md border bg-card px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted"
            >
              Kosongkan
            </button>
          </div>
        </div>

        {/* Incentive Status Field */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">
            Status Insentif Supir (Rp 35.000)
          </Label>
          <Input
            type="text"
            value={incentiveStatus}
            onChange={(e) => setIncentiveStatus(e.target.value)}
            placeholder="Belum Dibayar / Lunas"
            className="h-8 text-xs"
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting}
            className="gap-1.5"
          >
            {isSubmitting ? (
              <>
                <RiLoaderLine className="size-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <span>Simpan Status</span>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

export function TripFeeStatusDialog({
  trip,
  open,
  onOpenChange,
}: TripFeeStatusDialogProps) {
  if (!trip) return null

  const title = (
    <span className="flex items-center gap-2">
      <RiHandCoinLine className="size-5 text-primary" />
      <span>Update Status Fee DO Pihak Ketiga</span>
    </span>
  )

  const description = `Surat Jalan Order #${trip.orderNumber} (${
    trip.truckId === "W8187UA" ? "W 8187 UA" : "H 8133 OF"
  }) — ${trip.destinationCity}`

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      className="max-w-md"
    >
      <FeeStatusFormContent
        key={trip.id}
        trip={trip}
        onClose={() => onOpenChange(false)}
      />
    </ResponsiveDialog>
  )
}
