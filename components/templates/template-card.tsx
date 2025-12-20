import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { SchemaTemplate, TemplateSelection } from "@/types/template"

type TemplateCardProps = {
  template: SchemaTemplate
  onUse: (selection: TemplateSelection) => void
}

export default function TemplateCard({ template, onUse }: TemplateCardProps) {
  const [selectedType, setSelectedType] = useState<"sql" | "nosql">(template.schemaType)

  const schemaText = useMemo(() => {
    const fallback =
      template.schemas?.[selectedType] ??
      template.schema ??
      `/* Coming soon: ${selectedType.toUpperCase()} version */`

    if (!template.schemas?.[selectedType] && template.schemas) {
      return `/* Coming soon: ${selectedType.toUpperCase()} version */`
    }

    return fallback
  }, [selectedType, template.schema, template.schemas])

  const hasSql = !!(template.schemas?.sql || template.schemaType === "sql")
  const hasNosql = !!(template.schemas?.nosql || template.schemaType === "nosql")

  return (
    <Card className="page-card template-card-shell flex h-full flex-col gap-4 border-white/10 shadow-[0_30px_60px_rgba(15,23,42,0.45)]">
      <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold text-white sm:text-lg">{template.name}</CardTitle>
            <p className="text-sm leading-relaxed text-white/70">{template.description}</p>
          </div>
          <div className="flex items-center self-start rounded-full border border-white/10 bg-white/5 p-1 text-xs font-semibold uppercase tracking-widest text-white/70">
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 px-3 text-[11px] ${selectedType === "sql" ? "bg-white/15 text-white" : "text-white/70"}`}
              onClick={() => setSelectedType("sql")}
              disabled={!hasSql}
            >
              SQL
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 px-3 text-[11px] ${selectedType === "nosql" ? "bg-white/15 text-white" : "text-white/70"}`}
              onClick={() => setSelectedType("nosql")}
              disabled={!hasNosql}
            >
              NoSQL
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-0 sm:px-6">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span className="rounded-full bg-white/10 px-3 py-1 text-white">{selectedType.toUpperCase()}</span>
          <span className="text-white/70">{template.category}</span>
        </div>
        <pre className="template-schema-preview mt-3 max-h-32 overflow-auto rounded-lg border border-white/10 bg-slate-900/80 p-3 text-[0.72rem] leading-relaxed text-white/80 sm:text-[0.75rem]">
          {schemaText.trim()}
        </pre>
      </CardContent>
      <CardFooter className="mt-auto flex flex-col gap-3 px-4 pb-5 pt-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:px-6 sm:pb-6">
        <div className="flex flex-wrap gap-2">
          {template.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[11px]">
              {tag}
            </Badge>
          ))}
        </div>
        <Button
          size="sm"
          className="template-use-button text-xs uppercase tracking-widest w-full sm:w-auto"
          onClick={() =>
            onUse({
              template,
              schema: schemaText,
              schemaType: selectedType,
            })
          }
        >
          Use Template
        </Button>
      </CardFooter>
    </Card>
  )
}

