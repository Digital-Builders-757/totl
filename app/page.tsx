// Force dynamic rendering to prevent build-time Supabase access
export const dynamic = "force-dynamic";

import { ArrowRight, Star, MapPin, Search, Handshake, Sparkles } from "lucide-react";
// import Image from "next/image";
import Link from "next/link";
import { PostGigFooterLink } from "@/components/post-gig-footer-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FloatingPathsBackground } from "@/components/ui/floating-paths-background";
import { SafeImage } from "@/components/ui/safe-image";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-seamless-primary text-white pt-20">
      {/* Hero Section */}
      <section className="relative py-16 sm:py-24 md:py-32 lg:py-40 overflow-hidden">
        {/* Animated Floating Paths Background - Premium Back-Lit Effect */}
        <FloatingPathsBackground opacity={0.08} color="white" />
        
        {/* Apple-Inspired Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/3 via-white/8 to-white/3 z-[1]"></div>
        <div className="absolute top-0 left-1/4 w-48 h-48 sm:w-72 sm:h-72 bg-white/3 rounded-full blur-3xl animate-apple-float z-[1]"></div>
        <div
          className="absolute bottom-0 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-white/3 rounded-full blur-3xl animate-apple-float z-[1]"
          style={{ animationDelay: "1s" }}
        ></div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 md:gap-16 lg:gap-20 items-start">
            <div className="space-y-6 pt-4 text-center lg:text-left">
              <div className="space-y-6">
                <div className="apple-glass rounded-2xl px-6 py-3 w-fit mx-auto lg:mx-0">
                  <span className="text-white font-medium text-sm">
                    The Future of Talent Booking
                  </span>
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold text-white leading-tight font-display">
                  Connect with
                  <span className="apple-text-gradient"> Top Talent</span>
                  <br />
                  <span className="text-gray-200">Instantly</span>
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl text-gray-300 leading-relaxed max-w-lg mx-auto lg:mx-0">
                  TOTL Agency is the fastest way to discover, book, and work with exceptional
                  talent. From models to influencers, find the perfect match for your next project.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center lg:justify-start">
                <Link href="/choose-role" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="button-glow w-full px-8 sm:px-10 py-5 text-lg sm:text-xl font-semibold border-0 min-h-[56px]"
                  >
                    Start Booking <ArrowRight className="ml-2 sm:ml-3 h-5 w-5 sm:h-6 sm:w-6" />
                  </Button>
                </Link>
                <Link href="/talent" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full border-2 border-white/20 text-white hover:bg-white/5 hover:border-white/30 apple-glass px-8 sm:px-10 py-5 text-lg sm:text-xl font-semibold min-h-[56px]"
                  >
                    Browse Talent
                  </Button>
                </Link>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-8 md:gap-12 text-xs sm:text-sm text-gray-400">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-apple-glow"></div>
                  <span className="font-medium">500+ Verified Talent</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div
                    className="w-3 h-3 bg-white rounded-full animate-apple-glow"
                    style={{ animationDelay: "0.5s" }}
                  ></div>
                  <span className="font-medium">1000+ Projects Completed</span>
                </div>
              </div>
            </div>
            <div className="relative mt-8 lg:mt-0">
              <div className="relative z-10 apple-card p-4 sm:p-6 md:p-8">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-auto object-contain rounded-lg"
                >
                  <source src="/videos/slowmo_woman.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-white/5 rounded-3xl transform rotate-2"></div>
              <div className="absolute -inset-4 bg-gradient-to-tr from-white/5 to-white/2 rounded-3xl transform -rotate-2 hidden sm:block"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Talent Section */}
      <section className="py-32 bg-seamless-secondary">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="apple-glass rounded-2xl px-6 py-3 w-fit mx-auto mb-8">
              <span className="text-white font-medium text-sm">Featured Talent</span>
            </div>
            <h2 className="text-5xl lg:text-6xl font-bold text-white mb-6 font-display">
              Meet Our
              <span className="apple-text-gradient"> Stars</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Discover exceptional talent ready to bring your vision to life. From fashion to
              fitness, our curated selection represents the best in the industry.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Marcus Rodriguez",
                role: "Fitness Model",
                location: "Los Angeles",
                rating: 4.8,
                price: "$450/day",
                image: "https://picsum.photos/400/500?random=2",
                specialties: ["Fitness", "Lifestyle", "Commercial"],
              },
              {
                name: "Isabella Martinez",
                role: "Beauty Model",
                location: "Miami",
                rating: 4.9,
                price: "$400/day",
                image: "https://picsum.photos/400/500?random=3",
                specialties: ["Beauty", "Fashion", "Editorial"],
              },
              {
                name: "Alex Thompson",
                role: "Commercial Model",
                location: "Chicago",
                rating: 4.7,
                price: "$350/day",
                image: "https://picsum.photos/400/500?random=4",
                specialties: ["Commercial", "Corporate", "Lifestyle"],
              },
            ].map((talent, index) => (
              <Card
                key={talent.name}
                className="group apple-card hover-lift cursor-pointer overflow-hidden"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-0">
                  <div className="relative overflow-hidden">
                    <SafeImage
                      src={talent.image}
                      alt={talent.name}
                      width={400}
                      height={500}
                      className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-500"
                      fallbackSrc="/images/solo_logo.png"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-white/95 text-black font-semibold shadow-soft backdrop-blur-sm">
                        {talent.price}
                      </Badge>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white text-xl font-bold mb-1">{talent.name}</h3>
                      <p className="text-gray-300 text-sm font-medium">{talent.role}</p>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-semibold text-white">{talent.rating}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-300">
                        <MapPin className="h-4 w-4 mr-1" />
                        {talent.location}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {talent.specialties.map((specialty, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="text-xs bg-white/10 text-white border-white/20"
                        >
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-32 bg-seamless-accent">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="apple-glass rounded-2xl px-6 py-3 w-fit mx-auto mb-8">
              <span className="text-white font-medium text-sm">How It Works</span>
            </div>
            <h2 className="text-5xl lg:text-6xl font-bold text-white mb-6 font-display">
              Simple
              <span className="apple-text-gradient"> Process</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              From discovery to booking, we&apos;ve streamlined the entire process to make talent
              acquisition effortless and efficient.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto bg-white/10 rounded-full flex items-center justify-center apple-glass">
                <Search className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">Discover</h3>
              <p className="text-gray-300 leading-relaxed">
                Browse our curated selection of verified talent across all categories and
                specialties.
              </p>
            </div>
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto bg-white/10 rounded-full flex items-center justify-center apple-glass">
                <Handshake className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">Connect</h3>
              <p className="text-gray-300 leading-relaxed">
                Reach out directly to talent or let us facilitate the perfect match for your
                project.
              </p>
            </div>
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto bg-white/10 rounded-full flex items-center justify-center apple-glass">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">Create</h3>
              <p className="text-gray-300 leading-relaxed">
                Bring your vision to life with professional talent and seamless project management.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-32 bg-seamless-radial">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 text-center">
            <div className="space-y-4">
              <div className="text-5xl font-bold text-white font-display">500+</div>
              <div className="text-gray-300 text-lg">Verified Talent</div>
            </div>
            <div className="space-y-4">
              <div className="text-5xl font-bold text-white font-display">1000+</div>
              <div className="text-gray-300 text-lg">Projects Completed</div>
            </div>
            <div className="space-y-4">
              <div className="text-5xl font-bold text-white font-display">50+</div>
              <div className="text-gray-300 text-lg">Cities Covered</div>
            </div>
            <div className="space-y-4">
              <div className="text-5xl font-bold text-white font-display">4.9</div>
              <div className="text-gray-300 text-lg">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-seamless-primary">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-5xl lg:text-6xl font-bold text-white font-display">
              Ready to
              <span className="apple-text-gradient"> Get Started?</span>
            </h2>
            <p className="text-xl text-gray-300 leading-relaxed">
              Join thousands of brands and creators who trust TOTL Agency for their talent needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/choose-role">
                <Button
                  size="lg"
                  className="button-glow w-full sm:w-auto px-10 py-5 text-xl font-semibold border-0"
                >
                  Start Booking <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </Link>
              <Link href="/talent">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-2 border-white/20 text-white hover:bg-white/5 hover:border-white/30 apple-glass px-10 py-5 text-xl font-semibold"
                >
                  Browse Talent
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="space-y-6">
              <SafeImage
                src="/images/solo_logo.png"
                alt="TOTL Agency"
                width={120}
                height={40}
                className="h-8 w-auto brightness-0 invert"
              />
              <p className="text-gray-400 leading-relaxed">
                The future of talent booking. Connect with exceptional talent instantly.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-white font-semibold">Platform</h3>
              <div className="space-y-2">
                <Link
                  href="/talent"
                  className="block text-gray-400 hover:text-white transition-colors"
                >
                  Browse Talent
                </Link>
                <Link
                  href="/gigs"
                  className="block text-gray-400 hover:text-white transition-colors"
                >
                  Find Gigs
                </Link>
                <Link
                  href="/about"
                  className="block text-gray-400 hover:text-white transition-colors"
                >
                  About Us
                </Link>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-white font-semibold">Support</h3>
              <div className="space-y-2">
                <Link
                  href="/help"
                  className="block text-gray-400 hover:text-white transition-colors"
                >
                  Help Center
                </Link>
                <Link
                  href="/contact"
                  className="block text-gray-400 hover:text-white transition-colors"
                >
                  Contact Us
                </Link>
                <Link
                  href="/terms"
                  className="block text-gray-400 hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>
                <Link
                  href="/privacy"
                  className="block text-gray-400 hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-white font-semibold">Get Started</h3>
              <div className="space-y-2">
                <Link
                  href="/choose-role"
                  className="block text-gray-400 hover:text-white transition-colors"
                >
                  Apply as Talent
                </Link>
                <PostGigFooterLink />
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 TOTL Agency. All rights reserved.</p>
            <p className="mt-2 text-sm">
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              {" · "}
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
