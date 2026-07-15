import { mockProvider } from "./mock-provider.js";
import { createGeminiProvider } from "./gemini-provider.js";
import { ProviderConfigurationError } from "./provider-errors.js";

export { ProviderConfigurationError, ProviderFailureError } from "./provider-errors.js";

export function configuredProviderMode() {
  return process.env.AI_PROVIDER_MODE || process.env.BITEBUDDY_AI_PROVIDER || "mock";
}

export function getProvider(mode = configuredProviderMode(), options = {}) {
  if (mode === "mock") return mockProvider;
  if (mode === "gemini") return createGeminiProvider(options);
  throw new ProviderConfigurationError("Unsupported BiteBuddy provider mode.");
}
