import { RiHandCoinLine } from "@remixicon/react"

interface ProfitSharingEmptyStateProps {
  children?: React.ReactNode
}

export function ProfitSharingEmptyState({
  children,
}: ProfitSharingEmptyStateProps) {
  return (
    <div className="flex min-h-95 animate-in flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center fade-in-50">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <RiHandCoinLine className="size-7" />
      </div>
      <h3 className="text-lg font-semibold tracking-tight">
        Belum Ada Periode Bagi Hasil
      </h3>
      <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
        Tutup buku bulanan belum pernah dibuat. Jalankan wizard untuk menarik
        data ritase, biaya operasional, dan menghitung porsi bagi hasil pemodal
        secara otomatis.
      </p>
      {children && <div className="mt-6">{children}</div>}
    </div>
  )
}
