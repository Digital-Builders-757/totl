"use client";

import { useState } from "react";

type EmailType = "welcome" | "verification" | "password-reset" | "application-received";

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

  const sendWelcomeEmail = (options: SendEmailOptions) => {
    return sendEmail("welcome", options);
  };

  const sendVerificationEmail = (options: SendEmailOptions) => {
    return sendEmail("verification", options);
  };

  const sendPasswordResetEmail = (options: SendEmailOptions) => {
    return sendEmail("password-reset", options);
  };

  const sendApplicationReceivedEmail = (options: SendEmailOptions) => {
    return sendEmail("application-received", options);
  };

  return {
    isLoading,
    error,
    sendWelcomeEmail,
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendApplicationReceivedEmail,
  };
}
