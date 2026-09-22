import { describe, expect, it } from "vitest";

import { loadAdminConfig } from "./admin-config.js";

/**
 * Same confirmation discipline as spend/config.test.ts: LUMENLINE_ADMIN_SECRET is documented as
 * "required, no default" in admin-config.ts's own doc comment, and this file proves that refusal
 * is actually implemented, not just documented — the relayer must genuinely refuse to start
 * without it, not silently fall back to something.
 */
function validEnv(): NodeJS.ProcessEnv {
  return {
    LUMENLINE_ADMIN_SECRET: "a-real-admin-secret-value",
  };
}

describe("loadAdminConfig: LUMENLINE_ADMIN_SECRET is required, no default", () => {
  it("succeeds and returns the value when it is set", () => {
    const config = loadAdminConfig(validEnv());
    expect(config).toEqual({ adminSecret: "a-real-admin-secret-value" });
  });

  it("throws (does not fall back to a default) when LUMENLINE_ADMIN_SECRET is entirely unset", () => {
    const env = validEnv();
    delete env["LUMENLINE_ADMIN_SECRET"];
    expect(() => loadAdminConfig(env)).toThrow(/LUMENLINE_ADMIN_SECRET is required/);
  });

  it("throws when LUMENLINE_ADMIN_SECRET is set to an empty string", () => {
    const env = validEnv();
    env["LUMENLINE_ADMIN_SECRET"] = "";
    expect(() => loadAdminConfig(env)).toThrow(/LUMENLINE_ADMIN_SECRET is required/);
  });

  it("throws when LUMENLINE_ADMIN_SECRET is set to whitespace only", () => {
    const env = validEnv();
    env["LUMENLINE_ADMIN_SECRET"] = "   ";
    expect(() => loadAdminConfig(env)).toThrow(/LUMENLINE_ADMIN_SECRET is required/);
  });

  it("does not use process.env as a hidden fallback when an explicit (incomplete) env is passed", () => {
    // Guards against a future regression where requireEnv's default parameter (`env =
    // process.env`) could let a real ambient env var silently satisfy a call site that passed an
    // explicit, deliberately incomplete env object for testing — same real regression class
    // spend/config.test.ts already guards against for its own values.
    const original = process.env["LUMENLINE_ADMIN_SECRET"];
    process.env["LUMENLINE_ADMIN_SECRET"] = "an-ambient-secret-that-must-not-leak-in";
    try {
      const env = validEnv();
      delete env["LUMENLINE_ADMIN_SECRET"];
      expect(() => loadAdminConfig(env)).toThrow(/LUMENLINE_ADMIN_SECRET is required/);
    } finally {
      if (original === undefined) {
        delete process.env["LUMENLINE_ADMIN_SECRET"];
      } else {
        process.env["LUMENLINE_ADMIN_SECRET"] = original;
      }
    }
  });
});
