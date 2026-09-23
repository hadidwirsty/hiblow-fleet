import type { Trip } from "@/db/schema"

export interface TripFilterOptions {
  search?: string
  truckId?: string
  date?: string
  startDate?: string
  endDate?: string
  month?: string
  year?: string
  feeFilter?: "ALL" | "PENDING" | "PAID"
}

export function isDoFeePaid(status?: string | null): boolean {
  if (!status) return false
  const s = status.toLowerCase()
  return (
    s.includes("lunas") ||
    s.includes("sudah dibayar") ||
    s.includes("sdh dibayar")
  )
}

export function filterTrips(
  trips: Trip[],
  options: TripFilterOptions = {}
): Trip[] {
  const {
    search = "",
    truckId = "ALL",
    date,
    startDate,
    endDate,
    month = "ALL",
    year = "ALL",
    feeFilter = "ALL",
  } = options

  const cleanSearch = search.trim().toLowerCase()

  return trips.filter((trip) => {
    // 1. Text Search Filter (Hanya Nomor Surat Jalan & Kota Tujuan)
    if (cleanSearch) {
      const orderStr = String(trip.orderNumber).toLowerCase()
      const cityStr = trip.destinationCity.toLowerCase()

      const match =
        orderStr.includes(cleanSearch) || cityStr.includes(cleanSearch)

      if (!match) return false
    }

    // 2. Date Range Filter (Format YYYY-MM-DD dari Range Date Picker)
    const tripDate = trip.unloadingDate || trip.orderDate
    if (startDate && endDate) {
      if (!tripDate || tripDate < startDate || tripDate > endDate) {
        return false
      }
    } else if (startDate) {
      if (!tripDate || tripDate !== startDate) {
        return false
      }
    } else if (date) {
      const matchesDate = trip.orderDate === date || trip.unloadingDate === date
      if (!matchesDate) return false
    }

    // 2. Truck ID Filter
    if (truckId !== "ALL" && trip.truckId !== truckId) {
      return false
    }

    // 3. Month Filter (menggunakan unloadingDate jika ada, fallback ke orderDate)
    if (month !== "ALL") {
      const targetMonth = parseInt(month, 10)
      const dateStr = trip.unloadingDate || trip.orderDate
      if (dateStr) {
        // format ISO YYYY-MM-DD
        const tripMonth = parseInt(dateStr.split("-")[1], 10)
        if (tripMonth !== targetMonth) return false
      }
    }

    // 4. Year Filter (menggunakan unloadingDate jika ada, fallback ke orderDate)
    if (year !== "ALL") {
      const targetYear = parseInt(year, 10)
      const dateStr = trip.unloadingDate || trip.orderDate
      if (dateStr) {
        const tripYear = parseInt(dateStr.split("-")[0], 10)
        if (tripYear !== targetYear) return false
      }
    }

    // 5. DO Biaya Status Filter
    if (feeFilter !== "ALL") {
      const fee = parseFloat(trip.thirdPartyFee || "0")
      const hasFee = fee > 0 || Boolean(trip.thirdPartyName)
      const isPaid = isDoFeePaid(trip.thirdPartyStatus)

      if (feeFilter === "PENDING" && (!hasFee || isPaid)) {
        return false
      }
      if (feeFilter === "PAID" && (!hasFee || !isPaid)) {
        return false
      }
    }

    return true
  })
}
