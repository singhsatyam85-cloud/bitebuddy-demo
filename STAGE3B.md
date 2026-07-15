# BiteBuddy Stage 3B: Secure Gemini Integration

Stage 3B adds a server-only Gemini interpretation adapter while retaining the Stage 3A mock provider and deterministic rule-based fallback. Gemini never runs in the browser and never performs a BiteBuddy business action.

## Official API and SDK

- API: Gemini Interactions API (currently beta/preview).
- JavaScript SDK: `@google/genai`.
- Call: `GoogleGenAI().interactions.create(...)` with `response_format.type: "text"`, `mime_type: "application/json"`, and the BiteBuddy JSON Schema.
- Output: the SDK's final `interaction.output_text`, parsed and revalidated by BiteBuddy.

## Configuration

The ignored local `.env` file may contain:

```text
VITE_BITEBUDDY_AI_MODE=live_ai
VITE_BITEBUDDY_AI_TIMEOUT_MS=50000
AI_PROVIDER_MODE=gemini
GEMINI_API_KEY=<local secret>
GEMINI_MODEL=gemini-3.5-flash
GEMINI_TIMEOUT_MS=45000
```

`AI_PROVIDER_MODE=mock` remains the safe default. Gemini is never selected merely because a key exists. `GEMINI_MODEL` is configurable, and the default is `gemini-3.5-flash`. `VITE_BITEBUDDY_AI_TIMEOUT_MS` controls how long the browser waits for the backend and should remain longer than `GEMINI_TIMEOUT_MS`. Never prefix the key with `VITE_`; Vite-prefixed values are browser-visible.

## Security and fallback

Only the bounded message, limited recent turns, active dietary filters, locked allergy exclusions, relevant mock order reference/support stage, controlled value lists, and relevant approved active mock order IDs are sent. The adapter sends no localStorage dump, payment data, support queue, internal logs, source code, or credentials in the prompt. Interaction storage is disabled.

The system instruction treats customer text as untrusted, rejects prompt overrides and secret requests, prohibits invented data and executable actions, preserves allergy locks and confirmations, and requires an empty `recommendedItemIds` array. Provider output is constrained by JSON Schema and then checked by the existing strict validator. Unknown fields, identifiers, intents, diets, allergens, invalid confidence, malformed JSON, empty/refused output, and non-empty item IDs fail closed.

The Gemini request uses an abort-backed configurable timeout and disables SDK retries. Authentication, permission, rate-limit, network, timeout, refusal, JSON, and schema errors are mapped to controlled internal errors. The API returns only generic provider-unavailable errors, and the browser silently continues with deterministic rule-based handling.

All restaurants, menus, prices, availability, orders, tracking, couriers, tickets, payments, refunds, and compensation remain mock/deterministic. Gemini cannot cancel or modify an order, change delivery instructions, create a ticket, select menu records, or skip a confirmation.

## Development and manual smoke test

No key is needed for normal development:

```text
VITE_BITEBUDDY_AI_MODE=mock_ai
AI_PROVIDER_MODE=mock
```

The automated `npm.cmd run test:ai` suite uses mocked SDK clients and makes no live calls. After securely configuring the ignored local `.env`, a developer may explicitly run one read-only interpretation request:

```text
npm.cmd run test:gemini-live
```

The script refuses to run unless Gemini is explicitly selected and a key exists. It never prints the key or request headers and does not change application state. Quota, balance, authentication, and permission failures are reported using controlled codes.

To rotate the key, replace `GEMINI_API_KEY` only in the ignored local `.env` or secret manager and revoke the old key in Google AI Studio/Google Cloud. To remove Gemini access, delete the local key and set `AI_PROVIDER_MODE=mock`; do not commit `.env`.
