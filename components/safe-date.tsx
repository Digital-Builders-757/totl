"use client";

import { useState, useEffect } from "react";

interface SafeDateProps {
  date: string | Date;
  format?: "date" | "datetime" | "time";
  className?: string;
}

export function SafeDate({ date, format = "date", className }: SafeDateProps) {
  const [formattedDate, setFormattedDate] = useState<string>("");

  useEffect(() => {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    try {
      let formatted: string;
      switch (format) {
        case "datetime":
          formatted = dateObj.toLocaleString();
          break;
        case "time":
          formatted = dateObj.toLocaleTimeString();
          break;
        case "date":
        default:
          formatted = dateObj.toLocaleDateString();
          break;
      }
      setFormattedDate(formatted);
    } catch {
      // Fallback to ISO string if locale formatting fails
      setFormattedDate(dateObj.toISOString().split("T")[0]);
    }
  }, [date, format]);

  return <span className={className}>{formattedDate}</span>;
}
