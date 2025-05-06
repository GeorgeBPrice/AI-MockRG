"use client";

// This file is a compatibility layer to ensure any code using sonner
// will use our custom toast system instead

import { toast as customToast } from "@/components/ui/use-toast";

// Provide a mock component that does nothing
// This prevents errors in case the Toaster component is used directly
const Toaster = () => {
  return null; // Return nothing, we're using our custom Toaster instead
};

// Provide a toast function that maps to our custom toast system
interface ToastMessage {
  title?: string;
  description?: string;
  variant?: string;
  [key: string]: unknown;
}

function toast(message: string | ToastMessage) {
  if (typeof message === 'string') {
    return customToast({
      title: "Notification",
      description: message
    });
  } else {
    return customToast({
      title: message.title,
      description: message.description as string | undefined,
      variant: message.variant === 'error' ? 'destructive' : 
               message.variant === 'success' ? 'success' : 'default'
    });
  }
}

export { Toaster, toast };
