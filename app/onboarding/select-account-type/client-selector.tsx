"use client";

import { useState } from "react";
import { selectAccountType } from "./actions";
import TalentSignupForm from "@/components/forms/talent-signup-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ClientAccountTypeSelector() {
  const [showCareerBuilderDialog, setShowCareerBuilderDialog] = useState(false);
  const [showTalentSignupDialog, setShowTalentSignupDialog] = useState(false);

  const handleCareerBuilderClick = (e: React.MouseEvent | React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowCareerBuilderDialog(true);
  };

  const handleCareerBuilderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      setShowCareerBuilderDialog(true);
    }
  };

  const handleCreateTalentAccount = () => {
    setShowCareerBuilderDialog(false);
    // Open the talent signup form dialog
    setShowTalentSignupDialog(true);
  };

  return (
    <>
      <div className="relative z-10 grid gap-6 md:grid-cols-2">
        <div className="p-10 border-b border-white/5 md:border-b-0 md:border-r md:p-12">
          <h1 className="text-3xl font-semibold mb-3">Choose your path</h1>
          <p className="text-sm text-white/70 mb-6 leading-relaxed">
            Select Talent if you&apos;re looking for gigs, or Career Builder if you want to book talent.
          </p>
          <form action={selectAccountType} className="space-y-4">
            <input type="hidden" name="accountType" value="talent" />
            <p className="text-sm uppercase tracking-[0.3em] text-white/60">Talent</p>
            <p className="text-white/70 mb-4">
              Build your profile, submit to casting calls, and access your talent dashboard.
            </p>
            <Button type="submit" className="w-full bg-slate-200 text-black">
              I&apos;m Talent
            </Button>
          </form>
        </div>
        <div 
          className="p-10 md:p-12 opacity-60 cursor-not-allowed"
          onClick={handleCareerBuilderClick}
          onKeyDown={handleCareerBuilderKeyDown}
          role="button"
          tabIndex={0}
          aria-label="Apply as Career Builder - requires Talent account first"
        >
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-white/60">Career Builder</p>
            <p className="text-white/70 mb-4">
              Post gigs, browse premium talent, and manage applications from one place.
            </p>
            <Button 
              className="w-full bg-amber-500 text-black opacity-50 cursor-not-allowed" 
              disabled
              onClick={handleCareerBuilderClick}
            >
              I&apos;m a Career Builder
            </Button>
          </div>
        </div>
      </div>

      {/* Career Builder Dialog */}
      <Dialog open={showCareerBuilderDialog} onOpenChange={setShowCareerBuilderDialog}>
        <DialogContent className="bg-slate-900 border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold">Create a Talent Account First</DialogTitle>
            <DialogDescription className="text-gray-300 pt-2">
              To become a Career Builder, you must first create a Talent account. Once you have a Talent account, you can apply to become a Career Builder from your dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-300 text-sm leading-relaxed">
              This helps us verify your identity and ensures a smooth onboarding process. After creating your Talent account, you&apos;ll be able to apply for Career Builder status directly from your dashboard.
            </p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCareerBuilderDialog(false)}
              className="border-white/10 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTalentAccount}
              className="bg-amber-500 text-black hover:bg-amber-400"
            >
              Create Talent Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Talent Signup Form Dialog */}
      <Dialog open={showTalentSignupDialog} onOpenChange={setShowTalentSignupDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <ScrollArea className="max-h-[90vh]">
            <div className="p-6">
              <DialogHeader className="mb-4">
                <DialogTitle>Create Your Talent Account</DialogTitle>
                <DialogDescription>
                  Apply to join our talent roster. It&apos;s completely free to create an account.
                </DialogDescription>
              </DialogHeader>

              <TalentSignupForm onComplete={() => setShowTalentSignupDialog(false)} />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

