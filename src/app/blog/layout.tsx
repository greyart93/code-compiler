import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const title = "Free programming tutorials & deep dives";
const description =
  "Practical tutorials, deep dives and hard-won lessons from people who build. Learn JavaScript, Python, React, C++ and more — free to read, no paywall.";
const canonical = new URL("/blog", SITE_URL).toString();
const socialImage = new URL("/og-blog.png", SITE_URL).toString();

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "programming tutorials",
    "learn to code",
    "JavaScript tutorials",
    "Python tutorials",
    "React tutorials",
    "software engineering blog",
    "coding blog",
    "CodeVit blog",
  ],
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    url: canonical,
    siteName: SITE_NAME,
    title: `${title} | ${SITE_NAME}`,
    description,
    images: [
      {
        url: socialImage,
        width: 1200,
        height: 630,
        alt: "CodeVit blog — Notes from the workshop",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} | ${SITE_NAME}`,
    description,
    images: [socialImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Blog",
  "@id": `${canonical}#blog`,
  name: `${SITE_NAME} Blog — Notes from the workshop`,
  description,
  url: canonical,
  inLanguage: "en",
  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL.origin,
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}
