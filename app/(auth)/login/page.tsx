import type { Metadata } from "next"
import Image from "next/image"
import {
  RiBarChartBoxLine,
  RiExchangeDollarLine,
  RiShieldCheckLine,
  RiTruckLine,
} from "@remixicon/react"

import { ModeToggle } from "@/components/layout/mode-toggle"
import { LoginForm } from "@/features/auth/login-form"

export const metadata: Metadata = {
  title: "Masuk — HW Trans Fleet",
  description: "Masuk ke sistem manajemen armada dan keuangan HW Trans",
}

export default function LoginPage() {
  return (
    <div className="relative isolate flex min-h-svh w-full flex-col lg:flex-row">
      {/* Visual Background for Mobile & Tablet */}
      <div className="fixed inset-0 -z-10 lg:hidden">
        <Image
          src="/images/background_dark.jpg"
          alt="Latar Belakang Hadya Wiran Trans Mode Gelap"
          fill
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="hidden object-cover object-center dark:block"
        />
        <Image
          src="/images/background_light.jpg"
          alt="Latar Belakang Hadya Wiran Trans Mode Terang"
          fill
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="block object-cover object-center dark:hidden"
        />
        <div className="absolute inset-0 bg-background/60 backdrop-blur-xs dark:bg-background/60" />
      </div>

      {/* Left Column: Hero Showcase (Desktop only) */}
      <div className="relative hidden w-full overflow-hidden border-r border-border/40 bg-slate-100 p-10 select-none lg:flex lg:w-1/2 lg:flex-col lg:justify-between xl:w-7/12 xl:p-14 dark:bg-[#0b0d13]">
        {/* Centered Image Container with Direct Vertical Fade Mask */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="relative aspect-video w-full"
            style={{
              maskImage:
                "linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.03) 4%, rgba(0, 0, 0, 0.2) 12%, rgba(0, 0, 0, 0.6) 22%, black 32%, black 56%, rgba(0, 0, 0, 0.6) 68%, rgba(0, 0, 0, 0.2) 78%, rgba(0, 0, 0, 0.03) 88%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.03) 4%, rgba(0, 0, 0, 0.2) 12%, rgba(0, 0, 0, 0.6) 22%, black 32%, black 56%, rgba(0, 0, 0, 0.6) 68%, rgba(0, 0, 0, 0.2) 78%, rgba(0, 0, 0, 0.03) 88%, transparent 100%)",
            }}
          >
            <Image
              src="/images/background_dark.jpg"
              alt="Armada Truk Hi-Blow Hadya Wiran Trans Mode Gelap"
              fill
              priority
              sizes="(min-width: 1280px) 58vw, 50vw"
              className="hidden object-contain object-center opacity-80 transition-opacity duration-300 dark:block"
            />
            <Image
              src="/images/background_light.jpg"
              alt="Armada Truk Hi-Blow Hadya Wiran Trans Mode Terang"
              fill
              priority
              sizes="(min-width: 1280px) 58vw, 50vw"
              className="block object-contain object-center opacity-85 transition-opacity duration-300 dark:hidden"
            />
          </div>
        </div>

        {/* Cinematic Gradient Overlays adaptif Light / Dark Mode */}
        <div className="absolute inset-0 bg-linear-to-t from-slate-100/95 via-slate-100/45 to-slate-100/80 dark:from-[#0b0d13]/95 dark:via-[#0b0d13]/50 dark:to-[#0b0d13]/85" />
        <div className="absolute inset-0 bg-radial from-emerald-500/10 via-transparent to-transparent" />

        {/* Top Branding Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3 rounded-full border border-slate-300/80 bg-white/80 px-4 py-2 text-slate-900 shadow-md dark:border-white/15 dark:bg-black/50 dark:text-white">
            <Image
              src="/images/logo_dark.png"
              alt="Logo HW Trans"
              width={36}
              height={36}
              className="hidden size-7 dark:block"
            />
            <Image
              src="/images/logo_light.png"
              alt="Logo HW Trans"
              width={36}
              height={36}
              className="block size-7 dark:hidden"
            />
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wide">
              <span>HW Trans</span>
              <span className="text-muted-foreground/50">•</span>
              <span className="text-emerald-600 dark:text-emerald-300">
                Operasional Armada
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-medium text-emerald-700 shadow-xs dark:border-emerald-400/30 dark:bg-emerald-950/60 dark:text-emerald-300">
            <span className="size-2 animate-pulse rounded-full bg-emerald-500 dark:bg-emerald-400" />
            <span>2 Unit Armada Aktif</span>
          </div>
        </div>

        {/* Bottom Hero Content & Value Highlights */}
        <div className="relative z-10 space-y-6 pt-16">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-300 dark:ring-emerald-400/30">
              <RiShieldCheckLine className="size-3.5" />
              <span>Sistem Manajemen Terintegrasi</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 xl:text-4xl dark:text-white">
              Efisiensi Armada Hi-Blow & Transparansi Finansial
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-slate-700 dark:text-zinc-300">
              Kendali menyeluruh ritase semen curah, kontrol konsumsi
              operasional seluruh unit armada, hingga kalkulasi pembagian hasil
              pemodal secara real-time.
            </p>
          </div>

          {/* Metric Highlight Glass Cards */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="rounded-xl border border-slate-300/70 bg-white/80 p-3.5 shadow-md transition-colors hover:border-emerald-500/40 dark:border-white/10 dark:bg-black/50 dark:hover:border-white/20">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <RiTruckLine className="size-4" />
                <span className="text-xs font-semibold">Armada Aktif</span>
              </div>
              <p className="mt-1 text-xs font-medium text-slate-900 dark:text-zinc-200">
                Hi-Blow Silo Curah
              </p>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                Siap jalan & termonitor
              </p>
            </div>

            <div className="rounded-xl border border-slate-300/70 bg-white/80 p-3.5 shadow-md transition-colors hover:border-emerald-500/40 dark:border-white/10 dark:bg-black/50 dark:hover:border-white/20">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <RiBarChartBoxLine className="size-4" />
                <span className="text-xs font-semibold">Ritase & Omset</span>
              </div>
              <p className="mt-1 text-xs font-medium text-slate-900 dark:text-zinc-200">
                Pemantauan Real-Time
              </p>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                Pelacakan sangu & biaya
              </p>
            </div>

            <div className="rounded-xl border border-slate-300/70 bg-white/80 p-3.5 shadow-md transition-colors hover:border-emerald-500/40 dark:border-white/10 dark:bg-black/50 dark:hover:border-white/20">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <RiExchangeDollarLine className="size-4" />
                <span className="text-xs font-semibold">Bagi Hasil</span>
              </div>
              <p className="mt-1 text-xs font-medium text-slate-900 dark:text-zinc-200">
                Transparan & Akurat
              </p>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                Hak pemodal terjaga
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Authentication Form Area */}
      <div className="relative flex min-h-svh flex-1 flex-col justify-between p-6 sm:p-10 lg:w-1/2 lg:p-12 xl:w-5/12">
        {/* Top Bar with Mode Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 lg:hidden">
            <Image
              src="/images/logo_dark.png"
              alt="Logo HW Trans"
              width={36}
              height={36}
              className="hidden size-7 dark:block"
            />
            <Image
              src="/images/logo_light.png"
              alt="Logo HW Trans"
              width={36}
              height={36}
              className="block size-7 dark:hidden"
            />
            <span className="text-xs font-bold tracking-tight text-foreground">
              HW Trans Fleet
            </span>
          </div>
          <div className="ml-auto lg:absolute lg:top-6 lg:right-6">
            <ModeToggle />
          </div>
        </div>

        {/* Center: Login Form */}
        <div className="my-auto flex w-full justify-center py-8">
          <LoginForm />
        </div>

        {/* Bottom: Legal & Copyright */}
        <div className="text-center text-xs text-muted-foreground">
          <p>© 2026 PT Hadya Wiran Trans. Hak Cipta Dilindungi.</p>
        </div>
      </div>
    </div>
  )
}
