import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { STATE_COOKIE, createOAuthState, oauthConfig } from "@/lib/oauth";

// GET /api/auth/oauth/google|github → redirect to the provider's consent screen
export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const config = oauthConfig(provider, new URL(request.url).origin);

  if (!config) {
    // Credentials not configured yet — send back with a clear flag
    return NextResponse.redirect(new URL("/login?oauth=setup", request.url));
  }

  const state = createOAuthState();
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
