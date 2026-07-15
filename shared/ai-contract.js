export const MAX_MESSAGE_LENGTH = 1000;
export const MAX_HISTORY_ITEMS = 8;
export const MAX_HISTORY_MESSAGE_LENGTH = 500;

export const SUPPORTED_INTENTS = Object.freeze([
  "food_recommendation",
  "order_tracking",
  "support",
  "previous_orders",
  "preferences",
  "general",
]);

export const FOOD_TYPES = Object.freeze(["burger", "sushi", "biryani", "curry", "breakfast"]);
export const DIETARY_PREFERENCES = Object.freeze(["Vegan", "Vegetarian", "Gluten-Free", "Keto"]);
export const ALLERGEN_VALUES = Object.freeze(["Peanuts", "Milk", "Gluten", "Tree Nuts", "Sesame", "Shellfish", "Eggs", "Soy", "Fish"]);
export const SPICE_PREFERENCES = Object.freeze(["mild", "medium", "hot", "spicy"]);
export const SORT_PREFERENCES = Object.freeze(["fastest", "nearest", "rating"]);
export const PROVIDER_MODES = Object.freeze(["mock", "gemini"]);

export const SUPPORT_ISSUES = Object.freeze([
  "Late order",
  "Missing item",
  "Wrong item",
  "Damaged food",
  "Cold food",
  "Courier cannot find address",
  "Change delivery address",
  "Refund status",
  "Payment failure",
  "Cancel order",
  "Change delivery instructions",
  "Speak to a person",
]);

const TOP_LEVEL_FIELDS = new Set(["intent", "reply", "entities", "recommendedItemIds", "confidence", "requiresHumanReview", "providerMode"]);
const ENTITY_FIELDS = new Set(["foodTypes", "dietaryPreferences", "excludedAllergens", "maximumBudget", "spicePreference", "sortPreference", "orderReference", "supportIssue"]);
const CONTEXT_FIELDS = new Set(["recentHistory", "activeFilters", "lockedAllergies", "selectedOrderReference", "supportFlowStage"]);

export class ContractValidationError extends Error {
  constructor(message, code = "INVALID_CONTRACT") {
    super(message);
    this.name = "ContractValidationError";
    this.code = code;
  }
}

function assertPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ContractValidationError(`${label} must be an object.`);
}

function rejectUnknownFields(value, allowed, label) {
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length) throw new ContractValidationError(`${label} contains unsupported fields.`);
}

function validateStringArray(value, label, { maxItems = 12, maxLength = 80 } = {}) {
  if (!Array.isArray(value) || value.length > maxItems || value.some((entry) => typeof entry !== "string" || !entry.trim() || entry.length > maxLength)) {
    throw new ContractValidationError(`${label} must be a limited array of non-empty strings.`);
  }
  return [...new Set(value.map((entry) => entry.trim()))];
}

function validateControlledStringArray(value, label, allowed, options) {
  const clean = validateStringArray(value, label, options);
  if (clean.some((entry) => !allowed.includes(entry))) throw new ContractValidationError(`${label} contains an unsupported value.`);
  return clean;
}

export function validateChatRequest(input) {
  assertPlainObject(input, "Request body");
  rejectUnknownFields(input, new Set(["message", "context"]), "Request body");
  if (typeof input.message !== "string") throw new ContractValidationError("Message must be a string.", "INVALID_MESSAGE");
  const message = input.message.trim();
  if (!message) throw new ContractValidationError("Message is required.", "EMPTY_MESSAGE");
  if (message.length > MAX_MESSAGE_LENGTH) throw new ContractValidationError("Message is too long.", "MESSAGE_TOO_LARGE");

  const context = input.context ?? {};
  assertPlainObject(context, "Context");
  rejectUnknownFields(context, CONTEXT_FIELDS, "Context");
  const recentHistory = context.recentHistory ?? [];
  if (!Array.isArray(recentHistory) || recentHistory.length > MAX_HISTORY_ITEMS) throw new ContractValidationError("Conversation history is malformed.", "INVALID_HISTORY");
  const cleanHistory = recentHistory.map((entry) => {
    assertPlainObject(entry, "History entry");
    rejectUnknownFields(entry, new Set(["role", "content"]), "History entry");
    if (!["user", "assistant"].includes(entry.role) || typeof entry.content !== "string" || !entry.content.trim() || entry.content.length > MAX_HISTORY_MESSAGE_LENGTH) {
      throw new ContractValidationError("Conversation history is malformed.", "INVALID_HISTORY");
    }
    return { role: entry.role, content: entry.content.trim() };
  });

  const activeFilters = context.activeFilters ?? {};
  assertPlainObject(activeFilters, "Active filters");
  const allowedFilterFields = new Set(["budget", "diet", "spicy", "healthy", "foodTypes", "protein", "quick", "nearby", "allergens"]);
  rejectUnknownFields(activeFilters, allowedFilterFields, "Active filters");
  if (activeFilters.budget !== undefined && activeFilters.budget !== null && (typeof activeFilters.budget !== "number" || !Number.isFinite(activeFilters.budget) || activeFilters.budget < 0 || activeFilters.budget > 1000)) throw new ContractValidationError("Active budget filter is invalid.");
  for (const key of ["diet", "protein"]) {
    if (activeFilters[key] !== undefined && activeFilters[key] !== null && (typeof activeFilters[key] !== "string" || activeFilters[key].length > 80)) throw new ContractValidationError(`Active ${key} filter is invalid.`);
  }
  for (const key of ["spicy", "healthy", "quick", "nearby"]) {
    if (activeFilters[key] !== undefined && typeof activeFilters[key] !== "boolean") throw new ContractValidationError(`Active ${key} filter is invalid.`);
  }
  const cleanActiveFilters = {
    ...activeFilters,
    foodTypes: validateStringArray(activeFilters.foodTypes ?? [], "Active food types"),
    allergens: validateStringArray(activeFilters.allergens ?? [], "Active allergens", { maxItems: 16 }),
  };

  const lockedAllergies = validateStringArray(context.lockedAllergies ?? [], "Locked allergies", { maxItems: 16 });
  const selectedOrderReference = context.selectedOrderReference ?? null;
  const supportFlowStage = context.supportFlowStage ?? null;
  if (selectedOrderReference !== null && (typeof selectedOrderReference !== "string" || selectedOrderReference.length > 40)) throw new ContractValidationError("Selected order reference is invalid.");
  if (supportFlowStage !== null && (typeof supportFlowStage !== "string" || supportFlowStage.length > 60)) throw new ContractValidationError("Support flow stage is invalid.");

  return {
    message,
    context: {
      recentHistory: cleanHistory,
      activeFilters: cleanActiveFilters,
      lockedAllergies,
      selectedOrderReference,
      supportFlowStage,
    },
  };
}

export function validateInterpretation(output, { allowedItemIds = [], allowedOrderReferences = [] } = {}) {
  assertPlainObject(output, "Provider output");
  rejectUnknownFields(output, TOP_LEVEL_FIELDS, "Provider output");
  if (!SUPPORTED_INTENTS.includes(output.intent)) throw new ContractValidationError("Provider returned an unsupported intent.", "UNSUPPORTED_INTENT");
  if (typeof output.reply !== "string" || !output.reply.trim() || output.reply.length > 800) throw new ContractValidationError("Provider reply is invalid.");
  if (typeof output.confidence !== "number" || !Number.isFinite(output.confidence) || output.confidence < 0 || output.confidence > 1) throw new ContractValidationError("Provider confidence is invalid.");
  if (typeof output.requiresHumanReview !== "boolean") throw new ContractValidationError("Provider review flag is invalid.");
  if (!PROVIDER_MODES.includes(output.providerMode)) throw new ContractValidationError("Provider mode is invalid.");

  const entities = output.entities;
  assertPlainObject(entities, "Entities");
  rejectUnknownFields(entities, ENTITY_FIELDS, "Entities");
  const cleanEntities = {
    foodTypes: validateControlledStringArray(entities.foodTypes ?? [], "Food types", FOOD_TYPES),
    dietaryPreferences: validateControlledStringArray(entities.dietaryPreferences ?? [], "Dietary preferences", DIETARY_PREFERENCES),
    excludedAllergens: validateControlledStringArray(entities.excludedAllergens ?? [], "Excluded allergens", ALLERGEN_VALUES, { maxItems: 16 }),
    maximumBudget: entities.maximumBudget ?? null,
    spicePreference: entities.spicePreference ?? null,
    sortPreference: entities.sortPreference ?? null,
    orderReference: entities.orderReference ?? null,
    supportIssue: entities.supportIssue ?? null,
  };
  if (cleanEntities.maximumBudget !== null && (typeof cleanEntities.maximumBudget !== "number" || !Number.isFinite(cleanEntities.maximumBudget) || cleanEntities.maximumBudget < 0 || cleanEntities.maximumBudget > 1000)) throw new ContractValidationError("Maximum budget is invalid.");
  if (cleanEntities.spicePreference !== null && !SPICE_PREFERENCES.includes(cleanEntities.spicePreference)) throw new ContractValidationError("Spice preference is invalid.");
  if (cleanEntities.sortPreference !== null && !SORT_PREFERENCES.includes(cleanEntities.sortPreference)) throw new ContractValidationError("Sort preference is invalid.");
  if (cleanEntities.supportIssue !== null && !SUPPORT_ISSUES.includes(cleanEntities.supportIssue)) throw new ContractValidationError("Support issue is invalid.");
  if (cleanEntities.orderReference !== null && typeof cleanEntities.orderReference !== "string") throw new ContractValidationError("Order reference is invalid.");

  const itemIds = validateStringArray(output.recommendedItemIds ?? [], "Recommended item IDs", { maxItems: 8, maxLength: 80 });
  const itemAllowlist = new Set(allowedItemIds);
  if (itemIds.some((id) => !itemAllowlist.has(id))) throw new ContractValidationError("Provider returned an unknown menu-item ID.", "UNKNOWN_ITEM_ID");
  const orderAllowlist = new Set(allowedOrderReferences);
  if (cleanEntities.orderReference !== null && !orderAllowlist.has(cleanEntities.orderReference)) throw new ContractValidationError("Provider returned an unknown order reference.", "UNKNOWN_ORDER_REFERENCE");

  return {
    intent: output.intent,
    reply: output.reply.trim(),
    entities: cleanEntities,
    recommendedItemIds: itemIds,
    confidence: output.confidence,
    requiresHumanReview: output.requiresHumanReview,
    providerMode: output.providerMode,
  };
}
