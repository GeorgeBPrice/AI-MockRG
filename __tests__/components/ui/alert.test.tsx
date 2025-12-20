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
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

describe("Alert components", () => {
  it("renders default alert with expected classes", () => {
    render(
      <Alert data-testid="alert-default">
        <AlertTitle>Title</AlertTitle>
        <AlertDescription>Description</AlertDescription>
      </Alert>
    )

    const alert = screen.getByTestId("alert-default")
    expect(alert).toHaveRole("alert")
    expect(alert).toHaveClass("bg-background", "text-foreground")
    expect(screen.getByText("Title")).toHaveClass("font-medium")
    expect(screen.getByText("Description")).toHaveClass("text-sm")
  })

  it("applies destructive variant classes", () => {
    render(
      <Alert variant="destructive" data-testid="alert-destructive">
        Destructive
      </Alert>
    )

    const alert = screen.getByTestId("alert-destructive")
    expect(alert).toHaveClass("border-destructive/50", "text-destructive")
  })
})

