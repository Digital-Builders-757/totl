import { NextResponse } from "next/server";
import { ZodSchema } from "zod";

/**
 * Standard API error response
 */
export function createErrorResponse(
  message: string,
  status: number = 500,
  details?: any
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
export function createSuccessResponse(data?: any, status: number = 200) {
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
        error: createErrorResponse(
          "Invalid input",
          400,
          result.error.errors
        ),
      };
    }
    
    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      error: createErrorResponse("Invalid JSON", 400),
    };
  }
}

/**
 * Handle API route errors consistently
 */
export function handleApiError(error: unknown, context: string) {
  console.error(`Error in ${context}:`, error);
  
  if (error instanceof Error) {
    return createErrorResponse(error.message, 500);
  }
  
  return createErrorResponse("Unknown error", 500);
}
