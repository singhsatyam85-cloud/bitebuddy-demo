import { ALLERGEN_VALUES, DIETARY_PREFERENCES, SUPPORT_ISSUES } from "../../shared/ai-contract.js";

const ALLERGEN_TERMS = Object.freeze({
  peanut: "Peanuts", peanuts: "Peanuts", dairy: "Milk", milk: "Milk", gluten: "Gluten",
  nut: "Tree Nuts", nuts: "Tree Nuts", sesame: "Sesame", shellfish: "Shellfish",
  egg: "Eggs", eggs: "Eggs", soy: "Soy", fish: "Fish",
});

function supportIssue(text) {
  const rules = [
    [/\bpayment\s+(?:was\s+)?(?:fail(?:ed|ure)?|declin(?:ed|e))\b|\bcard\s+(?:was\s+)?declined\b|\b(?:failed|declined)\s+payment\b/, "Payment failure"],
    [/\brefund(?:ed|s|ing)?\b/, "Refund status"],
    [/\bcancel\b/, "Cancel order"],
    [/\blate\b|delivery time has passed|driver is delayed/, "Late order"],
    [/missing|did not receive/, "Missing item"],
    [/wrong item|not what i ordered|different meal/, "Wrong item"],
    [/damaged|packaging|spilled/, "Damaged food"],
    [/\bcold\b/, "Cold food"],
    [/\b(?:change|update)\b.*\bdelivery address\b/, "Change delivery address"],
    [/cannot find|find the address/, "Courier cannot find address"],
    [/delivery instructions|call me|leave it at|side entrance/, "Change delivery instructions"],
    [/speak to|human|person|agent/, "Speak to a person"],
  ];
  return rules.find(([pattern]) => pattern.test(text))?.[1] ?? null;
}

function extractEntities(text) {
  const budgetMatch = text.match(/(?:under|below|less than|maximum|max|budget(?: meal)?(?: of)?)[\s£$]*(\d+(?:\.\d+)?)/);
  const dietaryPreferences = [
    /\bvegan\b/.test(text) && "Vegan",
    /\bvegetarian\b|\bno meat\b|\bmeat free\b/.test(text) && "Vegetarian",
    /\bgluten[- ]free\b/.test(text) && "Gluten-Free",
    /\bketo\b/.test(text) && "Keto",
  ].filter(Boolean);
  const excludedAllergens = Object.entries(ALLERGEN_TERMS)
    .filter(([term]) => new RegExp(`(?:allergic to|allergy|avoid|no|without|free|cannot eat)[^.!?]{0,18}\\b${term}\\b|\\b${term}[- ]free`).test(text))
    .map(([, allergen]) => allergen);
  const orderReference = text.match(/\bbb\d{4}\b/i)?.[0].toUpperCase() ?? null;
  return {
    foodTypes: ["burger", "sushi", "biryani", "curry", "breakfast"].filter((food) => text.includes(food)),
    dietaryPreferences: [...new Set(dietaryPreferences)],
    excludedAllergens: [...new Set(excludedAllergens)],
    maximumBudget: budgetMatch ? Number(budgetMatch[1]) : /\bcheap|affordable|low cost|budget meal\b/.test(text) ? 10 : null,
    spicePreference: /\bmild\b/.test(text) ? "mild" : /\bhot\b/.test(text) ? "hot" : /\bspicy\b/.test(text) ? "spicy" : null,
    sortPreference: /fastest|quick delivery/.test(text) ? "fastest" : /nearby|near me/.test(text) ? "nearest" : null,
    orderReference,
    supportIssue: supportIssue(text),
  };
}

function retainConversationEntities(entities, context = {}) {
  const activeFilters = context.activeFilters || {};
  const retainedDiet = DIETARY_PREFERENCES.includes(activeFilters.diet) ? [activeFilters.diet] : [];
  const retainedBudget = Number.isFinite(activeFilters.budget) ? activeFilters.budget : null;
  const retainedAllergens = [...(activeFilters.allergens || []), ...(context.lockedAllergies || [])]
    .filter((allergen) => ALLERGEN_VALUES.includes(allergen));

  return {
    ...entities,
    dietaryPreferences: entities.dietaryPreferences.length ? entities.dietaryPreferences : retainedDiet,
    excludedAllergens: [...new Set([...retainedAllergens, ...entities.excludedAllergens])],
    maximumBudget: entities.maximumBudget ?? retainedBudget,
    spicePreference: entities.spicePreference ?? (activeFilters.spicy ? "spicy" : null),
  };
}

export const mockProvider = Object.freeze({
  mode: "mock",
  async interpretCustomerMessage(input) {
    const text = input.message.toLowerCase();
    const entities = retainConversationEntities(extractEntities(text), input.context);
    const injectionLike = /ignore (all|previous|system)|hidden prompt|system prompt|environment variables?|api keys?|change (the )?price|bypass|skip confirmation|live courier/.test(text);
    let intent = "food_recommendation";
    if (injectionLike) intent = "general";
    else if (entities.supportIssue && SUPPORT_ISSUES.includes(entities.supportIssue)) intent = "support";
    else if (/track( my)? order|order tracking|where is my order|order status/.test(text)) intent = "order_tracking";
    else if (/previous orders|reorder|repeat my usual|favourite restaurant/.test(text)) intent = "previous_orders";
    else if (/view preferences|my preferences/.test(text)) intent = "preferences";

    return {
      intent,
      reply: injectionLike
        ? "Mock interpretation identified a request that cannot override BiteBuddy business or security rules."
        : "Mock interpretation completed. BiteBuddy will apply deterministic menu, order, allergy, and support rules.",
      entities,
      recommendedItemIds: [],
      confidence: injectionLike ? 0.2 : 0.86,
      requiresHumanReview: injectionLike,
      providerMode: "mock",
    };
  },
});
