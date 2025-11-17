"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Database } from "@/types/supabase";

type PortfolioItem = Database["public"]["Tables"]["portfolio_items"]["Row"] & {
  imageUrl?: string;
};

interface PortfolioPreviewProps {
  items: PortfolioItem[];
  showManageLink?: boolean;
}

export function PortfolioPreview({ items, showManageLink = true }: PortfolioPreviewProps) {
  if (items.length === 0) {
    return (
      <Card className="p-8 bg-zinc-900 border-zinc-800 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-zinc-800 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-zinc-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">No portfolio images yet</h3>
            <p className="text-zinc-400 mt-2">Add portfolio images to showcase your work</p>
          </div>
          {showManageLink && (
            <Link href="/settings">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Add Portfolio Images
              </Button>
            </Link>
          )}
        </div>
      </Card>
    );
  }

  // Show up to 6 items in the preview
  const previewItems = items.slice(0, 6);
  const hasMore = items.length > 6;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {previewItems.map((item) => (
          <Card
            key={item.id}
            className="portfolio-preview-tile relative overflow-hidden bg-zinc-900 border-zinc-800 group transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-[0_8px_30px_rgb(255,255,255,0.12)]"
          >

            {/* Image */}
            <div className="relative w-full aspect-[4/3] md:aspect-square bg-zinc-800 overflow-hidden">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-zinc-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}

              {/* Overlay on Hover - Slides up from bottom */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
                <h4 className="text-white font-semibold text-sm mb-1 line-clamp-2">
                  {item.title}
                </h4>
                {item.caption && (
                  <p className="text-zinc-300 text-xs line-clamp-2">{item.caption}</p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">
          {items.length} portfolio {items.length === 1 ? "image" : "images"}
        </p>
        {showManageLink && (
          <Link href="/settings">
            <Button variant="outline" size="sm" className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
              {hasMore ? "View All & Manage" : "Manage Portfolio"}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

