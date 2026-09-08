import type { Metadata } from "next"

import { LoginForm } from "@/features/auth/login-form"

export const metadata: Metadata = {
  title: "Masuk — HW Trans Fleet",
  description: "Masuk ke sistem manajemen armada dan keuangan HW Trans",
}

export default function LoginPage() {
  return <LoginForm />
}
