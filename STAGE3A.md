# BiteBuddy Stage 3A: Secure AI Foundation

## Structure

- `src/`: existing React UI and deterministic BiteBuddy business rules. `aiClient.js` calls only the BiteBuddy backend and returns `null` on failure so existing rule-based handling continues.
- `server/`: dependency-free Node HTTP API, provider selection, authoritative identifier allowlists, and the mock adapter.
- `shared/ai-contract.js`: request and response limits plus strict provider-neutral validation used by both browser and server.
- `tests/ai-foundation.test.js`: focused contract, adapter, API-security, and fallback tests.

## Commands

- `npm.cmd run dev`: starts the mock API and Vite together.
- `npm.cmd run dev:frontend`: starts Vite only. Start `npm.cmd run dev:backend` separately for mock-AI HTTP 200 responses; otherwise AI requests safely fall back.
- `npm.cmd run dev:backend`: starts `POST /api/chat` on `127.0.0.1:8787` by default.
- `npm.cmd run test:ai`: runs the Stage 3A technical tests.
- `npm.cmd run build`: creates the production frontend build.

Copy `.env.example` to an ignored local `.env` only when configuration overrides are needed. No credential is required in mock mode. Variables prefixed with `VITE_` are browser-visible and must never contain secrets.

## Modes and fallback

The browser feature modes are `rule_based`, `mock_ai`, and `live_ai`. Stage 3A defaults to `mock_ai`; the server defaults to provider `mock`. Mock output is predictable and marked `providerMode: "mock"`. Selecting a live server provider fails closed because no official provider contract exists yet. Backend errors, timeouts, invalid JSON/output, unsupported intents, and unknown IDs all result in the existing rule-based customer journey.

Local Vite startup uses strict port 5173. If an older Vite process is still using that port, startup stops with a clear error instead of silently opening the new configured app on a different port. Close the stale process and rerun `npm.cmd run dev`.

## Response contract

`POST /api/chat` accepts one bounded customer message and limited recent context. It returns a validated object containing `intent`, a draft `reply`, controlled `entities`, allowlisted `recommendedItemIds`, confidence from `0` to `1`, `requiresHumanReview`, and `providerMode`. Unknown fields and invalid identifiers are rejected.

## Security and authority boundaries

Customer text is untrusted. The API receives no localStorage dump, payment details, support queue, credentials, or internal logs. Provider output may propose only intent and entities. Existing menu, price, allergen, availability, order, tracking, cancellation, delivery-instruction, and support handlers remain authoritative. The provider cannot mutate state, bypass confirmation, create tickets, approve refunds/compensation, or claim a live courier connection. API failures return generic messages without stack traces or environment details.

## Future provider adapter

Stage 3B should add an adapter beside `server/providers/mock-provider.js` and select it through `server/providers/index.js`. Implementation must wait for official provider documentation covering the provider identity, approved endpoint/base URL, model/deployment identifier, authentication mechanism and credential name, request/response schema, structured-output capability, timeout/retry/rate-limit guidance, data-retention policy, regional/privacy requirements, and approved error semantics. Restaurant/order tools or schemas must also be explicitly approved; none are invented here.

All restaurants, menu data, orders, tracking, tickets, and provider output remain simulated in Stage 3A. No live AI or operational service is connected.
