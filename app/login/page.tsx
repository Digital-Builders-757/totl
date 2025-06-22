"use client"

import type React from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/supabase"

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const router = useRouter()
  const { signIn } = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get("returnUrl")
  const verified = searchParams.get("verified") === "true"
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    if (verified) {
      toast({
        title: "Email verified successfully!",
        description: "You can now log in to your account.",
        variant: "default",
      })
    }
  }, [verified, toast])

  const validateForm = () => {
    const errors: Record<string, string> = {}

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim()) {
      errors.email = "Email is required"
    } else if (!emailRegex.test(email)) {
      errors.email = "Please enter a valid email address"
    }

    // Validate password
    if (!password) {
      errors.password = "Password is required"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form before submission
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setFormErrors({}) // Clear any existing errors

    try {
      const { error } = await signIn(email, password)

      if (error) {
        console.error("Login error:", error)
        if (error.message.includes("Invalid login credentials")) {
          setFormErrors({
            auth: "Invalid email or password. Please try again.",
          })
        } else if (error.message.includes("Email not confirmed")) {
          setFormErrors({
            auth: "Please verify your email address before signing in.",
          })
        } else {
          toast({
            title: "Error signing in",
            description: error.message,
            variant: "destructive",
          })
        }
        setIsLoading(false)
        return
      }

      // The AuthProvider will handle the redirect after it processes the new session.
      // We can optionally push a default route here if needed, but it's better to let the provider handle it.
      // For now, we just wait for the provider to do its work.
      toast({
        title: "Signed in successfully!",
        description: "Redirecting to your dashboard...",
      })

      // The redirect is now handled by the AuthProvider's onAuthStateChange listener
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center text-gray-600 hover:text-black mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to home
        </Link>

        <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <Image
                src="/images/totl-logo-transparent.png"
                alt="TOTL Agency"
                width={120}
                height={50}
                className="mx-auto mb-6"
              />
              <h1 className="text-2xl font-bold mb-2">Sign In</h1>
              <p className="text-gray-600">Sign in to access your TOTL Agency account</p>
            </div>

            {verified && (
              <Alert className="bg-green-50 border-green-200 mb-6">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Email verified successfully!</AlertTitle>
                <AlertDescription className="text-green-700">You can now log in to your account.</AlertDescription>
              </Alert>
            )}

            {formErrors.auth && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                {formErrors.auth}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email" className={formErrors.email ? "text-red-500" : ""}>
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (formErrors.email) {
                      const { email, ...rest } = formErrors
                      setFormErrors(rest)
                    }
                    if (formErrors.auth) {
                      const { auth, ...rest } = formErrors
                      setFormErrors(rest)
                    }
                  }}
                  required
                  className={formErrors.email ? "border-red-500" : ""}
                />
                {formErrors.email && <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className={formErrors.password ? "text-red-500" : ""}>
                    Password
                  </Label>
                  <Link href="/reset-password" className="text-sm text-gray-500 hover:text-black">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (formErrors.password) {
                        const { password, ...rest } = formErrors
                        setFormErrors(rest)
                      }
                      if (formErrors.auth) {
                        const { auth, ...rest } = formErrors
                        setFormErrors(rest)
                      }
                    }}
                    required
                    className={formErrors.password ? "border-red-500" : ""}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {formErrors.password && <p className="text-sm text-red-500 mt-1">{formErrors.password}</p>}
              </div>

              <Button type="submit" className="w-full bg-black text-white hover:bg-black/90" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-8 space-y-4">
              <div className="text-center">
                <p className="text-gray-600">
                  Are you a model or talent?{" "}
                  <Link
                    href={returnUrl ? `/talent/signup?returnUrl=${returnUrl}` : "/talent/signup"}
                    className="text-black font-medium hover:underline"
                  >
                    Create a talent account
                  </Link>
                </p>
              </div>

              <div className="text-center">
                <p className="text-gray-600">
                  Looking to hire talent?{" "}
                  <Link
                    href={returnUrl ? `/client/apply?returnUrl=${returnUrl}` : "/client/apply"}
                    className="text-black font-medium hover:underline"
                  >
                    Apply to become a client
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
