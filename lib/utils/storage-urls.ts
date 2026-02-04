/**
 * Convert Supabase storage path to public URL
 * Handles both full URLs (already formatted) and storage paths
 * 
 * @param bucket - Storage bucket name (e.g., "avatars", "portfolio")
 * @param pathOrUrl - Storage path or full URL
 * @returns Public URL or undefined if invalid
 */
export function publicBucketUrl(
  bucket: string,
  pathOrUrl: string | null | undefined
): string | undefined {
  if (!pathOrUrl) return undefined;
  const v = pathOrUrl.trim();
  if (!v) return undefined;

  // If already a full URL (http/https/data), return as-is
  if (v.startsWith("http://") || v.startsWith("https://") || v.startsWith("data:")) {
    return v;
  }

  // Build public URL from storage path
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return undefined;

  // Remove leading slashes from path
  const cleanPath = v.replace(/^\/+/, "");
  
  return `${base}/storage/v1/object/public/${bucket}/${cleanPath}`;
}
