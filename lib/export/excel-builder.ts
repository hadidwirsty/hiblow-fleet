import * as XLSX from "xlsx"

export interface ExcelSheetData {
  sheetName: string
  headers: string[]
  rows: (string | number | null | undefined)[][]
}

export interface ExcelExportOptions {
  sheets: ExcelSheetData[]
}

/**
 * Builds an Excel (.xlsx) workbook Blob from one or more structured sheets.
 * Automatically calculates column widths for clean visual presentation.
 */
export function buildExcelWorkbookBlob({ sheets }: ExcelExportOptions): Blob {
  const workbook = XLSX.utils.book_new()

  for (const sheetData of sheets) {
    const tableData = [sheetData.headers, ...sheetData.rows]
    const worksheet = XLSX.utils.aoa_to_sheet(tableData)

    // Calculate dynamic column width with reasonable min/max limits
    const colWidths = sheetData.headers.map((header, colIdx) => {
      let maxLen = header.length
      for (const row of sheetData.rows) {
        const cell = row[colIdx]
        if (cell !== null && cell !== undefined) {
          const str =
            typeof cell === "number"
              ? cell.toLocaleString("id-ID")
              : String(cell)
          maxLen = Math.max(maxLen, str.length)
        }
      }
      return { wch: Math.min(Math.max(maxLen + 2, 10), 60) }
    })

    worksheet["!cols"] = colWidths

    // Truncate sheet name to 31 chars max (Excel limitation)
    const safeSheetName = sheetData.sheetName.slice(0, 31)
    XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName)
  }

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  })

  return new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
}
