export interface CsvExportOptions {
  headers: string[]
  rows: (string | number | null | undefined)[][]
}

function escapeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '""'
  }

  if (typeof value === "number") {
    return String(value)
  }

  const stringValue = String(value)
  // Always wrap strings in double quotes and escape internal double quotes as ""
  const escaped = stringValue.replace(/"/g, '""')
  return `"${escaped}"`
}

/**
 * Builds an RFC-4180 compliant CSV string with a UTF-8 BOM prefix (\uFEFF)
 * for seamless compatibility with Microsoft Excel, Google Sheets, and Apple Numbers.
 */
export function buildCsvString({ headers, rows }: CsvExportOptions): string {
  const headerLine = headers.map((h) => escapeCsvCell(h)).join(",")

  const rowLines = rows.map((row) =>
    row.map((cell) => escapeCsvCell(cell)).join(",")
  )

  const csvBody = [headerLine, ...rowLines].join("\r\n")

  // Prepend UTF-8 BOM
  return `\uFEFF${csvBody}`
}
