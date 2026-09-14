import { Request, Response } from "express";
import { scheduleEmails } from "../services/scheduler.service";

export async function scheduleEmailsController(
  req: Request,
  res: Response
) {
  try {
    const {
      userId,
      senderId,
      recipients,
      subject,
      body,
      startTime,
      delayMs,
    } = req.body;

    if (
      !userId ||
      !senderId ||
      !recipients ||
      !Array.isArray(recipients) ||
      recipients.length === 0 ||
      !subject ||
      !body ||
      !startTime ||
      delayMs === undefined
    ) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const scheduleDate = new Date(startTime);

    if (isNaN(scheduleDate.getTime())) {
      return res.status(400).json({
        message: "Invalid startTime",
      });
    }

    if (scheduleDate.getTime() < Date.now()) {
      return res.status(400).json({
        message: "startTime must be in the future",
      });
    }

    if (
      typeof delayMs !== "number" ||
      delayMs < Number(process.env.MIN_EMAIL_DELAY_MS || 2000)
    ) {
      return res.status(400).json({
        message: `delayMs must be at least ${
          process.env.MIN_EMAIL_DELAY_MS || 2000
        }ms`,
      });
    }

    const emails = await scheduleEmails({
      userId,
      senderId,
      recipients,
      subject,
      body,
      startTime: scheduleDate,
      delayMs,
    });

    return res.status(201).json({
      message: `${emails.length} emails scheduled successfully`,
      count: emails.length,
      emails,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to schedule emails",
    });
  }
}