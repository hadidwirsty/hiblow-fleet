export interface EnvValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Validates required production deployment environment variables.
 * Enforces security constraints including non-empty secrets and minimum 32-character key length.
 */
export function validateDeploymentEnv(
  env: Record<string, string | undefined>
): EnvValidationResult {
  const errors: string[] = []

  // 1. DATABASE_URL
  if (!env.DATABASE_URL || env.DATABASE_URL.trim() === "") {
    errors.push("DATABASE_URL is required")
  } else if (
    !env.DATABASE_URL.startsWith("postgres://") &&
    !env.DATABASE_URL.startsWith("postgresql://")
  ) {
    errors.push("DATABASE_URL must start with postgres:// or postgresql://")
  }

  // 2. BETTER_AUTH_SECRET
  if (!env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET.trim() === "") {
    errors.push("BETTER_AUTH_SECRET is required")
  } else if (env.BETTER_AUTH_SECRET.length < 32) {
    errors.push(
      "BETTER_AUTH_SECRET must be at least 32 characters for security"
    )
  }

  // 3. BETTER_AUTH_URL
  if (!env.BETTER_AUTH_URL || env.BETTER_AUTH_URL.trim() === "") {
    errors.push("BETTER_AUTH_URL is required")
  }

  // 4. NEXT_PUBLIC_APP_URL
  if (!env.NEXT_PUBLIC_APP_URL || env.NEXT_PUBLIC_APP_URL.trim() === "") {
    errors.push("NEXT_PUBLIC_APP_URL is required")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
