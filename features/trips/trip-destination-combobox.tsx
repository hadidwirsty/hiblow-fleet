"use client"

import * as React from "react"
import { RiCheckLine, RiExpandUpDownLine } from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn, formatCurrency } from "@/lib/utils"
import type { rateReferences } from "@/db/schema"

export type RateReferenceRecord = typeof rateReferences.$inferSelect

interface TripDestinationComboboxProps {
  rateReferences: RateReferenceRecord[]
  selectedId?: string | null
  onSelect: (rateRef: RateReferenceRecord) => void
  disabled?: boolean
}

export function getPlantOriginInfo(
  originPlant?: string | null,
  clientName?: string | null
): { fullName: string; badgeName: string } {
  const combined = `${originPlant ?? ""} ${clientName ?? ""}`.toLowerCase()

  if (combined.includes("sbi") || combined.includes("solusi bangun")) {
    return {
      fullName: "Solusi Bangun Indonesia (SBI) - Tuban",
      badgeName: "Solusi Bangun Indonesia (SBI) - Tuban",
    }
  }

  if (combined.includes("indocement") || combined.includes("grobogan")) {
    return {
      fullName: "Indocement - Grobogan",
      badgeName: "Indocement",
    }
  }

  if (combined.includes("rembang")) {
    return {
      fullName: "Semen Indonesia (SI) - Rembang",
      badgeName: "Semen Indonesia - Rembang",
    }
  }

  // Default SI Tuban
  return {
    fullName: "Semen Indonesia (SI) - Tuban",
    badgeName: "Semen Indonesia - Tuban",
  }
}

export function TripDestinationCombobox({
  rateReferences,
  selectedId,
  onSelect,
  disabled = false,
}: TripDestinationComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const selectedRef = React.useMemo(
    () => rateReferences.find((r) => r.id === selectedId),
    [rateReferences, selectedId]
  )

  const selectedPlantInfo = React.useMemo(
    () =>
      selectedRef
        ? getPlantOriginInfo(selectedRef.originPlant, selectedRef.clientName)
        : null,
    [selectedRef]
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-1.5 text-left text-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
          !selectedRef && "text-muted-foreground"
        )}
      >
        <span className="truncate">
          {selectedRef && selectedPlantInfo ? (
            <span className="flex items-center gap-1.5 truncate">
              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
                {selectedPlantInfo.fullName}
              </span>
              <span className="text-muted-foreground">→</span>
              <span className="font-semibold text-foreground">
                {selectedRef.city}
              </span>
              <span className="text-muted-foreground">-</span>
              <span className="truncate text-foreground">
                {selectedRef.destination}
              </span>
            </span>
          ) : (
            "Pilih rute acuan (Pabrik Asal → Kota - Tujuan)..."
          )}
        </span>
        <RiExpandUpDownLine className="ml-2 size-4 shrink-0 opacity-50" />
      </PopoverTrigger>

      <PopoverContent
        className="w-(--anchor-width) max-w-[95vw] min-w-[320px] p-0 shadow-lg"
        align="start"
      >
        <Command>
          <CommandInput
            placeholder="Ketik pabrik asal, kota tujuan, atau proyek..."
            className="h-9 text-xs"
          />
          <CommandList className="max-h-75 overflow-y-auto p-1">
            <CommandEmpty className="p-4 text-center text-xs text-muted-foreground">
              Tidak ada rute acuan yang cocok.
            </CommandEmpty>
            <CommandGroup
              heading={`Daftar Rute Acuan (${rateReferences.length} Rute)`}
            >
              {rateReferences.map((rate) => {
                const isSelected = rate.id === selectedId
                const rateNum = parseFloat(rate.ratePerTon)
                const defaultSanguNum = rate.defaultSangu
                  ? parseFloat(rate.defaultSangu)
                  : 0
                const additionalRateNum = rate.additionalTonnageRate
                  ? parseFloat(rate.additionalTonnageRate)
                  : 0
                const plantInfo = getPlantOriginInfo(
                  rate.originPlant,
                  rate.clientName
                )

                return (
                  <CommandItem
                    key={rate.id}
                    value={`${plantInfo.fullName} ${rate.city} ${rate.destination} ${plantInfo.badgeName}`}
                    onSelect={() => {
                      onSelect(rate)
                      setOpen(false)
                    }}
                    className="flex cursor-pointer items-center justify-between gap-2 rounded-md p-2 text-xs hover:bg-accent"
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      {/* Desktop / Tablet layout (sm:block hidden) */}
                      <div className="hidden sm:block">
                        <div className="flex items-center gap-1.5 truncate font-medium">
                          <span className="shrink-0 font-semibold text-primary">
                            {plantInfo.fullName}
                          </span>
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            →
                          </span>
                          <span className="shrink-0 font-semibold text-foreground">
                            {rate.city}
                          </span>
                          <span className="shrink-0 text-muted-foreground">
                            -
                          </span>
                          <span className="truncate">{rate.destination}</span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                          <Badge
                            variant="outline"
                            className="h-4 px-1 py-0 text-[9px] font-normal"
                          >
                            {plantInfo.badgeName}
                          </Badge>
                          <span>{formatCurrency(rateNum)}/ton</span>
                          {defaultSanguNum > 0 ? (
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">
                              • UJ Acuan: {formatCurrency(defaultSanguNum)}
                            </span>
                          ) : (
                            <span>
                              • Sangu{" "}
                              {Math.round(
                                parseFloat(rate.sanguPercentage) * 100
                              )}
                              %
                            </span>
                          )}
                          {additionalRateNum > 0 && (
                            <span className="font-medium text-sky-600 dark:text-sky-400">
                              • Lebih Tonase:{" "}
                              {formatCurrency(additionalRateNum)}/t
                            </span>
                          )}
                          {rate.hasSpecialDeductions && (
                            <span className="font-medium text-amber-600 dark:text-amber-400">
                              • Pot. LJU
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Mobile layout (< sm: flex-col) - jelas & tidak terpotong */}
                      <div className="flex flex-col gap-0.5 sm:hidden">
                        <div className="flex items-center justify-between gap-1 text-[11px]">
                          <span className="truncate font-semibold text-primary">
                            {plantInfo.fullName}
                          </span>
                          <span className="shrink-0 font-mono font-medium text-foreground">
                            {formatCurrency(rateNum)}/ton
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-foreground">
                          <span>{rate.city}</span>
                          <span className="mx-1 text-muted-foreground">→</span>
                          <span className="font-normal text-muted-foreground">
                            {rate.destination}
                          </span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10.5px] text-muted-foreground">
                          {defaultSanguNum > 0 ? (
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              UJ Acuan: {formatCurrency(defaultSanguNum)}
                            </span>
                          ) : (
                            <span>
                              Sangu:{" "}
                              {Math.round(
                                parseFloat(rate.sanguPercentage) * 100
                              )}
                              %
                            </span>
                          )}
                          {additionalRateNum > 0 && (
                            <span className="font-medium text-sky-600 dark:text-sky-400">
                              • Lebih: {formatCurrency(additionalRateNum)}/t
                            </span>
                          )}
                          {rate.hasSpecialDeductions && (
                            <span className="font-medium text-amber-600 dark:text-amber-400">
                              • Pot. LJU
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <RiCheckLine className="size-4 shrink-0 text-primary" />
                    )}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
