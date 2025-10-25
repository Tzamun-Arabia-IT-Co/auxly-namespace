declare module 'passport-microsoft' {
  import { Strategy as PassportStrategy } from 'passport';

  export interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    tenant?: string;
    scope?: string[];
  }

  export class Strategy extends PassportStrategy {
    constructor(
      options: StrategyOptions,
      verify: (
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: (error: any, user?: any) => void
      ) => void
    );
  }
}





