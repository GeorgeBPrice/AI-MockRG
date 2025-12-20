import * as React from "react"

import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="presentation"
      className={cn(
        "animate-pulse rounded-lg bg-muted-foreground/10 shadow-inner dark:bg-muted-foreground/20",
        className
      )}
      {...props}
    />
  )
}

export default Skeleton

