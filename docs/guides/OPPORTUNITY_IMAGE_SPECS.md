# Opportunity Cover Image Specifications

**Purpose:** Define recommended dimensions and aspect ratios for opportunity (gig) cover images to prevent UI distortion.

## Display Requirements

| Spec | Value |
|------|-------|
| **Aspect ratio** | 4:3 |
| **Recommended dimensions** | 1200×900 px |
| **Minimum dimensions** | 800×600 px |
| **Max file size** | 4 MB |
| **Formats** | JPEG, PNG, GIF, WebP |

## Why 4:3?

Opportunity cards use `aspect-4-3` in the browse grid (`/gigs`) and detail views. Images in 4:3 will display without cropping or distortion.

## Where This Applies

- **Post Opportunity** (`/post-gig`) — Career Builders posting opportunities
- **Admin Create Opportunity** (`/admin/gigs/create`) — Admin-created opportunities

## Implementation

- Constants: `lib/constants/opportunity-image-specs.ts`
- Upload notice: `components/gigs/gig-image-uploader.tsx` displays the recommended specs above the upload area
