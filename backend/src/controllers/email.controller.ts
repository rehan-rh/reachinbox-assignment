import { Request, Response } from "express";
import { prisma } from "../config/database";
import { scheduleEmails } from "../services/scheduler.service";

export async function scheduleEmailsController(
  req: Request,
  res: Response
) {
  try {
    const user = req.user as { id: string };

    const {
      senderId,
      recipients,
      subject,
      body,
      startTime,
      delayMs,
      hourlyLimit,
    } = req.body;

    // Check authentication
    if (!user?.id) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    // Check required fields
    if (
      !senderId ||
      !recipients ||
      !Array.isArray(recipients) ||
      recipients.length === 0 ||
      !subject ||
      !body ||
      !startTime ||
      delayMs === undefined ||
      hourlyLimit === undefined
    ) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    // Make sure the sender belongs to the logged-in user
    const sender = await prisma.sender.findFirst({
      where: {
        id: senderId,
        userId: user.id,
      },
    });

    if (!sender) {
      return res.status(403).json({
        message: "Sender does not belong to this user",
      });
    }

    // Validate start time
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

    // Validate delay
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

    // Validate hourly limit
    const parsedHourlyLimit = Number(hourlyLimit);

    if (
      !Number.isInteger(parsedHourlyLimit) ||
      parsedHourlyLimit < 1 ||
      parsedHourlyLimit > 10000
    ) {
      return res.status(400).json({
        message:
          "hourlyLimit must be an integer between 1 and 10000",
      });
    }

    // Schedule the campaign
    const emails = await scheduleEmails({
      userId: user.id,
      senderId,
      recipients,
      subject,
      body,
      startTime: scheduleDate,
      delayMs,
      hourlyLimit: parsedHourlyLimit,
    });

    return res.status(201).json({
      message: `${emails.length} emails scheduled successfully`,
      count: emails.length,
      emails,
      hourlyLimit: parsedHourlyLimit,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to schedule emails",
    });
  }
}