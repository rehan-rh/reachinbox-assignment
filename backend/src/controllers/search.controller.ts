import { Request, Response } from "express";
import { searchEmails } from "../services/search.service";

export async function searchEmailsController(
  req: Request,
  res: Response
) {
  try {
    const q = String(req.query.q || "");
    const userId = String(req.query.userId || "");

    if (!q || !userId) {
      return res.status(400).json({
        message: "q and userId are required",
      });
    }

    const results = await searchEmails(
      userId,
      q
    );

    return res.json({
      results,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Search failed",
    });
  }
}