"use client";

import { ArrowLeft, Plus, Minus, Calendar, DollarSign, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createGig } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="button-glow border-0">
      {pending ? "Creating..." : "Create Gig"}
    </Button>
  );
}

export function CreateGigForm() {
  const [requirements, setRequirements] = useState<string[]>([""]);
  const [category, setCategory] = useState<string>("commercial");
  const router = useRouter();
  const [state, formAction] = useActionState(
    async (prevState: { error?: string; success?: boolean } | null, formData: FormData) => {
      const result = await createGig(formData);
      if (result?.success) {
        // Redirect to dashboard on success
        router.push("/admin/dashboard");
        router.refresh();
      }
      return result || null;
    },
    null
  );

  const addRequirement = () => {
    setRequirements([...requirements, ""]);
  };

  const removeRequirement = (index: number) => {
    const newRequirements = [...requirements];
    newRequirements.splice(index, 1);
    setRequirements(newRequirements);
  };

  const updateRequirement = (index: number, value: string) => {
    const newRequirements = [...requirements];
    newRequirements[index] = value;
    setRequirements(newRequirements);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center text-gray-600 hover:text-black mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to dashboard
        </Link>

        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">Create a New Gig</h1>
              <p className="text-gray-600">
                Fill out the form below to create a new casting call or gig. Be as detailed as
                possible to attract the right talent.
              </p>
            </div>

            <form action={formAction} className="space-y-6">
              {state?.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
                  {state.error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="title">Gig Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., Luxury Jewelry Campaign"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company/Brand Name</Label>
                <Input
                  id="company"
                  name="company"
                  placeholder="Your company or brand name"
                  defaultValue="Admin Company"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="editorial">Editorial</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="runway">Runway</SelectItem>
                      <SelectItem value="print">Print</SelectItem>
                      <SelectItem value="fitness">Fitness</SelectItem>
                      <SelectItem value="beauty">Beauty</SelectItem>
                      <SelectItem value="promotional">Promotional</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <input type="hidden" name="category" value={category} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <Input
                      id="location"
                      name="location"
                      placeholder="e.g., New York, NY"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe the gig, requirements, and what you're looking for..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <div className="relative">
                    <Calendar
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <Input id="start_date" name="start_date" type="date" className="pl-9" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compensation_min">Min Compensation</Label>
                  <div className="relative">
                    <DollarSign
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <Input
                      id="compensation_min"
                      name="compensation_min"
                      type="number"
                      placeholder="0"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compensation_max">Max Compensation</Label>
                  <div className="relative">
                    <DollarSign
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <Input
                      id="compensation_max"
                      name="compensation_max"
                      type="number"
                      placeholder="1000"
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Requirements</Label>
                {requirements.map((requirement, index) => (
                  <div key={index} className="flex space-x-2">
                    <Input
                      name={`requirement_${index}`}
                      placeholder="e.g., Female, 18-25, athletic build"
                      value={requirement}
                      onChange={(e) => updateRequirement(index, e.target.value)}
                    />
                    {requirements.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeRequirement(index)}
                      >
                        <Minus size={16} />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addRequirement} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Requirement
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="urgent" name="urgent" />
                <Label htmlFor="urgent">Mark as urgent</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="featured" name="featured" />
                <Label htmlFor="featured">Feature this gig</Label>
              </div>

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" asChild>
                  <Link href="/admin/dashboard">Cancel</Link>
                </Button>
                <SubmitButton />
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
