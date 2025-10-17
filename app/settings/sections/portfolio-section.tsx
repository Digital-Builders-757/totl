"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { PortfolioGallery } from "@/components/portfolio/portfolio-gallery";
import { PortfolioUpload } from "@/components/portfolio/portfolio-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Database } from "@/types/supabase";

type PortfolioItem = Database["public"]["Tables"]["portfolio_items"]["Row"] & { imageUrl?: string };

interface PortfolioSectionProps {
  portfolioItems: PortfolioItem[];
}

export function PortfolioSection({ portfolioItems }: PortfolioSectionProps) {
  const [showUpload, setShowUpload] = useState(false);

  const handleUploadSuccess = () => {
    setShowUpload(false);
    // Refresh the page to reload portfolio items
    window.location.reload();
  };

  const handleGalleryUpdate = () => {
    // Refresh the page to reload portfolio items
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Portfolio Gallery</h3>
          <p className="text-sm text-zinc-400 mt-1">
            Showcase your best work with a professional portfolio
          </p>
        </div>
        {!showUpload && (
          <Button
            onClick={() => setShowUpload(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Image
          </Button>
        )}
        {showUpload && (
          <Button
            onClick={() => setShowUpload(false)}
            variant="outline"
            className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        )}
      </div>

      {/* Upload Form */}
      {showUpload && (
        <div className="animate-in slide-in-from-top-2">
          <PortfolioUpload onUploadSuccess={handleUploadSuccess} />
        </div>
      )}

      {/* Portfolio Gallery */}
      <PortfolioGallery initialItems={portfolioItems} onUpdate={handleGalleryUpdate} />

      {/* Help Text */}
      {portfolioItems.length === 0 && !showUpload && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Get Started with Your Portfolio</CardTitle>
            <CardDescription className="text-zinc-400">
              Add your professional photos to attract more clients
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white font-semibold text-sm">1</span>
                </div>
                <div>
                  <h4 className="text-white font-medium">Upload Your Best Work</h4>
                  <p className="text-sm text-zinc-400">
                    Add high-quality images from your professional shoots
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white font-semibold text-sm">2</span>
                </div>
                <div>
                  <h4 className="text-white font-medium">Organize & Label</h4>
                  <p className="text-sm text-zinc-400">
                    Add titles and descriptions to provide context for each image
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white font-semibold text-sm">3</span>
                </div>
                <div>
                  <h4 className="text-white font-medium">Set Your Featured Image</h4>
                  <p className="text-sm text-zinc-400">
                    Star your best photo to showcase it prominently on your profile
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips Card */}
      {portfolioItems.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Portfolio Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Drag and drop to reorder your images</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Star an image to set it as your primary/featured photo</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Use high-resolution images for the best presentation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Add descriptive titles and captions to help clients understand your work</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

