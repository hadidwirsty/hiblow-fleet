"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import {
  RiEyeLine,
  RiEyeOffLine,
  RiLockLine,
  RiMailLine,
  RiShieldCheckLine,
  RiTruckLine,
} from "@remixicon/react"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { GlobalLoadingOverlay } from "@/components/layout/global-loading-overlay"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoginWelcomeDialog } from "@/features/auth/login-welcome-dialog"
import { signIn } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Kata sandi minimal 6 karakter"),
})

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false)
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const validated = loginSchema.safeParse({ email, password })
    if (!validated.success) {
      setError(validated.error.issues[0]?.message ?? "Input tidak valid")
      return
    }

    setIsPending(true)
    try {
      const result = await signIn.email({
        email: validated.data.email,
        password: validated.data.password,
      })

      if (result.error) {
        setError("Email atau kata sandi salah.")
        setIsPending(false)
        return
      }

      const user = result.data?.user as { role?: string } | undefined
      const role = user?.role
      const targetUrl = role === "admin" ? "/dashboard" : "/profit-sharing"

      setRedirectUrl(targetUrl)
      setShowWelcomeDialog(true)
      setIsPending(false)
    } catch {
      setError("Terjadi kesalahan saat masuk. Silakan coba lagi.")
      setIsPending(false)
    }
  }

  return (
    <>
      <GlobalLoadingOverlay
        open={isInitialLoading}
        label="HW Trans Fleet"
        description="Menyiapkan sistem operasional armada..."
      />

      <Card className="w-full max-w-md border-border/70 bg-card/85 shadow-2xl backdrop-blur-md transition-all duration-300">
        <CardHeader className="pb-4 text-center">
          <div className="mx-auto flex size-24 items-center justify-center sm:size-32">
            <Image
              src="/images/logo_dark.png"
              alt="Logo Armada HW Trans"
              width={140}
              height={140}
              priority
              className="hidden size-full object-contain dark:block"
            />
            <Image
              src="/images/logo_light.png"
              alt="Logo Armada HW Trans"
              width={140}
              height={140}
              priority
              className="block size-full object-contain dark:hidden"
            />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            HW Trans Fleet
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Hadya Wiran Trans — Sistem Manajemen Armada & Keuangan
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium">
                Email
              </Label>
              <div className="relative">
                <RiMailLine
                  className={cn(
                    "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground transition-all duration-200 ease-in-out",
                    email
                      ? "invisible -translate-x-2 scale-75 opacity-0"
                      : "visible translate-x-0 scale-100 opacity-100"
                  )}
                />
                <Input
                  id="email"
                  type="email"
                  placeholder="Masukkan email Anda"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    "h-10 text-sm transition-[padding] duration-200 ease-in-out",
                    email ? "pl-3" : "pl-9"
                  )}
                  autoComplete="email"
                  required
                  disabled={isPending}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-medium">
                  Kata Sandi
                </Label>
              </div>
              <div className="relative">
                <RiLockLine
                  className={cn(
                    "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground transition-all duration-200 ease-in-out",
                    password
                      ? "invisible -translate-x-2 scale-75 opacity-0"
                      : "visible translate-x-0 scale-100 opacity-100"
                  )}
                />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    "h-10 pr-10 text-sm transition-[padding] duration-200 ease-in-out",
                    password ? "pl-3" : "pl-9"
                  )}
                  autoComplete="current-password"
                  required
                  disabled={isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:text-foreground focus:outline-none"
                  tabIndex={-1}
                  aria-label={
                    showPassword
                      ? "Sembunyikan kata sandi"
                      : "Tampilkan kata sandi"
                  }
                >
                  {showPassword ? (
                    <RiEyeOffLine className="size-4" />
                  ) : (
                    <RiEyeLine className="size-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs font-medium text-destructive"
              >
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="relative h-10 w-full overflow-hidden font-medium shadow-md shadow-primary/20 transition-all hover:shadow-lg"
              disabled={isPending}
            >
              {isPending ? (
                <div className="relative flex w-full items-center justify-center">
                  <div className="pointer-events-none absolute inset-x-0 -bottom-2 h-px border-b border-dashed border-primary-foreground/30" />

                  <div className="animate-truck-drive pointer-events-none absolute inset-y-0 flex items-center">
                    <div className="animate-truck-rumble">
                      <RiTruckLine className="size-4.5 text-primary-foreground drop-shadow-xs" />
                    </div>
                  </div>

                  <span className="relative z-10 inline-flex items-center text-xs font-semibold tracking-wider">
                    <span>Memproses</span>
                    <span className="ml-0.5 inline-flex">
                      <span
                        className="inline-block animate-bounce"
                        style={{ animationDelay: "-0.32s" }}
                      >
                        .
                      </span>
                      <span
                        className="inline-block animate-bounce"
                        style={{ animationDelay: "-0.16s" }}
                      >
                        .
                      </span>
                      <span className="inline-block animate-bounce">.</span>
                    </span>
                  </span>
                </div>
              ) : (
                "Masuk"
              )}
            </Button>
          </form>

          <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <RiShieldCheckLine className="size-3.5 text-emerald-500" />
            <span>Akses terenkripsi sistem internal Hadya Wiran Trans</span>
          </div>
        </CardContent>
      </Card>

      <LoginWelcomeDialog
        open={showWelcomeDialog}
        redirectUrl={redirectUrl}
        onOpenChange={setShowWelcomeDialog}
      />
    </>
  )
}
