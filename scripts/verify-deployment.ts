import dotenv from "dotenv"

import { validateDeploymentEnv } from "../lib/deployment/env-validator"

dotenv.config({ path: ".env.local" })

console.log("🔍 Checking deployment environment variables readiness...")

const result = validateDeploymentEnv(process.env)

if (!result.isValid) {
  console.error("❌ Environment configuration incomplete:")
  result.errors.forEach((err) => console.error(`  - ${err}`))
  console.error(
    "\n💡 Make sure to set these variables in your Vercel Project Settings."
  )
  process.exit(1)
} else {
  console.log("✅ All required deployment environment variables are valid!")
  process.exit(0)
}
