"use client";

import { Eye, EyeOff } from "lucide-react";

/** Password visibility toggle — a clean eye that reads clearly at input size. */
export function PasswordEyeToggle({ hidden }: { hidden: boolean }) {
  return hidden ? <Eye className="size-4" /> : <EyeOff className="size-4" />;
}
