"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RiLockLine, RiMailLine, RiTruckLine } from "@remixicon/react"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn } from "@/lib/auth-client"

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
})

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

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
        setError("Email atau password salah.")
        return
      }

      // Role didapatkan dari user data atau fallback router refresh
      const user = result.data?.user as { role?: string } | undefined
      const role = user?.role
      const targetUrl = role === "admin" ? "/dashboard" : "/profit-sharing"
      router.replace(targetUrl)
      router.refresh()
    } catch {
      setError("Terjadi kesalahan saat masuk. Silakan coba lagi.")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card className="w-full max-w-sm border-border/80 shadow-lg">
      <CardHeader className="pb-4 text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <RiTruckLine className="size-6" />
        </div>
        <CardTitle className="text-xl font-bold tracking-tight">
          HW Trans Fleet
        </CardTitle>
        <CardDescription className="text-xs">
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
              <RiMailLine className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="nama@hiblow.fleet"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-8 text-sm"
                autoComplete="email"
                required
                disabled={isPending}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-medium">
              Password
            </Label>
            <div className="relative">
              <RiLockLine className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-8 text-sm"
                autoComplete="current-password"
                required
                disabled={isPending}
              />
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"
            >
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full font-medium"
            disabled={isPending}
          >
            {isPending ? "Memproses..." : "Masuk"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
