import { ErrorView } from "@/components/ui/error-view"
import { getDefaultHref } from "@/lib/session"

export default async function NotFound() {
  return (
    <ErrorView
      statusCode="404"
      title="Halaman Tidak Ditemukan"
      description="Halaman yang Anda cari tidak ada atau telah dipindahkan."
      animationPath="/animations/error404.json"
      actionLabel="Kembali ke Beranda"
      actionHref={await getDefaultHref()}
    />
  )
}
