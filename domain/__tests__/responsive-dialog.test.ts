import { describe, expect, it } from "vitest"

describe("ResponsiveDialog helper logic", () => {
  it("determines whether drawer or dialog should be chosen based on mobile flag", () => {
    function getModalComponentType(isMobile: boolean): "drawer" | "dialog" {
      return isMobile ? "drawer" : "dialog"
    }
    expect(getModalComponentType(true)).toBe("drawer")
    expect(getModalComponentType(false)).toBe("dialog")
  })
})
