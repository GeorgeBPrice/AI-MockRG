"use client";

import { useState, useEffect } from "react";
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

export default function NewSchemaPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSaving, setIsSaving] = useState(false);
  const [schema, setSchema] = useState("");
  const [schemaType, setSchemaType] = useState<"sql" | "nosql">("sql");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [preferredFormat, setPreferredFormat] = useState("json");
  const [preferredRecordCount, setPreferredRecordCount] = useState(10);

  useEffect(() => {
    if (status === "unauthenticated") {
      signIn();
    }
  }, [status, router]);

  const handleSave = async () => {
    if (status !== "authenticated" || !session?.user?.id) {
       toast({ title: "Error", description: "You must be logged in to save.", variant: "destructive" });
       return;
    }

    if (!name.trim()) {
      toast({ title: "Name Required", description: "Please enter a name for your schema", variant: "destructive" });
      return;
    }
    if (!schema.trim()) {
      toast({ title: "Schema Required", description: "Please define your schema structure", variant: "destructive" });
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch("/api/schemas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
                name,
                description: description || undefined,
                schema,
                schemaType,
                additionalInstructions: additionalInstructions || undefined,
                preferredFormat,
                preferredRecordCount,
          })
      });

      if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to save: ${response.statusText}`);
      }

      await response.json();

      toast({ title: "Schema Saved", description: `Schema "${name}" saved successfully.` });
      router.push("/saved");

    } catch (error) {
      toast({ title: "Save Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading") {
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
        <h1 className="text-3xl font-bold">Create New Schema</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => router.push("/saved")}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSaving ? "Saving..." : "Save Schema"}
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
            <Label htmlFor="additionalInstructions">Additional Instructions (Optional)</Label>
            <Textarea
              id="additionalInstructions"
              placeholder="e.g., Generate names suitable for a fantasy setting. Ensure email addresses are unique."
              className="resize-none h-24"
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Specific instructions for the AI when generating data based on this schema.
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
