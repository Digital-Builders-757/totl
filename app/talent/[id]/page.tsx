import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Instagram,
  MapPin,
  Calendar,
  Star,
  Award,
  Clock,
  Briefcase,
  Heart,
  Share2,
  MessageSquare,
} from "lucide-react"
import { SafeImage } from "@/components/ui/safe-image"

export default function TalentProfilePage({ params }: { params: { id: string } }) {
  // Get the talent data based on the ID
  const talentId = Number.parseInt(params.id)
  const talent = talentData[talentId] || talentData[0] // Fallback to first talent if ID not found

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-12">
        <Link href="/talent" className="inline-flex items-center text-gray-600 hover:text-black mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to talent
        </Link>

        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="relative h-64 md:h-96 bg-gray-200">
            {/* Using SafeImage for cover image */}
            <SafeImage
              src={talent.coverImage}
              alt="Cover"
              fill
              placeholderQuery="fashion backdrop"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          </div>

          <div className="relative px-6 md:px-8 pb-8">
            <div className="flex flex-col md:flex-row">
              <div className="relative -mt-20 md:-mt-24 mb-4 md:mb-0 md:mr-8">
                <div className="w-32 h-32 md:w-48 md:h-48 rounded-xl overflow-hidden border-4 border-white shadow-md">
                  {/* Using SafeImage for profile image */}
                  <SafeImage
                    src={talent.image}
                    alt={talent.name}
                    width={200}
                    height={200}
                    placeholderQuery="model portrait"
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>

              <div className="flex-1 pt-4 md:pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-1">{talent.name}</h1>
                    <p className="text-gray-600 text-lg">{talent.specialty}</p>
                  </div>
                  <div className="flex space-x-2 mt-4 md:mt-0">
                    <Button variant="outline" size="icon" className="rounded-full">
                      <Heart className="h-5 w-5" />
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-full">
                      <Share2 className="h-5 w-5" />
                    </Button>
                    <Button className="bg-black text-white hover:bg-black/90">
                      <MessageSquare className="mr-2 h-4 w-4" /> Contact
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {talent.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="rounded-full">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                    <span>{talent.location}</span>
                  </div>
                  <div className="flex items-center">
                    <Instagram className="mr-2 h-4 w-4 text-gray-500" />
                    <a href="#" className="hover:underline">
                      @{talent.instagram}
                    </a>
                  </div>
                  <div className="flex items-center">
                    <Star className="mr-2 h-4 w-4 text-gray-500" />
                    <span>{talent.rating} Rating</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                    <span>{talent.availability}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Details</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Height</h3>
                  <p>{talent.details.height}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Measurements</h3>
                  <p>{talent.details.measurements}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Hair Color</h3>
                  <p>{talent.details.hairColor}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Eye Color</h3>
                  <p>{talent.details.eyeColor}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Shoe Size</h3>
                  <p>{talent.details.shoeSize}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Languages</h3>
                  <p>{talent.details.languages.join(", ")}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Experience</h2>
              <div className="space-y-4">
                {talent.experience.map((exp, index) => (
                  <div key={index} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                    <div className="flex items-start">
                      <Briefcase className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                      <div>
                        <h3 className="font-medium">{exp.title}</h3>
                        <p className="text-gray-600 text-sm">{exp.company}</p>
                        <p className="text-gray-500 text-sm">{exp.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Availability</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium">Available for Bookings</p>
                    <p className="text-gray-600 text-sm">{talent.availabilityDetails.status}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Upcoming Schedule</h3>
                  {talent.availabilityDetails.schedule.map((item, index) => (
                    <div key={index} className="flex items-center py-2 border-b border-gray-100 last:border-0">
                      <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center mr-3">
                        <span className="font-medium">{item.date}</span>
                      </div>
                      <div>
                        <p className="font-medium">{item.event}</p>
                        <p className="text-gray-500 text-sm">{item.location}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Portfolio & Booking */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">About</h2>
              <p className="text-gray-700 whitespace-pre-line">{talent.bio}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <Tabs defaultValue="portfolio" className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                  <TabsTrigger value="polaroids">Polaroids</TabsTrigger>
                  <TabsTrigger value="videos">Videos</TabsTrigger>
                </TabsList>
                <TabsContent value="portfolio">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {talent.portfolio.map((item, index) => (
                      <div key={index} className="aspect-[3/4] relative rounded-md overflow-hidden group">
                        {/* Using SafeImage for portfolio images */}
                        <SafeImage
                          src={item.image}
                          alt={`Portfolio ${index + 1}`}
                          fill
                          placeholderQuery="fashion model"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <p className="text-white font-medium">{item.caption}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="polaroids">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {talent.polaroids.map((item, index) => (
                      <div key={index} className="aspect-[3/4] relative rounded-md overflow-hidden">
                        {/* Using SafeImage for polaroid images */}
                        <SafeImage
                          src={item}
                          alt={`Polaroid ${index + 1}`}
                          fill
                          placeholderQuery="model polaroid"
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="videos">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {talent.videos.map((video, index) => (
                      <div key={index} className="aspect-video relative rounded-md overflow-hidden bg-gray-100">
                        {/* Using SafeImage for video thumbnails with conditional rendering */}
                        {video.thumbnail && (
                          <SafeImage
                            src={video.thumbnail}
                            alt={`Video ${index + 1}`}
                            fill
                            placeholderQuery="video thumbnail"
                            className="object-cover"
                          />
                        )}
                        {!video.thumbnail && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <p className="text-gray-500">Video Preview {index + 1}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-6">Book This Talent</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                    <h3 className="font-medium">Standard Booking</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">Perfect for editorial, commercial, and print work</p>
                  <p className="font-bold text-xl mb-1">${talent.bookingRates.standard}/day</p>
                  <p className="text-gray-500 text-sm">Standard rate for 8-hour day</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Award className="h-5 w-5 text-gray-500 mr-2" />
                    <h3 className="font-medium">Premium Booking</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    Ideal for campaigns, exclusive rights, and extended usage
                  </p>
                  <p className="font-bold text-xl mb-1">${talent.bookingRates.premium}/day</p>
                  <p className="text-gray-500 text-sm">Premium rate with extended usage rights</p>
                </div>
              </div>
              <Button className="w-full bg-black text-white hover:bg-black/90">Request Booking</Button>
              <p className="text-center text-gray-500 text-sm mt-4">
                Or contact directly at{" "}
                <a href={`mailto:${talent.email}`} className="text-black font-medium">
                  {talent.email}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Comprehensive mock data for talent profiles
const talentData = [
  {
    name: "Sophia Chen",
    specialty: "Editorial & Runway",
    tags: ["Editorial", "High Fashion", "Runway", "Luxury", "Campaigns"],
    image: "/images/model-1.png",
    coverImage: "/vibrant-runway-show.png",
    location: "New York, NY",
    instagram: "sophiachen",
    rating: "4.9",
    availability: "Available Now",
    email: "sophia@totlagency.com",
    bio: "Sophia Chen is an accomplished model with over 5 years of experience in the fashion industry. Originally from San Francisco, she moved to New York to pursue her modeling career after being discovered at a local fashion event.\n\nSophia has worked with numerous high-end fashion brands and has been featured in multiple international fashion magazines. Her unique look and professional attitude have made her a favorite among designers and photographers.\n\nWith a background in dance, Sophia brings grace and fluid movement to the runway, making her especially sought after for fashion shows. She is passionate about sustainable fashion and often collaborates with eco-conscious brands.",
    details: {
      height: "5'11\" / 180cm",
      measurements: "32-24-34 / 81-61-86",
      hairColor: "Black",
      eyeColor: "Brown",
      shoeSize: "US 8 / EU 39",
      languages: ["English", "Mandarin", "French"],
    },
    experience: [
      {
        title: "New York Fashion Week",
        company: "Multiple Designers",
        date: "2022 - 2023",
      },
      {
        title: "Cover Model",
        company: "Vogue Magazine",
        date: "March 2022",
      },
      {
        title: "Campaign Face",
        company: "Luxury Brand",
        date: "Fall/Winter 2021",
      },
      {
        title: "Runway Model",
        company: "Paris Fashion Week",
        date: "2020 - 2021",
      },
    ],
    availabilityDetails: {
      status: "Available for bookings with 2 weeks notice",
      schedule: [
        {
          date: "May 15",
          event: "Editorial Shoot",
          location: "Los Angeles",
        },
        {
          date: "May 20",
          event: "Campaign Shoot",
          location: "New York",
        },
        {
          date: "Jun 5",
          event: "Fashion Show",
          location: "Milan",
        },
      ],
    },
    portfolio: [
      {
        image: "/ethereal-bloom.png",
        caption: "Vogue Editorial",
      },
      {
        image: "/fashion-forward-strut.png",
        caption: "NYFW Runway",
      },
      {
        image: "/urban-threads.png",
        caption: "Summer Campaign",
      },
      {
        image: "/radiant-portrait.png",
        caption: "Beauty Editorial",
      },
      {
        image: "/sophia-portfolio-1.png",
        caption: "Designer Lookbook",
      },
      {
        image: "/sophia-portfolio-2.png",
        caption: "Magazine Cover",
      },
    ],
    polaroids: ["/sophia-polaroid-1.png", "/sophia-polaroid-2.png", "/sophia-polaroid-3.png", "/sophia-polaroid-4.png"],
    videos: [
      { url: "#", thumbnail: "/sophia-video-1.png" },
      { url: "#", thumbnail: "/sophia-video-2.png" },
    ],
    bookingRates: {
      standard: 1200,
      premium: 2500,
    },
  },
  // Other talent data entries...
]
