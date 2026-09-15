import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as SlackStrategy } from "passport-slack-oauth2";

import { prisma } from "./database";

// ======================================================
// DEMO SENDER
// ======================================================

const DEMO_SENDER_EMAIL =
  process.env.DEMO_SENDER_EMAIL!;

// ======================================================
// GOOGLE OAUTH
// ======================================================

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (
      accessToken,
      refreshToken,
      profile,
      done
    ) => {
      try {
        const googleId = profile.id;

        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(
            new Error("Google email not found")
          );
        }

        const name =
          profile.displayName ||
          profile.name?.givenName ||
          "User";

        const avatar =
          profile.photos?.[0]?.value || null;

        // Create or update the application user
        const user = await prisma.user.upsert({
          where: {
            googleId,
          },
          update: {
            name,
            email,
            avatar,
          },
          create: {
            googleId,
            name,
            email,
            avatar,
          },
        });

        // ======================================================
        // CREATE DEMO SENDER FOR THIS USER
        // ======================================================

        if (DEMO_SENDER_EMAIL) {
          const existingSender =
            await prisma.sender.findFirst({
              where: {
                userId: user.id,
              },
            });

          if (!existingSender) {
            await prisma.sender.create({
              data: {
                userId: user.id,
                email: DEMO_SENDER_EMAIL,
              },
            });

            console.log(
              `Demo sender created for user ${user.email}: ${DEMO_SENDER_EMAIL}`
            );
          }
        }

        return done(null, user);
      } catch (error) {
        console.error(
          "Google authentication error:",
          error
        );

        return done(error);
      }
    }
  )
);

// ======================================================
// SLACK OAUTH
// ======================================================

passport.use(
  new SlackStrategy(
    {
      clientID: process.env.SLACK_CLIENT_ID!,
      clientSecret: process.env.SLACK_CLIENT_SECRET!,
      callbackURL: process.env.SLACK_CALLBACK_URL!,
      scope: [
        "chat:write",
        "channels:read",
      ],
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
  )
);

// ======================================================
// SESSION SERIALIZATION
// ======================================================

passport.serializeUser(
  (user: any, done) => {
    done(null, user.id);
  }
);

passport.deserializeUser(
  async (id: string, done) => {
    try {
      const user =
        await prisma.user.findUnique({
          where: {
            id,
          },
        });

      if (!user) {
        return done(null, false);
      }

      done(null, user);
    } catch (error) {
      done(error);
    }
  }
);

export default passport;