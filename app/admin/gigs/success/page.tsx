"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, ArrowRight, Clock, Users, Briefcase } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { SafeImage } from "@/components/ui/safe-image"

export default function GigSuccessPage() {
  const { toast } = useToast()

  // Show toast notification when the page loads
  useEffect(() => {
    toast({
      title: "Gig submitted!",
      description: "We'll review it shortly.",
      variant: "default",
    })
  }, [toast])

  // Mock data for the submitted gig
  const submittedGig = {
    id: 6,
    title: "Luxury Jewelry Campaign",
    category: "Commercial",
    location: "London, UK",
    compensation: "$3,000",
    duration: "1 Day Shoot",
    date: "July 15, 2023",
    status: "Pending Review",
    image: "/gig-jewelry.png",
    description:
      "Prestigious jewelry brand is seeking elegant female models for our upcoming fine jewelry campaign. The shoot will feature close-up hand shots as well as portrait work showcasing our exclusive diamond collection.",
    requirements: [
      "Female, ages 25-40",
      "Elegant hands with long fingers",
      "Well-maintained nails",
      "Refined facial features",
      "Previous luxury brand experience preferred",
    ],
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center mr-8">
                <SafeImage
                  src="/images/totl-logo-transparent.png"
                  alt="TOTL Agency"
                  width={100}
                  height={40}
                  placeholderQuery="agency logo"
                  className="brightness-100"
                />
              </Link>
              <nav className="hidden md:flex space-x-6">
                <Link href="/admin/dashboard" className="text-gray-600 hover:text-black">
                  Dashboard
                </Link>
                <Link href="/admin/gigs" className="text-black font-medium">
                  My Gigs
                </Link>
                <Link href="/admin/applications" className="text-gray-600 hover:text-black">
                  Applications
                </Link>
                <Link href="/admin/messages" className="text-gray-600 hover:text-black">
                  Messages
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Success Message */}
          <div className="bg-white rounded-xl shadow-sm p-8 mb-8 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full mx-auto flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-semibold">Your gig has been submitted!</h2>
            <p className="text-gray-600 mt-2 max-w-md mx-auto">
              Our team is reviewing your casting call. Once approved, it will appear on the talent dashboard for
              submissions.
            </p>
          </div>

          {/* Gig Summary */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Gig Summary</h2>
                <Badge className="bg-amber-100 text-amber-800">
                  <Clock className="mr-1 h-4 w-4" /> Pending Review
                </Badge>
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <div className="relative h-48 rounded-lg overflow-hidden">
                    <SafeImage
                      src={submittedGig.image}
                      alt={submittedGig.title}
                      fill
                      placeholderQuery="jewelry photoshoot"
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="md:w-2/3">
                  <h3 className="text-xl font-bold mb-2">{submittedGig.title}</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline" className="bg-gray-50">
                      {submittedGig.category}
                    </Badge>
                    <Badge variant="outline" className="bg-gray-50">
                      {submittedGig.location}
                    </Badge>
                    <Badge variant="outline" className="bg-gray-50">
                      {submittedGig.compensation}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-4">{submittedGig.description}</p>
                  <div className="flex items-center text-amber-600">
                    <Clock className="mr-2 h-4 w-4" />
                    <span className="text-sm">Estimated approval time: 24-48 hours</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <Button asChild className="bg-black text-white hover:bg-black/90 flex-1">
              <Link href="/admin/gigs/create">
                <Briefcase className="mr-2 h-4 w-4" /> Post Another Gig
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/admin/dashboard">View My Gigs</Link>
            </Button>
          </div>

          {/* While You Wait Section */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold">While You Wait...</h2>
            </div>
            <div className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="md:w-2/3">
                  <h3 className="text-lg font-semibold mb-2">
                    Start browsing talent and bookmark profiles that fit your casting
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Get a head start by exploring our diverse talent pool. Save profiles that match your requirements so
                    you're ready when your gig is approved.
                  </p>
                  <Button asChild className="bg-black text-white hover:bg-black/90">
                    <Link href="/talent">
                      <Users className="mr-2 h-4 w-4" /> Explore Talent <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="md:w-1/3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="aspect-square relative rounded-lg overflow-hidden">
                      <SafeImage src="/images/model-1.png" alt="Talent" fill className="object-cover" />
                    </div>
                    <div className="aspect-square relative rounded-lg overflow-hidden">
                      <SafeImage src="/images/model-2.png" alt="Talent" fill className="object-cover" />
                    </div>
                    <div className="aspect-square relative rounded-lg overflow-hidden">
                      <SafeImage src="/images/model-3.png" alt="Talent" fill className="object-cover" />
                    </div>
                    <div className="aspect-square relative rounded-lg overflow-hidden">
                      <SafeImage src="/athletic-woman-stretching.png" alt="Talent" fill className="object-cover" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
