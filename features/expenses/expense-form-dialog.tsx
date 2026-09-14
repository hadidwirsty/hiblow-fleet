/* eslint-disable react-hooks/incompatible-library */
"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  RiAddLine,
  RiEditLine,
  RiInformationLine,
  RiLoaderLine,
  RiReceiptLine,
} from "@remixicon/react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createExpense, updateExpense } from "./expenses.actions"
import { createExpenseSchema, EXPENSE_CATEGORIES } from "./expenses.schema"

import type { Expense } from "@/db/schema"
import type { ExpenseCategory } from "./expenses.schema"
import type { z } from "zod"

interface ExpenseFormDialogProps {
  expense?: Expense | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
}

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

  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const isEditMode = !!expense

  const todayStr = React.useMemo(
    () => new Date().toISOString().split("T")[0],
    []
  )

  const defaultValues: z.input<typeof createExpenseSchema> =
    React.useMemo(() => {
      if (expense) {
        return {
          truckId: expense.truckId as "W8187UA" | "H8133OF",
          expenseDate: expense.expenseDate,
          category: expense.category as ExpenseCategory,
          description: expense.description,
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
  } = useForm<
    z.input<typeof createExpenseSchema>,
    unknown,
    z.output<typeof createExpenseSchema>
  >({
    resolver: zodResolver(createExpenseSchema),
    defaultValues,
  })

  // Synchronize form values when editing expense changes
  React.useEffect(() => {
    if (open) {
      reset(defaultValues)
    }
  }, [open, defaultValues, reset])

  const selectedTruckId = watch("truckId")
  const selectedCategory = watch("category")
  const amountVal = watch("amount")
  const adminFeeVal = watch("adminFee")

  const totalCalculated = React.useMemo(() => {
    const amt = parseFloat(amountVal ?? "") || 0
    const adm = parseFloat(adminFeeVal ?? "") || 0
    return amt + adm
  }, [amountVal, adminFeeVal])

  async function onSubmit(data: z.output<typeof createExpenseSchema>) {
    try {
      setIsSubmitting(true)
      if (isEditMode && expense) {
        const result = await updateExpense({
          id: expense.id,
          ...data,
        })
        if (!result.success) {
          toast.error(result.error)
          return
        }
        toast.success("Catatan pengeluaran berhasil diperbarui!")
      } else {
        const result = await createExpense(data)
        if (!result.success) {
          toast.error(result.error)
          return
        }
        toast.success("Pengeluaran baru berhasil dicatat!")
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
        <div onClick={() => setOpen(true)} className="inline-block">
          {trigger ?? (
            <Button
              id="btn-add-expense"
              size="sm"
              className="gap-2 bg-primary font-medium text-primary-foreground shadow-xs hover:bg-primary/90"
            >
              <RiAddLine className="size-4" />
              <span>Catat Pengeluaran</span>
            </Button>
          )}
        </div>
      )}

      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title={
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              {isEditMode ? (
                <RiEditLine className="size-4" />
              ) : (
                <RiReceiptLine className="size-4" />
              )}
            </div>
            <span>
              {isEditMode
                ? "Edit Catatan Pengeluaran"
                : "Catat Pengeluaran Baru"}
            </span>
          </div>
        }
        description={
          isEditMode
            ? "Perbarui rincian beban operasional atau nota servis armada"
            : "Input nota servis bengkel, onderdil, BBM, atau biaya operasional lainnya"
        }
        className="sm:max-w-lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Unit Armada & Tanggal */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="truckId" className="text-xs font-medium">
                Unit Truk Armada <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedTruckId}
                onValueChange={(val) => {
                  if (val === "W8187UA" || val === "H8133OF") {
                    setValue("truckId", val, { shouldValidate: true })
                  }
                }}
              >
                <SelectTrigger id="truckId" className="h-9 text-xs">
                  <SelectValue placeholder="Pilih unit truk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="W8187UA">W 8187 UA (Dutro)</SelectItem>
                  <SelectItem value="H8133OF">H 8133 OF (Hino 500)</SelectItem>
                </SelectContent>
              </Select>
              {errors.truckId && (
                <p className="text-[11px] text-destructive">
                  {errors.truckId.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="expenseDate" className="text-xs font-medium">
                Tanggal Pengeluaran <span className="text-destructive">*</span>
              </Label>
              <Input
                id="expenseDate"
                type="date"
                className="h-9 text-xs"
                {...register("expenseDate")}
              />
              {errors.expenseDate && (
                <p className="text-[11px] text-destructive">
                  {errors.expenseDate.message}
                </p>
              )}
            </div>
          </div>

          {/* Kategori & Lokasi */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-xs font-medium">
                Kategori Beban <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedCategory}
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
                <SelectTrigger id="category" className="h-9 text-xs">
                  <SelectValue placeholder="Pilih kategori beban" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
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

            <div className="space-y-1.5">
              <Label htmlFor="location" className="text-xs font-medium">
                Lokasi / Kota (Opsional)
              </Label>
              <Input
                id="location"
                placeholder="Contoh: Tuban, Kudus, Semarang"
                className="h-9 text-xs"
                {...register("location")}
              />
            </div>
          </div>

          {/* Deskripsi */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-medium">
              Deskripsi Pengeluaran <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Contoh: Ganti filter oli, kampas rem belakang, selang gajah"
              rows={2}
              className="resize-none text-xs"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-[11px] text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Nominal Belanja & Biaya Admin Bank */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-xs font-medium">
                Nominal Belanja (Rp) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="any"
                placeholder="0"
                className="h-9 text-xs tabular-nums"
                {...register("amount")}
              />
              {errors.amount && (
                <p className="text-[11px] text-destructive">
                  {errors.amount.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adminFee" className="text-xs font-medium">
                Admin Transfer Bank (Rp)
              </Label>
              <Input
                id="adminFee"
                type="number"
                step="any"
                placeholder="0"
                className="h-9 text-xs tabular-nums"
                {...register("adminFee")}
              />
              {errors.adminFee && (
                <p className="text-[11px] text-destructive">
                  {errors.adminFee.message}
                </p>
              )}
            </div>
          </div>

          {/* Ringkasan Beban Realtime */}
          <div className="rounded-lg border border-border/70 bg-muted/40 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                <RiInformationLine className="size-3.5 text-primary" />
                Total Beban Tercatat:
              </span>
              <span className="text-sm font-bold text-foreground tabular-nums">
                Rp {totalCalculated.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* Catatan Perbaikan Tambahan */}
          <div className="space-y-1.5">
            <Label htmlFor="repairNotes" className="text-xs font-medium">
              Catatan Perbaikan / Nota (Opsional)
            </Label>
            <Textarea
              id="repairNotes"
              placeholder="Catatan nomor nota bengkel atau rincian mekanik"
              rows={2}
              className="resize-none text-xs"
              {...register("repairNotes")}
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
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
              {isSubmitting && (
                <RiLoaderLine className="size-3.5 animate-spin" />
              )}
              <span>
                {isEditMode ? "Simpan Perubahan" : "Simpan Pengeluaran"}
              </span>
            </Button>
          </div>
        </form>
      </ResponsiveDialog>
    </>
  )
}
