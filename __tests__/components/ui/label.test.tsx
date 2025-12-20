/**
 * @jest-environment jsdom
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

jest.mock("@/lib/utils", () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(" "),
}))

import { Label } from "@/components/ui/label"

describe("Label component", () => {
  it("renders the label root with the provided text and classes", () => {
    render(
      <Label data-testid="label-root" className="custom-label">
        Label Text
      </Label>
    )

    const label = screen.getByTestId("label-root")
    expect(label).toHaveTextContent("Label Text")
    expect(label).toHaveAttribute("data-slot", "label")
    expect(label).toHaveClass("flex", "items-center", "custom-label")
  })

  it("supports disabled styling via attributes", () => {
    render(
      <Label data-testid="label-disabled" disabled>
        Disabled
      </Label>
    )

    expect(screen.getByTestId("label-disabled")).toHaveClass(
      "group-data-[disabled=true]:pointer-events-none"
    )
  })
})

