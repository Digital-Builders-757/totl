"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, MapPin, DollarSign, Filter, ArrowRight, Calendar } from "lucide-react"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/database.types"

// FIXED: Using explicit column selection and avoiding aggregates

export async function getGigs() {
  const supabase = createServerComponentClient<Database>({ cookies })

  // FIXED: Explicit column selection, no aggregates
  const { data, error } = await supabase
    .from("gigs")
    .select(`
      id, 
      title, 
      description, 
      location, 
      compensation, 
      date, 
      category,
      image,
      client_id
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching gigs:", error)
    return []
  }

  return data || []
}

export default async function GigsPage() {
  const gigs = await getGigs()

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-4">Find Gigs</h1>
            <p className="text-gray-600 max-w-3xl">
              Browse through available casting opportunities and gigs. Filter by category, location, and more to find
              the perfect match for your talents.
            </p>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <Input placeholder="Search for gigs, roles, or keywords" className="pl-10 bg-gray-50 border-gray-200" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter size={16} />
                  Filters
                </Button>
                <Button className="bg-black text-white hover:bg-black/90">Search</Button>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                Editorial
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                Commercial
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                Runway
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                Print
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                Fitness
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                Beauty
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                Promotional
              </Badge>
            </div>
          </div>

          {/* Gigs List */}
          <div className="space-y-6">
            {gigs.map((gig, index) => (
              <div key={gig.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="grid md:grid-cols-4">
                  <div className="md:col-span-1 relative h-48 md:h-auto">
                    <Image
                      src={gig.image || "/placeholder.svg?height=300&width=300&query=casting"}
                      alt={gig.title}
                      fill
                      className="object-cover"
                    />
                    {/* {gig.featured && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-black text-white">Featured</Badge>
                      </div>
                    )}
                    {gig.urgent && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-red-500 text-white">Urgent</Badge>
                      </div>
                    )} */}
                  </div>
                  <div className="md:col-span-3 p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-xl font-bold mb-2">{gig.title}</h2>
                        {/* <p className="text-gray-600 mb-4">{gig.company}</p> */}
                      </div>
                      <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                        {gig.category}
                      </span>
                    </div>

                    <p className="text-gray-700 mb-4">{gig.description}</p>

                    <div className="flex flex-wrap gap-4 mb-6">
                      <div className="flex items-center text-gray-600">
                        <MapPin size={16} className="mr-1" />
                        {gig.location}
                      </div>
                      {/* <div className="flex items-center text-gray-600">
                        <Clock size={16} className="mr-1" />
                        {gig.duration}
                      </div> */}
                      <div className="flex items-center text-gray-600">
                        <DollarSign size={16} className="mr-1" />
                        {gig.compensation}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Calendar size={16} className="mr-1" />
                        {gig.date}
                      </div>
                    </div>

                    {/* <div className="flex flex-wrap gap-2 mb-4">
                      {gig.tags.map((tag, tagIndex) => (
                        <Badge key={tagIndex} variant="outline" className="bg-gray-50">
                          {tag}
                        </Badge>
                      ))}
                    </div> */}

                    <div className="flex justify-between items-center">
                      {/* <p className="text-gray-500 text-sm">Posted {gig.postedDate}</p> */}
                      <Button asChild className="bg-black text-white hover:bg-black/90">
                        <Link href={`/gigs/${index}`}>
                          View Details <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination or Load More */}
          <div className="mt-12 text-center">
            <Button variant="outline" className="mx-auto">
              Load More Gigs
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Comprehensive mock gig data
// const gigs = [
//   {
//     title: "Luxury Fashion Editorial",
//     company: "Vogue Magazine",
//     category: "Editorial",
//     description:
//       "Seeking female models for an upcoming high fashion editorial spread titled 'Future Nostalgia'. The shoot will feature avant-garde couture pieces from leading designers. Looking for models with strong editorial experience and the ability to convey emotion through sophisticated poses.",
//     location: "New York, NY",
//     duration: "1 Day Shoot",
//     compensation: "$2,000",
//     date: "June 15, 2023",
//     postedDate: "2 days ago",
//     image: "/gig-editorial.png",
//     featured: true,
//     tags: ["High Fashion", "Editorial", "Couture", "Female Models", "Print"],
//     requirements: [
//       "Female, 5'9\" - 5'11\"",
//       "Sizes 0-4",
//       "Strong editorial portfolio",
//       "Ability to create dynamic poses",
//       "Previous magazine experience preferred",
//     ],
//     clientInfo: {
//       name: "Vogue Magazine",
//       verified: true,
//       projects: 28,
//       rating: 4.9,
//     },
//   },
//   {
//     title: "Sportswear Campaign Models",
//     company: "Athletic Performance Brand",
//     category: "Commercial",
//     description:
//       "Athletic performance brand is casting fit male and female models for our upcoming Spring/Summer campaign. We're looking for models with athletic builds who can demonstrate movement and embody an active lifestyle. Experience in sports or fitness modeling is a plus.",
//     location: "Los Angeles, CA",
//     duration: "3 Day Shoot",
//     compensation: "$3,500",
//     date: "May 28-30, 2023",
//     postedDate: "5 days ago",
//     image: "/gig-sportswear.png",
//     tags: ["Fitness", "Commercial", "Athletic", "Male Models", "Female Models"],
//     requirements: [
//       "Athletic build",
//       "Ages 21-35",
//       "Genuine fitness experience",
//       "Ability to perform physical activities on set",
//       "Natural, healthy appearance",
//     ],
//     clientInfo: {
//       name: "Athletic Performance Brand",
//       verified: true,
//       projects: 12,
//       rating: 4.7,
//     },
//   },
//   {
//     title: "Runway Models for Fashion Week",
//     company: "Luxury Design House",
//     category: "Runway",
//     description:
//       "Prestigious design house is casting male and female models for our upcoming runway show during Paris Fashion Week. The collection features bold silhouettes and innovative textiles. We're seeking models with strong runway experience and confident walks.",
//     location: "Paris, France",
//     duration: "1 Week",
//     compensation: "$5,000+",
//     date: "September 25-October 2, 2023",
//     postedDate: "1 week ago",
//     image: "/gig-runway.png",
//     tags: ["Runway", "Fashion Week", "International", "High Fashion"],
//     requirements: [
//       "Female: 5'9\" - 6'0\", Male: 6'0\" - 6'3\"",
//       "Sizes: Female 0-4, Male 38-40",
//       "Professional runway experience required",
//       "Valid passport and ability to travel internationally",
//       "Previous fashion week experience preferred",
//     ],
//     clientInfo: {
//       name: "Luxury Design House",
//       verified: true,
//       projects: 35,
//       rating: 4.8,
//     },
//   },
//   {
//     title: "Beauty Campaign for Skincare Line",
//     company: "Luminous Beauty",
//     category: "Beauty",
//     description:
//       "Seeking models with exceptional skin for a campaign featuring our new natural skincare line. We're looking for diverse faces that showcase natural beauty. The campaign will focus on close-up beauty shots highlighting radiant, healthy skin.",
//     location: "Miami, FL",
//     duration: "2 Day Shoot",
//     compensation: "$2,800",
//     date: "June 8-9, 2023",
//     postedDate: "3 days ago",
//     image: "/gig-beauty.png",
//     tags: ["Beauty", "Skincare", "Close-up", "Diverse Models"],
//     requirements: [
//       "All ethnicities, ages 20-45",
//       "Excellent skin condition",
//       "No visible tattoos on face/neck",
//       "Natural look preferred",
//       "Previous beauty campaign experience a plus",
//     ],
//     clientInfo: {
//       name: "Luminous Beauty",
//       verified: true,
//       projects: 8,
//       rating: 4.6,
//     },
//   },
//   {
//     title: "E-commerce Models for Online Retailer",
//     company: "Modern Essentials",
//     category: "Commercial",
//     description:
//       "Fast-growing online fashion retailer needs male and female models for ongoing e-commerce shoots. Models will showcase our seasonal collections including casual wear, business attire, and accessories. Looking for models who can complete multiple looks efficiently.",
//     location: "Chicago, IL",
//     duration: "Ongoing",
//     compensation: "$1,200/day",
//     date: "Multiple dates available",
//     postedDate: "4 days ago",
//     image: "/gig-ecommerce.png",
//     urgent: true,
//     tags: ["E-commerce", "Commercial", "Fashion", "Ongoing Work"],
//     requirements: [
//       "Female: Sizes 2-10, Male: Sizes M-XL",
//       "Height: Female 5'7\" - 5'10\", Male 5'11\" - 6'2\"",
//       "Clean, commercial look",
//       "Ability to showcase garments effectively",
//       "Experience with high-volume shoots preferred",
//     ],
//     clientInfo: {
//       name: "Modern Essentials",
//       verified: true,
//       projects: 15,
//       rating: 4.5,
//     },
//   },
//   {
//     title: "Urban Streetwear Campaign",
//     company: "Street Culture Apparel",
//     category: "Commercial",
//     description:
//       "Streetwear brand is looking for models with authentic street style for our Fall collection campaign. We want real personalities who embody urban culture and can bring genuine energy to the shoot. The campaign will feature both still photography and short video content.",
//     location: "Brooklyn, NY",
//     duration: "2 Day Shoot",
//     compensation: "$1,800",
//     date: "July 12-13, 2023",
//     postedDate: "6 days ago",
//     image: "/gig-streetwear.png",
//     tags: ["Streetwear", "Urban", "Authentic", "Video", "Youth Culture"],
//     requirements: [
//       "Ages 18-28",
//       "Authentic street style",
//       "Diverse looks and backgrounds encouraged",
//       "Natural on-camera presence",
//       "Dance or movement skills a plus",
//     ],
//     clientInfo: {
//       name: "Street Culture Apparel",
//       verified: false,
//       projects: 4,
//       rating: 4.3,
//     },
//   },
//   {
//     title: "Luxury Jewelry Campaign",
//     company: "Eternal Diamonds",
//     category: "Commercial",
//     description:
//       "Prestigious jewelry brand is seeking elegant female models for our upcoming fine jewelry campaign. The shoot will feature close-up hand shots as well as portrait work showcasing our exclusive diamond collection. Looking for refined, sophisticated appearance.",
//     location: "London, UK",
//     duration: "1 Day Shoot",
//     compensation: "$3,000",
//     date: "June 22, 2023",
//     postedDate: "2 days ago",
//     image: "/gig-jewelry.png",
//     featured: true,
//     tags: ["Luxury", "Jewelry", "Elegant", "International", "High-End"],
//     requirements: [
//       "Female, ages 25-40",
//       "Elegant hands with long fingers",
//       "Well-maintained nails",
//       "Refined facial features",
//       "Previous luxury brand experience preferred",
//     ],
//     clientInfo: {
//       name: "Eternal Diamonds",
//       verified: true,
//       projects: 22,
//       rating: 4.9,
//     },
//   },
//   {
//     title: "Fitness Supplement Campaign",
//     company: "Peak Performance Nutrition",
//     category: "Fitness",
//     description:
//       "Health supplement company is casting fit male models with athletic physiques for our new product line campaign. The shoot will include gym settings and active lifestyle scenarios. Looking for models who embody health and vitality with defined muscle tone.",
//     location: "San Diego, CA",
//     duration: "1 Day Shoot",
//     compensation: "$1,500",
//     date: "June 5, 2023",
//     postedDate: "1 week ago",
//     image: "/gig-fitness.png",
//     urgent: true,
//     tags: ["Fitness", "Male Models", "Athletic", "Supplements", "Lifestyle"],
//     requirements: [
//       "Male, ages 22-35",
//       "Athletic, defined physique",
//       "Genuine fitness lifestyle",
//       "No visible tattoos preferred",
//       "Ability to demonstrate exercise form",
//     ],
//     clientInfo: {
//       name: "Peak Performance Nutrition",
//       verified: true,
//       projects: 7,
//       rating: 4.4,
//     },
//   },
//   {
//     title: "Lifestyle Models for Travel Campaign",
//     company: "Wanderlust Travel Magazine",
//     category: "Lifestyle",
//     description:
//       "Travel publication is seeking diverse models for an international travel campaign featuring exotic destinations. Models will be photographed in various travel scenarios including beaches, urban exploration, and cultural experiences. Looking for natural, relatable personalities.",
//     location: "Multiple Locations",
//     duration: "10 Day Shoot",
//     compensation: "$8,000 + Travel Expenses",
//     date: "July 15-25, 2023",
//     postedDate: "3 days ago",
//     image: "/gig-travel.png",
//     tags: ["Travel", "Lifestyle", "International", "Diverse Models", "On-Location"],
//     requirements: [
//       "Ages 21-45, all ethnicities",
//       "Natural, relatable appearance",
//       "Valid passport with ability to travel internationally",
//       "Adaptable to various environments and weather conditions",
//       "Previous travel or lifestyle modeling a plus",
//     ],
//     clientInfo: {
//       name: "Wanderlust Travel Magazine",
//       verified: true,
//       projects: 18,
//       rating: 4.7,
//     },
//   },
//   {
//     title: "Promotional Models for Product Launch",
//     company: "Tech Innovations Inc.",
//     category: "Promotional",
//     description:
//       "Tech company is hiring promotional models for our upcoming product launch event. Models will interact with guests, demonstrate products, and create an engaging atmosphere. Looking for outgoing personalities with excellent communication skills and professional appearance.",
//     location: "San Francisco, CA",
//     duration: "2 Day Event",
//     compensation: "$800",
//     date: "June 18-19, 2023",
//     postedDate: "5 days ago",
//     image: "/gig-promotional.png",
//     tags: ["Promotional", "Event", "Tech", "Interactive", "Brand Ambassador"],
//     requirements: [
//       "Ages 21-35",
//       "Professional appearance",
//       "Excellent verbal communication skills",
//       "Basic tech knowledge",
//       "Previous promotional or event experience preferred",
//     ],
//     clientInfo: {
//       name: "Tech Innovations Inc.",
//       verified: true,
//       projects: 5,
//       rating: 4.2,
//     },
//   },
// ]
