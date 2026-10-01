import { ErrorView } from "@/components/ui/error-view"

export default function UnauthorizedPage() {
  return (
    <ErrorView
      statusCode="401"
      title="Akses Ditolak"
      description="Anda belum masuk untuk mengakses halaman ini. Silakan masuk terlebih dahulu untuk mengakses halaman ini."
      animationPath="/animations/error403.json"
      actionLabel="Masuk"
      actionHref="/login"
    />
  )
}
