import { WebClient } from "@slack/web-api";
import { prisma } from "../config/database";

export async function saveSlackConnection(
  userId: string,
  accessToken: string
) {
  // Make sure the ReachInbox user exists
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new Error(`ReachInbox user ${userId} not found`);
  }

  // Create Slack client using the OAuth bot token
  const slack = new WebClient(accessToken);

  // Verify token and get workspace information
  const authResult = await slack.auth.test();

  const teamId = authResult.team_id as string | undefined;

  if (!teamId) {
    throw new Error("Slack team ID not found");
  }

  // Get public channels
  const conversations = await slack.conversations.list({
    types: "public_channel",
    limit: 100,
  });

  const channels = conversations.channels ?? [];

  // Prefer #general, otherwise use a channel where the bot is a member
  const channel =
    channels.find((item) => item.name === "general") ??
    channels.find((item) => item.is_member === true);

  if (!channel?.id) {
    throw new Error(
      "No suitable Slack channel found. Add the Slack app to a public channel."
    );
  }

  // Save or update Slack connection
  const connection = await prisma.slackConnection.upsert({
    where: {
      userId,
    },

    update: {
      accessToken,
      teamId,
      channelId: channel.id,
    },

    create: {
      userId,
      accessToken,
      teamId,
      channelId: channel.id,
    },
  });

  console.log("Slack connection saved successfully.");
  console.log(`Slack team: ${teamId}`);
  console.log(`Slack channel: ${channel.name} (${channel.id})`);

  return connection;
}

export async function sendSlackRateLimitNotification(
  userId: string,
  senderEmail: string,
  limit: number
) {
  const connection = await prisma.slackConnection.findUnique({
    where: {
      userId,
    },
  });

  if (!connection) {
    console.log(
      `Slack not connected for user ${userId}. Skipping notification.`
    );
    return;
  }

  if (!connection.channelId) {
    console.log(
      `No Slack channel configured for user ${userId}. Skipping notification.`
    );
    return;
  }

  try {
    const slack = new WebClient(connection.accessToken);

    await slack.chat.postMessage({
      channel: connection.channelId,
      text: `Hourly email rate limit reached for ${senderEmail}. Limit: ${limit} emails/hour.`,
    });

    console.log("Slack rate-limit notification sent.");
  } catch (error) {
    console.error("Failed to send Slack notification:", error);
  }
}

export async function disconnectSlack(userId: string) {
  await prisma.slackConnection.deleteMany({
    where: {
      userId,
    },
  });

  console.log(`Slack disconnected for user ${userId}`);
}