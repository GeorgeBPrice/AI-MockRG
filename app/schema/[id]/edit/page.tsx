"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SchemaEditor from "@/components/generator/schema-editor";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface SchemaEditPageProps {
  params: Promise<{ id: string }>;
}

export default function SchemaEditPage({ params }: SchemaEditPageProps) {
  const { id: schemaId } = use(params);
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [schema, setSchema] = useState("");
  const [schemaType, setSchemaType] = useState<"sql" | "nosql">("sql");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [preferredFormat, setPreferredFormat] = useState("json");
  const [preferredRecordCount, setPreferredRecordCount] = useState(10);

  const fetchSchema = useCallback(async () => {
    if (status === "authenticated" && schemaId) {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/schemas/${schemaId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Schema not found.");
          } else if (response.status === 401) {
            throw new Error("Unauthorized to view this schema.");
          } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              errorData.error || `Failed to load schema: ${response.statusText}`
            );
          }
        }
        const data = await response.json();
        if (data.schema) {
          setSchema(data.schema.schema);
          setSchemaType(data.schema.schemaType);
          setName(data.schema.name);
          setDescription(data.schema.description || "");
          setAdditionalInstructions(data.schema.additionalInstructions || "");
          setPreferredFormat(data.schema.preferredFormat || "json");
          setPreferredRecordCount(data.schema.preferredRecordCount || 10);
        } else {
          throw new Error("Schema data not found in response.");
        }
      } catch (error) {
        console.error(`Error loading schema:`, error);
        toast({
          title: "Load Failed",
          description: (error as Error).message,
          variant: "destructive",
        });
        router.push("/saved");
      } finally {
        setIsLoading(false);
      }
    } else if (status === "unauthenticated") {
      signIn();
    } else {
      if (!schemaId) {
        toast({
          title: "Error",
          description: "Schema ID not found.",
          variant: "destructive",
        });
        router.push("/saved");
      }
      if (status !== "loading") setIsLoading(false);
    }
  }, [schemaId, status, router]);

  useEffect(() => {
    fetchSchema();
  }, [fetchSchema]);

  const handleSave = async () => {
    if (status !== "authenticated" || !session?.user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to save.",
        variant: "destructive",
      });
      return;
    }
    if (!name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your schema",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch(`/api/schemas/${schemaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          schema,
          schemaType,
          additionalInstructions: additionalInstructions || undefined,
          preferredFormat,
          preferredRecordCount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to update: ${response.statusText}`
        );
      }

      await response.json();

      toast({ title: "Success", description: "Schema updated successfully" });
      router.push("/saved");
    } catch (error) {
      console.error(`Error saving schema:`, error);
      toast({
        title: "Save Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status !== "authenticated") {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Edit Schema</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => router.push("/saved")}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schema Details</CardTitle>
          <CardDescription>Basic information about your schema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="My Database Schema"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of what this schema is for..."
              className="resize-none h-24"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="additionalInstructions">
              Additional Instructions (Optional)
            </Label>
            <Textarea
              id="additionalInstructions"
              placeholder="e.g., Generate names suitable for a fantasy setting..."
              className="resize-none h-24"
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Specific instructions for the AI when generating data based on
              this schema.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Generation Settings</CardTitle>
          <CardDescription>
            Configure how records are generated by default
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="preferred-format">Default Output Format</Label>
            <Select value={preferredFormat} onValueChange={setPreferredFormat}>
              <SelectTrigger id="preferred-format">
                <SelectValue placeholder="Select output format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="xlsx">XLSX</SelectItem>
                <SelectItem value="xml">XML</SelectItem>
                <SelectItem value="txt">TXT (Tab Separated)</SelectItem>
                <SelectItem value="sql">SQL INSERT</SelectItem>
                <SelectItem value="html">HTML Table</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="record-count" className="text-sm font-medium">
                Default Number of Records: {preferredRecordCount}
              </Label>
            </div>
            <Slider
              id="record-count"
              min={1}
              max={100}
              step={1}
              value={[preferredRecordCount]}
              onValueChange={(value) => setPreferredRecordCount(value[0])}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Schema Definition</CardTitle>
          <CardDescription>
            Define your database schema structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SchemaEditor value={schema} onChange={setSchema} type={schemaType} />
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setSchemaType("sql")}
              className={schemaType === "sql" ? "bg-primary/10" : ""}
            >
              SQL
            </Button>
            <Button
              variant="outline"
              onClick={() => setSchemaType("nosql")}
              className={schemaType === "nosql" ? "bg-primary/10" : ""}
            >
              NoSQL
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
