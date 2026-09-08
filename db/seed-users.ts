import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

import { db, pool } from "./index"
import { user, account, session, verification } from "./schema"
import { auth } from "@/lib/auth"

async function seedUsers() {
  console.log("👤 Seeding initial authentication users...")

  // Hapus akun lama jika perlu bersih-bersih
  await db.delete(account)
  await db.delete(session)
  await db.delete(verification)
  await db.delete(user)

  // 1. Create Admin User
  const adminResult = await auth.api.signUpEmail({
    body: {
      email: "hafidz@hiblow.fleet",
      password: "password123",
      name: "Mas Hafidz",
      role: "admin",
    },
  })
  console.log(
    "✅ Admin user created:",
    adminResult?.user?.email,
    `(Role: ${adminResult?.user?.role})`
  )

  // 2. Create Partner User
  const partnerResult = await auth.api.signUpEmail({
    body: {
      email: "alfiah@hiblow.fleet",
      password: "password123",
      name: "Hj. Alfiah",
      role: "partner",
    },
  })
  console.log(
    "✅ Partner user created:",
    partnerResult?.user?.email,
    `(Role: ${partnerResult?.user?.role})`
  )

  console.log("🎉 User seeding complete!")
  await pool.end()
}

seedUsers().catch((err) => {
  console.error("❌ Failed to seed users:", err)
  pool.end().finally(() => process.exit(1))
})
