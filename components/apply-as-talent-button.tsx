"use client";

import { UserPlus } from "lucide-react";
import { useState } from "react";
import TalentSignupForm from "@/components/talent-signup-form";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ApplyAsTalentButtonProps extends ButtonProps {
  showIcon?: boolean;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

export function ApplyAsTalentButton({
  showIcon = true,
  variant = "default",
  size = "default",
  className,
  ...props
}: ApplyAsTalentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant={variant}
        size={size}
        className={`${className || ""}`}
        {...props}
      >
        {showIcon && <UserPlus className="mr-2 h-4 w-4" />}
        Apply as Talent
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <ScrollArea className="max-h-[90vh]">
            <div className="p-6">
              <DialogHeader className="mb-4">
                <DialogTitle>Create Your Talent Account</DialogTitle>
                <DialogDescription>
                  Apply to join our talent roster. It&apos;s completely free to create an account.
                </DialogDescription>
              </DialogHeader>

              <TalentSignupForm onComplete={() => setIsOpen(false)} />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
