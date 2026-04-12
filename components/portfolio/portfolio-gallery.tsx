"use client";

import { Trash2, Edit2, Check, X, ImageIcon } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { deletePortfolioItem, updatePortfolioItem } from "@/lib/actions/portfolio-actions";
import { cn } from "@/lib/utils/utils";
import type { Database } from "@/types/supabase";

type PortfolioItem = Database["public"]["Tables"]["portfolio_items"]["Row"] & {
  imageUrl?: string;
};

const glassCard =
  "panel-frosted min-w-0 border-white/10 bg-[var(--totl-surface-glass-strong)] text-white shadow-none";

const inputGlass =
  "border-white/10 bg-white/[0.06] text-[var(--oklch-text-primary)] placeholder:text-[var(--oklch-text-tertiary)] focus-visible:ring-[var(--oklch-accent)]";

interface PortfolioGalleryProps {
  initialItems: PortfolioItem[];
  onUpdate?: () => void;
}

export function PortfolioGallery({ initialItems, onUpdate }: PortfolioGalleryProps) {
  const [items, setItems] = useState<PortfolioItem[]>(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", caption: "", description: "" });
  const { toast } = useToast();

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const handleDelete = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this portfolio item?")) {
      return;
    }

    const result = await deletePortfolioItem(itemId);

    if (result.error) {
      toast({
        title: "Delete failed",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Deleted",
        description: "Portfolio item deleted successfully",
      });
      setItems(items.filter((item) => item.id !== itemId));
      onUpdate?.();
    }
  };

  const handleStartEdit = (item: PortfolioItem) => {
    setEditingId(item.id);
    setEditForm({
      title: item.title,
      caption: item.caption || "",
      description: item.description || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ title: "", caption: "", description: "" });
  };

  const handleSaveEdit = async (itemId: string) => {
    const result = await updatePortfolioItem(itemId, editForm);

    if (result.error) {
      toast({
        title: "Update failed",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Updated",
        description: "Portfolio item updated successfully",
      });
      setItems(
        items.map((item) =>
          item.id === itemId ? { ...item, ...editForm } : item
        )
      );
      setEditingId(null);
      onUpdate?.();
    }
  };

  if (items.length === 0) {
    return (
      <Card className={cn(glassCard, "p-10 text-center sm:p-12")}>
        <div className="mx-auto max-w-md space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.06]">
            <ImageIcon className="h-8 w-8 text-[var(--oklch-text-tertiary)]" aria-hidden />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--oklch-text-primary)]">
              No portfolio images yet
            </h3>
            <p className="mt-2 text-sm text-[var(--oklch-text-secondary)]">
              Upload your first image using the button above.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--oklch-text-secondary)]">
        Newest uploads appear first. Edit titles or captions anytime.
      </p>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
        {items.map((item) => (
          <Card
            key={item.id}
            className={cn(
              glassCard,
              "portfolio-tile group relative overflow-hidden transition-all duration-300 ease-out",
              "hover:shadow-[0_8px_30px_rgba(255,255,255,0.08)]"
            )}
          >
            <div className="portfolio-image-container relative h-48 w-full overflow-hidden bg-black/20 md:h-64">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transform-none"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-[var(--oklch-text-tertiary)]" aria-hidden />
                </div>
              )}

              {item.caption && (
                <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4 transition-transform duration-300 ease-out group-hover:translate-y-0 motion-reduce:transform-none">
                  <p className="line-clamp-2 text-sm font-medium text-white">{item.caption}</p>
                </div>
              )}
            </div>

            <div className="space-y-3 p-4 transition-transform duration-300 ease-out group-hover:-translate-y-0.5 motion-reduce:transform-none">
              {editingId === item.id ? (
                <div className="space-y-3">
                  <Input
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    placeholder="Title"
                    className={inputGlass}
                  />
                  <Input
                    value={editForm.caption}
                    onChange={(e) => setEditForm({ ...editForm, caption: e.target.value })}
                    placeholder="Caption"
                    className={inputGlass}
                  />
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Description"
                    rows={2}
                    className={inputGlass}
                  />
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      size="sm"
                      type="button"
                      onClick={() => handleSaveEdit(item.id)}
                      className="min-h-11 flex-1 bg-[var(--oklch-accent)] text-white hover:bg-[var(--oklch-accent)]/90"
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="min-h-11 flex-1 border-white/15 bg-white/[0.04] text-[var(--oklch-text-primary)] hover:bg-white/[0.08]"
                    >
                      <X className="mr-1 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="line-clamp-1 font-semibold text-[var(--oklch-text-primary)]">
                      {item.title}
                    </h3>
                    {item.caption && (
                      <p className="mt-1 line-clamp-2 text-sm text-[var(--oklch-text-secondary)]">
                        {item.caption}
                      </p>
                    )}
                    {item.description && (
                      <p className="mt-2 line-clamp-2 text-xs text-[var(--oklch-text-tertiary)]">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      type="button"
                      variant="outline"
                      onClick={() => handleStartEdit(item)}
                      className="min-h-11 flex-1 border-white/15 bg-white/[0.04] text-[var(--oklch-text-primary)] hover:bg-white/[0.08]"
                    >
                      <Edit2 className="mr-1 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      type="button"
                      variant="outline"
                      onClick={() => handleDelete(item.id)}
                      className="min-h-11 min-w-11 shrink-0 border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                      aria-label="Delete portfolio item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
