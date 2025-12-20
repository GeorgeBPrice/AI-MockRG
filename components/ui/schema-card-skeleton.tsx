import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import Skeleton from "@/components/ui/skeleton"

export default function SchemaCardSkeleton() {
  return (
    <Card className="flex animate-pulse flex-col gap-2 border-border/60 bg-background/30 shadow-none">
      <CardHeader className="space-y-2 px-6 pt-6">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-4 w-1/4" />
      </CardHeader>
      <CardContent className="space-y-3 px-6 pb-2">
        <Skeleton className="h-20 w-full" />
      </CardContent>
      <CardFooter className="flex items-center justify-between px-6 pb-6 pt-0">
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-20 rounded-full" />
      </CardFooter>
    </Card>
  )
}

