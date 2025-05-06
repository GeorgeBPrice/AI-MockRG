"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

interface DeleteSchemaButtonProps {
  schemaId: string;
  userId: string;
  onSuccess?: () => void;
}

export default function DeleteSchemaButton({
  schemaId,
  // userId,
  onSuccess,
}: DeleteSchemaButtonProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      // Try API call first for better persistence
      try {
        const response = await fetch(`/api/schemas/${schemaId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Failed to delete schema via API"
          );
        }

        // Call onSuccess and show toast
        if (onSuccess) {
          // Let parent handle the toast notification
          onSuccess();
        } else {
          // Only show toast if parent handler doesn't exist
          toast({
            title: "Success",
            description: "Schema deleted successfully",
            variant: "success"
          });
          
          // Refresh the page to update the list
          router.refresh();
        }

        return;
      } catch (apiError) {
        console.error("API delete failed:", apiError);

        toast({
          title: "Warning",
          description:
            "Unable to delete schema via API, trying direct method...",
          variant: "destructive",
        });

        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setOpen(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this schema. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
