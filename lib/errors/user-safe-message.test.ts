import { describe, expect, it } from "vitest";

import { userSafeMessage } from "./user-safe-message";

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
});
