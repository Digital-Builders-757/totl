"use client";

import { ArrowLeft, Plus, Minus, Calendar, DollarSign, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createGig } from "./actions";
import { GigImageUploader } from "@/components/gigs/gig-image-uploader";
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
import { VISIBLE_GIG_CATEGORIES, getCategoryLabel } from "@/lib/constants/gig-categories";

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
  const [category, setCategory] = useState<string>("modeling");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const router = useRouter();
  const [state, formAction] = useActionState(
    async (prevState: { error?: string; success?: boolean } | null, formData: FormData) => {
      // Add image file to FormData if present
      if (imageFile) {
        formData.append("gig_image", imageFile);
      }
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
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-12">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center text-gray-300 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to dashboard
        </Link>

        <div className="max-w-4xl mx-auto bg-gray-900 border border-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2 text-white">Create a New Gig</h1>
              <p className="text-gray-300">
                Fill out the form below to create a new casting call or gig. Be as detailed as
                possible to attract the right talent.
              </p>
            </div>

            <form action={formAction} className="space-y-6">
              {state?.error && (
                <div className="p-4 bg-red-900/20 border border-red-800 rounded-md text-red-400">
                  {state.error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-white">Gig Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., Luxury Jewelry Campaign"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-white">Company/Brand Name</Label>
                <Input
                  id="company"
                  name="company"
                  placeholder="Your company or brand name"
                  defaultValue="Admin Company"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-white">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger 
                      id="category"
                      className="bg-gray-800 border-gray-700 text-white data-[placeholder]:text-gray-500"
                    >
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      {VISIBLE_GIG_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-white focus:bg-gray-700 focus:text-white">
                          {getCategoryLabel(cat)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input type="hidden" name="category" value={category} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-white">Location</Label>
                  <div className="relative">
                    <MapPin
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <Input
                      id="location"
                      name="location"
                      placeholder="e.g., New York, NY"
                      className="pl-9 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe the gig, requirements, and what you're looking for..."
                  rows={4}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="start_date" className="text-white">Start Date</Label>
                  <div className="relative">
                    <Calendar
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <Input 
                      id="start_date" 
                      name="start_date" 
                      type="date" 
                      className="pl-9 bg-gray-800 border-gray-700 text-white" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compensation_min" className="text-white">Min Compensation</Label>
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
                      className="pl-9 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compensation_max" className="text-white">Max Compensation</Label>
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
                      className="pl-9 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-white">Requirements</Label>
                {requirements.map((requirement, index) => (
                  <div key={index} className="flex space-x-2">
                    <Input
                      name={`requirement_${index}`}
                      placeholder="e.g., Female, 18-25, athletic build"
                      value={requirement}
                      onChange={(e) => updateRequirement(index, e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                    />
                    {requirements.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeRequirement(index)}
                        className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                      >
                        <Minus size={16} />
                      </Button>
                    )}
                  </div>
                ))}
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addRequirement} 
                  className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Requirement
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  id="urgent" 
                  name="urgent"
                  className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-700"
                />
                <Label htmlFor="urgent" className="text-white">Mark as urgent</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  id="featured" 
                  name="featured"
                  className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-700"
                />
                <Label htmlFor="featured" className="text-white">Feature this gig</Label>
              </div>

              {/* Gig Cover Image Upload */}
              <div className="space-y-2">
                <GigImageUploader
                  onFileSelect={setImageFile}
                  disabled={state?.success === true}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  asChild
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                >
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
