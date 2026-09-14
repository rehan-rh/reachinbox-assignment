import { Router } from "express";
import { slackInstaller } from "../config/slack-oauth";
import {
  disconnectSlack,
  saveSlackConnection,
} from "../services/slack.service";

const router = Router();

router.get("/slack", async (req, res) => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).send("Missing userId");
    }

    await slackInstaller.handleInstallPath(
      req,
      res,
      {},
      {
        scopes: ["chat:write", "channels:read"],
        metadata: JSON.stringify({
          userId,
        }),
        redirectUri: process.env.SLACK_CALLBACK_URL!,
      },
    );
  } catch (error) {
    console.error("Slack OAuth start error:", error);

    if (!res.headersSent) {
      res.status(500).send("Failed to start Slack OAuth.");
    }
  }
});

router.get("/slack/callback", async (req, res) => {
  try {
    await slackInstaller.handleCallback(req, res, {
      success: async (installation, installOptions, _req, slackRes) => {
        try {
          const metadata = installOptions.metadata
            ? JSON.parse(installOptions.metadata)
            : null;

          const userId = metadata?.userId;

          if (!userId) {
            slackRes.writeHead(400, {
              "Content-Type": "text/plain",
            });
            slackRes.end("Missing application user ID.");
            return;
          }

          const accessToken = installation.bot?.token;

          if (!accessToken) {
            slackRes.writeHead(400, {
              "Content-Type": "text/plain",
            });
            slackRes.end("Slack bot token was not returned.");
            return;
          }

          await saveSlackConnection(userId, accessToken);

          slackRes.writeHead(200, {
            "Content-Type": "text/html; charset=utf-8",
          });

          slackRes.end(`
            <html>
              <body>
                <h2>Slack connected successfully!</h2>
                <p>You can close this window.</p>
              </body>
            </html>
          `);
        } catch (error) {
          console.error("Slack connection save error:", error);

          slackRes.writeHead(500, {
            "Content-Type": "text/plain",
          });

          slackRes.end(
            "Slack authorization succeeded, but saving the connection failed.",
          );
        }
      },

      failure: (error, _installOptions, _req, slackRes) => {
        console.error("Slack OAuth callback error:", error);

        slackRes.writeHead(500, {
          "Content-Type": "text/html; charset=utf-8",
        });

        slackRes.end(`
          <html>
            <body>
              <h2>Slack connection failed.</h2>
              <p>Please try again.</p>
            </body>
          </html>
        `);
      },
    });
  } catch (error) {
    console.error("Slack OAuth error:", error);

    if (!res.headersSent) {
      res.status(500).send("Failed to complete Slack OAuth.");
    }
  }
});

router.get("/slack/failed", (_req, res) => {
  res.status(401).send("Slack authentication failed.");
});

router.delete("/slack/:userId", async (req, res) => {
  try {
    await disconnectSlack(req.params.userId);

    res.json({
      message: "Slack disconnected successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to disconnect Slack",
    });
  }
});

export default router;
