import { Instagram, Mail, MapPin, Phone, Users, Target, Award, Sparkles } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-black text-white pt-20">
      {/* Hero Section - Matching Homepage Style */}
      <section className="relative py-32 lg:py-40 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/3 via-white/8 to-white/3"></div>
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-white/3 rounded-full blur-3xl animate-apple-float"></div>
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/3 rounded-full blur-3xl animate-apple-float"
          style={{ animationDelay: "1s" }}
        ></div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-6">
              <Badge className="bg-white/10 text-white border-white/20 px-4 py-2 text-sm">
                ✨ About TOTL Agency
              </Badge>
              <h1 className="text-6xl lg:text-8xl font-bold text-white leading-tight font-display">
                Rise Above
                <span className="apple-text-gradient"> The Rest</span>
              </h1>
              <p className="text-2xl text-gray-300 leading-relaxed max-w-lg">
                Representing exceptional modeling talent worldwide. We connect the right talent with
                the right opportunities through innovation and integrity.
              </p>
            </div>
            <div className="relative">
              <div className="relative z-10 apple-card p-8">
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
              <div className="absolute -inset-4 bg-gradient-to-tr from-white/5 to-white/2 rounded-3xl transform -rotate-2"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-32 bg-gradient-to-b from-black to-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-12 animate-apple-fade-in">
            <div className="apple-glass rounded-2xl px-6 py-3 w-fit mx-auto">
              <span className="text-white font-medium text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Our Story
              </span>
            </div>
            
            <h2 className="text-5xl lg:text-6xl font-bold text-white">
              Building the Future of Talent
            </h2>
            
            <div className="space-y-8 text-lg text-gray-300 leading-relaxed">
              <div className="apple-glass p-8 rounded-2xl hover:bg-white/5 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">2020</span>
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-white mb-2">The Vision</h3>
                    <p>
                      Founded in 2020, TOTL Agency emerged from a vision to transform the modeling
                      industry. We recognized a gap between exceptional talent and quality
                      opportunities, and set out to bridge that divide with integrity and innovation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="apple-glass p-8 rounded-2xl hover:bg-white/5 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">TOTL</span>
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-white mb-2">Our Commitment</h3>
                    <p>
                      Our name, TOTL (Top Of The Line), represents our commitment to excellence in every
                      aspect of our business. We believe in fostering genuine relationships with both
                      our talent and clients, creating a supportive community rather than just a
                      transactional agency.
                    </p>
                  </div>
                </div>
              </div>

              <div className="apple-glass p-8 rounded-2xl hover:bg-white/5 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-pink-500 to-orange-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">∞</span>
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-white mb-2">Today & Beyond</h3>
                    <p>
                      Today, we&apos;re proud to represent diverse talent across various modeling
                      specialties, connecting them with brands that value authenticity and creativity as
                      much as we do. Our journey continues as we shape the future of talent representation.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Elements */}
            <div className="flex justify-center items-center gap-8 pt-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Users className="w-8 h-8 text-blue-400" />
              </div>
              <div className="w-1 h-16 bg-gradient-to-b from-blue-500/50 to-purple-500/50 rounded-full"></div>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Target className="w-8 h-8 text-purple-400" />
              </div>
              <div className="w-1 h-16 bg-gradient-to-b from-purple-500/50 to-pink-500/50 rounded-full"></div>
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500/20 to-orange-500/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Award className="w-8 h-8 text-pink-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Mission Section */}
      <section className="py-32 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-apple-fade-in">
            <Badge className="bg-white/10 text-white border-white/20 px-4 py-2 text-sm mb-6">
              💎 Our Mission
            </Badge>
            <h2 className="text-5xl lg:text-6xl font-bold text-white">What Drives Us</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div
              className="apple-glass p-8 rounded-2xl group hover:bg-white/10 transition-all duration-300 animate-apple-scale-in"
              style={{ animationDelay: "0s" }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Empower Talent</h3>
              <p className="text-gray-300 leading-relaxed">
                We empower models to take control of their careers through education, mentorship,
                and transparent business practices.
              </p>
            </div>
            <div
              className="apple-glass p-8 rounded-2xl group hover:bg-white/10 transition-all duration-300 animate-apple-scale-in"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Foster Diversity</h3>
              <p className="text-gray-300 leading-relaxed">
                We celebrate diversity in all forms, actively working to create inclusive
                opportunities in the modeling industry.
              </p>
            </div>
            <div
              className="apple-glass p-8 rounded-2xl group hover:bg-white/10 transition-all duration-300 animate-apple-scale-in"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Elevate Standards</h3>
              <p className="text-gray-300 leading-relaxed">
                We&apos;re committed to raising industry standards through ethical practices, fair
                compensation, and professional development.
              </p>
            </div>
            <div
              className="apple-glass p-8 rounded-2xl group hover:bg-white/10 transition-all duration-300 animate-apple-scale-in"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Curated Applicant Access</h3>
              <p className="text-gray-300 leading-relaxed">
                Clients only see the talent who applied to their gigs—there is no public browseable
                roster. This approach keeps talent protected and keeps every opportunity contextually
                relevant.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Services Section */}
      <section className="py-32 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-apple-fade-in">
            <Badge className="bg-white/10 text-white border-white/20 px-4 py-2 text-sm mb-6">
              🌟 What We Offer
            </Badge>
            <h2 className="text-5xl lg:text-6xl font-bold text-white">Our Services</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="apple-glass p-10 rounded-2xl hover:bg-white/10 transition-all duration-300 group">
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-3 text-white">Talent Representation</h3>
                  <p className="text-gray-300 leading-relaxed">
                    We provide comprehensive representation for models, including portfolio
                    development, career guidance, and booking management.
                  </p>
                </div>
              </div>
            </div>

            <div className="apple-glass p-10 rounded-2xl hover:bg-white/10 transition-all duration-300 group">
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-3 text-white">Client Casting</h3>
                  <p className="text-gray-300 leading-relaxed">
                    We help brands find the perfect talent for their campaigns, events, and
                    promotional activities.
                  </p>
                </div>
              </div>
            </div>

            <div className="apple-glass p-10 rounded-2xl hover:bg-white/10 transition-all duration-300 group">
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-orange-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-3 text-white">Portfolio Development</h3>
                  <p className="text-gray-300 leading-relaxed">
                    We offer professional photoshoot coordination and portfolio curation to showcase
                    our talent&apos;s unique qualities.
                  </p>
                </div>
              </div>
            </div>

            <div className="apple-glass p-10 rounded-2xl hover:bg-white/10 transition-all duration-300 group">
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-3 text-white">Event Management</h3>
                  <p className="text-gray-300 leading-relaxed">
                    We coordinate fashion shows, promotional events, and brand activations with our
                    roster of professional models.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-32 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-apple-fade-in">
            <Badge className="bg-white/10 text-white border-white/20 px-4 py-2 text-sm mb-6">
              📧 Contact Us
            </Badge>
            <h2 className="text-5xl lg:text-6xl font-bold text-white">Get In Touch</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold mb-6">Contact Information</h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <MapPin className="w-6 h-6 mr-4 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold">Address</h4>
                    <p>
                      TOTL Agency
                      <br />
                      PO Box 13
                      <br />
                      Glassboro, NJ, 08028
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Phone className="w-6 h-6 mr-4 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold">Phone</h4>
                    <p>(212) 555-7890</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Mail className="w-6 h-6 mr-4 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold">Email</h4>
                    <p>contact@thetotlagency.com</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Instagram className="w-6 h-6 mr-4 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold">Instagram</h4>
                    <a
                      href="https://www.instagram.com/totlagency/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      @totlagency
                    </a>
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <h3 className="text-2xl font-bold mb-4">Office Hours</h3>
                <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                <p>Saturday: By appointment only</p>
                <p>Sunday: Closed</p>
              </div>
            </div>
            <div className="apple-glass p-8 rounded-2xl">
              <h3 className="text-2xl font-bold mb-6 text-white">Send Us a Message</h3>
              <form className="space-y-6">
                <div>
                  <label htmlFor="name" className="block mb-2 text-gray-300 font-medium">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-3 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block mb-2 text-gray-300 font-medium">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-3 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all"
                    placeholder="Your email"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block mb-2 text-gray-300 font-medium">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    className="w-full px-4 py-3 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all"
                    placeholder="Subject"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block mb-2 text-gray-300 font-medium">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    className="w-full px-4 py-3 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all resize-none"
                    placeholder="Your message"
                  ></textarea>
                </div>
                <Button className="w-full apple-button py-6 text-lg font-semibold">
                  Send Message
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-black relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/3 via-white/8 to-white/3"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto space-y-8 animate-apple-fade-in">
            <Badge className="bg-white/10 text-white border-white/20 px-4 py-2 text-sm">
              🚀 Join Us
            </Badge>
            <h2 className="text-5xl lg:text-6xl font-bold text-white">Ready to Work With Us?</h2>
            <p className="text-2xl text-gray-300 leading-relaxed max-w-2xl mx-auto">
              Whether you&apos;re a model looking for representation or a brand seeking talent,
              we&apos;re here to help you succeed.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
              <Link href="/choose-role">
                <Button size="lg" className="apple-button px-10 py-6 text-xl font-semibold">
                  Create Account
                </Button>
              </Link>
              <Link href="/client/apply">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/20 text-white hover:bg-white/5 hover:border-white/30 apple-glass px-10 py-6 text-xl font-semibold"
                >
                  Become a Career Builder
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
