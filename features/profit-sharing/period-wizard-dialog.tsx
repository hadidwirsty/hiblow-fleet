"use client"

import * as React from "react"
import {
  RiAddLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiCalendarLine,
  RiCheckLine,
  RiDeleteBinLine,
  RiHandCoinLine,
  RiInformationLine,
  RiLoaderLine,
  RiMoneyDollarCircleLine,
  RiUserAddLine,
} from "@remixicon/react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { calculateProfitSharing } from "@/domain/calculators/profit-sharing"
import type { PartnerInput as DomainPartnerInput } from "@/domain/calculators/profit-sharing"
import { formatCurrency } from "@/lib/utils"

import {
  createProfitSharingPeriod,
  previewPeriodCalculation,
} from "./profit-sharing.actions"
import {
  DEFAULT_FLEET_VALUATION,
  DEFAULT_MANAGER_COMMISSION_RATE,
  DEFAULT_PARTNERS,
} from "./profit-sharing.schema"

interface PeriodWizardDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
}

interface EditablePartner {
  name: string
  capitalShare: number
  partnerUserId?: string | null
}

function getMonthPreset(monthOffset: 0 | -1) {
  const now = new Date()
  const target = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  const year = target.getFullYear()
  const month = target.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const pad = (n: number) => String(n).padStart(2, "0")
  const startStr = `${year}-${pad(month + 1)}-${pad(firstDay.getDate())}`
  const endStr = `${year}-${pad(month + 1)}-${pad(lastDay.getDate())}`

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ]

  return {
    startDate: startStr,
    endDate: endStr,
    title: `Bagi Hasil ${monthNames[month]} ${year}`,
  }
}

export function PeriodWizardDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
}: PeriodWizardDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled
    ? (val: boolean) => controlledOnOpenChange?.(val)
    : setInternalOpen

  const [step, setStep] = React.useState<1 | 2>(1)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Step 1 states (initialized to previous month preset)
  const initialPreset = React.useMemo(() => getMonthPreset(-1), [])
  const [title, setTitle] = React.useState(initialPreset.title)
  const [startDate, setStartDate] = React.useState(initialPreset.startDate)
  const [endDate, setEndDate] = React.useState(initialPreset.endDate)
  const [commissionRate, setCommissionRate] = React.useState(
    DEFAULT_MANAGER_COMMISSION_RATE * 100
  )
  const [fleetValuation, setFleetValuation] = React.useState(
    DEFAULT_FLEET_VALUATION
  )

  // Live pulled figures from DB
  const [totalIncome, setTotalIncome] = React.useState<number>(0)
  const [totalExpenses, setTotalExpenses] = React.useState<number>(0)

  // Step 2 states: Partners list
  const [partners, setPartners] = React.useState<EditablePartner[]>(() =>
    DEFAULT_PARTNERS.map((p) => ({ ...p, partnerUserId: null }))
  )

  // Quick preset dates handler
  const setMonthPreset = React.useCallback((monthOffset: 0 | -1) => {
    const preset = getMonthPreset(monthOffset)
    setStartDate(preset.startDate)
    setEndDate(preset.endDate)
    setTitle(preset.title)
  }, [])

  // Recalculate preview on the fly whenever partners or rates change
  const liveCalculation = React.useMemo(() => {
    const validPartners: DomainPartnerInput[] = partners
      .filter((p) => p.name.trim() !== "" && p.capitalShare > 0)
      .map((p) => ({
        name: p.name.trim(),
        capitalShare: p.capitalShare,
        partnerUserId: p.partnerUserId ?? undefined,
      }))

    return calculateProfitSharing({
      totalIncome,
      totalExpenses,
      managerCommissionRate: commissionRate / 100,
      fleetValuation,
      partners: validPartners,
    })
  }, [totalIncome, totalExpenses, commissionRate, fleetValuation, partners])

  // Move from Step 1 to Step 2
  const handleProceedToStep2 = async () => {
    if (!title.trim()) {
      toast.error("Judul periode wajib diisi")
      return
    }
    if (!startDate || !endDate) {
      toast.error("Tanggal mulai dan selesai wajib ditentukan")
      return
    }
    if (startDate > endDate) {
      toast.error("Tanggal mulai tidak boleh melebihi tanggal selesai")
      return
    }

    setIsLoading(true)
    try {
      const res = await previewPeriodCalculation({
        startDate,
        endDate,
        managerCommissionRate: commissionRate / 100,
        fleetValuation,
        partners: partners.map((p) => ({
          name: p.name,
          capitalShare: p.capitalShare,
          partnerUserId: p.partnerUserId ?? undefined,
        })),
      })

      if (!res.success) {
        toast.error(res.error)
        return
      }

      setTotalIncome(res.totalIncome)
      setTotalExpenses(res.totalExpenses)
      setStep(2)
    } catch {
      toast.error("Gagal menarik data transaksi dari database")
    } finally {
      setIsLoading(false)
    }
  }

  // Add partner handler
  const handleAddPartner = () => {
    setPartners((prev) => [
      ...prev,
      { name: `Pemodal ${prev.length + 1}`, capitalShare: 10000000 },
    ])
  }

  // Remove partner handler
  const handleRemovePartner = (index: number) => {
    if (partners.length <= 1) {
      toast.warning("Minimal harus ada satu pemodal terdaftar")
      return
    }
    setPartners((prev) => prev.filter((_, idx) => idx !== index))
  }

  // Update partner field
  const handleUpdatePartner = (
    index: number,
    field: "name" | "capitalShare",
    value: string | number
  ) => {
    setPartners((prev) => {
      const updated = [...prev]
      if (field === "name") {
        updated[index] = { ...updated[index], name: String(value) }
      } else {
        const num = typeof value === "number" ? value : parseFloat(value) || 0
        updated[index] = { ...updated[index], capitalShare: Math.max(0, num) }
      }
      return updated
    })
  }

  // Submit and save period
  const handleSavePeriod = async () => {
    const validPartners = partners.filter(
      (p) => p.name.trim() !== "" && p.capitalShare > 0
    )
    if (validPartners.length === 0) {
      toast.error("Minimal sertakan 1 pemodal dengan modal lebih dari 0")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await createProfitSharingPeriod({
        title,
        startDate,
        endDate,
        managerCommissionRate: commissionRate / 100,
        fleetValuation,
        partners: validPartners,
      })

      if (!res.success) {
        toast.error(res.error)
        return
      }

      toast.success("Periode bagi hasil berhasil disimpan!")
      setOpen(false)
      setStep(1)
    } catch {
      toast.error("Terjadi kesalahan saat menyimpan periode")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {!isControlled && (
        <div onClick={() => setOpen(true)} className="w-full sm:w-auto">
          {trigger ?? (
            <Button
              id="btn-open-profit-sharing-wizard"
              size="sm"
              className="h-9 w-full gap-1.5 px-4 font-medium shadow-sm sm:w-auto"
            >
              <RiAddLine className="size-4" />
              <span>Tutup Buku Baru</span>
            </Button>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto p-0">
          {/* Header with Step Tracker */}
          <div className="border-b bg-muted/40 p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="space-y-1">
                <DialogTitle className="flex items-center gap-2 text-lg font-bold sm:text-xl">
                  <RiHandCoinLine className="size-5 text-primary" />
                  {step === 1
                    ? "Pilih Periode Tutup Buku"
                    : "Konfigurasi Pemodal & Laba"}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {step === 1
                    ? "Tentukan rentang tanggal cut-off ritase dan biaya operasional armada"
                    : "Sesuaikan daftar investor, modal disetor, dan periksa alokasi laba bersih"}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-1.5 self-start rounded-full border bg-background/80 px-2.5 py-1 text-[11px] font-semibold sm:self-auto sm:px-3 sm:text-xs">
                <span
                  className={
                    step === 1
                      ? "font-bold text-primary"
                      : "text-muted-foreground"
                  }
                >
                  1. Periode
                </span>
                <span className="text-muted-foreground">→</span>
                <span
                  className={
                    step === 2
                      ? "font-bold text-primary"
                      : "text-muted-foreground"
                  }
                >
                  2. Pemodal & Hasil
                </span>
              </div>
            </div>
          </div>

          {/* Form Body */}
          <div className="space-y-5 p-4 sm:space-y-6 sm:p-6">
            {step === 1 && (
              <div className="animate-in space-y-5 fade-in-50">
                {/* Presets */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Preset cepat:</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setMonthPreset(-1)}
                  >
                    Bulan Lalu
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setMonthPreset(0)}
                  >
                    Bulan Ini
                  </Button>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="period-title">Nama / Judul Periode</Label>
                  <Input
                    id="period-title"
                    placeholder="Contoh: Bagi Hasil September 2025"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                {/* Date Ranges */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label
                      htmlFor="start-date"
                      className="flex items-center gap-1"
                    >
                      <RiCalendarLine className="size-3.5 text-muted-foreground" />
                      Tanggal Mulai Bongkar
                    </Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="end-date"
                      className="flex items-center gap-1"
                    >
                      <RiCalendarLine className="size-3.5 text-muted-foreground" />
                      Tanggal Selesai Bongkar
                    </Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Configuration rates */}
                <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
                  <h4 className="flex items-center gap-1.5 text-sm font-semibold tracking-tight text-foreground">
                    <RiMoneyDollarCircleLine className="size-4 text-primary" />
                    Parameter Valuasi & Komisi Pengelola
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="commission-rate" className="text-xs">
                        Komisi Pengelola (%)
                      </Label>
                      <Input
                        id="commission-rate"
                        type="number"
                        step="0.5"
                        min="0"
                        max="100"
                        value={commissionRate}
                        onChange={(e) =>
                          setCommissionRate(parseFloat(e.target.value) || 0)
                        }
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Standar Excel HW Trans: 5% dari Laba Kotor.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="fleet-valuation" className="text-xs">
                        Valuasi Total Armada (Rp)
                      </Label>
                      <Input
                        id="fleet-valuation"
                        type="number"
                        step="1000000"
                        min="1"
                        value={fleetValuation}
                        onChange={(e) =>
                          setFleetValuation(parseFloat(e.target.value) || 0)
                        }
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Acuan proporsi saham: {formatCurrency(fleetValuation)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Helpful Notes */}
                <div className="flex items-start gap-2.5 rounded-md border border-blue-200/60 bg-blue-50/50 p-3 text-xs text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300">
                  <RiInformationLine className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400" />
                  <p>
                    Sistem akan menarik seluruh <strong>omset ritase</strong>{" "}
                    berdasarkan <strong>tanggal bongkar</strong> di rentang
                    tersebut, serta menjumlahkan{" "}
                    <strong>pengeluaran riil</strong> dengan mengecualikan
                    kategori <em>DP/Cicilan</em>.
                  </p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-in space-y-6 fade-in-50">
                {/* Financial Pull Summary Banner */}
                <div className="grid grid-cols-2 gap-3 rounded-xl border bg-muted/40 p-3.5 sm:grid-cols-4">
                  <div>
                    <span className="block text-[11px] font-medium text-muted-foreground">
                      Total Omset Ritase
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {formatCurrency(totalIncome)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-medium text-muted-foreground">
                      Total Biaya Operasional
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {formatCurrency(totalExpenses)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-medium text-muted-foreground">
                      Laba Kotor (Gross)
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        liveCalculation.grossBalance >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {formatCurrency(liveCalculation.grossBalance)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-medium text-muted-foreground">
                      Laba Siap Dibagi
                    </span>
                    <span className="text-sm font-bold text-primary">
                      {formatCurrency(liveCalculation.distributableProfit)}
                    </span>
                  </div>
                </div>

                {/* Partners Configuration Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold tracking-tight">
                        Daftar Investor & Porsi Modal
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Nilai modal fleksibel dan dapat diedit atau ditambah
                        sewaktu-waktu
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 text-xs"
                      onClick={handleAddPartner}
                    >
                      <RiUserAddLine className="size-3.5" />
                      Tambah Investor
                    </Button>
                  </div>

                  <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-xs">
                      <thead className="border-b bg-muted/60">
                        <tr>
                          <th className="px-3 py-2.5 text-left font-medium">
                            Nama Investor
                          </th>
                          <th className="px-3 py-2.5 text-right font-medium">
                            Modal Disetor (Rp)
                          </th>
                          <th className="px-3 py-2.5 text-right font-medium">
                            % Saham
                          </th>
                          <th className="px-3 py-2.5 text-right font-medium">
                            Hak Dividen (Rp)
                          </th>
                          <th className="w-10 px-2 py-2.5 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {partners.map((partner, idx) => {
                          const calculatedShare =
                            liveCalculation.partnerShares[idx]
                          return (
                            <tr key={idx} className="hover:bg-muted/30">
                              <td className="px-3 py-2">
                                <Input
                                  value={partner.name}
                                  onChange={(e) =>
                                    handleUpdatePartner(
                                      idx,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                  className="h-8 text-xs font-medium"
                                  placeholder="Nama investor"
                                />
                              </td>
                              <td className="px-3 py-2 text-right">
                                <Input
                                  type="number"
                                  step="1000000"
                                  value={partner.capitalShare}
                                  onChange={(e) =>
                                    handleUpdatePartner(
                                      idx,
                                      "capitalShare",
                                      e.target.value
                                    )
                                  }
                                  className="h-8 text-right font-mono text-xs"
                                />
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                                {calculatedShare
                                  ? (
                                      calculatedShare.sharePercentage * 100
                                    ).toFixed(4)
                                  : (
                                      (partner.capitalShare / fleetValuation) *
                                      100
                                    ).toFixed(4)}
                                %
                              </td>
                              <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(
                                  calculatedShare?.payoutAmount ?? 0
                                )}
                              </td>
                              <td className="px-2 py-2 text-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 text-muted-foreground hover:text-destructive"
                                  onClick={() => handleRemovePartner(idx)}
                                >
                                  <RiDeleteBinLine className="size-3.5" />
                                </Button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot className="border-t bg-muted/40 font-semibold">
                        <tr>
                          <td className="px-3 py-2.5">Total Pemodal</td>
                          <td className="px-3 py-2.5 text-right font-mono">
                            {formatCurrency(
                              partners.reduce(
                                (sum, p) => sum + p.capitalShare,
                                0
                              )
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono">
                            {(
                              (partners.reduce(
                                (sum, p) => sum + p.capitalShare,
                                0
                              ) /
                                fleetValuation) *
                              100
                            ).toFixed(2)}
                            %
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(
                              liveCalculation.totalPartnerPayouts
                            )}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Manager Profit Allocation Summary */}
                <div className="space-y-2.5 rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-tight text-foreground">
                      Alokasi Hak Pengelola (Mas Hafidz)
                    </span>
                    <Badge
                      variant="outline"
                      className="border-primary/30 text-[10px] font-medium"
                    >
                      Komisi + Sisa Saham Armada
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 gap-3 pt-1 text-xs sm:grid-cols-3">
                    <div className="rounded-lg border bg-background/80 p-2.5">
                      <span className="block text-[11px] text-muted-foreground">
                        Komisi Manajemen ({commissionRate}%):
                      </span>
                      <span className="font-bold text-foreground">
                        {formatCurrency(
                          liveCalculation.managerCommissionAmount
                        )}
                      </span>
                    </div>
                    <div className="rounded-lg border bg-background/80 p-2.5">
                      <span className="block text-[11px] text-muted-foreground">
                        Sisa Laba Saham Sendiri:
                      </span>
                      <span className="font-bold text-foreground">
                        {formatCurrency(liveCalculation.managerProfit)}
                      </span>
                    </div>
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5">
                      <span className="block text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                        Total Take Home Pengelola:
                      </span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(liveCalculation.managerTakeHome)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dialog Actions Footer */}
          <DialogFooter className="flex items-center justify-between border-t bg-muted/20 px-6 py-4 sm:justify-between">
            {step === 1 ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  className="gap-1.5"
                  onClick={handleProceedToStep2}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <RiLoaderLine className="size-4 animate-spin" />
                      Menarik Data...
                    </>
                  ) : (
                    <>
                      Lanjut ke Pemodal
                      <RiArrowRightLine className="size-4" />
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => setStep(1)}
                  disabled={isSubmitting}
                >
                  <RiArrowLeftLine className="size-4" />
                  Kembali ke Step 1
                </Button>
                <Button
                  type="button"
                  className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={handleSavePeriod}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <RiLoaderLine className="size-4 animate-spin" />
                      Menyimpan Tutup Buku...
                    </>
                  ) : (
                    <>
                      <RiCheckLine className="size-4" />
                      Simpan & Tutup Buku
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
