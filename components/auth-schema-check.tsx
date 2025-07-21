"use client";

import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthSchemaCheck() {
  const [isLoading, setIsLoading] = useState(true);
  const [authSchemaStatus, setAuthSchemaStatus] = useState<{
    exists: boolean;
    tables: string[];
    hasUsersTable: boolean;
    error?: string;
  }>({
    exists: false,
    tables: [],
    hasUsersTable: false,
  });

  const checkAuthSchema = async () => {
    setIsLoading(true);

    try {
      // Use server action to check auth schema with service role key
      const response = await fetch("/api/admin/check-auth-schema", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error checking auth schema: ${response.statusText}`);
      }

      const data = await response.json();
      setAuthSchemaStatus({
        exists: data.exists,
        tables: data.tables || [],
        hasUsersTable: data.hasUsersTable,
        error: data.error,
      });
    } catch (e) {
      console.error("Error checking auth schema:", e);
      setAuthSchemaStatus({
        exists: false,
        tables: [],
        hasUsersTable: false,
        error: e.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthSchema();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Auth Schema Status
          {isLoading ? (
            <RefreshCw className="h-5 w-5 animate-spin text-gray-500" />
          ) : authSchemaStatus.hasUsersTable ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : authSchemaStatus.exists ? (
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
        </CardTitle>
        <CardDescription>
          Checking the status of your Supabase auth schema using service role key
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : (
          <>
            {authSchemaStatus.error && (
              <Alert variant="destructive">
                <AlertTitle>Error Checking Auth Schema</AlertTitle>
                <AlertDescription>{authSchemaStatus.error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Auth Schema</h3>
                <p className="text-sm mt-1">
                  {authSchemaStatus.exists ? (
                    <span className="text-green-600 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Auth schema exists
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center">
                      <XCircle className="h-4 w-4 mr-1" />
                      Auth schema not found or insufficient permissions
                    </span>
                  )}
                </p>
              </div>

              {authSchemaStatus.exists && (
                <>
                  <div>
                    <h3 className="text-sm font-medium">Users Table</h3>
                    <p className="text-sm mt-1">
                      {authSchemaStatus.hasUsersTable ? (
                        <span className="text-green-600 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Users table exists in auth schema
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center">
                          <XCircle className="h-4 w-4 mr-1" />
                          Users table not found in auth schema
                        </span>
                      )}
                    </p>
                  </div>

                  {authSchemaStatus.tables.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium">Auth Schema Tables</h3>
                      <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        {authSchemaStatus.tables.map((table) => (
                          <li key={table} className="flex items-center">
                            <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                            {table}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

              <div>
                <h3 className="text-sm font-medium">Recommendation</h3>
                <p className="text-sm mt-1">
                  {!authSchemaStatus.exists ? (
                    <span className="text-red-600">
                      The auth schema is missing. Contact Supabase support to reset your auth
                      schema.
                    </span>
                  ) : !authSchemaStatus.hasUsersTable ? (
                    <span className="text-red-600">
                      The users table is missing from the auth schema. Contact Supabase support to
                      reset your auth schema.
                    </span>
                  ) : (
                    <span className="text-green-600">
                      Auth schema appears to be properly configured.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </>
        )}

        <Button onClick={checkAuthSchema} disabled={isLoading} variant="outline" className="mt-4">
          {isLoading ? "Checking..." : "Check Again"}
        </Button>
      </CardContent>
    </Card>
  );
}
