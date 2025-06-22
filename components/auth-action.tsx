"use client"

import { RequireAuth } from "./require-auth"
import { Button } from "@/components/ui/button"
import type { ButtonProps } from "@/components/ui/button"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "./auth-provider"

interface AuthActionProps extends ButtonProps {
  actionText?: string
  unauthenticatedText?: string
  onAction: () => Promise<void> | void
  loadingText?: string
}

/**
 * A button that requires authentication to perform an action
 * Shows a sign in button if not authenticated
 */
export function AuthAction({
  actionText,
  unauthenticatedText = "Sign in to continue",
  onAction,
  loadingText = "Processing...",
  children,
  ...buttonProps
}: AuthActionProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { isLoading: authLoading } = useAuth()

  const handleAction = async () => {
    try {
      setIsLoading(true)
      await onAction()
    } catch (error) {
      console.error("Action error:", error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <Button disabled {...buttonProps}>
        {children || actionText}
      </Button>
    )
  }

  return (
    <RequireAuth
      fallback={
        <Button onClick={() => router.push("/choose-role")} {...buttonProps}>
          {unauthenticatedText}
        </Button>
      }
    >
      <Button onClick={handleAction} disabled={isLoading} {...buttonProps}>
        {isLoading ? loadingText : children || actionText}
      </Button>
    </RequireAuth>
  )
}
