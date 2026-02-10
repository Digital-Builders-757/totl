import React from "react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { Database } from "@/types/supabase";

// Type definitions from database
type GigStatus = Database["public"]["Enums"]["gig_status"];
type ApplicationStatus = Database["public"]["Enums"]["application_status"];
type BookingStatus = Database["public"]["Enums"]["booking_status"];
type UserRole = Database["public"]["Enums"]["user_role"];

// Icon components (using Unicode symbols for zero-dependency)
const Icons = {
  draft: "📝",
  active: "✨",
  closed: "🔒",
  // completed removed: not in current gig_status enum
  // completed: "✅",
  featured: "⭐",
  urgent: "⚡",
  new: "🆕",
  under_review: "👀",
  shortlisted: "📋",
  rejected: "❌",
  accepted: "🎉",
  pending: "⏳",
  confirmed: "✓",
  cancelled: "🚫",
  talent: "🎭",
  client: "💼",
  admin: "👑",
  approved: "✅",
  verified: "✓",
  unverified: "⚠️",
};

// Status label mappings
const StatusLabels = {
  // Gig statuses
  draft: "Draft",
  active: "Active",
  closed: "Closed",
  // completed removed: not in current gig_status enum
  // completed: "Completed",
  featured: "Featured",
  urgent: "Urgent",
  
  // Application statuses
  new: "New",
  under_review: "Under Review",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  accepted: "Accepted",
  
  // Booking statuses
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  
  // User roles
  talent: "Talent",
  client: "Client",
  admin: "Admin",
  
  // Client application statuses
  approved: "Approved",
  
  // Special states
  verified: "Verified",
  unverified: "Unverified",
  inactive: "Inactive",
};

// ============================================================================
// GIG STATUS BADGE
// ============================================================================

interface GigStatusBadgeProps extends Omit<BadgeProps, "variant"> {
  status: GigStatus | string;
  showIcon?: boolean;
}

export function GigStatusBadge({ status, showIcon = true, ...props }: GigStatusBadgeProps) {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, "_");
  const variant = normalizedStatus as BadgeProps["variant"];
  const icon = showIcon ? Icons[normalizedStatus as keyof typeof Icons] : null;
  const label = StatusLabels[normalizedStatus as keyof typeof StatusLabels] || status;

  return (
    <Badge variant={variant} icon={icon} {...props}>
      {label}
    </Badge>
  );
}

// ============================================================================
// APPLICATION STATUS BADGE
// ============================================================================

interface ApplicationStatusBadgeProps extends Omit<BadgeProps, "variant"> {
  status: ApplicationStatus | string;
  showIcon?: boolean;
}

export function ApplicationStatusBadge({
  status,
  showIcon = true,
  ...props
}: ApplicationStatusBadgeProps) {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, "_");
  const variant = normalizedStatus as BadgeProps["variant"];
  const icon = showIcon ? Icons[normalizedStatus as keyof typeof Icons] : null;
  const label = StatusLabels[normalizedStatus as keyof typeof StatusLabels] || status;

  return (
    <Badge variant={variant} icon={icon} {...props}>
      {label}
    </Badge>
  );
}

// ============================================================================
// BOOKING STATUS BADGE
// ============================================================================

interface BookingStatusBadgeProps extends Omit<BadgeProps, "variant"> {
  status: BookingStatus | string;
  showIcon?: boolean;
}

export function BookingStatusBadge({
  status,
  showIcon = true,
  ...props
}: BookingStatusBadgeProps) {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, "_");
  const variant = normalizedStatus as BadgeProps["variant"];
  const icon = showIcon ? Icons[normalizedStatus as keyof typeof Icons] : null;
  const label = StatusLabels[normalizedStatus as keyof typeof StatusLabels] || status;

  return (
    <Badge variant={variant} icon={icon} {...props}>
      {label}
    </Badge>
  );
}

// ============================================================================
// USER ROLE BADGE
// ============================================================================

interface UserRoleBadgeProps extends Omit<BadgeProps, "variant"> {
  userRole: UserRole | string;
  showIcon?: boolean;
}

export function UserRoleBadge({ userRole, showIcon = true, ...props }: UserRoleBadgeProps) {
  const normalizedRole = userRole.toLowerCase().replace(/\s+/g, "_");
  const variant = normalizedRole as BadgeProps["variant"];
  const icon = showIcon ? Icons[normalizedRole as keyof typeof Icons] : null;
  const label = StatusLabels[normalizedRole as keyof typeof StatusLabels] || userRole;

  return (
    <Badge variant={variant} icon={icon} {...props}>
      {label}
    </Badge>
  );
}

// ============================================================================
// GENERIC STATUS BADGE (Auto-detects type)
// ============================================================================

interface StatusBadgeProps extends Omit<BadgeProps, "variant"> {
  status: string;
  showIcon?: boolean;
  type?: "gig" | "application" | "booking" | "role" | "auto";
}

export function StatusBadge({
  status,
  showIcon = true,
  type = "auto",
  ...props
}: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, "_");

  // Auto-detect status type if not specified
  if (type === "auto") {
    // Gig statuses
    if (["draft", "active", "closed", "featured", "urgent"].includes(normalizedStatus)) {
      return <GigStatusBadge status={status} showIcon={showIcon} {...props} />;
    }
    // Application statuses
    if (
      ["new", "under_review", "shortlisted", "rejected", "accepted"].includes(normalizedStatus)
    ) {
      return <ApplicationStatusBadge status={status} showIcon={showIcon} {...props} />;
    }
    // Booking statuses
    if (["pending", "confirmed", "cancelled"].includes(normalizedStatus)) {
      return <BookingStatusBadge status={status} showIcon={showIcon} {...props} />;
    }
    // User roles
    if (["talent", "client", "admin"].includes(normalizedStatus)) {
      return <UserRoleBadge userRole={status} showIcon={showIcon} {...props} />;
    }
  }

  // Use explicit type
  if (type === "gig") {
    return <GigStatusBadge status={status} showIcon={showIcon} {...props} />;
  }
  if (type === "application") {
    return <ApplicationStatusBadge status={status} showIcon={showIcon} {...props} />;
  }
  if (type === "booking") {
    return <BookingStatusBadge status={status} showIcon={showIcon} {...props} />;
  }
  if (type === "role") {
    return <UserRoleBadge userRole={status} showIcon={showIcon} {...props} />;
  }

  // Fallback to basic badge
  const variant = normalizedStatus as BadgeProps["variant"];
  const icon = showIcon ? Icons[normalizedStatus as keyof typeof Icons] : null;
  const label = StatusLabels[normalizedStatus as keyof typeof StatusLabels] || status;

  return (
    <Badge variant={variant} icon={icon} {...props}>
      {label}
    </Badge>
  );
}

// ============================================================================
// CLIENT APPLICATION STATUS BADGE (for /client/apply flow)
// ============================================================================

type ClientApplicationStatus = "pending" | "approved" | "rejected";

interface ClientApplicationStatusBadgeProps extends Omit<BadgeProps, "variant"> {
  status: ClientApplicationStatus;
  showIcon?: boolean;
}

export function ClientApplicationStatusBadge({
  status,
  showIcon = true,
  ...props
}: ClientApplicationStatusBadgeProps) {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, "_");
  const variant = normalizedStatus as BadgeProps["variant"];
  const icon = showIcon ? Icons[normalizedStatus as keyof typeof Icons] : null;
  const label = StatusLabels[normalizedStatus as keyof typeof StatusLabels] || status;

  return (
    <Badge variant={variant} icon={icon} {...props}>
      {label}
    </Badge>
  );
}

