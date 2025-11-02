"use client";

import { Mail, Phone, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowser } from "@/lib/supabase/supabase-browser";
import type { Database } from "@/types/supabase";

type TalentProfile = Database["public"]["Tables"]["talent_profiles"]["Row"];

interface TalentProfileClientProps {
  talent: TalentProfile;
}

export function TalentProfileClient({ talent }: TalentProfileClientProps) {
  const [user, setUser] = useState<Database["public"]["Tables"]["profiles"]["Row"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status safely without modifying cookies
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createSupabaseBrowser();
        if (!supabase) return;
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Get user profile to check role
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();
          
          setUser(profile);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Check if user can see sensitive information
  // Only talent themselves, clients, or admins can see sensitive details
  const canViewSensitiveInfo = user && (
    user.id === talent.user_id || 
    user.role === 'client' || 
    user.role === 'admin'
  );

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6 border border-gray-300">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-300">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Contact Information - Conditional based on authentication */}
      {canViewSensitiveInfo ? (
        <div className="bg-white rounded-lg p-6 border border-gray-300">
          <h3 className="text-lg font-semibold text-black mb-4">Contact Information</h3>
          <div className="space-y-3">
            {talent.phone && (
              <div className="flex items-center text-black">
                <Phone className="mr-3 h-4 w-4 text-black" />
                {talent.phone}
              </div>
            )}
            <div className="flex items-center text-black">
              <Mail className="mr-3 h-4 w-4 text-black" />
              Contact through agency
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg p-6 border border-gray-300">
          <h3 className="text-lg font-semibold text-black mb-4">Contact Information</h3>
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Contact details are only visible to registered clients</p>
            <Button asChild className="apple-button">
              <Link href="/login">Sign In to View Contact Info</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Physical Stats - Conditional based on authentication */}
      {canViewSensitiveInfo ? (
        <div className="bg-white rounded-lg p-6 border border-gray-300">
          <h3 className="text-lg font-semibold text-black mb-4">Physical Stats</h3>
          <div className="space-y-2 text-sm text-black">
            {talent.age && (
              <div className="flex justify-between">
                <span>Age:</span>
                <span className="font-medium text-black">{talent.age}</span>
              </div>
            )}
            {talent.height && (
              <div className="flex justify-between">
                <span>Height:</span>
                <span className="font-medium text-black">{talent.height}</span>
              </div>
            )}
            {talent.weight && (
              <div className="flex justify-between">
                <span>Weight:</span>
                <span className="font-medium text-black">{talent.weight} lbs</span>
              </div>
            )}
            {talent.hair_color && (
              <div className="flex justify-between">
                <span>Hair:</span>
                <span className="font-medium text-black">{talent.hair_color}</span>
              </div>
            )}
            {talent.eye_color && (
              <div className="flex justify-between">
                <span>Eyes:</span>
                <span className="font-medium text-black">{talent.eye_color}</span>
              </div>
            )}
            {talent.shoe_size && (
              <div className="flex justify-between">
                <span>Shoe Size:</span>
                <span className="font-medium text-black">{talent.shoe_size}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg p-6 border border-gray-300">
          <h3 className="text-lg font-semibold text-black mb-4">Physical Stats</h3>
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Physical details are only visible to registered clients</p>
            <Button asChild className="apple-button">
              <Link href="/login">Sign In to View Details</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Experience */}
      {talent.experience_years && (
        <div className="bg-white rounded-lg p-6 border border-gray-300">
          <h3 className="text-lg font-semibold text-black mb-4">Experience</h3>
          <div className="flex items-center text-black">
            <Star className="mr-2 h-4 w-4 text-black" />
            <span>{talent.experience_years} years in the industry</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <a
          href={`mailto:contact@thetotlagency.com?subject=Booking Inquiry for ${talent.first_name} ${talent.last_name}&body=Hi, I'm interested in booking ${talent.first_name} ${talent.last_name} for a project. Please provide more information.`}
          className="flex-1"
        >
          <Button className="w-full bg-white text-black hover:bg-gray-200">
            Contact Talent
          </Button>
        </a>
        {talent.portfolio_url ? (
          <a
            href={talent.portfolio_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button
              variant="outline"
              className="w-full border-white/30 text-white hover:bg-white/10 hover:border-white/50"
            >
              View Portfolio
            </Button>
          </a>
        ) : (
          <Button
            variant="outline"
            className="w-full border-white/30 text-white hover:bg-white/10 hover:border-white/50 flex-1"
            disabled
          >
            View Portfolio
          </Button>
        )}
      </div>
    </div>
  );
}
