import crypto from "crypto";
import { prisma } from "../config/database";
import { emailQueue } from "../queues/email.queue";

interface ScheduleEmailsInput {
  userId: string;
  senderId: string;
  recipients: string[];
  subject: string;
  body: string;
  startTime: Date;
  delayMs: number;
  hourlyLimit: number;
}

export async function scheduleEmails(
  input: ScheduleEmailsInput
) {
  const emails = [];

  /*
   * One campaign ID is shared by every email created
   * during this scheduling request.
   */
  const campaignId = crypto.randomUUID();

  for (let i = 0; i < input.recipients.length; i++) {
    const recipient = input.recipients[i];

    const scheduledAt = new Date(
      input.startTime.getTime() +
        i * input.delayMs
    );

    const idempotencyKey = crypto.randomUUID();

    const email = await prisma.email.create({
      data: {
        userId: input.userId,
        senderId: input.senderId,

        campaignId,
        hourlyLimit: input.hourlyLimit,

        recipient,
        subject: input.subject,
        body: input.body,

        scheduledAt,
        status: "SCHEDULED",

        idempotencyKey,
      },
    });

    await emailQueue.add(
      "send-email",
      {
        emailId: email.id,
      },
      {
        jobId: email.id,

        delay: Math.max(
          0,
          scheduledAt.getTime() - Date.now()
        ),

        removeOnComplete: false,
        removeOnFail: false,
      }
    );

    emails.push(email);
  }

  return emails;
}