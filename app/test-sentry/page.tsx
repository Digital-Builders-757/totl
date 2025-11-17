"use client";

import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestSentryPage() {
  const throwError = () => {
    throw new Error("🧪 Test error from TOTL Agency - Application Submission Testing");
  };

  const captureMessage = () => {
    Sentry.captureMessage("✅ Test message: Sentry MCP integration working!", "info");
    alert("Message sent to Sentry! Check your Sentry dashboard.");
  };

  const captureException = () => {
    try {
      // Simulate the 406 error we just fixed
      throw new Error("Simulated 406 error: client_id field not found in applications table");
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          feature: "application-submission",
          test: true,
        },
        extra: {
          context: "Testing Sentry MCP integration",
          timestamp: new Date().toISOString(),
        },
        level: "error",
      });
      alert("Exception captured! Check Sentry dashboard.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🔍 Sentry Integration Test</CardTitle>
            <CardDescription>
              Test your Sentry setup and MCP integration. Errors will go to the{" "}
              <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">sentry-yellow-notebook</code>{" "}
              project.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Test 1: Throw Unhandled Error</h3>
              <p className="text-sm text-gray-600 mb-2">
                This will throw an error that crashes the component and gets caught by Sentry.
              </p>
              <Button onClick={throwError} variant="destructive">
                💥 Throw Test Error
              </Button>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Test 2: Send Info Message</h3>
              <p className="text-sm text-gray-600 mb-2">
                This sends a message to Sentry without causing an error.
              </p>
              <Button onClick={captureMessage} variant="default">
                📨 Send Test Message
              </Button>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Test 3: Capture Handled Exception</h3>
              <p className="text-sm text-gray-600 mb-2">
                This simulates catching an error and sending it to Sentry with context.
              </p>
              <Button onClick={captureException} variant="secondary">
                🎯 Capture Test Exception
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📊 Check Your Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm font-medium">Sentry Dashboard:</p>
              <a
                href="https://sentry.io/organizations/the-digital-builders-bi/projects/sentry-yellow-notebook/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm"
              >
                View sentry-yellow-notebook project →
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🤖 Test MCP Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-2">
              After generating test errors, ask your AI assistant:
            </p>
            <div className="bg-gray-100 p-3 rounded text-sm font-mono space-y-1">
              <p>&quot;Show me the latest errors from sentry-yellow-notebook&quot;</p>
              <p>&quot;What errors happened in the last hour?&quot;</p>
              <p>&quot;Get details for the most recent error&quot;</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
