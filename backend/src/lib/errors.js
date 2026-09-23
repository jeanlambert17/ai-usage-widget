export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

// Providers throw this (or a subclass) when a stored credential/session is
// rejected, so the usage route can flag "reconnect this account" generically
// without knowing which provider it came from.
export class ProviderAuthError extends Error {
  constructor(message) {
    super(message);
    this.name = "ProviderAuthError";
    this.isAuthError = true;
  }
}
