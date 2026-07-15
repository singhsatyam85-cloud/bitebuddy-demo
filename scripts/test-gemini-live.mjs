import { interpretChat } from "../server/chat-service.js";

if (process.env.AI_PROVIDER_MODE !== "gemini") {
  console.error("Manual Gemini smoke test skipped: set AI_PROVIDER_MODE=gemini in the ignored local .env file.");
  process.exitCode = 1;
} else if (!process.env.GEMINI_API_KEY?.trim()) {
  console.error("Manual Gemini smoke test skipped: GEMINI_API_KEY is not configured in the ignored local .env file.");
  process.exitCode = 1;
} else {
  try {
    const result = await interpretChat({
      message: "Show me a vegan meal under £15 without peanuts.",
      context: {
        recentHistory: [],
        activeFilters: {},
        lockedAllergies: ["Peanuts"],
        selectedOrderReference: null,
        supportFlowStage: null,
      },
    });
    console.log(`Gemini interpretation smoke test passed. Model: ${process.env.GEMINI_MODEL || "gemini-3.5-flash"}. Provider mode: ${result.providerMode}.`);
  } catch (error) {
    const code = error?.code || "PROVIDER_UNAVAILABLE";
    console.error(`Gemini interpretation smoke test failed safely (${code}). Check API access, quota, model permission, and local configuration.`);
    process.exitCode = 1;
  }
}
