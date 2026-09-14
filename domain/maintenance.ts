const DUE_SOON_THRESHOLD_DAYS = 30
const MS_PER_DAY = 1000 * 60 * 60 * 24

export type ReminderStatus = "overdue" | "due_soon" | "ok"

/**
 * Calculates days until the due date from today.
 * Returns negative if overdue, 0 if due today, positive if future.
 * Pure function — `today` is injected as parameter.
 */
export function getDaysUntilDue(dueDate: string, today: Date): number {
  const due = new Date(dueDate)
  // Normalize to midnight UTC to avoid time-of-day drift
  const todayMidnight = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  )
  const dueMidnight = new Date(
    Date.UTC(due.getFullYear(), due.getMonth(), due.getDate())
  )
  return Math.round(
    (dueMidnight.getTime() - todayMidnight.getTime()) / MS_PER_DAY
  )
}

/**
 * Computes urgency status for a maintenance reminder.
 * Pure function — `today` is injected as parameter.
 *
 * @returns "overdue"  — past due date
 * @returns "due_soon" — within 30 days (inclusive)
 * @returns "ok"       — more than 30 days away
 */
export function computeReminderStatus(
  dueDate: string,
  today: Date
): ReminderStatus {
  const daysUntil = getDaysUntilDue(dueDate, today)
  if (daysUntil < 0) return "overdue"
  if (daysUntil <= DUE_SOON_THRESHOLD_DAYS) return "due_soon"
  return "ok"
}
