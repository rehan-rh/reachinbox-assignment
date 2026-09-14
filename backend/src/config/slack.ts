import { WebClient } from "@slack/web-api";

export function createSlackClient(accessToken: string) {
  return new WebClient(accessToken);
}