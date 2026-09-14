"use client"

import * as React from "react"
import { RiAlarmWarningLine, RiCheckLine, RiTimeLine } from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import type { MaintenanceReminder } from "@/db/schema"
import {
  computeReminderStatus,
  getDaysUntilDue,
  type ReminderStatus,
} from "@/domain/maintenance"
import { formatDateIndonesian } from "@/lib/utils"

interface MaintenanceRemindersWidgetProps {
  reminders: MaintenanceReminder[]
}

const STATUS_CONFIG: Record<
  ReminderStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  overdue: {
    label: "Lewat Jatuh Tempo",
    className:
      "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
    icon: <RiAlarmWarningLine className="size-3" />,
  },
  due_soon: {
    label: "Mendekat",
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    icon: <RiTimeLine className="size-3" />,
  },
  ok: {
    label: "Aman",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    icon: <RiCheckLine className="size-3" />,
  },
}

const TYPE_LABELS: Record<string, string> = {
  oil_change: "Ganti Oli",
  kir: "Uji KIR",
  stnk: "Pajak STNK",
  other: "Lainnya",
}

export function MaintenanceRemindersWidget({
  reminders,
}: MaintenanceRemindersWidgetProps) {
  const [today] = React.useState(() => new Date())

  const remindersWithStatus = reminders.map((r) => ({
    ...r,
    status: computeReminderStatus(r.dueDate, today),
    daysUntil: getDaysUntilDue(r.dueDate, today),
  }))

  const urgentCount = remindersWithStatus.filter(
    (r) => r.status === "overdue" || r.status === "due_soon"
  ).length

  if (reminders.length === 0) {
    return (
      <div className="flex h-30 items-center justify-center rounded-xl border border-dashed">
        <p className="text-sm text-muted-foreground">
          Belum ada jadwal servis yang dikonfigurasi
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {urgentCount > 0 && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
          <RiAlarmWarningLine className="size-3.5" />
          {urgentCount} item memerlukan perhatian segera
        </p>
      )}

      <div className="divide-y divide-border overflow-hidden rounded-xl border">
        {remindersWithStatus.map((reminder) => {
          const config = STATUS_CONFIG[reminder.status]
          const daysText =
            reminder.daysUntil < 0
              ? `Lewat ${Math.abs(reminder.daysUntil)} hari`
              : reminder.daysUntil === 0
                ? "Hari ini!"
                : `${reminder.daysUntil} hari lagi`

          return (
            <div
              key={reminder.id}
              className="flex items-center justify-between gap-2.5 bg-card px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3"
            >
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="truncate text-xs font-semibold text-foreground sm:text-sm">
                  {reminder.label}
                </p>
                <p className="truncate text-[10px] text-muted-foreground sm:text-xs">
                  {reminder.truckId} ·{" "}
                  {TYPE_LABELS[reminder.reminderType] ?? reminder.reminderType}{" "}
                  · {formatDateIndonesian(reminder.dueDate, true)}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Badge
                  variant="outline"
                  className={`gap-1 px-1.5 py-0.5 text-[10px] font-medium sm:text-[11px] ${config.className}`}
                >
                  {config.icon}
                  {config.label}
                </Badge>
                <span className="text-[10px] text-muted-foreground tabular-nums sm:text-xs">
                  {daysText}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
