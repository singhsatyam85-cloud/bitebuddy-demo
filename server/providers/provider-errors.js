export class ProviderConfigurationError extends Error {
  constructor(message = "Provider configuration is unavailable.") {
    super(message);
    this.name = "ProviderConfigurationError";
    this.code = "PROVIDER_CONFIGURATION_ERROR";
  }
}

export class ProviderFailureError extends Error {
  constructor(code, { retryable = false } = {}) {
    super("Provider interpretation failed.");
    this.name = "ProviderFailureError";
    this.code = code;
    this.retryable = retryable;
  }
}
