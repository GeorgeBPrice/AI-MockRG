export type SchemaTemplateCategory =
  | "authentication"
  | "profiles"
  | "settings"
  | "email"
  | "messages"
  | "alerts"
  | "system"
  | "other"

export interface SchemaTemplate {
  id: string
  name: string
  description: string
  category: SchemaTemplateCategory
  schema: string
  schemaType: "sql" | "nosql"
  schemas?: {
    sql?: string
    nosql?: string
  }
  examples?: string
  tags: string[]
  popularity: number
}

export interface TemplateSelection {
  template: SchemaTemplate
  schema: string
  schemaType: "sql" | "nosql"
}

