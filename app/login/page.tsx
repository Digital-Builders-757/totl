"use client";

import { ArrowLeft, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { PATHS } from "@/lib/constants/routes";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [verified, setVerified] = useState(false);
  const [returnUrl, setReturnUrl] = useState<string | null>(null);
  const { signIn } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Safely extract search params in useEffect to avoid SSR issues
  useEffect(() => {
    if (searchParams) {
      const returnUrlParam = searchParams.get("returnUrl");
      const verifiedParam = searchParams.get("verified") === "true";
      setReturnUrl(returnUrlParam);
      setVerified(verifiedParam);
      
      if (verifiedParam) {
        toast({
          title: "Email verified successfully!",
          description: "You can now log in to your account.",
          variant: "default",
        });
      }
    }
  }, [searchParams, toast]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!emailRegex.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    // Validate password
    if (!password) {
      errors.password = "Password is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setFormErrors({});

    try {
      const { error } = await signIn(email, password);

      if (error) {
        console.error("Login error:", error);
        if (error.message.includes("Invalid login credentials")) {
          setFormErrors({ auth: "Invalid credentials. Please try again." });
        } else if (error.message.includes("Email not confirmed")) {
          setFormErrors({ auth: "Please verify your email address before signing in." });
        } else {
          toast({
            title: "Error signing in",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Signed in successfully!",
        description: "Redirecting to your dashboard...",
      });

      // If they were trying to hit a protected route, honor it when safe
      const isSafeReturnUrl =
        returnUrl && returnUrl.startsWith("/") && !returnUrl.startsWith("//");

      if (isSafeReturnUrl) {
        window.location.href = returnUrl;
        return;
      }

      // Otherwise send them to a neutral route and let middleware/AuthProvider
      // route by the *actual* profiles.role at request time (admin/client/talent).
      window.location.href = PATHS.HOME;
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black pt-24 sm:pt-28 relative overflow-hidden grain-texture">
      {/* Quiet “airlock” backdrop: subtle gradient + grain, no blob animations */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-40 z-[1]" />
      
      <div className="container mx-auto px-4 py-4 sm:py-6 md:py-8 relative z-10">
        {/* Hydration marker for E2E stability (element exists pre-hydration). */}
        <span data-testid="login-hydrated" className="sr-only">
          {isHydrated ? "ready" : "loading"}
        </span>
        <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white mb-4 sm:mb-6 md:mb-6 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to home
        </Link>

        <div className="max-w-md mx-auto panel-frosted overflow-hidden">
          
          <div className="p-4 sm:p-6 md:p-8">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-xl sm:text-2xl font-bold mb-2 text-white">Welcome back</h1>
              <p className="text-sm sm:text-base text-gray-300">Sign in to continue to your dashboard</p>
            </div>

            {verified && (
              <Alert className="bg-green-900/30 border-green-700 mb-6">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <AlertTitle className="text-green-300">Email verified successfully!</AlertTitle>
                <AlertDescription className="text-green-400">
                  You can now log in to your account.
                </AlertDescription>
              </Alert>
            )}

            {formErrors.auth && (
              <div className="mb-6 p-3 bg-red-900/30 border border-red-700 text-red-300 rounded-md text-sm">
                {formErrors.auth}
              </div>
            )}

            <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit} noValidate>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="email" className={`text-white text-sm sm:text-base ${formErrors.email ? "text-red-400" : ""}`}>
                  Email
                </Label>
                <Input
                  id="email"
                  data-testid="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (formErrors.email) {
                      setFormErrors((prev) => {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const { email: _, ...rest } = prev;
                        return rest;
                      });
                    }
                    if (formErrors.auth) {
                      setFormErrors((prev) => {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const { auth: _, ...rest } = prev;
                        return rest;
                      });
                    }
                  }}
                  className={`bg-gray-900/60 text-white border-white/10 focus:border-white/20 text-base placeholder:text-gray-500 input-glow ${formErrors.email ? "border-red-500" : ""}`}
                />
                {formErrors.email && (
                  <p className="text-sm text-red-400 mt-1">{formErrors.email}</p>
                )}
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className={`text-white text-sm sm:text-base ${formErrors.password ? "text-red-400" : ""}`}>
                    Password
                  </Label>
                  <Link href="/reset-password" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    data-testid="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (formErrors.password) {
                        setFormErrors((prev) => {
                          // eslint-disable-next-line @typescript-eslint/no-unused-vars
                          const { password: _, ...rest } = prev;
                          return rest;
                        });
                      }
                      if (formErrors.auth) {
                        setFormErrors((prev) => {
                          // eslint-disable-next-line @typescript-eslint/no-unused-vars
                          const { auth: _, ...rest } = prev;
                          return rest;
                        });
                      }
                    }}
                    className={`bg-gray-900/60 text-white border-white/10 focus:border-white/20 text-base placeholder:text-gray-500 input-glow ${formErrors.password ? "border-red-500" : ""}`}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="text-sm text-red-400 mt-1">{formErrors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                data-testid="login-button"
                className="w-full button-glow"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="mt-6 sm:mt-8 mb-6 sm:mb-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-black/40 border border-white/10 rounded px-2 text-gray-400">
                    New to TOTL?
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="text-center">
                <p className="text-sm sm:text-base text-gray-300">
                  Don&apos;t have an account?{" "}
                  <Link
                    href={returnUrl ? `/choose-role?returnUrl=${encodeURIComponent(returnUrl)}` : "/choose-role"}
                    className="text-white/90 font-medium hover:text-white inline-block transition-colors"
                  >
                    Create an account →
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
