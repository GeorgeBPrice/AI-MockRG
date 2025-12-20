import { useMemo, useState } from "react"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import TemplateCard from "@/components/templates/template-card"
import { searchTemplates } from "@/lib/templates"
import { SchemaTemplateCategory, TemplateSelection } from "@/types/template"
import { cn } from "@/lib/utils"
import { Layers, Search } from "lucide-react"

type TemplatePickerProps = {
  triggerLabel: string
  onSelect: (selection: TemplateSelection) => void
}

const categoryBadge = (category: SchemaTemplateCategory | "all") => {
  return category === "all" ? "All" : category.charAt(0).toUpperCase() + category.slice(1)
}

const categories: (SchemaTemplateCategory | "all")[] = [
  "all",
  "authentication",
  "profiles",
  "settings",
  "email",
  "messages",
  "alerts",
  "system",
  "other",
]

export default function TemplatePicker({ triggerLabel, onSelect }: TemplatePickerProps) {
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<SchemaTemplateCategory | "all">("all")
  const [isOpen, setIsOpen] = useState(false)

  const templates = useMemo(
    () =>
      searchTemplates({
        query,
        category: activeCategory === "all" ? undefined : activeCategory,
      }),
    [query, activeCategory]
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="flex items-center gap-1">
          <Layers className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="page-card template-dialog max-w-[95vw] sm:!max-w-[1200px] sm:w-[min(95vw,1200px)]"
      >
        <DialogHeader>
          <DialogTitle>Browse Schema Templates</DialogTitle>
          <DialogDescription>
            Load a template to jumpstart your schema, then tweak it as needed.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-1">
          {categories.map((category) => (
            <Button
              key={category}
              variant="ghost"
              size="sm"
              className={cn(
                "rounded-full px-2 text-[11px] m font-semibold uppercase tracking-widest max-sm:text-[10px] max-sm:px-1",
                activeCategory === category ? "text-white" : "text-muted-foreground hover:text-white/80"
              )}
              onClick={() => setActiveCategory(category)}
            >
              {categoryBadge(category)}
            </Button>
          ))}
        </div>
        <div>
          <div className="relative w-full">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
              <Search className="h-4 w-4" />
            </span>
            <Input
              placeholder="Search templates (name, tags, schema)..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto pr-1 max-sm:max-h-[60vh]">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-muted/60 bg-muted/10 p-6 text-center text-sm text-muted-foreground">
                No templates match your search yet.
              </div>
            ) : (
              templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onUse={(selection) => {
                    onSelect(selection)
                    setIsOpen(false)
                  }}
                />
              ))
            )}
          </div>
        </div>

        <DialogFooter className="mt-6 border-t pt-4">
          <DialogClose asChild>
            <Button variant="outline" size="sm">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

