import { Request, Response } from "express";
import { prisma } from "../config/database";

export async function getEmailsController(
  req: Request,
  res: Response
) {
  try {
    const status = req.query.status as
      | "SCHEDULED"
      | "SENT"
      | "FAILED"
      | undefined;

    const emails = await prisma.email.findMany({
      where: status
        ? {
            status,
          }
        : undefined,
      include: {
        sender: true,
      },
      orderBy: {
        scheduledAt: "asc",
      },
    });

    return res.json({
      emails,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch emails",
    });
  }
}