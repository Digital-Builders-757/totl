import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Instagram, Mail, MapPin, Phone } from "lucide-react"

export default function AboutPage() {
  return (
    <main className="pt-20">
      {/* Hero Section */}
      <section className="relative bg-black text-white">
        <div className="absolute inset-0 z-0 opacity-50">
          <Image src="/images/agency-team.png" alt="TOTL Agency Team" fill className="object-cover" priority />
        </div>
        <div className="relative z-10 container mx-auto px-4 py-32 md:py-40">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">About TOTL Agency</h1>
          <p className="text-xl md:text-2xl max-w-2xl">
            Representing exceptional modeling talent worldwide. We rise above the rest to connect the right talent with
            the right opportunities.
          </p>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Story</h2>
              <p className="text-gray-700 mb-4">
                Founded in 2020, TOTL Agency emerged from a vision to transform the modeling industry. We recognized a
                gap between exceptional talent and quality opportunities, and set out to bridge that divide with
                integrity and innovation.
              </p>
              <p className="text-gray-700 mb-4">
                Our name, TOTL (Top Of The Line), represents our commitment to excellence in every aspect of our
                business. We believe in fostering genuine relationships with both our talent and clients, creating a
                supportive community rather than just a transactional agency.
              </p>
              <p className="text-gray-700">
                Today, we're proud to represent diverse talent across various modeling specialties, connecting them with
                brands that value authenticity and creativity as much as we do.
              </p>
            </div>
            <div className="md:w-1/2 relative h-[400px] md:h-[500px] w-full">
              <Image src="/images/model-2.png" alt="TOTL Agency Journey" fill className="object-cover rounded-lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Our Mission Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">Our Mission</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="w-8 h-8"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4">Empower Talent</h3>
              <p className="text-gray-700">
                We empower models to take control of their careers through education, mentorship, and transparent
                business practices.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="w-8 h-8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4">Foster Diversity</h3>
              <p className="text-gray-700">
                We celebrate diversity in all forms, actively working to create inclusive opportunities in the modeling
                industry.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="w-8 h-8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4">Elevate Standards</h3>
              <p className="text-gray-700">
                We're committed to raising industry standards through ethical practices, fair compensation, and
                professional development.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Team Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Meet Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                name: "Alexandra Reynolds",
                role: "Founder & CEO",
                image: "/professional-woman-portrait.png",
              },
              {
                name: "Marcus Chen",
                role: "Talent Director",
                image: "/professional-asian-man-portrait.png",
              },
              {
                name: "Sophia Williams",
                role: "Client Relations",
                image: "/professional-black-woman-portrait.png",
              },
              {
                name: "James Rodriguez",
                role: "Marketing Director",
                image: "/placeholder.svg?key=x265d",
              },
            ].map((member, index) => (
              <div key={index} className="text-center">
                <div className="relative h-[350px] w-full mb-4 overflow-hidden">
                  <Image
                    src={member.image || "/placeholder.svg"}
                    alt={member.name}
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <h3 className="text-xl font-bold">{member.name}</h3>
                <p className="text-gray-600">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm flex">
              <div className="mr-6">
                <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Talent Representation</h3>
                <p className="text-gray-700">
                  We provide comprehensive representation for models, including portfolio development, career guidance,
                  and booking management.
                </p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm flex">
              <div className="mr-6">
                <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Client Casting</h3>
                <p className="text-gray-700">
                  We help brands find the perfect talent for their campaigns, events, and promotional activities.
                </p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm flex">
              <div className="mr-6">
                <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Portfolio Development</h3>
                <p className="text-gray-700">
                  We offer professional photoshoot coordination and portfolio curation to showcase our talent's unique
                  qualities.
                </p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm flex">
              <div className="mr-6">
                <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Event Management</h3>
                <p className="text-gray-700">
                  We coordinate fashion shows, promotional events, and brand activations with our roster of professional
                  models.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-black text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Get In Touch</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold mb-6">Contact Information</h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <MapPin className="w-6 h-6 mr-4 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold">Address</h4>
                    <p>
                      123 Fashion Avenue, Suite 500
                      <br />
                      New York, NY 10001
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
                    <p>info@totlagency.com</p>
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
            <div>
              <h3 className="text-2xl font-bold mb-6">Send Us a Message</h3>
              <form className="space-y-4">
                <div>
                  <label htmlFor="name" className="block mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
                    placeholder="Your email"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
                    placeholder="Subject"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
                    placeholder="Your message"
                  ></textarea>
                </div>
                <Button className="w-full">Send Message</Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Work With Us?</h2>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Whether you're a model looking for representation or a brand seeking talent, we're here to help you succeed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/talent/signup">
              <Button size="lg">Apply as Talent</Button>
            </Link>
            <Link href="/client/apply">
              <Button size="lg" variant="outline">
                Become a Client
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
