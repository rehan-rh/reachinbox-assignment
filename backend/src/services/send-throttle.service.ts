import { redis } from "../config/redis";

const THROTTLE_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local delay = tonumber(ARGV[2])

local last = redis.call("GET", key)

if not last then
    redis.call("SET", key, now, "PX", delay)
    return 0
end

last = tonumber(last)

local nextAllowed = last + delay

if now >= nextAllowed then
    redis.call("SET", key, now, "PX", delay)
    return 0
end

return nextAllowed - now
`;

export async function waitForSendSlot(
  senderId: string,
  delayMs: number
): Promise<void> {
  const key = `email:send-throttle:${senderId}`;

  while (true) {
    const now = Date.now();

    const result = await redis.eval(
      THROTTLE_SCRIPT,
      1,
      key,
      now,
      delayMs
    );

    const waitTime = Number(result);

    if (waitTime <= 0) {
      return;
    }

    await new Promise((resolve) =>
      setTimeout(resolve, waitTime)
    );
  }
}