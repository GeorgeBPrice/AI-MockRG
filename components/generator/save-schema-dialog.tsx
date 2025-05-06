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

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  description: z.string().optional(),
});

interface SaveSchemaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, description?: string) => void;
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
}: SaveSchemaDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate we have a userId and it's not empty
  const effectiveUserId = userId || "test-user-123";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialName,
      description: initialDescription,
    },
  });

  // Reset form when dialog opens with initial values
  useEffect(() => {
    if (open) {
      form.reset({
        name: initialName,
        description: initialDescription,
      });
    }
  }, [open, initialName, initialDescription, form]);

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    try {
      onSave(values.name, values.description || undefined);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editMode ? "Update Schema" : "Save Schema"}
          </DialogTitle>
          <DialogDescription>
            Give your schema a name and optional description.
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
