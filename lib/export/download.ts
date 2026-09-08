/**
 * Triggers a file download in the browser from a given Blob or text content.
 * Safely cleans up the object URL to avoid browser memory leaks.
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  if (typeof window === "undefined") return

  const url = window.URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.style.display = "none"

  document.body.appendChild(link)
  link.click()

  // Clean up
  setTimeout(() => {
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }, 100)
}

/**
 * Downloads raw string content as a file (e.g. CSV or TXT).
 */
export function triggerTextDownload(
  content: string,
  filename: string,
  mimeType = "text/csv;charset=utf-8;"
): void {
  const blob = new Blob([content], { type: mimeType })
  triggerBlobDownload(blob, filename)
}
