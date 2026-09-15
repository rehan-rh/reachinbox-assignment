import { prisma } from "../config/database";
import { emailTransporter } from "../config/email";
import { waitForSendSlot } from "./send-throttle.service";
import { checkHourlyRateLimit } from "./hourly-rate-limit.service";
import { RateLimitError } from "../utils/rate-limit.error";
import { indexEmail } from "./search.service";
import { sendSlackRateLimitNotification } from "./slack.service";

export async function sendEmail(emailId: string) {
  const email = await prisma.email.findUnique({
    where: { id: emailId },
    include: { sender: true },
  });

  if (!email) {
    throw new Error(
      `Email ${emailId} not found`
    );
  }

  if (email.status === "SENT") {
    console.log(
      `Email ${emailId} was already sent. Skipping.`
    );
    return;
  }

  /*
   * Rate limit belongs to this campaign.
   */
  const rateLimit =
    await checkHourlyRateLimit(
      email.campaignId,
      email.hourlyLimit
    );

  if (!rateLimit.allowed) {
    console.log(
      `Hourly rate limit reached for campaign ${email.campaignId}`
    );

    if (rateLimit.limitJustExceeded) {
      await sendSlackRateLimitNotification(
        email.userId,
        email.sender.email,
        rateLimit.limit
      );
    }

    throw new RateLimitError(
      rateLimit.retryAt
    );
  }

  await prisma.email.update({
    where: { id: emailId },
    data: {
      status: "PROCESSING",
      attempts: {
        increment: 1,
      },
    },
  });

  try {
    await waitForSendSlot(
      email.senderId,
      Number(
        process.env.MIN_EMAIL_DELAY_MS || 2000
      )
    );

    const info =
      await emailTransporter.sendMail({
        from: email.sender.email,
        to: email.recipient,
        subject: email.subject,
        text: email.body,
      });

    const sentAt = new Date();

    await prisma.email.update({
      where: { id: emailId },
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
      where: { id: emailId },
      data: {
        status: "FAILED",
      },
    });

    throw error;
  }
}