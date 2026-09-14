import dotenv from "dotenv";
import passport from "passport";
import { Strategy as SlackStrategy } from "passport-slack-oauth2";

dotenv.config();

const slackStrategy = new SlackStrategy(
  {
    clientID: process.env.SLACK_CLIENT_ID!,
    clientSecret: process.env.SLACK_CLIENT_SECRET!,
    callbackURL: process.env.SLACK_CALLBACK_URL!,
    scope: ["identity.basic", "chat:write", "channels:read"],
  },
  async (
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function
  ) => {
    try {
      return done(null, {
        accessToken,
        profile,
      });
    } catch (error) {
      return done(error);
    }
  }
);

// Explicitly register it as "slack"
passport.use("slack", slackStrategy);

export default passport;