"use client";

import { useState } from "react";

// Only public-callable routes should be exposed to client components.
type EmailType = "verification" | "password-reset";

interface SendEmailOptions {
  email: string;
  firstName?: string;
  userId?: string;
  gigTitle?: string;
}

export function useEmailService() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendEmail = async (type: EmailType, options: SendEmailOptions) => {
    setIsLoading(true);
    setError(null);

    try {
      const endpoint = `/api/email/send-${type}`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(options),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send email");
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const sendVerificationEmail = (options: SendEmailOptions) => {
    return sendEmail("verification", options);
  };

  const sendPasswordResetEmail = (options: SendEmailOptions) => {
    return sendEmail("password-reset", options);
  };

  return {
    isLoading,
    error,
    sendVerificationEmail,
    sendPasswordResetEmail,
  };
}
