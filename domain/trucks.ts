interface TruckRecord {
  id: string
  driver: string
  plate: string
}

export const TRUCKS_MASTER: Record<string, TruckRecord> = {
  W8187UA: { id: "W8187UA", driver: "Triyono", plate: "W 8187 UA" },
  H8133OF: { id: "H8133OF", driver: "Khoirul", plate: "H 8133 OF" },
}

export function formatPlateNumber(truckId: string): string {
  return TRUCKS_MASTER[truckId]?.plate || truckId
}

export function getDriverAndTruck(truckId: string): {
  driver: string
  plate: string
} {
  const truck = TRUCKS_MASTER[truckId]
  if (truck) {
    return { driver: truck.driver, plate: truck.plate }
  }
  return { driver: "Supir", plate: truckId }
}

export function getDriverName(truckId: string): string {
  return TRUCKS_MASTER[truckId]?.driver || "Supir"
}
