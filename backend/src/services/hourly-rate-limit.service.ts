import { redis } from "../config/redis";

interface RateLimitResult {
  allowed: boolean;
  count: number;
  limit: number;
  retryAt: Date;
  limitJustExceeded: boolean;
}

const RATE_LIMIT_SCRIPT = `
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local ttl = tonumber(ARGV[2])

local count = redis.call("INCR", key)

if count == 1 then
    redis.call("EXPIRE", key, ttl)
end

if count <= limit then
    return {1, count}
end

return {0, count}
`;

export async function checkHourlyRateLimit(
  senderId: string
): Promise<RateLimitResult> {
  const limit = Number(
    process.env.MAX_EMAILS_PER_HOUR || 100
  );

  const now = new Date();

  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const hour = String(now.getUTCHours()).padStart(2, "0");

  const windowKey = `${year}-${month}-${day}-${hour}`;

  const key = `email:rate:${senderId}:${windowKey}`;

  const secondsUntilNextHour =
    3600 -
    (now.getUTCMinutes() * 60 +
      now.getUTCSeconds());

  const result = (await redis.eval(
    RATE_LIMIT_SCRIPT,
    1,
    key,
    limit,
    Math.max(secondsUntilNextHour, 1)
  )) as [number, number];

  const allowed = Number(result[0]) === 1;
  const count = Number(result[1]);

  const retryAt = new Date(
    now.getTime() +
      Math.max(secondsUntilNextHour, 1) * 1000
  );

  const limitJustExceeded =
    !allowed && count === limit + 1;

  return {
    allowed,
    count,
    limit,
    retryAt,
    limitJustExceeded,
  };
}