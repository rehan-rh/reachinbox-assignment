export class RateLimitError extends Error {
  retryAt: Date;

  constructor(retryAt: Date) {
    super("Hourly email rate limit reached");

    this.name = "RateLimitError";
    this.retryAt = retryAt;
  }
}