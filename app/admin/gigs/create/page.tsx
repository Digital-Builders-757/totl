"use client";

import { ArrowLeft, Upload, Plus, Minus, Calendar, DollarSign, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
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

export default function CreateGigPage() {
  const [requirements, setRequirements] = useState<string[]>([""]);

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

            <form className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Gig Title</Label>
                <Input id="title" placeholder="e.g., Luxury Jewelry Campaign" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company/Brand Name</Label>
                <Input
                  id="company"
                  placeholder="Your company or brand name"
                  defaultValue="Eternal Diamonds"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select defaultValue="commercial">
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <Input id="location" placeholder="e.g., New York, NY" className="pl-9" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <div className="relative">
                    <Clock
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <Input
                      id="duration"
                      placeholder="e.g., 1 Day Shoot, 3 Days, etc."
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compensation">Compensation</Label>
                  <div className="relative">
                    <DollarSign
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <Input
                      id="compensation"
                      placeholder="e.g., $1,200, $500-$800, etc."
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date">Shoot Date</Label>
                  <div className="relative">
                    <Calendar
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <Input id="date" type="date" className="pl-9" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="applicationDeadline">Application Deadline</Label>
                  <div className="relative">
                    <Calendar
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <Input id="applicationDeadline" type="date" className="pl-9" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Gig Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide a detailed description of the gig, including what to expect, the concept, etc."
                  rows={6}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="requirements">Requirements</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addRequirement}>
                    <Plus className="h-4 w-4 mr-1" /> Add Requirement
                  </Button>
                </div>

                {requirements.map((requirement, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={requirement}
                      onChange={(e) => updateRequirement(index, e.target.value)}
                      placeholder={`Requirement ${index + 1}`}
                    />
                    {requirements.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRequirement(index)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverImage">Cover Image</Label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Upload className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 mb-2">Drag and drop an image, or click to browse</p>
                  <p className="text-gray-400 text-sm mb-4">Recommended size: 1200 x 800 pixels</p>
                  <Button type="button" variant="outline" size="sm">
                    Upload Image
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-2">
                  <Switch id="featured" />
                  <Label htmlFor="featured">Mark as Featured</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="urgent" />
                  <Label htmlFor="urgent">Mark as Urgent</Label>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <Button type="submit" className="bg-black text-white hover:bg-black/90">
                  Publish Gig
                </Button>
                <Button type="button" variant="outline">
                  Save as Draft
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
