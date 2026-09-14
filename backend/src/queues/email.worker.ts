import {
  Worker,
  DelayedError,
} from "bullmq";

import { redis } from "../config/redis";
import { sendEmail } from "../services/email.service";
import { RateLimitError } from "../utils/rate-limit.error";

export const emailWorker = new Worker(
  "email-queue",
  async (job) => {
    console.log("=================================");
    console.log(`Processing job ${job.id}`);
    console.log("Email ID:", job.data.emailId);
    console.log("=================================");

    try {
      await sendEmail(job.data.emailId);
    } catch (error) {
      if (error instanceof RateLimitError) {
        console.log(
          `Rate limit reached. Rescheduling job ${job.id}`
        );

        await job.moveToDelayed(
          error.retryAt.getTime(),
          job.token
        );

        console.log(
          `Job ${job.id} delayed until ${error.retryAt.toISOString()}`
        );

        throw new DelayedError();
      }

      throw error;
    }
  },
  {
    connection: redis,
    concurrency: Number(
      process.env.WORKER_CONCURRENCY || 5
    ),
  }
);

emailWorker.on("completed", (job) => {
  console.log(
    `Job ${job.id} completed`
  );
});

emailWorker.on("failed", (job, error) => {
  console.error(
    `Job ${job?.id} failed`
  );

  console.error(error);
});