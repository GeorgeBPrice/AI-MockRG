 "use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TemplateCard from "@/components/templates/template-card";
import { searchTemplates } from "@/lib/templates";
import { SchemaTemplateCategory, TemplateSelection } from "@/types/template";
import Skeleton from "@/components/ui/skeleton";

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
];

const categoryLabel = (category: SchemaTemplateCategory | "all") =>
  category === "all" ? "All" : category.charAt(0).toUpperCase() + category.slice(1);

export default function TemplatesPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<SchemaTemplateCategory | "all">("all");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  const templates = useMemo(
    () =>
      searchTemplates({
        query,
        category: activeCategory === "all" ? undefined : activeCategory,
      }),
    [query, activeCategory]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 200);
    return () => window.clearTimeout(timer);
  }, []);

  const showSkeletonContent = isLoading;

  const handleUseTemplate = (selection: TemplateSelection) => {
    const params = new URLSearchParams({
      templateSchema: encodeURIComponent(selection.schema),
      templateType: selection.schemaType,
      templateName: selection.template.name,
      from: "templates",
    });

    router.push(`/generator?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <section className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Templates</p>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold leading-tight">Sample Template Schemas</h1>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Browse sample templates and load them directly into the generator.
          </p>
        </div>
      </section>
      </div>

      <div className="flex flex-wrap gap-2 max-sm:-mx-1 max-sm:px-1">
        {showSkeletonContent
          ? Array.from({ length: 6 }).map((_, index) => (
              <Skeleton
                key={`category-skeleton-${index}`}
                className="h-9 w-24 rounded-full"
              />
            ))
          : categories.map((category) => (
              <Button
                key={category}
                variant="ghost"
                size="sm"
                className={`rounded-full px-3 text-[11px] font-semibold uppercase tracking-widest max-sm:px-2 ${
                  activeCategory === category ? "text-white" : "text-muted-foreground hover:text-white/80"
                }`}
                onClick={() => setActiveCategory(category)}
              >
                {categoryLabel(category)}
              </Button>
            ))}
      </div>

      <div>
        {showSkeletonContent ? (
          <Skeleton className="h-10 w-full rounded-2xl" />
        ) : (
          <Input
            placeholder="Search templates (name, tags, schema)..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="max-sm:text-sm"
          />
        )}
      </div>

      {showSkeletonContent ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`template-skeleton-${index}`}
              className="page-card template-card-shell flex flex-col gap-4 border border-white/10 p-6 text-slate-300"
            >
              <Skeleton className="h-6 w-40 rounded-full" />
              <Skeleton className="h-3 w-32 rounded-full" />
              <Skeleton className="h-32 w-full rounded-2xl" />
              <div className="flex justify-between gap-3">
                <Skeleton className="h-8 w-20 rounded-full" />
                <Skeleton className="h-10 w-28 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <TemplateCard key={template.id} template={template} onUse={handleUseTemplate} />
          ))}
        </div>
      )}
    </div>
  );
}

