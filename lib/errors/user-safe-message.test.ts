import { describe, expect, it } from "vitest";

import { userSafeMessage, userSafeMessageFromActionError } from "./user-safe-message";

describe("userSafeMessage", () => {
  it("maps failed to fetch to network copy", () => {
    expect(userSafeMessage(new Error("TypeError: Failed to fetch"))).toMatch(/couldn’t reach/i);
  });

  it("maps invalid login to friendly copy", () => {
    expect(userSafeMessage(new Error("Invalid login credentials"))).toMatch(/email or password/i);
  });

  it("does not pass through very long messages", () => {
    const custom = "Short custom fallback.";
    const longInternal = "x".repeat(220);
    expect(userSafeMessage(new Error(longInternal), custom)).toBe(custom);
  });

  it("uses custom fallback for empty message", () => {
    const fb = "Custom.";
    expect(userSafeMessage(new Error(""), fb)).toBe(fb);
  });

  it("passes through short curated server-style messages", () => {
    const msg = "Could not mark that notification as read. Try refreshing.";
    expect(userSafeMessage(new Error(msg))).toBe(msg);
  });

  it("does not pass through short messages with SQL statement keywords (UPDATE/DELETE)", () => {
    const fb = "Use fallback.";
    // Avoid "rls" / permission heuristics so the final SQL-ish guard is what we exercise.
    expect(userSafeMessage(new Error("Error: update not allowed for this column"), fb)).toBe(fb);
    expect(userSafeMessage(new Error("Delete failed: row is referenced"), fb)).toBe(fb);
  });

  it("does not pass through Postgres-style detail / syntax fragments", () => {
    const fb = "Custom.";
    expect(userSafeMessage(new Error('ERROR: 42P01: relation "foo" does not exist\nLINE 1: ...'), fb)).toBe(
      fb
    );
    expect(userSafeMessage(new Error("Detail: Key (id)=(1) is not present in table bar."), fb)).toBe(fb);
  });

  it("userSafeMessageFromActionError maps SQL-shaped short action errors to safe copy", () => {
    expect(userSafeMessageFromActionError("merge into gigs failed")).toMatch(/something went wrong|try again/i);
  });

  it("maps multiline stack traces to fallback", () => {
    const fb = "Custom fallback.";
    const stack = "Error: boom\n    at foo (main.js:1:1)";
    expect(userSafeMessage(new Error(stack), fb)).toBe(fb);
  });

  it("maps invalid JWT to session copy", () => {
    expect(userSafeMessage(new Error("Invalid JWT"))).toMatch(/session expired|sign in again/i);
  });

  it("maps rate limit copy", () => {
    expect(userSafeMessage(new Error("429: rate limit exceeded"))).toMatch(/too many attempts/i);
  });

  it("userSafeMessageFromActionError maps stored strings", () => {
    expect(userSafeMessageFromActionError("violates row-level security policy")).toMatch(/don’t have permission/i);
    expect(userSafeMessageFromActionError(undefined, "Saved.")).toBe("Saved.");
    expect(userSafeMessageFromActionError("")).toMatch(/something went wrong/i);
  });
});
