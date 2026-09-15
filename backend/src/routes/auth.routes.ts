import { Router } from "express";
import passport from "../config/passport";

import { slackInstaller } from "../config/slack-oauth";

import {
  disconnectSlack,
  getSlackConnection,
  saveSlackConnection,
} from "../services/slack.service";

const router = Router();

// ======================================================
// GOOGLE LOGIN
// ======================================================

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/auth/login-failed",
  }),
  (_req, res) => {
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  },
);

// ======================================================
// CURRENT USER
// ======================================================

router.get("/me", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      message: "Not authenticated",
    });
  }

  res.json({
    user: req.user,
  });
});

// ======================================================
// LOGOUT
// ======================================================

router.post("/logout", (req, res, next) => {
  req.logout((error) => {
    if (error) {
      return next(error);
    }

    req.session.destroy((sessionError) => {
      if (sessionError) {
        return next(sessionError);
      }

      res.json({
        message: "Logged out successfully",
      });
    });
  });
});

// ======================================================
// GOOGLE LOGIN FAILED
// ======================================================

router.get("/login-failed", (_req, res) => {
  res.status(401).send("Google authentication failed.");
});

// ======================================================
// SLACK OAUTH
// ======================================================

router.get("/slack", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Login with Google before connecting Slack.");
    }

    const user = req.user as {
      id: string;
    };

    const userId = user.id;

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
                <!DOCTYPE html>
                <html>
                  <head>
                    <title>Slack Connected</title>
                  </head>
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
              <!DOCTYPE html>
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

// ======================================================
// SLACK FAILED
// ======================================================

router.get("/slack/failed", (_req, res) => {
  res.status(401).send("Slack authentication failed.");
});

// ======================================================
// SLACK DISCONNECT
// ======================================================

// ======================================================
// SLACK STATUS
// ======================================================

router.get("/slack/status", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const user = req.user as { id: string };

    const connection = await getSlackConnection(user.id);

    return res.json({
      connected: Boolean(connection),
      connection,
    });
  } catch (error) {
    console.error("Failed to get Slack status:", error);

    return res.status(500).json({
      message: "Failed to get Slack status",
    });
  }
});

// ======================================================
// SLACK DISCONNECT
// ======================================================

router.delete("/slack", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const user = req.user as { id: string };

    await disconnectSlack(user.id);

    return res.json({
      message: "Slack disconnected successfully",
    });
  } catch (error) {
    console.error("Failed to disconnect Slack:", error);

    return res.status(500).json({
      message: "Failed to disconnect Slack",
    });
  }
});
export default router;
