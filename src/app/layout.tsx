import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

/* Portfolio typography: Inter for body text, Bricolage Grotesque for   display/headings, JetBrains Mono for code — all variable, latin subset. */
const inter = localFont({
  src: "./fonts/InterVariable.woff2",
  variable: "--font-sans",
  weight: "100 900",
  display: "swap",
});
const bricolage = localFont({
  src: "./fonts/BricolageGrotesqueVF.woff2",
  variable: "--font-heading",
  weight: "200 800",
  display: "swap",
});
const jetbrainsMono = localFont({
  src: "./fonts/JetBrainsMono.woff2",
  variable: "--font-mono",
  weight: "400 500",
  display: "swap",
});

/* Base loads kept for the landing page, which is deliberately left on the   original system so only the rest of the app moves to the portfolio set */
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: {
    default: "CodeVit — Online Compiler & Playground",
    template: "%s | CodeVit",
  },
  description:
    "Write, run and share code in JavaScript, Python, C++, Java, Go, Rust, TypeScript, PHP, Lua, Kotlin, C#, Dart, Swift, Ruby, Bash and Assembly — with structured courses, quizzes, blog, explore and Q&A discussions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${bricolage.variable} ${jetbrainsMono.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
