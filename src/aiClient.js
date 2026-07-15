import { validateInterpretation } from "../shared/ai-contract.js";

export const AI_FEATURE_MODES = Object.freeze(["rule_based", "mock_ai", "live_ai"]);
const DEFAULT_MODE = "mock_ai";
const DEFAULT_REQUEST_TIMEOUT_MS = 50000;

export function configuredAiMode() {
  const configured = import.meta.env?.VITE_BITEBUDDY_AI_MODE || DEFAULT_MODE;
  return AI_FEATURE_MODES.includes(configured) ? configured : "rule_based";
}

export function configuredAiRequestTimeoutMs() {
  const configured = Number(import.meta.env?.VITE_BITEBUDDY_AI_TIMEOUT_MS ?? DEFAULT_REQUEST_TIMEOUT_MS);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_REQUEST_TIMEOUT_MS;
}

export async function requestInterpretation(input, options = {}) {
  const mode = options.mode || configuredAiMode();
  if (mode === "rule_based") return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? configuredAiRequestTimeoutMs());
  try {
    const fetchImpl = options.fetchImpl || globalThis.fetch;
    if (typeof fetchImpl !== "function") throw new Error("Backend request is unavailable.");
    const response = await fetchImpl("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("Backend interpretation failed.");
    const result = validateInterpretation(await response.json(), {
      allowedItemIds: options.allowedItemIds || [],
      allowedOrderReferences: options.allowedOrderReferences || [],
    });
    if (mode === "mock_ai" && result.providerMode !== "mock") throw new Error("Unexpected provider mode.");
    if (mode === "live_ai" && !["gemini", "mock"].includes(result.providerMode)) throw new Error("Configured AI provider is unavailable.");
    return result;
  } finally {
    clearTimeout(timeout);
  }
}

export function assistantLabelForSource(source) {
  if (source === "gemini") return "AI-assisted using mock business data";
  if (source === "mock") return "Mock assistant";
  return "BiteBuddy assistant";
}

export async function interpretWithRuleBasedFallback(input, options = {}) {
  try {
    const interpretation = await requestInterpretation(input, options);
    if (interpretation) return { source: interpretation.providerMode, interpretation };
  } catch {
    // Technical details deliberately stay out of the customer conversation.
  }
  return { source: "rule_based", interpretation: null };
}

export function enrichRuleBasedInput(message, interpretation) {
  if (!interpretation || interpretation.intent !== "food_recommendation") return message;
  const entities = interpretation.entities;
  const additions = [
    ...entities.foodTypes,
    ...entities.dietaryPreferences,
    ...entities.excludedAllergens.map((allergen) => `avoid ${allergen}`),
    entities.maximumBudget !== null && `under £${entities.maximumBudget}`,
    entities.spicePreference,
    entities.sortPreference === "fastest" && "fastest delivery",
    entities.sortPreference === "nearest" && "near me",
  ].filter(Boolean);
  return additions.length ? `${message} ${additions.join(" ")}` : message;
}
