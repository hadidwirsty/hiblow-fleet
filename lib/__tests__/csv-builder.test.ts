import { describe, expect, it } from "vitest"

import { buildCsvString } from "@/lib/export/csv-builder"

describe("csv-builder", () => {
  it("should generate valid RFC-4180 CSV with UTF-8 BOM", () => {
    const headers = ["No", "Nama", "Kota"]
    const rows = [
      [1, "Hadid Wiransetyo", "Semarang"],
      [2, "Mas Hafidz", "Tuban"],
    ]

    const csv = buildCsvString({ headers, rows })

    // Must start with UTF-8 BOM \uFEFF
    expect(csv.startsWith("\uFEFF")).toBe(true)

    const contentWithoutBom = csv.slice(1)
    const lines = contentWithoutBom.split("\r\n")

    expect(lines[0]).toBe('"No","Nama","Kota"')
    expect(lines[1]).toBe('1,"Hadid Wiransetyo","Semarang"')
    expect(lines[2]).toBe('2,"Mas Hafidz","Tuban"')
  })

  it("should properly escape double quotes, commas, and newlines", () => {
    const headers = ["Item", "Catatan"]
    const rows = [
      [
        'Ban Luar "Gajah Tunggal"',
        "Beli di Kudus, garansi 1 th\nNota terlampir",
      ],
    ]

    const csv = buildCsvString({ headers, rows })
    expect(csv.startsWith("\uFEFF")).toBe(true)

    // Quotes must be escaped as ""
    expect(csv).toContain('"Ban Luar ""Gajah Tunggal"""')
    // Comma and newline must be enclosed in quotes
    expect(csv).toContain('"Beli di Kudus, garansi 1 th\nNota terlampir"')
  })

  it("should handle null and undefined cell values as empty string", () => {
    const headers = ["Col1", "Col2"]
    const rows = [[null, undefined]]

    const csv = buildCsvString({ headers, rows })
    const lines = csv.slice(1).split("\r\n")
    expect(lines[1]).toBe('""' + ',""')
  })
})
