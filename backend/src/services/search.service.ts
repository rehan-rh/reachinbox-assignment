import { elasticsearch } from "../config/elasticsearch";

const INDEX_NAME = "emails";

export async function indexEmail(email: {
  id: string;
  userId: string;
  recipient: string;
  subject: string;
  body: string;
  status: string;
  scheduledAt: Date;
  sentAt: Date | null;
}) {
  await elasticsearch.index({
    index: INDEX_NAME,
    id: email.id,
    document: {
      id: email.id,
      userId: email.userId,
      recipient: email.recipient,
      subject: email.subject,
      body: email.body,
      status: email.status,
      scheduledAt: email.scheduledAt,
      sentAt: email.sentAt,
    },
  });
}

export async function searchEmails(
  userId: string,
  query: string
) {
  const result = await elasticsearch.search({
    index: INDEX_NAME,
    query: {
      bool: {
        must: [
          {
            multi_match: {
              query,
              fields: [
                "recipient",
                "subject",
                "body",
              ],
            },
          },
        ],
        filter: [
          {
            term: {
              userId,
            },
          },
        ],
      },
    },
  });

  return result.hits.hits;
}