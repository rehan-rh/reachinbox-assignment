import { prisma } from "../config/database";
import { emailQueue } from "../queues/email.queue";
import crypto from "crypto";
import { indexEmail } from "./search.service";

interface ScheduleEmailsInput {
  userId: string;
  senderId: string;
  recipients: string[];
  subject: string;
  body: string;
  startTime: Date;
  delayMs: number;
}

export async function scheduleEmails(input: ScheduleEmailsInput) {
  const emails = [];

  for (let i = 0; i < input.recipients.length; i++) {
    const recipient = input.recipients[i];

    // Each email is scheduled after the previous one
    const scheduledAt = new Date(
      input.startTime.getTime() + i * input.delayMs
    );

    const idempotencyKey = crypto.randomUUID();

    const email = await prisma.email.create({
      data: {
        userId: input.userId,
        senderId: input.senderId,
        recipient,
        subject: input.subject,
        body: input.body,
        scheduledAt,
        status: "SCHEDULED",
        idempotencyKey,
      },
    });

    // Index scheduled email in Elasticsearch
    await indexEmail({
      id: email.id,
      userId: email.userId,
      recipient: email.recipient,
      subject: email.subject,
      body: email.body,
      status: "SCHEDULED",
      scheduledAt: email.scheduledAt,
      sentAt: null,
    });

    const delay = Math.max(
      0,
      scheduledAt.getTime() - Date.now()
    );

    await emailQueue.add(
      "send-email",
      {
        emailId: email.id,
      },
      {
        jobId: email.id,
        delay,
        removeOnComplete: false,
        removeOnFail: false,
      }
    );

    emails.push(email);
  }

  return emails;
}