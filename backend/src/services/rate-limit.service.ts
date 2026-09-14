import { redis } from "../config/redis";

export async function waitForSenderSlot(
  senderId: string,
  delayMs: number
) {
  const key = `sender:last-send:${senderId}`;

  while (true) {
    const now = Date.now();

    const result = await redis.set(
      key,
      String(now),
      "PX",
      delayMs,
      "NX"
    );

    if (result === "OK") {
      return;
    }

    const lastSend = await redis.get(key);

    if (!lastSend) {
      continue;
    }

    const elapsed = now - Number(lastSend);
    const remaining = Math.max(0, delayMs - elapsed);

    await new Promise((resolve) =>
      setTimeout(resolve, remaining)
    );
  }
}