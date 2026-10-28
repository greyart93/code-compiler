import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TourProvider } from "@/components/tour/tour-provider";
import { Toaster } from "@/components/ui/toaster";

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
// Landing-page display font (Bricolage Grotesque) and its code companion
// (JetBrains Mono) — latin subset shipped with the redesign.
const bricolage = localFont({
  src: "./fonts/BricolageGrotesqueVF.woff2",
  variable: "--font-bricolage",
  weight: "400 800",
  display: "swap",
});
const jetbrainsMono = localFont({
  src: "./fonts/JetBrainsMono.woff2",
  variable: "--font-jetbrains-mono",
  weight: "400 500",
  display: "swap",
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
        className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <TourProvider>{children}</TourProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
