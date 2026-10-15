/* eslint-disable react-hooks/incompatible-library */
"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  RiAddLine,
  RiArrowDownSLine,
  RiCalendarLine,
  RiEditLine,
  RiInformationLine,
  RiReceiptLine,
} from "@remixicon/react"
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  cn,
  formatCurrency,
  formatCurrencyInput,
  parseCurrencyInput,
} from "@/lib/utils"
import { useUIStore } from "@/stores/theme"
import { createExpense, updateExpense } from "./expenses.actions"
import { createExpenseSchema, EXPENSE_CATEGORIES } from "./expenses.schema"

import type { Expense } from "@/db/schema"
import type { ExpenseCategory } from "./expenses.schema"

interface ExpenseFormDialogProps {
  expense?: Expense | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
}

type ExpenseFormValues = z.input<typeof createExpenseSchema>

export function ExpenseFormDialog({
  expense,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
}: ExpenseFormDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled
    ? (val: boolean) => controlledOnOpenChange?.(val)
    : setInternalOpen

  const { setModalSuccess } = useUIStore()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [datePickerOpen, setDatePickerOpen] = React.useState(false)
  const isEditMode = !!expense

  const todayStr = React.useMemo(
    () => new Date().toISOString().split("T")[0],
    []
  )

  // Ambil kuantitas langsung dari field quantity atau ekstrak jika data warisan (legacy)
  const defaultValues: ExpenseFormValues = React.useMemo(() => {
    if (expense) {
      let desc = expense.description || ""
      let qty = expense.quantity || ""
      if (!qty) {
        const match = desc.match(/\(([^)]+)\)$/)
        if (match && match[1]) {
          qty = match[1].trim()
          desc = desc.replace(/\s*\([^)]+\)$/, "").trim()
        }
      }

      return {
        truckId: expense.truckId as "W8187UA" | "H8133OF",
        expenseDate: expense.expenseDate,
        category: expense.category as ExpenseCategory,
        description: desc,
        quantity: qty,
        amount: String(expense.amount),
        adminFee: String(expense.adminFee ?? "0.00"),
        location: expense.location ?? "",
        repairNotes: expense.repairNotes ?? "",
      }
    }
    return {
      truckId: "W8187UA",
      expenseDate: todayStr,
      category: "Servis",
      description: "",
      quantity: "",
      amount: "",
      adminFee: "0.00",
      location: "",
      repairNotes: "",
    }
  }, [expense, todayStr])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormValues, unknown, ExpenseFormValues>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues,
  })

  // Sinkronisasi form values saat dialog terbuka atau target edit berubah
  React.useEffect(() => {
    if (open) {
      reset(defaultValues)
    }
  }, [open, defaultValues, reset])

  const watchedTruckId = watch("truckId")
  const watchedExpenseDate = watch("expenseDate")
  const watchedCategory = watch("category")
  const watchedAmount = watch("amount")
  const watchedAdminFee = watch("adminFee")

  const totalCalculated = React.useMemo(() => {
    const amt = parseFloat(watchedAmount ?? "") || 0
    const adm = parseFloat(watchedAdminFee ?? "") || 0
    return amt + adm
  }, [watchedAmount, watchedAdminFee])

  const parsedExpenseDate = React.useMemo(() => {
    if (!watchedExpenseDate) return undefined
    try {
      return parseISO(watchedExpenseDate)
    } catch {
      return undefined
    }
  }, [watchedExpenseDate])

  const displayExpenseDate = React.useMemo(() => {
    if (!parsedExpenseDate) return "Pilih tanggal pengeluaran"
    return format(parsedExpenseDate, "d MMMM yyyy", { locale: id })
  }, [parsedExpenseDate])

  async function onSubmit(data: ExpenseFormValues) {
    try {
      setIsSubmitting(true)

      const payload = {
        truckId: data.truckId,
        expenseDate: data.expenseDate,
        category: data.category,
        description: data.description.trim(),
        quantity: data.quantity?.trim() || null,
        amount: data.amount,
        adminFee: data.adminFee || "0.00",
        location: data.location || null,
        repairNotes: data.repairNotes || null,
      }

      if (isEditMode && expense) {
        const result = await updateExpense({
          id: expense.id,
          ...payload,
        })
        if (!result.success) {
          toast.error(result.error)
          return
        }
        toast.success("Catatan pengeluaran berhasil diperbarui!")
        setModalSuccess({
          open: true,
          title: "Pengeluaran Berhasil Diperbarui",
          message: `Catatan pengeluaran "${payload.description}" berhasil diperbarui.`,
          actionMessage: "Selesai",
        })
      } else {
        const result = await createExpense(payload)
        if (!result.success) {
          toast.error(result.error)
          return
        }
        toast.success("Pengeluaran baru berhasil dicatat!")
        const totalAmount =
          (parseFloat(payload.amount) || 0) +
          (parseFloat(payload.adminFee ?? "0") || 0)
        setModalSuccess({
          open: true,
          title: "Pengeluaran Berhasil Dicatat",
          message: `Catatan pengeluaran "${payload.description}" sebesar ${formatCurrency(totalAmount)} berhasil disimpan.`,
          actionMessage: "Selesai",
        })
      }

      setOpen(false)
      if (!isEditMode) {
        reset()
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Terjadi kesalahan sistem"
      )
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
              id="btn-add-expense"
              size="sm"
              className="h-9 w-full gap-1.5 px-4 font-medium shadow-xs sm:w-auto"
            >
              <RiAddLine className="size-4" />
              <span>Tambah Pengeluaran Armada</span>
            </Button>
          )}
        </div>
      )}

      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title={
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {isEditMode ? (
                <RiEditLine className="size-4" />
              ) : (
                <RiReceiptLine className="size-4" />
              )}
            </div>
            <span>
              {isEditMode
                ? "Ubah Catatan Pengeluaran"
                : "Tambah Pengeluaran Armada"}
            </span>
          </div>
        }
        description={
          isEditMode
            ? "Perbarui rincian beban operasional, nota servis bengkel, atau pembelian onderdil armada"
            : "Catat beban operasional, pembelian onderdil, BBM, servis bengkel, atau biaya perbankan armada"
        }
        className="sm:max-w-2xl lg:max-w-3xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Baris 1: Unit Armada (Full Width Standar /trips) */}
          <div className="space-y-1.5">
            <div className="flex h-5 items-center justify-between">
              <Label htmlFor="truckId" className="text-xs font-semibold">
                Unit Armada <span className="text-destructive">*</span>
              </Label>
            </div>
            <Select
              value={watchedTruckId || "W8187UA"}
              onValueChange={(val) => {
                setValue("truckId", val as "W8187UA" | "H8133OF", {
                  shouldValidate: true,
                })
              }}
            >
              <SelectTrigger
                id="truckId"
                className="h-9! w-full text-xs font-medium"
              >
                <SelectValue placeholder="Pilih unit armada">
                  {watchedTruckId === "W8187UA"
                    ? "Triyono - W 8187 UA"
                    : watchedTruckId === "H8133OF"
                      ? "Khoirul - H 8133 OF"
                      : "Pilih unit armada"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="W8187UA" className="text-xs font-medium">
                  Triyono - W 8187 UA
                </SelectItem>
                <SelectItem value="H8133OF" className="text-xs font-medium">
                  Khoirul - H 8133 OF
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.truckId && (
              <p className="text-[11px] text-destructive">
                {errors.truckId.message}
              </p>
            )}
          </div>

          {/* Baris 2: Tanggal Pengeluaran & Kategori Beban (2 Kolom Standar) */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <div className="flex h-5 items-center justify-between">
                <Label htmlFor="expenseDate" className="text-xs font-semibold">
                  Tanggal Pengeluaran{" "}
                  <span className="text-destructive">*</span>
                </Label>
              </div>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      id="expenseDate"
                      type="button"
                      variant="outline"
                      className={cn(
                        "h-9! w-full justify-between text-left text-xs font-normal",
                        !watchedExpenseDate && "text-muted-foreground"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <RiCalendarLine className="size-3.5 text-muted-foreground" />
                        {displayExpenseDate}
                      </span>
                      <RiArrowDownSLine className="size-3.5 text-muted-foreground" />
                    </Button>
                  }
                />
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={parsedExpenseDate}
                    onSelect={(d) => {
                      setValue(
                        "expenseDate",
                        d ? format(d, "yyyy-MM-dd") : "",
                        {
                          shouldValidate: true,
                        }
                      )
                      setDatePickerOpen(false)
                    }}
                    locale={id}
                  />
                </PopoverContent>
              </Popover>
              {errors.expenseDate && (
                <p className="text-[11px] text-destructive">
                  {errors.expenseDate.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex h-5 items-center justify-between">
                <Label htmlFor="category" className="text-xs font-semibold">
                  Kategori Beban <span className="text-destructive">*</span>
                </Label>
              </div>
              <Select
                value={watchedCategory}
                onValueChange={(val) => {
                  if (
                    val &&
                    EXPENSE_CATEGORIES.includes(val as ExpenseCategory)
                  ) {
                    setValue("category", val as ExpenseCategory, {
                      shouldValidate: true,
                    })
                  }
                }}
              >
                <SelectTrigger
                  id="category"
                  className="h-9! w-full text-xs font-medium"
                >
                  <SelectValue placeholder="Pilih kategori beban" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem
                      key={cat}
                      value={cat}
                      className="text-xs font-medium"
                    >
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-[11px] text-destructive">
                  {errors.category.message}
                </p>
              )}
            </div>
          </div>

          {/* Baris 3: Nama Pengeluaran / Barang & Satuan / Jumlah (2 Kolom Proporsional) */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex h-5 items-center justify-between">
                <Label htmlFor="description" className="text-xs font-semibold">
                  Nama Pengeluaran / Barang{" "}
                  <span className="text-destructive">*</span>
                </Label>
              </div>
              <Input
                id="description"
                placeholder="mis. Selang Gajah, Ban Duraturn, Servis Valve"
                className="h-9! text-xs font-medium"
                {...register("description")}
              />
              {errors.description && (
                <p className="text-[11px] text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:col-span-1">
              <div className="flex h-5 items-center justify-between">
                <Label htmlFor="quantity" className="text-xs font-semibold">
                  Satuan / Jumlah
                </Label>
              </div>
              <Input
                id="quantity"
                placeholder="mis. 5 meter, 2 set"
                className="h-9! text-xs font-medium"
                {...register("quantity")}
              />
            </div>
          </div>

          {/* Baris 4: Nominal Belanja & Admin Transfer Bank (2 Kolom Standar) */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <div className="flex h-5 items-center justify-between">
                <Label htmlFor="amount" className="text-xs font-semibold">
                  Nominal Belanja (Rp){" "}
                  <span className="text-destructive">*</span>
                </Label>
              </div>
              <Input
                id="amount"
                type="text"
                inputMode="decimal"
                value={formatCurrencyInput(watchedAmount || "")}
                onChange={(e) => {
                  const raw = parseCurrencyInput(e.target.value)
                  setValue("amount", raw, { shouldValidate: true })
                }}
                placeholder="mis. 400.000"
                className="h-9! font-mono text-xs font-medium tabular-nums"
              />
              {errors.amount && (
                <p className="text-[11px] text-destructive">
                  {errors.amount.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex h-5 items-center justify-between">
                <Label htmlFor="adminFee" className="text-xs font-semibold">
                  Admin Transfer Bank (Rp)
                </Label>
              </div>
              <Input
                id="adminFee"
                type="text"
                inputMode="decimal"
                value={formatCurrencyInput(watchedAdminFee || "")}
                onChange={(e) => {
                  const raw = parseCurrencyInput(e.target.value)
                  setValue("adminFee", raw, { shouldValidate: true })
                }}
                placeholder="mis. 2.500"
                className="h-9! font-mono text-xs font-medium tabular-nums"
              />
              {errors.adminFee && (
                <p className="text-[11px] text-destructive">
                  {errors.adminFee.message}
                </p>
              )}
            </div>
          </div>

          {/* Ringkasan Total Beban Real-time */}
          <div className="rounded-xl border border-primary/25 bg-primary/5 p-3.5 backdrop-blur-xs dark:bg-primary/10">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <RiInformationLine className="size-4 text-primary" />
                Total Beban Tercatat:
              </span>
              <span className="font-mono text-base font-bold text-rose-600 tabular-nums dark:text-rose-400">
                {formatCurrency(totalCalculated)}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Nominal pokok belanja ditambah biaya transfer perbankan
            </p>
          </div>

          {/* Baris 5: Keterangan / Lokasi / Toko & Catatan Perbaikan / Rincian Nota (2 Kolom Seimbang) */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <div className="flex h-5 items-center justify-between">
                <Label htmlFor="location" className="text-xs font-semibold">
                  Keterangan / Lokasi / Toko (Opsional)
                </Label>
              </div>
              <Input
                id="location"
                placeholder="mis. Tuban, Shopee, Pak Yanto Pereng, RTGS"
                className="h-9! text-xs font-medium"
                {...register("location")}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex h-5 items-center justify-between">
                <Label htmlFor="repairNotes" className="text-xs font-semibold">
                  Catatan Perbaikan / Rincian Nota (Opsional)
                </Label>
              </div>
              <Input
                id="repairNotes"
                placeholder="mis. Nota #0482, garansi 6 bulan, part mekanik"
                className="h-9! text-xs font-medium"
                {...register("repairNotes")}
              />
            </div>
          </div>

          {/* Footer: Tombol Batal & Simpan Standar /trips & /rates (50/50 size="lg") */}
          <div className="flex items-center justify-end gap-2 border-t px-2 pt-3">
            <Button
              type="button"
              variant="outline"
              className="w-1/2"
              size="lg"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="w-1/2"
              size="lg"
              loading={isSubmitting}
              loadingText="Menyimpan"
            >
              {isEditMode ? "Simpan Perubahan" : "Simpan Pengeluaran"}
            </Button>
          </div>
        </form>
      </ResponsiveDialog>
    </>
  )
}
