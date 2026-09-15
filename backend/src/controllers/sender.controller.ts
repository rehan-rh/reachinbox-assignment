import { Request, Response } from "express";
import { prisma } from "../config/database";

export async function getSendersController(
  req: Request,
  res: Response
) {
  try {
    const user = req.user as { id: string };

    if (!user?.id) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const senders = await prisma.sender.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return res.json({
      senders,
    });
  } catch (error) {
    console.error("Failed to fetch senders:", error);

    return res.status(500).json({
      message: "Failed to fetch senders",
    });
  }
}