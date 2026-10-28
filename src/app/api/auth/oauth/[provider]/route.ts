import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";

const STATE_COOKIE = "codevit_oauth_state";

export function oauthConfig(provider: string) {
  const isGoogle = provider === "google";
  const isGithub = provider === "github";
  if (!isGoogle && !isGithub) return null;

  const clientId = isGoogle
    ? process.env.GOOGLE_CLIENT_ID
    : process.env.GITHUB_CLIENT_ID;
  const clientSecret = isGoogle
    ? process.env.GOOGLE_CLIENT_SECRET
    : process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  // Public origin of this app (set APP_URL in production; dev default localhost:3000)
  const origin = process.env.APP_URL ?? "http://localhost:3000";

  return isGoogle
    ? {
        provider,
        clientId,
        clientSecret,
        authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        userUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
        scope: "openid email profile",
        redirectUri: `${origin}/api/auth/oauth/google/callback`,
      }
    : {
        provider,
        clientId,
        clientSecret,
        authorizeUrl: "https://github.com/login/oauth/authorize",
        tokenUrl: "https://github.com/login/oauth/access_token",
        userUrl: "https://api.github.com/user",
        scope: "read:user user:email",
        redirectUri: `${origin}/api/auth/oauth/github/callback`,
      };
}

// GET /api/auth/oauth/google|github → redirect to the provider's consent screen
export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const config = oauthConfig(provider);

  if (!config) {
    // Credentials not configured yet — send back with a clear flag
    return NextResponse.redirect(
      new URL("/login?oauth=setup", request.url)
    );
  }

  const state = randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });

  const url = new URL(config.authorizeUrl);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", config.scope);
  url.searchParams.set("state", state);
  if (provider === "google") {
    url.searchParams.set("access_type", "online");
    url.searchParams.set("prompt", "select_account");
  }

  return NextResponse.redirect(url.toString());
}
