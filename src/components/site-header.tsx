"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Code2, User as UserIcon, LogOut } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { SaveButton } from "@/components/save-button";

type Me = { id: string; username: string; email: string; name: string | null };

export function SiteHeader({ canSave = false }: { canSave?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        setMe(d.user);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe(null);
    router.refresh();
  };

  // 👇 Logged out → only public pages. Logged in → the full app.
  const publicNav = [
    { href: "/playground", label: "Playground" },
    { href: "/learn", label: "Learn" },
  ];
  const authedNav = [
    { href: "/playground", label: "Playground" },
    { href: "/explore", label: "Explore" },
    { href: "/learn", label: "Learn" },
    { href: "/blog", label: "Blog" },
    { href: "/discuss", label: "Discuss" },
    { href: "/quiz", label: "Quiz" },
    { href: "/dashboard", label: "Dashboard" },
  ];
  const navItems = me ? authedNav : publicNav;

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur"
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Code2 className="size-5 text-primary" />
          CodeVit
        </Link>

        <nav className="flex flex-nowrap items-center gap-0.5 overflow-x-auto sm:gap-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative shrink-0 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors sm:px-3 ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-md bg-accent"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {canSave && <SaveButton />}

          {!loaded ? null : me ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/u/${me.username}`}>
                  <UserIcon className="size-4" />
                  {me.username}
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                aria-label="Log out"
                title="Log out"
              >
                <LogOut className="size-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Sign up</Link>
              </Button>
            </>
          )}
          <ModeToggle />
        </div>
      </div>
    </motion.header>
  );
}
