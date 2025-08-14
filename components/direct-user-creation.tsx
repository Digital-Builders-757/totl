"use client";

import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import type React from "react";

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/types/supabase";

type UserRole = Database["public"]["Enums"]["user_role"];

// Type definitions for user creation
interface CreatedUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

interface UserCreationResult {
  success: boolean;
  message: string;
  details?: CreatedUser | Error;
}

export default function DirectUserCreation() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "talent" as UserRole,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<UserCreationResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toISOString()}] ${message}`]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRoleChange = (value: string) => {
    setFormData({
      ...formData,
      role: value as UserRole,
    });
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    setLogs([]);

    try {
      addLog(`Starting user creation for ${formData.email}`);

      // Use server endpoint with service role key
      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        addLog(`User creation failed: ${data.error || response.statusText}`);
        throw new Error(data.error || "Failed to create user");
      }

      addLog(`User created successfully with ID: ${data.user.id}`);

      setResult({
        success: true,
        message: `User ${formData.email} created successfully`,
        details: data.user as CreatedUser,
      });
    } catch (error) {
      console.error("User creation error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setResult({
        success: false,
        message: errorMessage,
        details: error instanceof Error ? error : new Error(errorMessage),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Direct User Creation (Using Service Role Key)</CardTitle>
        <CardDescription>
          Create a user directly using the Supabase admin API with service role key
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={createUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="talent">Talent</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating User...
              </>
            ) : (
              "Create User"
            )}
          </Button>
        </form>

        {result && (
          <Alert variant={result.success ? "default" : "destructive"} className="mt-4">
            <AlertTitle className="flex items-center">
              {result.success ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Success
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Error
                </>
              )}
            </AlertTitle>
            <AlertDescription>
              {result.message}
              {result.success && result.details && "id" in result.details && (
                <div className="mt-2 text-xs">
                  <p>User ID: {result.details.id}</p>
                  <p>Email: {result.details.email}</p>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {logs.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Operation Logs</h3>
            <div className="bg-gray-100 p-3 rounded text-xs font-mono h-40 overflow-y-auto">
              {logs.map((log, i) => (
                <div key={i} className="pb-1">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
