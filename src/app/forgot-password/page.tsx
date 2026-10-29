"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth-shell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? "Something went wrong");
        return;
      }
      setSent(true);
      // No mail sender configured yet — the API returns the link directly
      if (d.resetUrl) setDevLink(d.resetUrl);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      eyebrow={sent ? "Password reset · link created" : "Password reset"}
      title={sent ? "Check your inbox." : "Forgot your password?"}
      description={
        sent
          ? "If an account exists for that email, a reset link has been created. Follow it to choose a new password."
          : "Enter the email on your account and we will create a single-use link to set a new password."
      }
      footer={
        <p className="text-[12.5px] text-muted-foreground">
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      }
    >
      {!sent ? (
        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-[12.5px] leading-relaxed text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" disabled={busy} className="w-full">
            {busy && <Loader2 className="size-4 animate-spin" />} Send reset link
          </Button>
        </form>
      ) : (
        <div className="grid gap-4">
          <span className="grid size-12 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <MailCheck className="size-5" />
          </span>

          <p className="text-[13px] leading-relaxed text-muted-foreground">
            We checked <span className="font-medium text-foreground">{email}</span>. If it belongs to
            an account, a reset link was created.
          </p>

          {devLink && (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3.5">
              <p className="mono-label !text-[9px]">Development mode</p>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
                Email delivery is not configured, so use the link directly:
              </p>
              <Link
                href={devLink}
                className="mt-2 flex items-center gap-1 break-all font-mono text-[11.5px] font-medium text-primary hover:underline"
              >
                {devLink}
                <ArrowUpRight className="size-3 shrink-0" />
              </Link>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/login">
                <Check className="size-4" /> Back to sign in
              </Link>
            </Button>
            <button
              type="button"
              onClick={() => {
                setSent(false);
                setDevLink(null);
              }}
              className="text-[12px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Use a different email
            </button>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
