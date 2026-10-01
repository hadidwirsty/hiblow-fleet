import { ErrorView } from "@/components/ui/error-view"
import { getDefaultHref } from "@/lib/session"

export default async function ForbiddenPage() {
  return (
    <ErrorView
      statusCode="403"
      title="Akses Terlarang"
      description="Anda tidak memiliki hak akses untuk melihat halaman ini. Silakan hubungi tim bantuan untuk informasi lebih lanjut."
      animationPath="/animations/error403.json"
      actionLabel="Kembali ke Beranda"
      actionHref={await getDefaultHref()}
    />
  )
}
