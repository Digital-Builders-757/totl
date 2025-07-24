"use client";

// Force dynamic rendering to prevent build-time Supabase access
export const dynamic = "force-dynamic";

import { MapPin, DollarSign, Clock, Users, Star, ArrowRight } from "lucide-react";
import Link from "next/link";
import { PostAGigFooterLink } from "@/components/PostAGigFooterLink";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SafeImage } from "@/components/ui/safe-image";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <SafeImage
                src="/images/totl-logo-transparent.png"
                alt="TOTL Agency"
                width={120}
                height={40}
                className="h-8 w-auto"
              />
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/talent" className="text-gray-600 hover:text-gray-900 transition-colors">
                Browse Talent
              </Link>
              <Link href="/gigs" className="text-gray-600 hover:text-gray-900 transition-colors">
                Find Gigs
              </Link>
              <Link href="/about" className="text-gray-600 hover:text-gray-900 transition-colors">
                About
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/choose-role">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="secondary" className="w-fit">
                  The Future of Talent Booking
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Connect with
                  <span className="text-blue-600"> Top Talent</span>
                  <br />
                  Instantly
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  TOTL Agency is the fastest way to discover, book, and work with exceptional
                  talent. From models to influencers, find the perfect match for your next project.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/choose-role">
                  <Button size="lg" className="w-full sm:w-auto">
                    Start Booking <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/talent">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Browse Talent
                  </Button>
                </Link>
              </div>
              <div className="flex items-center space-x-8 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>500+ Verified Talent</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span>1000+ Projects Completed</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative z-10">
                <Image
                  src="/placeholder.jpg"
                  alt="Professional model showcasing talent"
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-purple-600/20 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Talent Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">Featured Talent</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover our top-rated professionals ready for your next project
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Sophia Chen",
                category: "Fashion Model",
                location: "New York, NY",
                rating: 4.9,
                image: "/placeholder.jpg",
                price: "$500/day",
              },
              {
                name: "Marcus Johnson",
                category: "Fitness Model",
                location: "Los Angeles, CA",
                rating: 4.8,
                image: "/placeholder.jpg",
                price: "$400/day",
              },
              {
                name: "Ava Rodriguez",
                category: "Commercial Model",
                location: "Miami, FL",
                rating: 5.0,
                image: "/placeholder.jpg",
                price: "$350/day",
              },
            ].map((talent, index) => (
              <Card
                key={index}
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                <CardContent className="p-0">
                  <div className="relative overflow-hidden rounded-t-lg">
                    <SafeImage
                      src={talent.image}
                      alt={talent.name}
                      width={400}
                      height={500}
                      className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-white/90 text-gray-900">{talent.price}</Badge>
                    </div>
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{talent.name}</h3>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{talent.rating}</span>
                      </div>
                    </div>
                    <p className="text-gray-600">{talent.category}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="h-4 w-4 mr-1" />
                      {talent.location}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/talent">
              <Button variant="outline" size="lg">
                View All Talent <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Gigs Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">Latest Opportunities</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Fresh gigs posted by top brands and agencies
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* This section will be populated with real gigs from the database */}
            <div className="text-center py-12">
              <p className="text-gray-500">Loading latest opportunities...</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">How TOTL Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple, fast, and secure talent booking in three easy steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Browse & Discover",
                description:
                  "Search through our curated database of verified talent. Filter by category, location, budget, and availability.",
                icon: "🔍",
              },
              {
                step: "02",
                title: "Connect & Book",
                description:
                  "Review portfolios, check availability, and send booking requests directly through our platform.",
                icon: "🤝",
              },
              {
                step: "03",
                title: "Create & Deliver",
                description:
                  "Collaborate seamlessly with your chosen talent and receive high-quality deliverables on time.",
                icon: "✨",
              },
            ].map((item, index) => (
              <div key={index} className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-2xl">
                  {item.icon}
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-blue-600">STEP {item.step}</div>
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-white">
              Ready to Find Your Perfect Match?
            </h2>
            <p className="text-xl text-blue-100">
              Join thousands of brands and talent who trust TOTL Agency for their projects
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/choose-role">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Get Started Today
                </Button>
              </Link>
              <Link href="/about">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-blue-100 text-blue-100 hover:bg-white hover:text-blue-600"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <SafeImage
                src="/images/totl-logo-transparent.png"
                alt="TOTL Agency"
                width={120}
                height={40}
                className="h-8 w-auto brightness-0 invert"
              />
              <p className="text-gray-400">
                The premier platform for connecting brands with exceptional talent.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Brands</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <PostAGigFooterLink />
                </li>
                <li>
                  <Link href="/talent" className="hover:text-white transition-colors">
                    Browse Talent
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Talent</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/talent/signup" className="hover:text-white transition-colors">
                    Join as Talent
                  </Link>
                </li>
                <li>
                  <Link href="/gigs" className="hover:text-white transition-colors">
                    Find Gigs
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Success Stories
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/about" className="hover:text-white transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 TOTL Agency. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
