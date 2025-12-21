"use client";

import { Users } from "lucide-react";
import { useState } from "react";
import TalentSignupForm from "@/components/forms/talent-signup-form";
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
        {showIcon && <Users className="mr-2 h-4 w-4" />}
        Apply as Talent
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <ScrollArea className="max-h-[90vh]">
            <div data-testid="talent-signup-dialog" className="p-6">
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
