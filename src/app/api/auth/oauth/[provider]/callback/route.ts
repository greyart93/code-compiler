import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { oauthConfig } from "../route";

const STATE_COOKIE = "codevit_oauth_state";

type ProviderUser = {
  email: string;
  name: string | null;
  username: string;
};

type OAuthConfig = NonNullable<ReturnType<typeof oauthConfig>>;

async function exchangeGithub(config: OAuthConfig, code: string): Promise<ProviderUser | null> {
  const tokenRes = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) return null;

  const headers = {
    Authorization: `Bearer ${tokenData.access_token}`,
    Accept: "application/vnd.github+json",
  };
  const userRes = await fetch("https://api.github.com/user", { headers });
  const gh = await userRes.json();

  let email: string = gh.email ?? "";
  if (!email) {
    const emailsRes = await fetch("https://api.github.com/user/emails", { headers });
    if (emailsRes.ok) {
      const emails = await emailsRes.json();
      email = emails.find((e: { primary: boolean; verified: boolean }) => e.primary && e.verified)?.email ?? "";
    }
  }
  if (!email) return null;

  return {
    email: String(email).toLowerCase(),
    name: gh.name ?? gh.login,
    username: gh.login,
  };
}

async function exchangeGoogle(config: OAuthConfig, code: string): Promise<ProviderUser | null> {
  const tokenRes = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: config.redirectUri,
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) return null;

  const userRes = await fetch(config.userUrl, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const g = await userRes.json();
  if (!g.email) return null;

  return {
    email: String(g.email).toLowerCase(),
    name: g.name ?? g.email.split("@")[0],
    username: g.email.split("@")[0].replace(/[^a-zA-Z0-9_-]/g, "_"),
  };
}

// GET /api/auth/oauth/google|github/callback?code&state
export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const config = oauthConfig(provider);
  if (!config) {
    return NextResponse.redirect(new URL("/login?oauth=setup", request.url));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const cookieStore = await cookies();
  const savedState = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);

  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(new URL("/login?oauth=state", request.url));
  }

  try {
    const profile =
      provider === "github"
        ? await exchangeGithub(config, code)
        : await exchangeGoogle(config, code);
    if (!profile) {
      return NextResponse.redirect(new URL("/login?oauth=failed", request.url));
    }

    // Find by OAuth account id or by verified email
    let user = await prisma.user.findUnique({ where: { email: profile.email } });

    if (!user) {
      // Auto-create an account; guarantee a unique username
      let username = profile.username.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 20);
      if (username.length < 3) username = `${username}_user`;
      const base = username;
      let n = 1;
      while (await prisma.user.findUnique({ where: { username } })) {
        username = `${base}${n++}`.slice(0, 20);
      }
      user = await prisma.user.create({
        data: {
          email: profile.email,
          username,
          name: profile.name,
          password: null, // OAuth-only account
        },
      });
    }

    await createSession({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
    });

    return NextResponse.redirect(new URL(`/u/${user.username}`, request.url));
  } catch (error) {
    console.error("oauth callback error:", error);
    return NextResponse.redirect(new URL("/login?oauth=failed", request.url));
  }
}
