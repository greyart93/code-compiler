"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth-shell";
import { PasswordEyeToggle } from "@/components/password-eye-toggle";

function ResetPasswordForm() {
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? "Failed to reset password");
        return;
      }
      router.push("/login");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <div className="grid gap-4">
        <span className="grid size-12 place-items-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <KeyRound className="size-5" />
        </span>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          This reset link is missing its token. Request a fresh link and try again — links are
          single-use and expire.
        </p>
        <Button variant="outline" asChild className="w-full">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="password">New password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            className="pr-10"
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground active:scale-75"
            aria-label={showPassword ? "Hide new password" : "Show new password"}
            aria-pressed={!showPassword}
            onClick={() => setShowPassword((v) => !v)}
          >
            <PasswordEyeToggle hidden={!showPassword} />
          </button>
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="confirm">Confirm new password</Label>
        <div className="relative">
          <Input
            id="confirm"
            type={showConfirm ? "text" : "password"}
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat it"
            autoComplete="new-password"
            className="pr-10"
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground active:scale-75"
            aria-label={showConfirm ? "Hide confirmation" : "Show confirmation"}
            aria-pressed={!showConfirm}
            onClick={() => setShowConfirm((v) => !v)}
          >
            <PasswordEyeToggle hidden={!showConfirm} />
          </button>
        </div>
      </div>

      {password && confirm && password !== confirm && (
        <p className="text-[11.5px] text-destructive">Passwords don&apos;t match yet.</p>
      )}

      {error && (
        <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-[12.5px] leading-relaxed text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" disabled={busy} className="w-full">
        {busy && <Loader2 className="size-4 animate-spin" />} Reset password
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell
      eyebrow="Password reset"
      title="Set a new password."
      description="Choose something strong and unique. You will be signed in with it from now on."
    >
      <Suspense fallback={<div className="h-[220px] animate-pulse rounded-xl bg-muted/40" />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
