import * as XLSX from "xlsx"
import { describe, expect, it } from "vitest"

import { buildExcelWorkbookBlob } from "@/lib/export/excel-builder"

describe("excel-builder", () => {
  it("should create a valid single-sheet Excel workbook blob", async () => {
    const sheets = [
      {
        sheetName: "Ritase HW Trans",
        headers: ["No Order", "Armada", "Omset"],
        rows: [
          [101, "W 8187 UA", 5500000],
          [102, "H 8133 OF", 4800000],
        ],
      },
    ]

    const blob = buildExcelWorkbookBlob({ sheets })

    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    expect(blob.size).toBeGreaterThan(100)

    // Verify sheet content by reading back the arrayBuffer with XLSX
    const arrayBuffer = await blob.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: "array" })

    expect(workbook.SheetNames).toContain("Ritase HW Trans")
    const sheet = workbook.Sheets["Ritase HW Trans"]
    expect(sheet).toBeDefined()

    const parsedJson = XLSX.utils.sheet_to_json(sheet)
    expect(parsedJson).toHaveLength(2)
    expect(parsedJson[0]).toEqual({
      "No Order": 101,
      Armada: "W 8187 UA",
      Omset: 5500000,
    })
  })

  it("should support multiple sheets in one workbook", async () => {
    const sheets = [
      {
        sheetName: "Ringkasan",
        headers: ["Kategori", "Total"],
        rows: [["Omset", 10000000]],
      },
      {
        sheetName: "Dividen",
        headers: ["Nama", "Hak"],
        rows: [["Alfiah", 5000000]],
      },
    ]

    const blob = buildExcelWorkbookBlob({ sheets })
    const arrayBuffer = await blob.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: "array" })

    expect(workbook.SheetNames).toEqual(["Ringkasan", "Dividen"])
  })
})
