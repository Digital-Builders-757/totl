"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, MapPin, DollarSign, Filter, ArrowRight, Calendar } from "lucide-react"

// Define a type for the gig
interface Gig {
  id: string
  title: string
}

interface GigsClientProps {
  gigs: Gig[]
}

export function GigsClient({ gigs }: GigsClientProps) {
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Gigs</h1>
      <ul className="space-y-4">
        {gigs.map((gig) => (
          <li key={gig.id} className="flex items-center justify-between p-4 bg-white rounded shadow">
            <span>{gig.title}</span>
            <Button asChild>
              <Link href={`/gigs/${gig.id}`}>
                View Details <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
