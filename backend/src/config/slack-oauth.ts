import dotenv from "dotenv";
import { InstallProvider } from "@slack/oauth";

dotenv.config();

export const slackInstaller = new InstallProvider({
  clientId: process.env.SLACK_CLIENT_ID!,
  clientSecret: process.env.SLACK_CLIENT_SECRET!,
  stateSecret: process.env.SLACK_STATE_SECRET!,

  legacyStateVerification: true,

  // 30 minutes for local development
  stateCookieExpirationSeconds: 1800,
});