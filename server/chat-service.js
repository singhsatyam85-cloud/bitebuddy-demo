import { ContractValidationError, validateChatRequest, validateInterpretation } from "../shared/ai-contract.js";
import { AUTHORITATIVE_MENU_ITEM_IDS, AUTHORITATIVE_ORDER_REFERENCES } from "./authoritative-data.js";
import { getProvider } from "./providers/index.js";

export class ProviderTimeoutError extends Error {
  constructor() {
    super("Provider interpretation timed out.");
    this.name = "ProviderTimeoutError";
    this.code = "PROVIDER_TIMEOUT";
  }
}

function withTimeout(promise, timeoutMs) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new ProviderTimeoutError()), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export async function interpretChat(rawInput, options = {}) {
  const input = validateChatRequest(rawInput);
  if (input.context.selectedOrderReference && !AUTHORITATIVE_ORDER_REFERENCES.includes(input.context.selectedOrderReference)) {
    throw new ContractValidationError("Context contains an unknown order reference.", "UNKNOWN_ORDER_REFERENCE");
  }
  const provider = options.provider || getProvider(options.providerMode, options.providerOptions);
  if (!provider || typeof provider.interpretCustomerMessage !== "function") throw new Error("Provider adapter is invalid.");
  const timeoutMs = options.timeoutMs ?? (provider.timeoutMs ? provider.timeoutMs + 250 : Number(process.env.BITEBUDDY_PROVIDER_TIMEOUT_MS || 3000));
  const rawOutput = await withTimeout(Promise.resolve(provider.interpretCustomerMessage(input)), timeoutMs);
  return validateInterpretation(rawOutput, {
    allowedItemIds: AUTHORITATIVE_MENU_ITEM_IDS,
    allowedOrderReferences: AUTHORITATIVE_ORDER_REFERENCES,
  });
}
