import { prisma } from "../config/database";
import { emailTransporter } from "../config/email";
import { waitForSendSlot } from "./send-throttle.service";
import { checkHourlyRateLimit } from "./hourly-rate-limit.service";
import { RateLimitError } from "../utils/rate-limit.error";
import { indexEmail } from "./search.service";
import { sendSlackRateLimitNotification } from "./slack.service";

export async function sendEmail(emailId: string) {
  const email = await prisma.email.findUnique({
    where: {
      id: emailId,
    },
    include: {
      sender: true,
    },
  });

  if (!email) {
    throw new Error(`Email ${emailId} not found`);
  }

  // Idempotency
  if (email.status === "SENT") {
    console.log(
      `Email ${emailId} was already sent. Skipping.`
    );

    return;
  }

  // Check hourly rate limit
  const rateLimit = await checkHourlyRateLimit(
    email.senderId
  );

  if (!rateLimit.allowed) {
    console.log(
      `Hourly rate limit reached for sender ${email.sender.email}`
    );

    /*
     * Only the first email that exceeds the limit
     * sends a Slack notification.
     *
     * Example:
     * limit = 100
     * email #101 -> notification
     * email #102 -> no notification
     * email #103 -> no notification
     */
    if (rateLimit.limitJustExceeded) {
      await sendSlackRateLimitNotification(
        email.userId,
        email.sender.email,
        rateLimit.limit
      );
    }

    throw new RateLimitError(rateLimit.retryAt);
  }

  // Mark processing
  await prisma.email.update({
    where: {
      id: emailId,
    },
    data: {
      status: "PROCESSING",
      attempts: {
        increment: 1,
      },
    },
  });

  try {
    // Enforce minimum delay between sends
    await waitForSendSlot(
      email.senderId,
      Number(
        process.env.MIN_EMAIL_DELAY_MS || 2000
      )
    );

    const info = await emailTransporter.sendMail({
      from: email.sender.email,
      to: email.recipient,
      subject: email.subject,
      text: email.body,
    });

    const sentAt = new Date();

    await prisma.email.update({
      where: {
        id: emailId,
      },
      data: {
        status: "SENT",
        sentAt,
        messageId: info.messageId,
      },
    });

    await indexEmail({
      id: email.id,
      userId: email.userId,
      recipient: email.recipient,
      subject: email.subject,
      body: email.body,
      status: "SENT",
      scheduledAt: email.scheduledAt,
      sentAt,
    });

    console.log(
      `Email ${emailId} sent successfully`
    );

    return info;
  } catch (error) {
    await prisma.email.update({
      where: {
        id: emailId,
      },
      data: {
        status: "FAILED",
      },
    });

    throw error;
  }
}