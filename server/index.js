import http from "node:http";
import { pathToFileURL } from "node:url";
import { ContractValidationError } from "../shared/ai-contract.js";
import { interpretChat, ProviderTimeoutError } from "./chat-service.js";
import { ProviderConfigurationError, ProviderFailureError } from "./providers/index.js";

const MAX_BODY_BYTES = 16 * 1024;

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
      const error = new ContractValidationError("Request body is too large.", "REQUEST_TOO_LARGE");
      throw error;
    }
  }
  try {
    return JSON.parse(body || "{}");
  } catch {
    throw new ContractValidationError("Request body must be valid JSON.", "INVALID_JSON");
  }
}

export function createApiServer(options = {}) {
  return http.createServer(async (request, response) => {
    const url = new URL(request.url, "http://localhost");
    if (request.method !== "POST" || url.pathname !== "/api/chat") {
      sendJson(response, 404, { error: { code: "NOT_FOUND", message: "Route not found." } });
      return;
    }
    try {
      const result = await interpretChat(await readJson(request), options);
      sendJson(response, 200, result);
    } catch (error) {
      if (error instanceof ContractValidationError) {
        sendJson(response, 400, { error: { code: error.code, message: error.message } });
      } else if (error instanceof ProviderConfigurationError) {
        sendJson(response, 503, { error: { code: "PROVIDER_UNAVAILABLE", message: "Interpretation service is unavailable." } });
      } else if (error instanceof ProviderFailureError) {
        sendJson(response, 503, { error: { code: "PROVIDER_UNAVAILABLE", message: "Interpretation service is temporarily unavailable." } });
      } else if (error instanceof ProviderTimeoutError || error?.code === "RATE_LIMITED") {
        sendJson(response, 503, { error: { code: error.code, message: "Interpretation service is temporarily unavailable." } });
      } else {
        sendJson(response, 500, { error: { code: "INTERNAL_ERROR", message: "The request could not be processed." } });
      }
    }
  });
}

const isEntryPoint = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntryPoint) {
  const host = process.env.BITEBUDDY_API_HOST || "127.0.0.1";
  const port = Number(process.env.BITEBUDDY_API_PORT || 8787);
  const server = createApiServer();
  server.listen(port, host, () => console.log(`BiteBuddy AI API listening at http://${host}:${port}/api/chat`));
}
