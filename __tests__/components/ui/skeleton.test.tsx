/**
 * @jest-environment jsdom
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

jest.mock("@/lib/utils", () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(" "),
}))

import Skeleton from "@/components/ui/skeleton"

describe("Skeleton component", () => {
  it("renders the skeleton surface with default classes", () => {
    render(<Skeleton data-testid="skeleton" className="extra" />)

    const skeleton = screen.getByTestId("skeleton")
    expect(skeleton).toHaveAttribute("role", "presentation")
    expect(skeleton).toHaveClass("animate-pulse", "rounded-lg", "extra")
  })
})

