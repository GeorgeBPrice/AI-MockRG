import { SavedSchema } from "@/lib/storage";
import { Calendar, Link, ExternalLink } from "lucide-react";
import DeleteSchemaButton from "../generator/delete-schema-button";
import { Button } from "../ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../ui/card";

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export const SchemaCard: React.FC<{
  schema: SavedSchema;
  userId: string;
  onDelete: (schemaId: string) => void;
}> = ({ schema, userId, onDelete }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="line-clamp-1">{schema.name}</CardTitle>
            <CardDescription className="flex items-center mt-1">
              <Calendar className="mr-1 h-3 w-3" />
              {formatDate(schema.updatedAt)}
            </CardDescription>
          </div>
          <div className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
            {schema.schemaType.toUpperCase()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {schema.description ? (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {schema.description}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">No description</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex space-x-2">
          <DeleteSchemaButton
            schemaId={schema.id}
            userId={userId}
            onSuccess={() => onDelete(schema.id)}
          />
          <Button variant="outline" size="sm" asChild>
            <Link href={`/schema/${schema.id}/edit`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit
            </Link>
          </Button>
        </div>
        <Button variant="default" size="sm" asChild>
          <Link href={`/generator?schema=${schema.id}`}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Load
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};
