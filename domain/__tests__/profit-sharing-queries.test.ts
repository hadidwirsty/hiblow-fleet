import { beforeEach, describe, expect, it, vi } from "vitest"

const mockWhere = vi.fn().mockResolvedValue([{ total: 15000000 }])
const mockInnerJoin = vi.fn().mockReturnValue({ where: mockWhere })
const mockFrom = vi.fn().mockReturnValue({
  innerJoin: mockInnerJoin,
  where: mockWhere,
})
const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

vi.mock("@/db", () => ({
  db: {
    select: mockSelect,
  },
}))

describe("profit-sharing.queries - getMyTotalDividend", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("harus mengembalikan angka number untuk valid userId", async () => {
    const { getMyTotalDividend } =
      await import("@/features/profit-sharing/profit-sharing.queries")
    const result = await getMyTotalDividend("user-test-123")
    expect(typeof result).toBe("number")
    expect(result).toBe(15000000)
  })

  it("harus mengembalikan 0 jika userId kosong", async () => {
    const { getMyTotalDividend } =
      await import("@/features/profit-sharing/profit-sharing.queries")
    const result = await getMyTotalDividend("")
    expect(result).toBe(0)
  })

  it("harus mengembalikan 0 jika query mengembalikan empty array", async () => {
    mockWhere.mockResolvedValueOnce([])
    const { getMyTotalDividend } =
      await import("@/features/profit-sharing/profit-sharing.queries")
    const result = await getMyTotalDividend("user-empty")
    expect(result).toBe(0)
  })
})
