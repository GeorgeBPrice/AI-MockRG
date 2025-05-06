"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { SavedSchema } from "@/lib/storage";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Database, ExternalLink, Calendar, FilePlus, RefreshCcw } from "lucide-react";
import DeleteSchemaButton from "@/components/generator/delete-schema-button";
import { toast } from "@/components/ui/use-toast";
import { useSession } from "next-auth/react";

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function SavedSchemasPage() {
  const { status } = useSession();
  const [schemas, setSchemas] = useState<SavedSchema[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isFetchingRef = useRef(false);

  const fetchSchemas = useCallback(async () => {
    if (isFetchingRef.current) {
        return;
    }

    if (status !== 'authenticated') {
        setSchemas([]);
        return;
    }

    setIsLoading(true);
    isFetchingRef.current = true;
    try {
      const response = await fetch('/api/schemas');

      if (!response.ok) {
        if (response.status === 401) {
          console.error("Unauthorized: Not logged in.");
          setSchemas([]);
        } else {
           const errorData = await response.json().catch(() => ({}));
           throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
      } else {
        const data = await response.json();
        setSchemas(Array.isArray(data.schemas) ? data.schemas : []);
      }
    } catch (error) {
      console.error("Error fetching schemas:", error);
      toast({
        title: "Error Loading Schemas",
        description: (error as Error).message || "Could not load saved schemas.",
        variant: "destructive",
      });
      setSchemas([]);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated') {
       if (!isFetchingRef.current) {
         fetchSchemas();
       }
    }
    if (status === 'unauthenticated') {
       setSchemas([]);
       setIsLoading(false);
    }
  }, [status, fetchSchemas]);

  const handleSchemaDeleted = (schemaId: string) => {
    setSchemas((current) => current.filter((schema) => schema.id !== schemaId));
    toast({ 
      title: "Schema Deleted", 
      description: "The schema has been successfully deleted.",
      variant: "success"
    });
  };

  const handleRefresh = useCallback(() => {
      if (status === 'authenticated') {
         if (!isFetchingRef.current) {
            fetchSchemas();
         }
      } else {
          toast({title: "Not Logged In", description: "Please log in to view saved schemas."}) 
      }
  }, [status, fetchSchemas]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
         <div className="text-center py-12">
          <Database className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Please Log In</h3>
          <p className="text-muted-foreground">
            Log in to view and manage your saved schemas.
          </p>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Saved Schemas</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? "Loading..." : "Refresh"}
          </Button>
          <Button asChild>
            <Link href="/schema/new">
              <FilePlus className="mr-2 h-4 w-4" />
              New Schema
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : schemas.length === 0 ? (
        <div className="text-center py-12">
          <Database className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No schemas saved yet</h3>
          <p className="text-muted-foreground">
            Create and save a schema using the generator to access it here.
          </p>
          <Button className="mt-4" asChild>
             <Link href="/schema/new">Create New Schema</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schemas.map((schema) => (
            <SchemaCard
              key={schema.id}
              schema={schema}
              onDelete={handleSchemaDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SchemaCard({ schema, onDelete }: {
    schema: SavedSchema;
    onDelete: (schemaId: string) => void;
}) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

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
          {userId && (
            <DeleteSchemaButton
                schemaId={schema.id}
                userId={userId}
                onSuccess={() => onDelete(schema.id)}
            />
          )}
          <Button variant="outline" size="sm" asChild disabled={!userId}>
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
        <Button variant="default" size="sm" className="ml-2" asChild>
          <Link href={`/generator?schema=${schema.id}&from=saved`}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Load
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
