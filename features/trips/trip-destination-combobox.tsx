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
import type { rateReferences } from "@/src/db/schema"

export type RateReferenceRecord = typeof rateReferences.$inferSelect

interface TripDestinationComboboxProps {
  rateReferences: RateReferenceRecord[]
  selectedId?: string | null
  onSelect: (rateRef: RateReferenceRecord) => void
  disabled?: boolean
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
          {selectedRef ? (
            <span className="flex items-center gap-1.5">
              <span className="font-semibold text-foreground">
                {selectedRef.city}
              </span>
              <span className="text-muted-foreground">→</span>
              <span className="text-foreground">{selectedRef.destination}</span>
            </span>
          ) : (
            "Cari kota atau nama tujuan pabrik..."
          )}
        </span>
        <RiExpandUpDownLine className="ml-2 size-4 shrink-0 opacity-50" />
      </PopoverTrigger>

      <PopoverContent className="w-90 p-0 shadow-lg" align="start">
        <Command>
          <CommandInput
            placeholder="Ketik kota atau nama pabrik..."
            className="h-9 text-xs"
          />
          <CommandList className="max-h-75 overflow-y-auto p-1">
            <CommandEmpty className="p-4 text-center text-xs text-muted-foreground">
              Tidak ada rute acuan yang cocok.
            </CommandEmpty>
            <CommandGroup heading="Daftar Rute Acuan (289 Rute)">
              {rateReferences.map((rate) => {
                const isSelected = rate.id === selectedId
                const rateNum = parseFloat(rate.ratePerTon)

                return (
                  <CommandItem
                    key={rate.id}
                    value={`${rate.city} ${rate.destination} ${rate.clientName}`}
                    onSelect={() => {
                      onSelect(rate)
                      setOpen(false)
                    }}
                    className="flex cursor-pointer items-center justify-between gap-2 rounded-md p-2 text-xs hover:bg-accent"
                  >
                    <div className="flex min-w-0 flex-col">
                      <div className="flex items-center gap-1.5 truncate font-medium">
                        <span className="font-semibold text-foreground">
                          {rate.city}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          →
                        </span>
                        <span className="truncate">{rate.destination}</span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Badge
                          variant="outline"
                          className="h-4 px-1 py-0 text-[9px] font-normal"
                        >
                          {rate.clientName}
                        </Badge>
                        <span>{formatCurrency(rateNum)}/ton</span>
                        <span>
                          • Sangu{" "}
                          {Math.round(parseFloat(rate.sanguPercentage) * 100)}%
                        </span>
                        {rate.hasSpecialDeductions && (
                          <span className="font-medium text-amber-600 dark:text-amber-400">
                            • Pot. LJU
                          </span>
                        )}
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
