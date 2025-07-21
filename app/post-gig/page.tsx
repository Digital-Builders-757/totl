"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";

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
import { Textarea } from "@/components/ui/textarea";

export default function PostGigPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission delay
    setTimeout(() => {
      // Redirect to success page
      router.push("/admin/gigs/success");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center text-gray-600 hover:text-black mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to home
        </Link>

        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">Post a New Gig</h1>
              <p className="text-gray-600">
                Fill out the form below to create a new casting call or gig. Be as detailed as
                possible to attract the right talent.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="title">Gig Title</Label>
                <Input id="title" placeholder="e.g., Fashion Editorial Model Needed" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company/Brand Name</Label>
                <Input id="company" placeholder="Your company or brand name" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="editorial">Editorial</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="runway">Runway</SelectItem>
                      <SelectItem value="print">Print</SelectItem>
                      <SelectItem value="fitness">Fitness</SelectItem>
                      <SelectItem value="promotional">Promotional</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" placeholder="e.g., New York, NY" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Input id="duration" placeholder="e.g., 1 Day Shoot, 3 Days, etc." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compensation">Compensation</Label>
                  <Input id="compensation" placeholder="e.g., $1,200, $500-$800, etc." />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Gig Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide a detailed description of the gig, including requirements, what to expect, etc."
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea
                  id="requirements"
                  placeholder="List specific requirements such as age range, height, experience level, etc."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="applicationDeadline">Application Deadline</Label>
                <Input id="applicationDeadline" type="date" />
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-black text-white hover:bg-black/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Post Gig"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
