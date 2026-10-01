import * as React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ErrorView } from "@/components/ui/error-view"

describe("ErrorView Component", () => {
  it("renders status code, title, and description correctly", () => {
    const html = renderToStaticMarkup(
      <ErrorView
        statusCode="404"
        title="Halaman Tidak Ditemukan"
        description="Maaf, halaman tidak ada."
        animationPath="/animations/error404.json"
      />
    )

    expect(html).toContain("404")
    expect(html).toContain("Halaman Tidak Ditemukan")
    expect(html).toContain("Maaf, halaman tidak ada.")
  })

  it("renders default action link to root when no actionHref is specified", () => {
    const html = renderToStaticMarkup(
      <ErrorView
        statusCode="403"
        title="Akses Terlarang"
        description="Tidak memiliki izin."
        animationPath="/animations/error403.json"
      />
    )

    expect(html).toContain('href="/"')
    expect(html).toContain("Kembali ke Beranda")
  })

  it("renders custom action link when actionHref and actionLabel are provided", () => {
    const html = renderToStaticMarkup(
      <ErrorView
        statusCode="401"
        title="Akses Ditolak"
        description="Harus masuk terlebih dahulu."
        animationPath="/animations/error403.json"
        actionLabel="Halaman Masuk"
        actionHref="/login"
      />
    )

    expect(html).toContain('href="/login"')
    expect(html).toContain("Halaman Masuk")
  })

  it("renders button when onAction callback is provided instead of link", () => {
    const onAction = () => {}
    const html = renderToStaticMarkup(
      <ErrorView
        statusCode="500"
        title="Kesalahan Internal"
        description="Sistem mengalami kendala."
        animationPath="/animations/error500.json"
        actionLabel="Coba Lagi"
        onAction={onAction}
      />
    )

    expect(html).toContain("<button")
    expect(html).toContain("Coba Lagi")
    expect(html).not.toContain('href="/"')
  })
})
