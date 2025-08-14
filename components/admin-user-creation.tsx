"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { AlertCircle } from "lucide-react";
import type React from "react";

import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

export default function AdminUserCreation() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<"talent" | "client" | "admin">("talent");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Try to create user with direct API call
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: {
          email,
          password,
          firstName,
          lastName,
          role,
        },
      });

      if (error) {
        console.error("Error creating user:", error);
        setError(error.message || "Failed to create user");
        return;
      }

      if (data?.error) {
        setError(data.error);
        return;
      }

      setSuccess(`User ${email} created successfully!`);
      toast({
        title: "User created",
        description: `User ${email} has been created successfully.`,
      });

      // Reset form
      setEmail("");
      setPassword("");
      setFirstName("");
      setLastName("");
    } catch (err) {
      console.error("Unexpected error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create New User</CardTitle>
        <CardDescription>Create a new user account manually</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as "talent" | "client" | "admin")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="talent">Talent</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create User"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-gray-500">
          This will create a new user account without email verification.
        </p>
      </CardFooter>
    </Card>
  );
}
