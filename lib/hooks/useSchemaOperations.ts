"use client";

import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import {
  SavedSchema,
  getSchemas as getLocalSchemas,
  getSchema as getLocalSchema,
  saveSchema as saveLocalSchema,
  updateSchema as updateLocalSchema,
  deleteSchema as deleteLocalSchema,
} from "@/lib/storage";

// This hook provides schema operations with API calls and local fallbacks
export function useSchemaOperations(userId: string) {
  const [loading, setLoading] = useState(false);

  // Get all schemas
  const getSchemas = async (): Promise<SavedSchema[]> => {
    setLoading(true);

    try {
      const response = await fetch("/api/schemas");

      if (!response.ok) {
        throw new Error("API request failed");
      }

      const data = await response.json();
      return Array.isArray(data.schemas) ? data.schemas : [];
    } catch (apiError) {
      console.error("API fetch failed, using local storage:", apiError);

      // Fallback to local storage
      try {
        const localSchemas = await getLocalSchemas(userId);
        return Array.isArray(localSchemas) ? localSchemas : [];
      } catch (localError) {
        console.error("Local storage fetch failed:", localError);
        toast({
          title: "Error",
          description: "Failed to load schemas from any source",
          variant: "destructive",
        });
        return [];
      }
    } finally {
      setLoading(false);
    }
  };

  // Get a single schema
  const getSchema = async (schemaId: string): Promise<SavedSchema | null> => {
    setLoading(true);

    try {
      const response = await fetch(`/api/schemas/${schemaId}`);

      if (!response.ok) {
        throw new Error("API request failed");
      }

      const data = await response.json();
      return data.schema || null;
    } catch (apiError) {
      console.error("API fetch failed, using local storage:", apiError);

      // Fallback to local storage
      try {
        const schema = await getLocalSchema(userId, schemaId);
        return schema;
      } catch (localError) {
        console.error("Local storage fetch failed:", localError);
        toast({
          title: "Error",
          description: "Failed to load schema from any source",
          variant: "destructive",
        });
        return null;
      }
    } finally {
      setLoading(false);
    }
  };

  // Save a new schema
  const saveSchema = async (schemaData: {
    name: string;
    description?: string;
    schema: string;
    schemaType: "sql" | "nosql";
  }): Promise<SavedSchema | null> => {
    setLoading(true);

    try {
      const response = await fetch("/api/schemas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(schemaData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `API request failed: ${errorData.message || "Unknown error"}`
        );
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: "Schema saved successfully",
      });

      return data.schema || null;
    } catch (apiError) {
      console.error("API save failed, using local storage:", apiError);

      // Fallback to local storage
      try {
        if (!userId) {
          throw new Error("User ID is required for direct storage");
        }

        const savedSchema = await saveLocalSchema(userId, schemaData);
        toast({
          title: "Success",
          description: "Schema saved locally (offline mode)",
        });
        return savedSchema;
      } catch (localError) {
        console.error("Local storage save failed:", localError);
        toast({
          title: "Error",
          description: "Failed to save schema to any source",
          variant: "destructive",
        });
        return null;
      }
    } finally {
      setLoading(false);
    }
  };

  // Update an existing schema
  const updateSchema = async (
    schemaId: string,
    updates: {
      name?: string;
      description?: string;
      schema?: string;
      schemaType?: "sql" | "nosql";
    }
  ): Promise<SavedSchema | null> => {
    setLoading(true);

    try {
      const response = await fetch(`/api/schemas/${schemaId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `API request failed: ${errorData.message || "Unknown error"}`
        );
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: "Schema updated successfully",
      });

      return data.schema || null;
    } catch (apiError) {
      console.error("API update failed, using local storage:", apiError);

      // Fallback to local storage
      try {
        const updatedSchema = await updateLocalSchema(
          userId,
          schemaId,
          updates
        );

        if (updatedSchema) {
          toast({
            title: "Success",
            description: "Schema updated locally (offline mode)",
          });
        } else {
          console.warn("Schema not found in local storage");
          toast({
            title: "Error",
            description: "Schema not found locally",
            variant: "destructive",
          });
        }
        return updatedSchema;
      } catch (localError) {
        console.error("Local storage update failed:", localError);
        toast({
          title: "Error",
          description: "Failed to update schema in any source",
          variant: "destructive",
        });
        return null;
      }
    } finally {
      setLoading(false);
    }
  };

  // Delete a schema
  const deleteSchema = async (schemaId: string): Promise<boolean> => {
    setLoading(true);

    try {
      const response = await fetch(`/api/schemas/${schemaId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `API request failed: ${errorData.message || "Unknown error"}`
        );
      }

      console.log("Schema deleted via API");
      toast({
        title: "Success",
        description: "Schema deleted successfully",
      });

      return true;
    } catch (apiError) {
      console.error("API delete failed, using local storage:", apiError);

      // Fallback to local storage
      try {
        const success = await deleteLocalSchema(userId, schemaId);

        if (success) {
          console.log("Schema deleted from local storage");
          toast({
            title: "Success",
            description: "Schema deleted locally (offline mode)",
          });
        } else {
          console.warn("Schema not found in local storage");
          toast({
            title: "Error",
            description: "Schema not found locally",
            variant: "destructive",
          });
        }
        return success;
      } catch (localError) {
        console.error("Local storage delete failed:", localError);
        toast({
          title: "Error",
          description: "Failed to delete schema from any source",
          variant: "destructive",
        });
        return false;
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getSchemas,
    getSchema,
    saveSchema,
    updateSchema,
    deleteSchema,
  };
}
