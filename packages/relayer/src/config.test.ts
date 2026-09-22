import { describe, expect, it } from "vitest";

import { loadOutboundRelayerConfig, loadRelayerConfig, outboundEnabled } from "./config.js";

function validEnv(): NodeJS.ProcessEnv {
  return {
    LUMENLINE_NETWORK: "mainnet",
    DATABASE_URL: "postgres://user:pass@localhost:5432/lumenline",
    LUMENLINE_STELLAR_RPC_URL: "https://soroban-rpc.example.com",
  };
}

describe("loadRelayerConfig", () => {
  it("succeeds with just the three genuinely required vars, using documented defaults for the rest", () => {
    const config = loadRelayerConfig(validEnv());
    expect(config).toMatchObject({
      network: "mainnet",
      databaseUrl: "postgres://user:pass@localhost:5432/lumenline",
      rpcUrl: "https://soroban-rpc.example.com",
      host: "0.0.0.0",
      port: 8080,
      pollIntervalMs: 2000,
      pollMaxIntervalMs: 30_000,
      maxConcurrentTransfers: 20,
      registrationLimitMaxAttempts: 60,
      registrationLimitWindowMs: 60_000,
      // Fail-closed default: NO browser origin allowed when LUMENLINE_CORS_ORIGINS is unset — see
      // RelayerConfig.corsOrigins's own doc comment for why this is the safe default, not `["*"]`.
      corsOrigins: [],
    });
  });

  describe("corsOrigins", () => {
    it("is an empty array (fail-closed) when LUMENLINE_CORS_ORIGINS is unset", () => {
      expect(loadRelayerConfig(validEnv()).corsOrigins).toEqual([]);
    });

    it("is an empty array when LUMENLINE_CORS_ORIGINS is set to an empty or whitespace-only string", () => {
      expect(loadRelayerConfig({ ...validEnv(), LUMENLINE_CORS_ORIGINS: "" }).corsOrigins).toEqual(
        [],
      );
      expect(
        loadRelayerConfig({ ...validEnv(), LUMENLINE_CORS_ORIGINS: "   " }).corsOrigins,
      ).toEqual([]);
    });

    it("parses a single real origin", () => {
      expect(
        loadRelayerConfig({
          ...validEnv(),
          LUMENLINE_CORS_ORIGINS: "https://app.example.com",
        }).corsOrigins,
      ).toEqual(["https://app.example.com"]);
    });

    it("parses multiple comma-separated origins, trimming whitespace around each", () => {
      expect(
        loadRelayerConfig({
          ...validEnv(),
          LUMENLINE_CORS_ORIGINS:
            "https://app.example.com, http://localhost:4173 ,https://widget.example.com",
        }).corsOrigins,
      ).toEqual(["https://app.example.com", "http://localhost:4173", "https://widget.example.com"]);
    });

    it("drops empty entries from trailing/doubled commas rather than keeping an empty-string origin", () => {
      expect(
        loadRelayerConfig({
          ...validEnv(),
          LUMENLINE_CORS_ORIGINS: "https://app.example.com,,",
        }).corsOrigins,
      ).toEqual(["https://app.example.com"]);
    });
  });

  it.each(["LUMENLINE_NETWORK", "DATABASE_URL", "LUMENLINE_STELLAR_RPC_URL"] as const)(
    "throws when %s is unset — these three are genuinely required, unlike the load-balancing/performance knobs below",
    (name) => {
      const env = validEnv();
      delete env[name];
      expect(() => loadRelayerConfig(env)).toThrow(new RegExp(`${name} is required`));
    },
  );

  it("throws with a specific message when LUMENLINE_NETWORK is set to something other than mainnet/testnet", () => {
    const env = validEnv();
    env["LUMENLINE_NETWORK"] = "devnet";
    expect(() => loadRelayerConfig(env)).toThrow(/must be "mainnet" or "testnet"/);
  });

  it("honors an explicit override for every performance/load knob (STEP 4: these are allowed sensible defaults)", () => {
    const config = loadRelayerConfig({
      ...validEnv(),
      HOST: "127.0.0.1",
      PORT: "9090",
      LUMENLINE_POLL_INTERVAL_MS: "500",
      LUMENLINE_POLL_MAX_INTERVAL_MS: "5000",
      LUMENLINE_MAX_CONCURRENT_TRANSFERS: "5",
      LUMENLINE_REGISTRATION_LIMIT_MAX_ATTEMPTS: "10",
      LUMENLINE_REGISTRATION_LIMIT_WINDOW_MS: "30000",
    });
    expect(config).toMatchObject({
      host: "127.0.0.1",
      port: 9090,
      pollIntervalMs: 500,
      pollMaxIntervalMs: 5000,
      maxConcurrentTransfers: 5,
      registrationLimitMaxAttempts: 10,
      registrationLimitWindowMs: 30_000,
    });
  });
});

describe("outboundEnabled", () => {
  it("is false when LUMENLINE_OUTBOUND_ENABLED is unset — outbound is opt-in, not inferred", () => {
    expect(outboundEnabled({})).toBe(false);
  });

  it('is false for anything other than the exact string "true" (no truthy-string guessing)', () => {
    for (const value of ["1", "yes", "True", "TRUE", " true", "true "]) {
      expect(outboundEnabled({ LUMENLINE_OUTBOUND_ENABLED: value }), `value=${value}`).toBe(false);
    }
  });

  it('is true when LUMENLINE_OUTBOUND_ENABLED is exactly "true"', () => {
    expect(outboundEnabled({ LUMENLINE_OUTBOUND_ENABLED: "true" })).toBe(true);
  });
});

function validOutboundEnv(): NodeJS.ProcessEnv {
  return {
    LUMENLINE_OUTBOUND_DESTINATION_CHAIN: "ethereum-sepolia",
    LUMENLINE_OUTBOUND_EVM_RPC_URL: "https://sepolia.example.com",
  };
}

describe("loadOutboundRelayerConfig", () => {
  it("succeeds with just the two genuinely required vars, using documented defaults for the rest", () => {
    const config = loadOutboundRelayerConfig(validOutboundEnv());
    expect(config).toEqual({
      destinationChain: "ethereum-sepolia",
      evmRpcUrl: "https://sepolia.example.com",
      pollIntervalMs: 2000,
      pollMaxIntervalMs: 30_000,
      maxConcurrentTransfers: 20,
    });
  });

  it.each(["LUMENLINE_OUTBOUND_DESTINATION_CHAIN", "LUMENLINE_OUTBOUND_EVM_RPC_URL"] as const)(
    "throws when %s is unset",
    (name) => {
      const env = validOutboundEnv();
      delete env[name];
      expect(() => loadOutboundRelayerConfig(env)).toThrow(new RegExp(`${name} is required`));
    },
  );

  it("honors an explicit override for every performance/load knob", () => {
    const config = loadOutboundRelayerConfig({
      ...validOutboundEnv(),
      LUMENLINE_OUTBOUND_POLL_INTERVAL_MS: "500",
      LUMENLINE_OUTBOUND_POLL_MAX_INTERVAL_MS: "5000",
      LUMENLINE_OUTBOUND_MAX_CONCURRENT_TRANSFERS: "5",
    });
    expect(config).toMatchObject({
      pollIntervalMs: 500,
      pollMaxIntervalMs: 5000,
      maxConcurrentTransfers: 5,
    });
  });
});
