"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Code2, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/site-header";

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
    <div className="min-h-screen">
      <SiteHeader />
      <main className="flex items-center justify-center p-4 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <Card>
            <CardHeader className="items-center text-center">
              {sent ? (
                <MailCheck className="mb-1 size-8 text-green-500" />
              ) : (
                <Code2 className="mb-1 size-8 text-primary" />
              )}
              <CardTitle className="text-xl">
                {sent ? "Check your email" : "Forgot your password?"}
              </CardTitle>
              <CardDescription>
                {sent
                  ? "If an account exists for that email, a reset link was created."
                  : "Enter your email and we'll create a reset link."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!sent ? (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" disabled={busy}>
                    {busy && <Loader2 className="size-4 animate-spin" />} Send reset link
                  </Button>
                </form>
              ) : (
                <div className="flex flex-col gap-4">
                  {devLink && (
                    <div className="rounded-lg border border-dashed p-3 text-sm">
                      <p className="mb-2 text-xs text-muted-foreground">
                        Email delivery isn't configured yet — use your link directly:
                      </p>
                      <Link
                        href={devLink}
                        className="break-all font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {devLink}
                      </Link>
                    </div>
                  )}
                  <Button variant="outline" asChild>
                    <Link href="/login">Back to sign in</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
