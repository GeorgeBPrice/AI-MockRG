import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2, X } from "lucide-react"

export const generationSteps = [
  { id: "parsing", label: "Parsing schema" },
  { id: "generating", label: "Generating data" },
  { id: "formatting", label: "Formatting output" },
] as const

export type StepId = (typeof generationSteps)[number]["id"]

type GenerationProgressProps = {
  currentStep: StepId
  progress: number
  description?: string
  onCancel?: () => void
  isCancelable?: boolean
}

export default function GenerationProgress({
  currentStep,
  progress,
  description,
  onCancel,
  isCancelable,
}: GenerationProgressProps) {
  const normalizedProgress = Math.min(Math.max(Math.round(progress), 0), 100)
  const activeIndex = generationSteps.findIndex((step) => step.id === currentStep)

  return (
    <div className="rounded-2xl border border-border/60 bg-background/60 p-4 shadow-lg backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {currentStep === "parsing"
              ? "Parsing schema"
              : currentStep === "generating"
              ? "Generating data"
              : "Formatting output"}
          </p>
          <p className="text-sm font-medium text-foreground">{description || "Preparing your mock records"}</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border/40 bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          {normalizedProgress}%
        </div>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted-foreground/20">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
          style={{ width: `${normalizedProgress}%` }}
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {generationSteps.map((step, index) => {
          const status = index < activeIndex ? "completed" : index === activeIndex ? "active" : "pending"
          return (
            <div
              key={step.id}
              className="flex gap-2 rounded-xl border border-border/40 bg-muted/30 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              {status === "completed" ? (
                <CheckCircle className="h-4 w-4 text-success" />
              ) : status === "active" ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <span className="h-3 w-3 rounded-full bg-muted-foreground/70" />
              )}
              <span className={status === "active" ? "text-foreground" : undefined}>{step.label}</span>
            </div>
          )
        })}
      </div>

      {isCancelable && onCancel ? (
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      ) : null}
    </div>
  )
}

