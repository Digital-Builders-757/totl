/**
 * @vitest-environment happy-dom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ApplicationStatusBadge,
  BookingStatusBadge,
  ClientApplicationStatusBadge,
  GigStatusBadge,
  StatusBadge,
  UserRoleBadge,
} from "@/components/ui/status-badge";

describe("status badges", () => {
  it("renders gig badge with icon + label", () => {
    render(<GigStatusBadge status="active" />);
    expect(screen.getByText("Active")).toBeDefined();
    expect(screen.getByText("✨")).toBeDefined();
  });

  it("renders application badge for custom status", () => {
    render(<ApplicationStatusBadge status="shortlisted" />);
    expect(screen.getByText("Shortlisted")).toBeDefined();
    expect(screen.getByText("📋")).toBeDefined();
  });

  it("renders booking badge with variant class", () => {
    const { container } = render(<BookingStatusBadge status="confirmed" />);
    expect(screen.getByText("Confirmed")).toBeDefined();
    const badgeElement = container.firstChild as HTMLElement | null;
    expect(badgeElement).toBeTruthy();
    expect(badgeElement?.className).toContain("bg-emerald-500/20");
  });

  it("renders role badge using icon and label", () => {
    render(<UserRoleBadge role="client" />);
    expect(screen.getByText("Client")).toBeDefined();
    expect(screen.getByText("💼")).toBeDefined();
  });

  it("auto-detects status type", () => {
    render(<StatusBadge status="new" />);
    expect(screen.getByText("New")).toBeDefined();
  });

  it("renders client application status", () => {
    render(<ClientApplicationStatusBadge status="approved" />);
    expect(screen.getByText("Approved")).toBeDefined();
  });
});

