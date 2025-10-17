"use client";

import { useState, useEffect } from "react";
import { Trash2, Star, GripVertical, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  deletePortfolioItem,
  reorderPortfolioItems,
  setPrimaryPortfolioItem,
  updatePortfolioItem,
} from "@/lib/actions/portfolio-actions";
import Image from "next/image";
import type { Database } from "@/types/supabase";

type PortfolioItem = Database["public"]["Tables"]["portfolio_items"]["Row"] & {
  imageUrl?: string;
};

interface PortfolioGalleryProps {
  initialItems: PortfolioItem[];
  onUpdate?: () => void;
}

export function PortfolioGallery({ initialItems, onUpdate }: PortfolioGalleryProps) {
  const [items, setItems] = useState<PortfolioItem[]>(initialItems);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", caption: "", description: "" });
  const { toast } = useToast();

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newItems = [...items];
    const draggedItem = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);

    setItems(newItems);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;

    // Save new order to database
    const itemIds = items.map((item) => item.id);
    const result = await reorderPortfolioItems(itemIds);

    if (result.error) {
      toast({
        title: "Reorder failed",
        description: result.error,
        variant: "destructive",
      });
      // Revert to original order
      setItems(initialItems);
    } else {
      toast({
        title: "Order updated",
        description: "Portfolio items reordered successfully",
      });
      onUpdate?.();
    }

    setDraggedIndex(null);
  };

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

  const handleSetPrimary = async (itemId: string) => {
    const result = await setPrimaryPortfolioItem(itemId);

    if (result.error) {
      toast({
        title: "Update failed",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Primary image set",
        description: "Featured image updated successfully",
      });
      // Update local state
      setItems(
        items.map((item) => ({
          ...item,
          is_primary: item.id === itemId,
        }))
      );
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
      // Update local state
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
      <Card className="p-12 bg-zinc-900 border-zinc-800 text-center">
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
            <p className="text-zinc-400 mt-2">
              Upload your first portfolio image to get started
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item, index) => (
        <Card
          key={item.id}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          className={`
            relative overflow-hidden bg-zinc-900 border-zinc-800 cursor-move
            transition-all duration-200
            ${draggedIndex === index ? "opacity-50 scale-95" : "opacity-100 scale-100"}
            ${item.is_primary ? "ring-2 ring-yellow-500" : ""}
          `}
        >
          {/* Drag Handle */}
          <div className="absolute top-2 left-2 z-10 bg-black/50 rounded p-1 cursor-grab active:cursor-grabbing">
            <GripVertical className="w-5 h-5 text-white" />
          </div>

          {/* Primary Badge */}
          {item.is_primary && (
            <div className="absolute top-2 right-2 z-10 bg-yellow-500 text-black px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
              <Star className="w-3 h-3" fill="currentColor" />
              Primary
            </div>
          )}

          {/* Image */}
          <div className="relative w-full h-64 bg-zinc-800">
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {editingId === item.id ? (
              // Edit Mode
              <div className="space-y-3">
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Title"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
                <Input
                  value={editForm.caption}
                  onChange={(e) => setEditForm({ ...editForm, caption: e.target.value })}
                  placeholder="Caption"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Description"
                  rows={2}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSaveEdit(item.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="flex-1 bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              // View Mode
              <>
                <div>
                  <h3 className="font-semibold text-white line-clamp-1">{item.title}</h3>
                  {item.caption && (
                    <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{item.caption}</p>
                  )}
                  {item.description && (
                    <p className="text-xs text-zinc-500 mt-2 line-clamp-2">{item.description}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStartEdit(item)}
                    className="flex-1 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  {!item.is_primary && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetPrimary(item.id)}
                      className="bg-zinc-800 border-zinc-700 text-yellow-500 hover:bg-zinc-700"
                      title="Set as primary/featured image"
                    >
                      <Star className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(item.id)}
                    className="bg-zinc-800 border-zinc-700 text-red-500 hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

