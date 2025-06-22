"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Eye, EyeOff, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "./auth-provider"

// Define the form schema with validation rules
const signupSchema = z
  .object({
    firstName: z
      .string()
      .min(2, { message: "First name must be at least 2 characters" })
      .max(50, { message: "First name cannot exceed 50 characters" }),
    lastName: z
      .string()
      .min(2, { message: "Last name must be at least 2 characters" })
      .max(50, { message: "Last name cannot exceed 50 characters" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
      .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
      .regex(/[0-9]/, { message: "Password must contain at least one number" }),
    confirmPassword: z.string(),
    agreeTerms: z.boolean().refine((val) => val === true, {
      message: "You must agree to the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type SignupFormValues = z.infer<typeof signupSchema>

interface TalentSignupFormProps {
  onComplete?: () => void
}

export default function TalentSignupForm({ onComplete }: TalentSignupFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const { signUp } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeTerms: false,
    },
  })

  // Watch the agreeTerms value to handle checkbox state
  const agreeTerms = watch("agreeTerms")

  const onSubmit = async (data: SignupFormValues) => {
    setIsSubmitting(true)
    setServerError(null)

    try {
      console.log("Starting signup process for:", data.email)

      const { error } = await signUp(data.email, data.password, {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          role: "talent",
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      })

      if (error) {
        console.error("Signup error:", error)
        if (error.message.includes("User already exists")) {
          setServerError(
            "A user with this email already exists. Please check your inbox for a verification email or try logging in."
          )
        } else {
          setServerError(error.message)
        }
        setIsSubmitting(false)
        return
      }

      toast({
        title: "Account creation successful!",
        description: "Please check your email to verify your account before logging in.",
      })

      if (onComplete) {
        onComplete()
      }

      router.push(`/verification-pending?email=${encodeURIComponent(data.email)}`)
    } catch (error) {
      console.error("Unexpected error during signup:", error)
      setServerError(error instanceof Error ? error.message : "An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {serverError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="firstName" className={errors.firstName ? "text-red-500" : ""}>
            First Name *
          </Label>
          <Input
            id="firstName"
            placeholder="Enter your first name"
            {...register("firstName")}
            className={errors.firstName ? "border-red-500" : ""}
            disabled={isSubmitting}
          />
          {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className={errors.lastName ? "text-red-500" : ""}>
            Last Name *
          </Label>
          <Input
            id="lastName"
            placeholder="Enter your last name"
            {...register("lastName")}
            className={errors.lastName ? "border-red-500" : ""}
            disabled={isSubmitting}
          />
          {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className={errors.email ? "text-red-500" : ""}>
          Email Address *
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email address"
          {...register("email")}
          className={errors.email ? "border-red-500" : ""}
          disabled={isSubmitting}
        />
        {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className={errors.password ? "text-red-500" : ""}>
          Password *
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a password"
            {...register("password")}
            className={errors.password ? "border-red-500" : ""}
            disabled={isSubmitting}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password ? (
          <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
        ) : (
          <p className="text-xs text-gray-500 mt-1">
            Password must be at least 8 characters with uppercase, lowercase, and numbers
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className={errors.confirmPassword ? "text-red-500" : ""}>
          Confirm Password *
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm your password"
            {...register("confirmPassword")}
            className={errors.confirmPassword ? "border-red-500" : ""}
            disabled={isSubmitting}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>}
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox
          id="agreeTerms"
          checked={agreeTerms}
          onCheckedChange={(checked) => {
            // Update the form value when checkbox changes
            const event = {
              target: {
                name: "agreeTerms",
                value: checked,
              },
            } as any
            register("agreeTerms").onChange(event)
          }}
          className={errors.agreeTerms ? "border-red-500" : ""}
          disabled={isSubmitting}
        />
        <div className="grid gap-1.5 leading-none">
          <label
            htmlFor="agreeTerms"
            className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
              errors.agreeTerms ? "text-red-500" : ""
            }`}
          >
            I agree to the{" "}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Privacy Policy
            </a>{" "}
            *
          </label>
          {errors.agreeTerms && (
            <p className="text-sm text-red-500 mt-1">
              {errors.agreeTerms.message || "You must agree to the terms and conditions"}
            </p>
          )}
        </div>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          After signing up, you'll need to verify your email address and complete your profile in your dashboard.
        </AlertDescription>
      </Alert>

      <div className="pt-4 flex justify-end">
        <Button type="submit" className="bg-black text-white hover:bg-black/90" disabled={isSubmitting}>
          {isSubmitting ? "Creating Account..." : "Create Free Account"}
        </Button>
      </div>
    </form>
  )
}
