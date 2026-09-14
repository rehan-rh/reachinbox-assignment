import { Request, Response } from "express";
import { searchEmails } from "../services/search.service";

export async function searchEmailsController(
  req: Request,
  res: Response
) {
  try {
    const user = req.user as {
      id: string;
    };

    const q = String(req.query.q || "");

    if (!q) {
      return res.status(400).json({
        message: "q is required",
      });
    }

    const results = await searchEmails(
      user.id,
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