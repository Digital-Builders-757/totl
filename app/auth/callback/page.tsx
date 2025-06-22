"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, XCircle } from "lucide-react"

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const searchParams = useSearchParams()
  const [verificationStatus, setVerificationStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const effectRan = useRef(false)

  useEffect(() => {
    // This function is defined once and called inside the effect.
    const handleEmailVerification = async () => {
      // In development, React's Strict Mode runs useEffects twice to check for side-effects.
      // This ref prevents our code from running twice.
      if (effectRan.current) {
        return
      }
      effectRan.current = true

      const code = searchParams.get("code")
      if (!code) {
        setVerificationStatus("error")
        setErrorMessage("Verification code is missing from the link.")
        return
      }

      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("Verification error:", error)
        setVerificationStatus("error")
        setErrorMessage(error.message)
        return
      }

      // Success!
      setVerificationStatus("success")

      // Update profile in the background without blocking the UI
      if (data.session?.user) {
        supabase.from("profiles").update({ email_verified: true }).eq("id", data.session.user.id).then()
      }

      // Redirect the user to the login page after a short delay.
      setTimeout(() => {
        router.push("/login?verified=true")
      }, 2000)
    }

    handleEmailVerification()
  }, [searchParams, router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Email Verification</CardTitle>
          <CardDescription className="text-center">
            {verificationStatus === "loading" ? "Verifying your email address..." : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          {verificationStatus === "loading" && (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-t-black border-r-gray-200 border-b-gray-200 border-l-gray-200 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600">Please wait while we verify your email...</p>
            </div>
          )}

          {verificationStatus === "success" && (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-medium text-green-800 mb-2">Email Verified Successfully!</h3>
              <p className="text-gray-600 text-center mb-4">
                Your email has been verified. You will be redirected to the login page shortly.
              </p>
            </div>
          )}

          {verificationStatus === "error" && (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-medium text-red-800 mb-2">Verification Failed</h3>
              <p className="text-gray-600 text-center mb-4">
                {errorMessage || "We couldn't verify your email. The link may have expired or is invalid."}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {verificationStatus === "error" && <Button onClick={() => router.push("/login")}>Return to Login</Button>}
        </CardFooter>
      </Card>
    </div>
  )
}
