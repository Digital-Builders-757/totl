import { NextResponse } from "next/server";
import { ZodSchema } from "zod";
import { logActionFailure } from "@/lib/errors/log-action-failure";

/**
 * Standard API error response
 */
export function createErrorResponse(
  message: string,
  status: number = 500,
  details?: Record<string, unknown>
) {
  return NextResponse.json(
    {
      error: message,
      ...(details && { details }),
    },
    { status }
  );
}

/**
 * Standard API success response
 */
export function createSuccessResponse(data?: Record<string, unknown>, status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      ...(data && { data }),
    },
    { status }
  );
}

/**
 * Validate request body with Zod schema
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: NextResponse }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return {
        success: false,
        error: createErrorResponse("Invalid input", 400, { validationErrors: result.error.errors }),
      };
    }

    return { success: true, data: result.data };
  } catch {
    return {
      success: false,
      error: createErrorResponse("Invalid JSON", 400),
    };
  }
}

const GENERIC_500 = "An unexpected error occurred. Please try again.";

/**
 * Handle API route errors consistently.
 * Logs full detail; returns a safe client message (optional debugId for support correlation).
 */
function newDebugId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function handleApiError(error: unknown, context: string) {
  const debugId = newDebugId();
  logActionFailure(`api.${context}`, error, { debugId });

  return createErrorResponse(GENERIC_500, 500, { debugId });
}
