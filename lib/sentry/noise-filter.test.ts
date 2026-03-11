import { describe, expect, it } from "vitest";
import {
  shouldFilterLocalObjectCapturedAsExceptionNoise,
  shouldFilterServerAbortIncomingNoise,
  shouldFilterSupabaseLockAbortNoise,
} from "./noise-filter";

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

describe("shouldFilterLocalObjectCapturedAsExceptionNoise", () => {
  const localhostEvent = {
    request: { url: "http://localhost:3000/talent/dashboard" },
    tags: {},
  };

  it("returns true for object captured as exception from localhost", () => {
    expect(
      shouldFilterLocalObjectCapturedAsExceptionNoise(
        localhostEvent as never,
        "Object captured as exception with keys: code, details, hint, message"
      )
    ).toBe(true);
  });

  it("returns false for production URL", () => {
    const prodEvent = { request: { url: "https://app.example.com/talent/dashboard" } };
    expect(
      shouldFilterLocalObjectCapturedAsExceptionNoise(
        prodEvent as never,
        "Object captured as exception with keys: code, details, hint, message"
      )
    ).toBe(false);
  });
});

describe("shouldFilterServerAbortIncomingNoise", () => {
  const eventWithAbortStack = {
    exception: {
      values: [
        {
          stacktrace: {
            frames: [{ filename: "node:_http_server" }, { filename: "node:net" }],
          },
        },
      ],
    },
  };

  it("returns true for aborted with _http_server stack", () => {
    expect(
      shouldFilterServerAbortIncomingNoise(eventWithAbortStack as never, "aborted")
    ).toBe(true);
  });

  it("returns false for different message", () => {
    expect(
      shouldFilterServerAbortIncomingNoise(eventWithAbortStack as never, "EPIPE")
    ).toBe(false);
  });
});
