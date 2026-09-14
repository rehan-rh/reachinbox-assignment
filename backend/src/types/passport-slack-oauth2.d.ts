declare module "passport-slack-oauth2" {
  import { Strategy } from "passport-strategy";

  export interface SlackStrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string[];
  }

  export class Strategy extends Strategy {
    constructor(
      options: SlackStrategyOptions,
      verify: (
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: (error: any, user?: any) => void
      ) => void
    );

    authenticate(req: any, options?: any): void;
  }
}