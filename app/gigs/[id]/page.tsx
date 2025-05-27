"use client"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MapPin, Clock, DollarSign, Calendar, Building, CheckCircle, Star } from "lucide-react"
import { RequireAuth } from "@/components/require-auth"

export default function GigDetailPage({ params }: { params: { id: string } }) {
  // Get the gig data based on the ID
  const gigId = Number.parseInt(params.id)
  const gig = gigs[gigId] || gigs[0] // Fallback to first gig if ID not found

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-12">
        <Link href="/gigs" className="inline-flex items-center text-gray-600 hover:text-black mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to gigs
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gig Header */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="relative h-64 md:h-80 bg-gray-200">
                {/* Fixed: Added fallback for gig image */}
                <Image
                  src={gig.image || "/placeholder.svg?height=400&width=1200&query=photoshoot"}
                  alt={gig.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                {gig.featured && (
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-black text-white">Featured</Badge>
                  </div>
                )}
                {gig.urgent && (
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-red-500 text-white">Urgent</Badge>
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-1">{gig.title}</h1>
                    <p className="text-gray-600 text-lg">{gig.company}</p>
                  </div>
                  <Badge className="mt-2 md:mt-0 w-fit bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                    {gig.category}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {gig.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="bg-gray-50">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                    <span>{gig.location}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-gray-500" />
                    <span>{gig.duration}</span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="mr-2 h-4 w-4 text-gray-500" />
                    <span>{gig.compensation}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                    <span>{gig.date}</span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <h2 className="text-xl font-bold mb-4">Description</h2>
                  <p className="text-gray-700 whitespace-pre-line">{gig.description}</p>
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Requirements</h2>
              <ul className="space-y-3">
                {gig.requirements.map((requirement, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <span>{requirement}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Similar Gigs */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-6">Similar Opportunities</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {similarGigs.map((similarGig, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="relative h-40 bg-gray-200">
                      {/* Fixed: Added fallback for similar gig image */}
                      <Image
                        src={similarGig.image || "/placeholder.svg?height=200&width=400&query=photoshoot"}
                        alt={similarGig.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold mb-1">{similarGig.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">{similarGig.company}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">{similarGig.location}</span>
                        <Badge variant="outline">{similarGig.category}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Apply Now */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Apply Now</h2>
              <p className="text-gray-600 mb-6">
                Interested in this opportunity? Submit your application now to be considered for this role.
              </p>
              <RequireAuth
                fallback={
                  <Button className="w-full bg-black text-white hover:bg-black/90 mb-3">Sign in to Apply</Button>
                }
              >
                <Button className="w-full bg-black text-white hover:bg-black/90 mb-3">Apply for this Gig</Button>
              </RequireAuth>
              <RequireAuth
                fallback={
                  <p className="text-sm text-center text-gray-500 mt-2">
                    Don't have an account? You'll be able to create one after clicking the button above.
                  </p>
                }
              >
                <Button variant="outline" className="w-full">
                  Save for Later
                </Button>
              </RequireAuth>
            </div>

            {/* Client Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">About the Client</h2>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                  <Building className="h-6 w-6 text-gray-500" />
                </div>
                <div>
                  <div className="flex items-center">
                    <p className="font-medium">{gig.clientInfo.name}</p>
                    {gig.clientInfo.verified && (
                      <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
                        <CheckCircle className="h-3 w-3 mr-1" /> Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm">Client since 2021</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Projects</p>
                  <p className="font-bold">{gig.clientInfo.projects}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Rating</p>
                  <div className="flex items-center">
                    <p className="font-bold mr-1">{gig.clientInfo.rating}</p>
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full">
                View Client Profile
              </Button>
            </div>

            {/* Application Tips */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Application Tips</h2>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <span>Highlight relevant experience in your application</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <span>Include your most recent and relevant portfolio images</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <span>Be specific about your availability for the shoot dates</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <span>Respond promptly to any follow-up communications</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Comprehensive mock gig data
const gigs = [
  {
    title: "Luxury Fashion Editorial",
    company: "Vogue Magazine",
    category: "Editorial",
    description:
      "Seeking female models for an upcoming high fashion editorial spread titled 'Future Nostalgia'. The shoot will feature avant-garde couture pieces from leading designers. Looking for models with strong editorial experience and the ability to convey emotion through sophisticated poses.\n\nThe editorial will be shot by renowned fashion photographer Elena Mori and will be featured in our September issue. The concept explores the intersection of futuristic elements with vintage aesthetics, creating a unique visual narrative that challenges conventional fashion boundaries.\n\nSelected models will work closely with our creative team to bring this vision to life through a series of conceptual setups in both studio and architectural locations throughout New York City. This is an excellent opportunity to be part of a prestigious editorial that will receive significant industry exposure.",
    location: "New York, NY",
    duration: "1 Day Shoot",
    compensation: "$2,000",
    date: "June 15, 2023",
    postedDate: "2 days ago",
    image: "/gig-editorial.png",
    featured: true,
    tags: ["High Fashion", "Editorial", "Couture", "Female Models", "Print"],
    requirements: [
      "Female, 5'9\" - 5'11\"",
      "Sizes 0-4",
      "Strong editorial portfolio",
      "Ability to create dynamic poses",
      "Previous magazine experience preferred",
    ],
    clientInfo: {
      name: "Vogue Magazine",
      verified: true,
      projects: 28,
      rating: 4.9,
    },
  },
  // Other gig data entries...
]

// Similar gigs for the detail page
const similarGigs = [
  {
    title: "High Fashion Lookbook",
    company: "Luxury Brand",
    category: "Editorial",
    location: "New York, NY",
    image: "/similar-gig-1.png",
  },
  {
    title: "Magazine Cover Shoot",
    company: "Fashion Publication",
    category: "Editorial",
    location: "Los Angeles, CA",
    image: "/similar-gig-2.png",
  },
  {
    title: "Designer Campaign",
    company: "Premium Fashion Label",
    category: "Commercial",
    location: "Miami, FL",
    image: "/similar-gig-3.png",
  },
  {
    title: "Fashion Week Casting",
    company: "Fashion Week Organization",
    category: "Runway",
    location: "Milan, Italy",
    image: "/similar-gig-4.png",
  },
]
