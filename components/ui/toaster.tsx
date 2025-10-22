"use client";

import { CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";

export function Toaster() {
  const { toasts } = useToast();

  const getIcon = (variant?: string) => {
    switch (variant) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-400 animate-scale-in flex-shrink-0" />;
      case "destructive":
        return <XCircle className="h-5 w-5 text-red-400 animate-scale-in flex-shrink-0" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-400 animate-scale-in flex-shrink-0" />;
      case "info":
        return <Info className="h-5 w-5 text-blue-400 animate-scale-in flex-shrink-0" />;
      default:
        return null;
    }
  };

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const icon = getIcon(variant);
        
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-3 flex-1">
              {icon}
              <div className="grid gap-1 flex-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
