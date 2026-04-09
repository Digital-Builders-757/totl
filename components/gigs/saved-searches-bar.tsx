"use client";

import { Bookmark, BookmarkPlus, Loader2, Settings2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  deleteSavedSearch,
  listSavedSearches,
  saveSearch,
  type SavedSearch,
  type SavedSearchParams,
} from "@/lib/actions/saved-search-actions";
import { buildGigsUrl } from "@/lib/utils/saved-search-url";

export interface SavedSearchesBarProps {
  currentParams: SavedSearchParams;
}

export function SavedSearchesBar({ currentParams }: SavedSearchesBarProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSearches = useCallback(async () => {
    setLoading(true);
    const result = await listSavedSearches();
    setLoading(false);
    if (result.ok) {
      setSearches(result.data);
    }
  }, []);

  useEffect(() => {
    fetchSearches();
  }, [fetchSearches]);

  const handleLoad = (search: SavedSearch) => {
    const url = buildGigsUrl(search.params);
    router.push(url);
  };

  const handleSave = async () => {
    const name = saveName.trim();
    if (!name) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const result = await saveSearch(name, currentParams);
    setSaving(false);
    if (result.ok) {
      setSaveOpen(false);
      setSaveName("");
      await fetchSearches();
      toast({ title: "Search saved", description: `"${name}" saved successfully.` });
    } else {
      toast({ title: "Failed to save", description: result.error, variant: "destructive" });
    }
  };

  const handleDelete = async (search: SavedSearch) => {
    if (!confirm(`Delete "${search.name}"?`)) return;
    setDeletingId(search.id);
    const result = await deleteSavedSearch(search.id);
    setDeletingId(null);
    if (result.ok) {
      await fetchSearches();
      toast({ title: "Search deleted" });
    } else {
      toast({ title: "Failed to delete", description: result.error, variant: "destructive" });
    }
  };

  const handleManageLoad = (search: SavedSearch) => {
    const url = buildGigsUrl(search.params);
    setManageOpen(false);
    router.push(url);
  };

  const hasSearches = searches.length > 0;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 min-w-0">
        <Bookmark className="h-4 w-4 text-[var(--oklch-text-tertiary)] flex-shrink-0" />

        {loading ? (
          <div className="flex min-h-[44px] w-full items-center gap-2 rounded-lg border border-border/45 bg-card/40 px-3 text-foreground sm:w-[220px]">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading saved searches…</span>
          </div>
        ) : hasSearches ? (
          <Select
            onValueChange={(id) => {
              const search = searches.find((s) => s.id === id);
              if (search) handleLoad(search);
            }}
          >
            <SelectTrigger
              className="h-auto min-h-[44px] w-full border-border/45 bg-card/40 text-foreground sm:w-[220px]"
              aria-label="Load saved search"
            >
              <SelectValue placeholder="Load saved search" />
            </SelectTrigger>
            <SelectContent>
              {searches.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-sm text-[var(--oklch-text-secondary)]">Save your filters for 1‑click reuse.</p>
        )}
      </div>

      <div className="flex gap-2">
        {hasSearches && (
          <Dialog open={manageOpen} onOpenChange={setManageOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="min-h-[44px] border-[var(--oklch-border)] text-white hover:bg-white/10"
              >
                <Settings2 className="h-4 w-4 mr-2" />
                Manage
              </Button>
            </DialogTrigger>
            <DialogContent className="panel-frosted card-backlit flex max-h-[80vh] flex-col overflow-hidden border-border/50">
              <DialogHeader>
                <DialogTitle className="text-white">Manage saved searches</DialogTitle>
              </DialogHeader>
              <div className="overflow-y-auto flex-1 min-h-0 space-y-2 py-4">
                {searches.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-card/35 p-3"
                  >
                    <button
                      type="button"
                      onClick={() => handleManageLoad(s)}
                      className="flex-1 text-left text-white hover:underline truncate"
                    >
                      {s.name}
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => handleDelete(s)}
                      disabled={deletingId === s.id}
                      aria-label={`Delete ${s.name}`}
                    >
                      {deletingId === s.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        )}

        <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] border-[var(--oklch-border)] text-white hover:bg-white/10"
            >
              <BookmarkPlus className="h-4 w-4 mr-2" />
              Save this search
            </Button>
          </DialogTrigger>
          <DialogContent className="panel-frosted border-border/50">
            <DialogHeader>
              <DialogTitle className="text-white">Save search</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="save-name" className="text-white">
                  Name
                </Label>
                <Input
                  id="save-name"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="e.g. NYC modeling gigs"
                  className="bg-background text-foreground"
                  maxLength={64}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSaveOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

