
import { describe, expect, it } from "vitest";
import {
  validateAdminAuth,
  validateFlagContent,
  validateUserAuth,
} from "./moderation-validation";

describe("moderation validation helpers", () => {
  describe("validateFlagContent", () => {
    it("returns error if resourceId is missing", () => {
      const result = validateFlagContent("", "reason");
      expect(result.error).toBe("Resource and reason are required.");
    });

    it("returns error if reason is missing or empty", () => {
      const result1 = validateFlagContent("123", "");
      expect(result1.error).toBe("Resource and reason are required.");

      const result2 = validateFlagContent("123", "   ");
      expect(result2.error).toBe("Resource and reason are required.");
    });

    it("returns success if valid", () => {
      const result = validateFlagContent("123", "Inappropriate content");
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe("validateUserAuth", () => {
    it("returns error if user is missing", () => {
      const result = validateUserAuth(null, null);
      expect(result.error).toBe("You need to be signed in to report gigs.");
    });

    it("returns error if authError is present", () => {
      const result = validateUserAuth({ id: "1" }, new Error("Auth failed"));
      expect(result.error).toBe("You need to be signed in to report gigs.");
    });

    it("returns success if user is present and no error", () => {
      const result = validateUserAuth({ id: "1" }, null);
      expect(result.success).toBe(true);
    });
  });

  describe("validateAdminAuth", () => {
    it("returns error if user is missing", () => {
      const result = validateAdminAuth(null, { role: "admin" });
      expect(result.error).toBe("Not authenticated.");
    });

    it("returns error if profile is missing", () => {
      const result = validateAdminAuth({ id: "1" }, null);
      expect(result.error).toBe("Not authorized.");
    });

    it("returns error if role is not admin", () => {
      const result = validateAdminAuth({ id: "1" }, { role: "user" });
      expect(result.error).toBe("Not authorized.");
    });

    it("returns success if user is present and role is admin", () => {
      const result = validateAdminAuth({ id: "1" }, { role: "admin" });
      expect(result.success).toBe(true);
    });
  });
});

