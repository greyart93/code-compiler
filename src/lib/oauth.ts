import { randomBytes } from "crypto";

export const STATE_COOKIE = "codevit_oauth_state";

type OAuthProvider = "google" | "github";

export type OAuthConfig = {
  provider: OAuthProvider;
  clientId: string;
  clientSecret: string;
  authorizeUrl: string;
  tokenUrl: string;
  userUrl: string;
  scope: string;
  redirectUri: string;
};

export function isOAuthProvider(provider: string): provider is OAuthProvider {
  return provider === "google" || provider === "github";
}

/**
 * Builds the provider config. `origin` is the public origin of this app, used to
 * build the callback URL that must match the one registered with the provider.
 * Set APP_URL in production; in development it falls back to the request origin
 * so the dev server's port is honoured.
 */
export function oauthConfig(provider: string, origin: string): OAuthConfig | null {
  if (!isOAuthProvider(provider)) return null;

  const isGoogle = provider === "google";
  const clientId = isGoogle ? process.env.GOOGLE_CLIENT_ID : process.env.GITHUB_CLIENT_ID;
  const clientSecret = isGoogle
    ? process.env.GOOGLE_CLIENT_SECRET
    : process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  // In production use the configured public URL; in development stay on the
  // origin actually being browsed so the callback matches this dev server.
  const base =
    process.env.NODE_ENV === "production"
      ? (process.env.APP_URL ?? origin)
      : origin;
  const originBase = base.replace(/\/+$/, "");

  return isGoogle
    ? {
        provider,
        clientId,
        clientSecret,
        authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        userUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
        scope: "openid email profile",
        redirectUri: `${originBase}/api/auth/oauth/google/callback`,
      }
    : {
        provider,
        clientId,
        clientSecret,
        authorizeUrl: "https://github.com/login/oauth/authorize",
        tokenUrl: "https://github.com/login/oauth/access_token",
        userUrl: "https://api.github.com/user",
        scope: "read:user user:email",
        redirectUri: `${originBase}/api/auth/oauth/github/callback`,
      };
}

export function createOAuthState() {
  return randomBytes(16).toString("hex");
}
