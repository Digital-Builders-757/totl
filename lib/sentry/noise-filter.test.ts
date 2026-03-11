import { describe, expect, it } from "vitest";
import { shouldFilterSupabaseLockAbortNoise } from "./noise-filter";

describe("shouldFilterSupabaseLockAbortNoise", () => {
  const eventWithAuthJsLocksFrames = {
    exception: {
      values: [
        {
          stacktrace: {
            frames: [
              { filename: "node_modules/@supabase/auth-js/dist/locks/something.js" },
            ],
          },
        },
      ],
    },
  };

  const eventWithNoFrames = { exception: undefined };

  it("returns true for AbortError with signal is aborted without reason and auth-js/locks stack", () => {
    const error = {
      name: "AbortError",
      message: "signal is aborted without reason",
    };
    expect(
      shouldFilterSupabaseLockAbortNoise(eventWithAuthJsLocksFrames as never, error)
    ).toBe(true);
  });

  it("returns true when error.name is AbortError even if message lacks 'aborterror'", () => {
    const error = {
      name: "AbortError",
      message: "signal is aborted without reason",
    };
    expect(
      shouldFilterSupabaseLockAbortNoise(eventWithAuthJsLocksFrames as never, error)
    ).toBe(true);
  });

  it("returns false for TypeError Load failed", () => {
    const error = {
      name: "TypeError",
      message: "Load failed",
    };
    expect(
      shouldFilterSupabaseLockAbortNoise(eventWithAuthJsLocksFrames as never, error)
    ).toBe(false);
  });

  it("returns false when message matches but stack lacks auth-js/locks", () => {
    const error = {
      name: "AbortError",
      message: "signal is aborted without reason",
    };
    expect(shouldFilterSupabaseLockAbortNoise(eventWithNoFrames as never, error)).toBe(
      false
    );
  });

  it("returns false when error is undefined", () => {
    expect(
      shouldFilterSupabaseLockAbortNoise(eventWithAuthJsLocksFrames as never, undefined)
    ).toBe(false);
  });
});
