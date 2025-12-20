/**
 * @jest-environment jsdom
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

jest.mock("@/lib/utils", () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(" "),
}))

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

describe("Card components", () => {
  it("renders the Card wrapper and inner surface with provided props", () => {
    render(
      <Card data-testid="card-inner" className="extra-class">
        card body
      </Card>
    )

    const inner = screen.getByTestId("card-inner")
    expect(inner).toBeInTheDocument()
    expect(inner).toHaveClass("min-h-full", "extra-class")

    const outer = inner.closest("[data-slot='card']")
    expect(outer).toBeInTheDocument()
    expect(outer).toHaveStyle(
      "background-image: linear-gradient(135deg, var(--card-gradient-start), var(--card-gradient-middle), var(--card-gradient-end))"
    )
  })

  it("applies slot classes for header, title, and description", () => {
    render(
      <Card>
        <CardHeader data-testid="card-header">
          <CardTitle data-testid="card-title">Title</CardTitle>
          <CardDescription data-testid="card-description">
            Description
          </CardDescription>
        </CardHeader>
      </Card>
    )

    const header = screen.getByTestId("card-header")
    expect(header).toHaveAttribute("data-slot", "card-header")
    expect(header).toHaveClass("grid", "items-start")

    expect(screen.getByTestId("card-title")).toHaveClass("font-semibold")
    expect(screen.getByTestId("card-description")).toHaveClass(
      "text-muted-foreground"
    )
  })

  it("renders action, content, and footer slots", () => {
    render(
      <Card>
        <CardContent data-testid="card-content">Content</CardContent>
        <CardAction data-testid="card-action">Action</CardAction>
        <CardFooter data-testid="card-footer">Footer</CardFooter>
      </Card>
    )

    expect(screen.getByTestId("card-content")).toHaveClass("px-6")
    expect(screen.getByTestId("card-action")).toHaveAttribute(
      "data-slot",
      "card-action"
    )
    expect(screen.getByTestId("card-footer")).toHaveClass("flex")
  })
})

