"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

interface UrgentBadgeProps {
  deadline: string;
}

export function UrgentBadge({ deadline }: UrgentBadgeProps) {
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    // Check if deadline is within 7 days
    const deadlineDate = new Date(deadline);
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    setIsUrgent(deadlineDate < sevenDaysFromNow);
  }, [deadline]);

  if (!isUrgent) return null;

  return <Badge className="absolute top-3 left-3 bg-red-500 text-white">Urgent</Badge>;
}
