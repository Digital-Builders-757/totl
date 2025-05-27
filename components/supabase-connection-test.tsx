"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, RefreshCw } from "lucide-react"

export default function SupabaseConnectionTest() {
  const [isLoading, setIsLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean
    error?: string
    publicVars: boolean
    serviceVars: boolean
  }>({
    connected: false,
    publicVars: false,
    serviceVars: false,
  })

  const testConnection = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/admin/test-connection", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Error testing connection: ${response.statusText}`)
      }

      const data = await response.json()
      setConnectionStatus({
        connected: data.connected,
        error: data.error,
        publicVars: data.publicVars,
        serviceVars: data.serviceVars,
      })
    } catch (e) {
      console.error("Error testing connection:", e)
      setConnectionStatus({
        connected: false,
        error: e.message,
        publicVars: false,
        serviceVars: false,
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Supabase Connection Status
          {isLoading ? (
            <RefreshCw className="h-5 w-5 animate-spin text-gray-500" />
          ) : connectionStatus.connected ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
        </CardTitle>
        <CardDescription>Testing connection to Supabase with both anon and service role keys</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : (
          <>
            {connectionStatus.error && (
              <Alert variant="destructive">
                <AlertTitle>Connection Error</AlertTitle>
                <AlertDescription>{connectionStatus.error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Connection Status</h3>
                <p className="text-sm mt-1">
                  {connectionStatus.connected ? (
                    <span className="text-green-600 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Successfully connected to Supabase
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center">
                      <XCircle className="h-4 w-4 mr-1" />
                      Failed to connect to Supabase
                    </span>
                  )}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium">Environment Variables</h3>
                <ul className="mt-2 space-y-1 text-sm">
                  <li className="flex items-center">
                    {connectionStatus.publicVars ? (
                      <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-500 mr-1" />
                    )}
                    Public variables (URL and anon key)
                  </li>
                  <li className="flex items-center">
                    {connectionStatus.serviceVars ? (
                      <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-500 mr-1" />
                    )}
                    Service role variables (URL and service role key)
                  </li>
                </ul>
              </div>
            </div>
          </>
        )}

        <Button onClick={testConnection} disabled={isLoading} variant="outline" className="mt-4">
          {isLoading ? "Testing..." : "Test Connection Again"}
        </Button>
      </CardContent>
    </Card>
  )
}
