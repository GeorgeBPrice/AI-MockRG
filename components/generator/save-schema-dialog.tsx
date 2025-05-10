"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { saveSchema } from "@/lib/storage"; // Direct import for fallback
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  preferredFormat: z.string().optional(),
  preferredRecordCount: z.number().min(1).max(100).optional(),
});

interface SaveSchemaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, description?: string, preferredFormat?: string, preferredRecordCount?: number) => void;
  onSuccess?: (schemaId: string) => void;
  schemaData?: {
    schema: string;
    schemaType: "sql" | "nosql";
  };
  initialName?: string;
  initialDescription?: string;
  userId: string;
  editMode?: boolean;
  schemaId?: string;
  handleApiCall?: boolean;
  preferredFormat?: string;
  preferredRecordCount?: number;
}

export function SaveSchemaDialog({
  open,
  onOpenChange,
  onSave,
  onSuccess,
  schemaData = { schema: "", schemaType: "sql" },
  initialName = "",
  initialDescription = "",
  userId,
  editMode = false,
  schemaId = "",
  handleApiCall = true,
  preferredFormat = "json",
  preferredRecordCount = 10,
}: SaveSchemaDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recordCount, setRecordCount] = useState(preferredRecordCount);

  // Validate we have a userId and it's not empty
  const effectiveUserId = userId || "test-user-123";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialName,
      description: initialDescription,
      preferredFormat: preferredFormat,
      preferredRecordCount: preferredRecordCount,
    },
  });

  // Reset form when dialog opens with initial values
  useEffect(() => {
    if (open) {
      form.reset({
        name: initialName,
        description: initialDescription,
        preferredFormat: preferredFormat,
        preferredRecordCount: preferredRecordCount,
      });
      setRecordCount(preferredRecordCount);
    }
  }, [open, initialName, initialDescription, preferredFormat, preferredRecordCount, form]);

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    try {
      onSave(
        values.name, 
        values.description || undefined, 
        values.preferredFormat, 
        values.preferredRecordCount || recordCount
      );

      // Only continue with API calls if user configured them
      if (handleApiCall) {
        if (editMode && schemaId) {
          // Update existing schema via API
          try {
            const response = await fetch(`/api/schemas/${schemaId}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: values.name,
                description: values.description || undefined,
                preferredFormat: values.preferredFormat,
                preferredRecordCount: values.preferredRecordCount || recordCount,
              }),
            });

            if (!response.ok) {
              throw new Error("API call failed");
            }

            const data = await response.json();
            if (onSuccess) onSuccess(data.schema.id);
          } catch (apiError) {
            console.error("API update failed, using direct storage:", apiError);
            toast({
              title: "Warning",
              description:
                "Changes may not be saved to the server. Please try again later.",
              variant: "destructive",
            });
          }
        } else {
          try {
            const response = await fetch("/api/schemas", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: values.name,
                description: values.description || undefined,
                schema: schemaData.schema,
                schemaType: schemaData.schemaType,
                preferredFormat: values.preferredFormat,
                preferredRecordCount: values.preferredRecordCount || recordCount,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(
                `API call failed: ${
                  errorData.error || errorData.message || "Unknown error"
                }`
              );
            }

            const data = await response.json();
            if (onSuccess && data.schema && data.schema.id) {
              onSuccess(data.schema.id);
            }
          } catch (apiError) {
            console.error("API save failed, using direct storage:", apiError);

            // Fallback to direct storage method
            try {
              if (!effectiveUserId) {
                throw new Error(
                  "User ID is required for direct storage fallback"
                );
              }

              const savedSchema = await saveSchema(effectiveUserId, {
                name: values.name,
                description: values.description || undefined,
                schema: schemaData.schema,
                schemaType: schemaData.schemaType,
              });

              if (savedSchema && onSuccess) {
                onSuccess(savedSchema.id);
              }
            } catch (storageError) {
              console.error("Direct storage also failed:", storageError);
              toast({
                title: "Save Failed",
                description: "Could not save schema using any method.",
                variant: "destructive",
              });
              throw storageError;
            }
          }
        }
      }

      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Save Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Update the form when the record count changes
  const handleRecordCountChange = (value: number[]) => {
    setRecordCount(value[0]);
    form.setValue('preferredRecordCount', value[0]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editMode ? "Update Schema" : "Save Schema"}
          </DialogTitle>
          <DialogDescription>
            Give your schema a name and configure optional settings.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Database Schema" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of this schema..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4 pt-2 border-t">
              <h3 className="text-sm font-medium">Default Generation Settings</h3>
              
              <FormField
                control={form.control}
                name="preferredFormat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Output Format</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select output format" />
                        </SelectTrigger>
                      </FormControl>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label htmlFor="record-count" className="text-sm font-medium">
                  Default Record Count: {recordCount}
                </Label>
                <Slider
                  id="record-count"
                  min={1}
                  max={100}
                  step={1}
                  value={[recordCount]}
                  onValueChange={handleRecordCountChange}
                  className="w-full"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : editMode
                  ? "Update Schema"
                  : "Save Schema"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
