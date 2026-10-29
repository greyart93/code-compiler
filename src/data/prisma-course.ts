import type { LessonSeed, SectionSeed } from "./course-types";

/**
 * Prisma 7 course content.
 *
 * The app itself is pinned to prisma@7.10.0, so this track teaches the v7
 * workflow rather than the legacy v6 `@prisma/client` / node_modules model.
 * Prisma 8 is still a release candidate; mixing v7 CLI commands with v8
 * packages is the fastest way to get confusing configuration errors.
 *
 * Authoring note: `md` lets the lesson source use @@ as a code-fence marker,
 * ~~inline code~~ for backticks, and @D@ for a literal dollar sign before
 * `{` (GitHub Actions / tagged templates). This keeps the long lessons
 * readable without a forest of backslash escapes.
 */
const md = (raw: string) =>
  raw
    // Only whole-line markers are fences. Prisma's @@id/@@index attributes
    // inside a code block must survive untouched.
    .replace(/^@@([a-z0-9+#.-]*)[ \t]*$/gm, (_, lang: string) => "```" + lang)
    .replace(/~~([^~\n]+)~~/g, "`$1`")
    .replace(/@BT@/g, "`")
    .replace(/@D@/g, "$");

export const PRISMA_FOUNDATIONS: SectionSeed = {
  id: "prisma-foundations",
  title: "Prisma 7 Foundations",
  lessons: [
    {
      id: "prisma-version",
      title: "Prisma 7.10 — what changed",
      minutes: 7,
      md: md(String.raw`# Prisma 7.10

Prisma is three things working together:

1. **A schema** (~~schema.prisma~~) that describes your models and datasource.
2. **A generated client** that gives you typed queries in TypeScript.
3. **Migrations** that turn schema changes into reviewable SQL.

Prisma 7 changed the plumbing around all three. The mental model is the same,
but the setup is not the Prisma 6 setup you will find in older blog posts.

## The v7 changes that matter

| Area | Prisma 6 | Prisma 7.10 |
|---|---|---|
| Client engine | Rust query engine binary | Rust-free client by default |
| Database driver | Built-in engine | **Driver adapter required** |
| Generator | ~~prisma-client-js~~ | ~~prisma-client~~ (ESM-first) |
| Generated output | Magic ~~node_modules/.prisma~~ | Explicit ~~output~~ directory |
| Config | Mostly implicit | ~~prisma7.config.ts~~ (or ~~prisma.config.ts~~) |
| Env loading | CLI loaded ~~.env~~ | You load it explicitly with ~~dotenv~~ |
| Import | ~~@prisma/client~~ | Generated path, e.g. ~~../generated/prisma/client~~ |

> **Version check:** this course pins ~~prisma@7.10.0~~ and
> ~~@prisma/client@7.10.0~~ because that is what CodeVit uses. Prisma's docs
> currently use ~~prisma@prev~~ for v8 release-candidate examples. Do not copy
> a ~~@prev~~ command into a v7 project.

## Check what you actually have

@@bash
npm ls prisma @prisma/client @prisma/adapter-pg
npx prisma --version
@@

A clean v7 project prints a 7.10.x CLI and client. If the CLI is 8.x and the
client is 7.x, stop and fix the versions before writing a schema.

## What stays the same

- Models, fields, attributes, and relations are still schema-first.
- ~~prisma migrate dev~~ still generates SQL in ~~prisma/migrations~~.
- ~~findMany~~, ~~include~~, ~~select~~, ~~$transaction~~, and ~~$queryRaw~~ still exist.
- The database still does the real work; Prisma is the typed client and
  migration tool, not a replacement for understanding SQL.

The next lesson wires up a real v7 project from an empty folder.`),
      exercises: [
        {
          type: "fill-blank",
          prompt: "Which generator does Prisma 7 use by default?",
          template:
            'generator client {\n  provider = "___"\n  output   = "../src/generated/prisma"\n}',
          blanks: [
            {
              options: ["prisma-client", "prisma-client-js", "prisma-client-ts"],
              answer: "prisma-client",
            },
          ],
          explanation:
            "`prisma-client` outputs plain TypeScript into the `output` directory. `prisma-client-js` is the deprecated node_modules generator.",
        },
        {
          type: "quiz",
          prompt: "In Prisma 7, what must you pass to `new PrismaClient()`?",
          answers: ["adapter", "a driver adapter", "driver adapter", "an adapter"],
          snippet: "const adapter = new PrismaPg({ connectionString });\nconst prisma = new PrismaClient({ adapter });",
          placeholder: "one word",
          hint: "The Rust engine is gone; the client needs a database driver.",
          explanation:
            "Prisma 7 uses driver adapters such as `@prisma/adapter-pg`. Without one, the client throws an error about the `client` engine type.",
        },
      ],
    },
    {
      id: "prisma-setup",
      title: "Install & configure Prisma 7.10",
      minutes: 10,
      md: md(String.raw`# Install Prisma 7.10

This is the full setup for a fresh TypeScript project. Run the commands in
order and do not skip the version pins.

## 1. Create the project

@@bash
mkdir prisma-7-demo
cd prisma-7-demo
npm init -y
npm install -D prisma@7.10.0 @types/node dotenv typescript tsx
npm install @prisma/client@7.10.0 @prisma/adapter-pg
@@

- ~~prisma~~ is the CLI.
- ~~@prisma/client~~ is the v7 client runtime.
- ~~@prisma/adapter-pg~~ connects the client to PostgreSQL through ~~pg~~.
- ~~dotenv~~ loads ~~.env~~ for the CLI and scripts.
- ~~tsx~~ runs TypeScript scripts without a build step.

## 2. Make the project ESM-ready

Prisma 7's ~~prisma-client~~ generator is ESM-first. Add this to
~~package.json~~:

@@json
{
  "type": "module"
}
@@

And use a modern ~~tsconfig.json~~:

@@json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
@@

## 3. Initialize Prisma

@@bash
npx prisma init --datasource-provider postgresql --output ../src/generated/prisma
@@

This creates:

@@text
prisma/
  schema.prisma
src/
  generated/
    prisma/          ← generated client (created by prisma generate)
prisma7.config.ts
.env
@@

Prisma 7.10 names the config file ~~prisma7.config.ts~~ so it cannot collide
with Prisma 8's ~~prisma.config.ts~~. The v7 CLI discovers either name.

## 4. Check the config

@@ts
// prisma7.config.ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
@@

~~import "dotenv/config"~~ is not optional: v7 no longer loads ~~.env~~ for
you. If you only run ~~prisma generate~~ in CI and the database URL is not
available, use ~~process.env.DATABASE_URL ?? ""~~ instead of ~~env()~~,
because ~~env()~~ throws when the variable is missing.

## 5. Point at a database

@@bash
# .env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/prisma7?schema=public"
@@

Use a real local PostgreSQL database, a Docker container, or Prisma Postgres.
The URL must be a direct connection string; the CLI needs it for migrations.

## 6. Verify before writing models

@@bash
npx prisma validate
npx prisma --version
@@

If ~~validate~~ succeeds, the config and schema paths are wired correctly. If
it fails, fix the path or the environment variable now — not after writing
twelve models.`),
      exercises: [
        {
          type: "fill-blank",
          prompt: "What is the Prisma 7.10 config file called?",
          template: "___\n\nimport \"dotenv/config\";\nimport { defineConfig } from \"prisma/config\";",
          blanks: [
            {
              options: ["prisma7.config.ts", "prisma.config.js", "schema.config.ts"],
              answer: "prisma7.config.ts",
            },
          ],
          explanation:
            "Prisma 7.10 generates `prisma7.config.ts`. The CLI also accepts `prisma.config.ts`, which is the Prisma 8 name.",
        },
        {
          type: "quiz",
          prompt: "Why does the config import `dotenv/config`?",
          answers: [
            "prisma 7 does not load .env automatically",
            "to load .env",
            "environment variables",
            "prisma 7 no longer loads .env",
          ],
          placeholder: "what does it do?",
          hint: "This changed from Prisma 6.",
          explanation:
            "Prisma 7 stopped loading `.env` implicitly. The config file must load it (or the environment must provide the variable some other way).",
        },
      ],
    },
    {
      id: "prisma-schema-migrate",
      title: "Schema, first migration & Studio",
      minutes: 10,
      md: md(String.raw`# Schema → migration → data

## 1. Write the schema

Replace the generated models in ~~prisma/schema.prisma~~ with:

@@prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  posts     Post[]
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  body      String?
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId  Int

  @@index([authorId, createdAt])
}
@@

Read the schema as a contract:

- ~~@id~~ marks the primary key.
- ~~@default(autoincrement())~~ lets PostgreSQL allocate ids.
- ~~@unique~~ creates a unique index.
- ~~String?~~ is nullable.
- ~~@relation~~ declares the foreign key and its delete behavior.
- ~~@@index~~ adds a database index for the queries you expect.

## 2. Format and validate

@@bash
npx prisma format
npx prisma validate
@@

Formatting is not cosmetic: a schema that will not format usually has a typo
that will fail in a less helpful way later.

## 3. Create the first migration

@@bash
npx prisma migrate dev --name init
@@

This does three things:

1. Diffs the schema against the database.
2. Writes a timestamped SQL file under ~~prisma/migrations/~~.
3. Applies the SQL to your development database.

Then generate the client explicitly:

@@bash
npx prisma generate
@@

Do not rely on a side effect to regenerate the client. After a schema change,
run ~~generate~~ and let TypeScript tell you what moved.

## 4. Read the migration SQL

@@bash
ls prisma/migrations
cat prisma/migrations/*/migration.sql
@@

You should see ~~CREATE TABLE~~, ~~CREATE UNIQUE INDEX~~, and the foreign key.
Commit this folder. It is the history of your database, and production will
replay it with ~~prisma migrate deploy~~.

## 5. Inspect the data

@@bash
npx prisma studio
@@

Studio opens a browser UI for your tables. It is a development tool, not a
production admin panel.

## 6. Seed a little data

Create ~~prisma/seed.ts~~:

@@ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

await prisma.user.upsert({
  where: { email: "ada@example.com" },
  update: {},
  create: {
    email: "ada@example.com",
    name: "Ada",
    posts: { create: [{ title: "Hello Prisma", published: true }] },
  },
});

await prisma.$disconnect();
@@

Register the seed command in ~~prisma7.config.ts~~:

@@ts
migrations: {
  path: "prisma/migrations",
  seed: "tsx prisma/seed.ts",
},
@@

Then run:

@@bash
npx prisma db seed
@@

> **Never** run ~~migrate reset~~ against a database whose data you care about.
> It drops and recreates the schema.`),
      exercises: [
        {
          type: "fill-blank",
          prompt: "Complete the auto-incrementing primary key.",
          template: "model User {\n  id    Int    @id @default(___) \n  email String @unique\n}",
          blanks: [
            {
              options: ["autoincrement()", "uuid()", "now()"],
              answer: "autoincrement()",
            },
          ],
          explanation:
            "`@default(autoincrement())` maps to a database-generated integer sequence. Use `uuid()` when you need globally unique ids.",
        },
        {
          type: "quiz",
          prompt: "Which command applies committed migrations in production?",
          answers: ["prisma migrate deploy", "migrate deploy", "npx prisma migrate deploy"],
          placeholder: "the command",
          hint: "It replays files; it does not write new ones.",
          explanation:
            "`prisma migrate deploy` applies existing migration files and never creates a new migration. `migrate dev` is for development only.",
        },
      ],
    },
    {
      id: "prisma-client",
      title: "Instantiate the client with a driver adapter",
      minutes: 9,
      md: md(String.raw`# The client

In Prisma 7 you do not import from ~~@prisma/client~~. You import the generated
client from the ~~output~~ path in your schema.

## 1. Create a shared client

@@ts
// src/lib/prisma.ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const adapter = new PrismaPg({ connectionString });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
@@

Why the global singleton? In development, Next.js hot reload can evaluate this
module repeatedly. Without a global, every save creates another client and
eventually exhausts the database connection pool. In production the module is
created once per process anyway.

## 2. Run your first query

@@ts
// script.ts
import "dotenv/config";
import { prisma } from "./src/lib/prisma";

const users = await prisma.user.findMany({
  include: { posts: true },
  orderBy: { createdAt: "desc" },
  take: 5,
});

console.log(users);
await prisma.$disconnect();
@@

@@bash
npx tsx script.ts
@@

## 3. Connect deliberately

The client connects lazily on the first query. You can connect eagerly when
you want startup to fail fast:

@@ts
await prisma.$connect();
@@

Always disconnect in short-lived scripts and tests:

@@ts
await prisma.$disconnect();
@@

In a long-running server, do not disconnect after every request. Keep one
client for the process and let the adapter's pool do its job.

## Common v7 errors

| Error | Cause | Fix |
|---|---|---|
| “Using engine type client requires either adapter or accelerateUrl” | No adapter passed | Pass ~~new PrismaPg({ connectionString })~~ |
| “Cannot find module …/client” | Client not generated | Run ~~npx prisma generate~~ |
| “Environment variable not found: DATABASE_URL” | ~~.env~~ not loaded | Import ~~dotenv/config~~ or set the variable |
| “Module not found: .js” with tsx | Extension mismatch | Set ~~importFileExtension = "ts"~~ in the generator |`),
      exercises: [
        {
          type: "quiz",
          prompt: "Which package provides the PostgreSQL driver adapter?",
          answers: ["@prisma/adapter-pg", "prisma-adapter-pg", "@prisma/pg"],
          placeholder: "package name",
          hint: "It starts with @prisma/adapter-.",
          explanation:
            "`@prisma/adapter-pg` wraps `pg` and lets the Rust-free Prisma 7 client talk to PostgreSQL.",
        },
        {
          type: "fill-blank",
          prompt: "Complete the client construction.",
          template:
            'const adapter = new PrismaPg({ connectionString });\nconst prisma = new PrismaClient({ ___ });',
          blanks: [{ options: ["adapter", "engine", "datasource"], answer: "adapter" }],
          explanation:
            "The Prisma 7 client takes an `adapter`; the old `datasources`/`engine` options are not the v7 setup.",
        },
      ],
    },
  ],
};

export const PRISMA_QUERYING: SectionSeed = {
  id: "prisma-querying",
  title: "Querying & Modeling",
  lessons: [
    {
      id: "prisma-crud",
      title: "CRUD, filters & pagination",
      minutes: 10,
      md: md(String.raw`# CRUD

All examples assume ~~prisma~~ is the client from the previous lesson.

## Create

@@ts
const user = await prisma.user.create({
  data: {
    email: "grace@example.com",
    name: "Grace",
    posts: {
      create: [{ title: "First post", published: true }],
    },
  },
  include: { posts: true },
});
@@

Bulk insert:

@@ts
await prisma.user.createMany({
  data: [
    { email: "a@example.com", name: "A" },
    { email: "b@example.com", name: "B" },
  ],
  skipDuplicates: true,
});
@@

## Read

@@ts
// Unique field → findUnique
const ada = await prisma.user.findUnique({
  where: { email: "ada@example.com" },
});

// First match, arbitrary order unless you order it
const newest = await prisma.post.findFirst({
  orderBy: { createdAt: "desc" },
});

// Many
const adults = await prisma.user.findMany({
  where: {
    age: { gte: 18 },
    name: { contains: "a", mode: "insensitive" },
    OR: [{ email: { endsWith: "@example.com" } }, { name: null }],
  },
  orderBy: [{ name: "asc" }, { id: "asc" }],
  take: 20,
  skip: 0,
});
@@

~~findUnique~~ only accepts unique fields (~~id~~, ~~email~~, a compound
~~@@unique~~). If you need a non-unique filter, use ~~findFirst~~.

## Update and upsert

@@ts
await prisma.user.update({
  where: { id: 1 },
  data: { name: "Grace Hopper" },
});

await prisma.user.upsert({
  where: { email: "x@example.com" },
  update: { name: "Updated" },
  create: { email: "x@example.com", name: "Created" },
});

await prisma.user.updateMany({
  where: { name: null },
  data: { name: "Anonymous" },
});
@@

## Delete

@@ts
await prisma.user.delete({ where: { id: 1 } }); // throws P2025 if missing
await prisma.user.deleteMany({ where: { email: { endsWith: "@old.test" } } });
@@

Prefer ~~deleteMany~~ when “the row may or may not exist” is a normal outcome.

## Pagination

Offset pagination is easy:

@@ts
const page = 2;
const perPage = 20;
const rows = await prisma.post.findMany({
  orderBy: { id: "asc" },
  skip: (page - 1) * perPage,
  take: perPage,
});
@@

Cursor pagination stays stable when rows are inserted:

@@ts
const rows = await prisma.post.findMany({
  orderBy: { id: "asc" },
  take: 20,
  ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
});
@@

Always pair ~~take~~ with ~~orderBy~~; without an order, “page 2” is not
well-defined.`),
      exercises: [
        {
          type: "quiz",
          prompt: "Which method must you use when filtering by a non-unique field?",
          answers: ["findFirst", "findUnique", "findOne"],
          placeholder: "method name",
          hint: "`findUnique` requires a unique selector.",
          explanation:
            "`findUnique` only accepts unique fields. Use `findFirst` (optionally with `orderBy`) for arbitrary filters.",
        },
        {
          type: "fill-blank",
          prompt: "Limit the query to 20 rows.",
          template: "const rows = await prisma.post.findMany({\n  orderBy: { id: \"asc\" },\n  ___: 20,\n});",
          blanks: [{ options: ["take", "limit", "first"], answer: "take" }],
          explanation:
            "Prisma uses `take` for a row limit and `skip` for an offset. SQL's `LIMIT` is not the Prisma Client API.",
        },
      ],
    },
    {
      id: "prisma-relations",
      title: "Relations, include & select",
      minutes: 10,
      md: md(String.raw`# Relations

Prisma relations are declared on both sides. The foreign key lives on the
“many” side.

## One-to-many

@@prisma
model User {
  id    Int    @id @default(autoincrement())
  email String @unique
  posts Post[]
}

model Post {
  id       Int  @id @default(autoincrement())
  title    String
  author   User @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId Int
}
@@

## One-to-one

Add ~~@unique~~ to the foreign key:

@@prisma
model User {
  id      Int      @id @default(autoincrement())
  profile Profile?
}

model Profile {
  id     Int    @id @default(autoincrement())
  bio    String?
  user   User   @relation(fields: [userId], references: [id])
  userId Int    @unique
}
@@

## Many-to-many

Implicit (Prisma creates the join table):

@@prisma
model Post {
  id   Int   @id @default(autoincrement())
  tags Tag[]
}

model Tag {
  id    Int    @id @default(autoincrement())
  name  String @unique
  posts Post[]
}
@@

Use an explicit join model when the relationship itself has data:

@@prisma
model PostTag {
  post   Post @relation(fields: [postId], references: [id])
  postId Int
  tag    Tag  @relation(fields: [tagId], references: [id])
  tagId  Int
  addedAt DateTime @default(now())

  @@id([postId, tagId])
}
@@

## Loading relations

~~include~~ returns the full related model:

@@ts
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    posts: {
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    },
    _count: { select: { posts: true } },
  },
});
@@

~~select~~ returns only the fields you ask for:

@@ts
const tiny = await prisma.user.findUnique({
  where: { id: 1 },
  select: {
    email: true,
    posts: { select: { title: true } },
  },
});
@@

You cannot mix ~~select~~ and ~~include~~ at the same level. Pick one.

## Connecting relations

@@ts
await prisma.post.create({
  data: {
    title: "Typed relations",
    author: { connect: { email: "ada@example.com" } },
    tags: {
      connectOrCreate: [
        { where: { name: "prisma" }, create: { name: "prisma" } },
        { where: { name: "typescript" }, create: { name: "typescript" } },
      ],
    },
  },
});
@@

Use ~~connect~~ when the parent must exist, and ~~connectOrCreate~~ when the
parent may be new. The latter is still a write, so validate the input first.`),
      exercises: [
        {
          type: "fill-blank",
          prompt: "Complete the relation's foreign-key declaration.",
          template:
            "author User @relation(fields: [___], references: [id])\nauthorId Int",
          blanks: [{ options: ["authorId", "id", "User"], answer: "authorId" }],
          explanation:
            "The `fields` list names the scalar foreign-key column on this model; `references` names the parent's unique column.",
        },
        {
          type: "quiz",
          prompt: "Which key loads related models in the same query?",
          answers: ["include", "join", "populate"],
          placeholder: "the Prisma option",
          hint: "It is mutually exclusive with `select` at the same level.",
          explanation:
            "`include` loads full relations; `select` can also nest relations but returns only chosen fields. `populate` is Mongoose, not Prisma.",
        },
      ],
    },
    {
      id: "prisma-nested-transactions",
      title: "Nested writes & transactions",
      minutes: 10,
      md: md(String.raw`# Nested writes

A nested write is one client call that creates or updates related rows.

@@ts
const user = await prisma.user.create({
  data: {
    email: "ada@example.com",
    posts: {
      create: [
        { title: "First" },
        { title: "Second" },
      ],
    },
  },
  include: { posts: true },
});
@@

Other nested operations:

@@ts
await prisma.post.update({
  where: { id: 1 },
  data: {
    tags: {
      connect: [{ id: 7 }, { id: 8 }],
      create: [{ name: "new-tag" }],
    },
  },
});
@@

~~connect~~, ~~connectOrCreate~~, ~~create~~, ~~createMany~~, ~~update~~,
~~updateMany~~, ~~upsert~~, ~~delete~~, ~~deleteMany~~, ~~disconnect~~, and
~~set~~ all have nested forms. They run in a single database transaction when
the adapter supports it.

## Batch transaction

Use the array form for independent operations that must all succeed:

@@ts
const [user, audit] = await prisma.$transaction([
  prisma.user.create({ data: { email: "a@example.com" } }),
  prisma.audit.create({ data: { action: "user.created" } }),
]);
@@

## Interactive transaction

Use the callback form when step 2 depends on step 1:

@@ts
await prisma.$transaction(
  async (tx) => {
    const from = await tx.account.update({
      where: { id: 1 },
      data: { balance: { decrement: 100 } },
    });

    if (from.balance < 0) {
      throw new Error("insufficient funds"); // rolls everything back
    }

    await tx.account.update({
      where: { id: 2 },
      data: { balance: { increment: 100 } },
    });
  },
  {
    isolationLevel: "Serializable",
    timeout: 5_000,
  }
);
@@

Inside the callback, use ~~tx~~ — not the outer ~~prisma~~. Mixing clients
takes the operation outside the transaction.

## When not to use a transaction

- Do not wrap a slow third-party HTTP call in a database transaction.
- Do not hold a transaction open while waiting for a user.
- Do not use ~~Serializable~~ everywhere; it increases retries and lock waits.

Keep transactions short, and make them retry-safe when the isolation level can
produce serialization failures.`),
      exercises: [
        {
          type: "fill-blank",
          prompt: "Start an interactive transaction.",
          template: "await prisma.___(async (tx) => {\n  // ...\n});",
          blanks: [{ options: ["$transaction", "$batch", "$interactive"], answer: "$transaction" }],
          explanation:
            "`$transaction` accepts either an array of promises or a callback. The callback receives a `tx` client.",
        },
        {
          type: "quiz",
          prompt: "When must you use the callback form instead of the array form?",
          answers: [
            "when step 2 depends on step 1",
            "when one step depends on another",
            "when queries depend on each other",
            "when you need the result of the first query",
          ],
          placeholder: "describe the dependency",
          hint: "The array form executes independent promises together.",
          explanation:
            "The callback form gives you a `tx` client so later queries can use values returned by earlier ones. The array form is for independent operations.",
        },
      ],
    },
    {
      id: "prisma-aggregate-raw",
      title: "Aggregates, groupBy & raw SQL",
      minutes: 9,
      md: md(String.raw`# Aggregates

@@ts
const totals = await prisma.order.aggregate({
  _count: true,
  _sum: { amount: true },
  _avg: { amount: true },
  where: { status: "paid" },
});
@@

## groupBy

@@ts
const byStatus = await prisma.order.groupBy({
  by: ["status"],
  _count: { _all: true },
  _sum: { amount: true },
  having: {
    amount: { _sum: { gt: 1_000 } },
  },
  orderBy: { _sum: { amount: "desc" } },
});
@@

~~groupBy~~ has a constraint: every selected scalar must either be in ~~by~~ or
be aggregated. This mirrors SQL's ~~GROUP BY~~ rules.

## Raw SQL

Use the tagged template when you need a query the client API cannot express:

@@ts
type Row = { id: number; email: string };

const rows = await prisma.$queryRaw<Row[]>@BT@
  SELECT id, email
  FROM "User"
  WHERE email = @D@{email}
@BT@;
@@

The tagged template parameterizes the value. This is the safe form.

For dynamically composed fragments, use ~~Prisma.sql~~:

@@ts
import { Prisma } from "../generated/prisma/client";

const where = Prisma.sql@BT@status = @D@{status}@BT@;
const rows = await prisma.$queryRaw@BT@
  SELECT * FROM "Order" WHERE @D@{where}
@BT@;
@@

## The unsafe escape hatch

~~$queryRawUnsafe~~ accepts a string. It does **not** parameterize for you:

@@ts
// Only for a trusted, fully controlled string. Never interpolate user input.
await prisma.$queryRawUnsafe('SELECT 1');
@@

If you need a dynamic column or table name, allow-list it:

@@ts
const sortable = new Set(["createdAt", "amount"]);
if (!sortable.has(sort)) throw new Error("invalid sort");
@@

## Writes with raw SQL

~~$executeRaw~~ is for INSERT/UPDATE/DELETE. It returns the affected row count.
Prefer the typed client for normal writes; reserve raw SQL for bulk operations,
database-specific features, or reporting queries.`),
      exercises: [
        {
          type: "quiz",
          prompt: "Which raw-query form parameterizes interpolated values?",
          answers: ["$queryRaw", "queryRaw", "the tagged template"],
          placeholder: "method name",
          hint: "It uses a tagged template literal, not a plain string.",
          explanation:
            "The tagged template form of `$queryRaw` parameterizes values. `$queryRawUnsafe` takes a string and is for trusted SQL only.",
        },
        {
          type: "fill-blank",
          prompt: "Aggregate without collapsing the result into one row.",
          template: "const rows = await prisma.order.___({\n  by: [\"status\"],\n  _sum: { amount: true },\n});",
          blanks: [{ options: ["groupBy", "aggregate", "findMany"], answer: "groupBy" }],
          explanation:
            "`groupBy` returns one row per group; `aggregate` returns a single summary object for the whole filtered set.",
        },
      ],
    },
  ],
};

export const PRISMA_PRODUCTION: SectionSeed = {
  id: "prisma-production",
  title: "Production & Practice",
  lessons: [
    {
      id: "prisma-migrations-team",
      title: "Migrations in a team & production",
      minutes: 10,
      md: md(String.raw`# Migrations are code

A migration is a SQL file committed with the application. Treat it like code:
review it, test it, and deploy it in order.

## The development loop

@@bash
# 1. edit prisma/schema.prisma
npx prisma format
npx prisma migrate dev --name add_order_status
npx prisma generate
@@

~~migrate dev~~ compares the schema to the development database, writes the
diff, applies it, and records it in ~~_prisma_migrations~~. It may prompt for a
reset if the database has drifted. Read the prompt; do not reflexively press
“yes”.

## Production

@@bash
npx prisma migrate deploy
npx prisma migrate status
@@

- ~~migrate deploy~~ applies committed migrations. It does not create new ones.
- ~~migrate status~~ tells you which migrations are pending or failed.
- Run migrations as a release step, before the new app version starts serving
  traffic.

Never run ~~migrate dev~~ or ~~migrate reset~~ in production.

## Prototyping vs migrating

~~prisma db push~~ syncs the schema without creating migration files:

@@bash
npx prisma db push
@@

It is fine for a throwaway prototype. It is not a deployment strategy because
there is no reviewable history.

## Drift

Drift means the database no longer matches the migration history. Common causes:

- Someone edited a table manually.
- A migration was applied out of order.
- A hotfix used ~~db push~~ against a shared database.

Inspect with ~~migrate status~~, then either restore the database or create a
new migration that reconciles it. Do not “fix” drift by deleting migration
files that have already been applied.

## Baselining an existing database

For a database that predates Prisma:

1. Introspect: ~~npx prisma db pull~~.
2. Create the initial migration directory manually.
3. Mark it as already applied: ~~npx prisma migrate resolve --applied <name>~~.
4. Future changes use normal ~~migrate dev~~.

## CI/CD shape

@@yaml
- run: npm ci
- run: npx prisma generate
- run: npx prisma migrate deploy
  env:
    DATABASE_URL: @D@{{ secrets.DATABASE_URL }}
- run: npm run build
@@

Generate at build time, migrate at release time, and fail the deployment if
either step fails.`),
      exercises: [
        {
          type: "quiz",
          prompt: "Which command applies migrations in production?",
          answers: ["migrate deploy", "prisma migrate deploy", "npx prisma migrate deploy"],
          placeholder: "command",
          hint: "It is not `migrate dev`.",
          explanation:
            "`prisma migrate deploy` replays committed migrations without generating new ones or resetting data.",
        },
        {
          type: "fill-blank",
          prompt: "Sync a throwaway prototype without writing migration files.",
          template: "npx prisma ___",
          blanks: [{ options: ["db push", "migrate dev", "migrate deploy"], answer: "db push" }],
          explanation:
            "`db push` is for prototypes. Production needs reviewable migration files applied with `migrate deploy`.",
        },
      ],
    },
    {
      id: "prisma-errors",
      title: "Errors, validation & graceful failures",
      minutes: 9,
      md: md(String.raw`# Handle the error you can name

Prisma throws typed errors. Import them from the generated client:

@@ts
import { Prisma } from "../generated/prisma/client";

try {
  await prisma.user.create({ data: { email } });
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      throw new ConflictError("That email is already registered");
    }
    if (error.code === "P2025") {
      throw new NotFoundError("User not found");
    }
  }
  throw error;
}
@@

## Codes you will actually see

| Code | Meaning | Typical response |
|---|---|---|
| P2002 | Unique constraint failed | 409 Conflict |
| P2025 | Required record not found | 404 Not Found |
| P2003 | Foreign-key constraint failed | 400 Bad Request |
| P2014 | Relation violation | 400 Bad Request |
| P2028 | Transaction API error | 500 / retry |
| P2034 | Write conflict / deadlock | retry the transaction |

Do not return the raw Prisma message to a user. It can contain table names,
column names, and fragments of values.

## Validation happens before Prisma

Prisma checks types, not business rules. Validate with Zod (or your schema
library) before the query:

@@ts
const input = createUserSchema.parse(body);
await prisma.user.create({ data: input });
@@

Database constraints are the last line of defense, not the first.

## Transaction retries

Serializable transactions and write conflicts are expected under load. Retry
the whole callback, not just the failed query:

@@ts
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      const retryable =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2034" || error.code === "P2028");
      if (!retryable || i === attempts - 1) throw error;
    }
  }
  throw new Error("unreachable");
}
@@

Keep retries bounded. An unbounded retry loop turns a database hiccup into an
outage.`),
      exercises: [
        {
          type: "quiz",
          prompt: "Which Prisma error code means a unique constraint was violated?",
          answers: ["p2002", "p2002 unique", "p2002 conflict"],
          placeholder: "e.g. P2002",
          hint: "It is the duplicate-value error.",
          explanation:
            "P2002 is the unique-constraint violation. Map it to HTTP 409 and show a friendly message.",
        },
        {
          type: "fill-blank",
          prompt: "Catch the typed Prisma error class.",
          template: "if (error instanceof Prisma.___) {\n  // inspect error.code\n}",
          blanks: [
            {
              options: [
                "PrismaClientKnownRequestError",
                "PrismaClientValidationError",
                "PrismaClientError",
              ],
              answer: "PrismaClientKnownRequestError",
            },
          ],
          explanation:
            "`PrismaClientKnownRequestError` carries the `code` field. Validation errors are a different class and usually mean the query shape is wrong.",
        },
      ],
    },
    {
      id: "prisma-performance",
      title: "Performance, logging & extensions",
      minutes: 10,
      md: md(String.raw`# Performance is mostly query shape

Prisma makes the easy query easy. It cannot guess that you only need two
columns, or that a relation is about to produce 200 queries.

## Select only what you render

@@ts
// Returns every column, including large text fields
const users = await prisma.user.findMany();

// Returns exactly what the page needs
const users = await prisma.user.findMany({
  select: { id: true, name: true, image: true },
});
@@

## Avoid N+1 queries

The classic mistake:

@@ts
const users = await prisma.user.findMany();
for (const user of users) {
  const posts = await prisma.post.findMany({ where: { authorId: user.id } });
}
@@

One query for users + one per user = N+1. Use a relation load or a batched
~~in~~ query:

@@ts
const users = await prisma.user.findMany({
  include: { posts: { take: 3, orderBy: { createdAt: "desc" } } },
});

// Or, when you only need some users:
const posts = await prisma.post.findMany({
  where: { authorId: { in: userIds } },
});
@@

## Index for the filters you actually use

@@prisma
model Post {
  id        Int      @id @default(autoincrement())
  authorId  Int
  createdAt DateTime @default(now())
  published Boolean  @default(false)

  @@index([authorId, createdAt])
  @@index([published, createdAt])
}
@@

An index is a trade-off: reads get faster, writes get slower. Index the columns
that appear in ~~where~~, ~~orderBy~~, and joins — not every column.

## Log slow queries

@@ts
const prisma = new PrismaClient({
  adapter,
  log: [
    { emit: "event", level: "query" },
    { emit: "stdout", level: "warn" },
  ],
});

prisma.$on("query", (event) => {
  if (event.duration > 100) {
    console.warn("slow query", event.duration, event.query);
  }
});
@@

In production, ship the duration and a redacted query shape to your metrics
system. Do not log parameter values that may contain personal data.

## Reusable query extensions

@@ts
const db = prisma.$extends({
  result: {
    user: {
      displayName: {
        needs: { name: true, email: true },
        compute(user) {
          return user.name ?? user.email.split("@")[0];
        },
      },
    },
  },
});
@@

Use extensions for presentation logic and soft-delete scopes. Do not hide
complex authorization inside an extension; keep it explicit at the call site.

## Connections

- Create one client per process.
- In serverless, reuse the client across warm invocations.
- Use the database's pooler for many short-lived functions.
- Tune the adapter pool instead of opening a client per request.
- Always disconnect in scripts and test teardowns.`),
      exercises: [
        {
          type: "quiz",
          prompt: "What is the usual fix for an N+1 query pattern?",
          answers: [
            "include the relation or batch with in",
            "include",
            "use include",
            "batch the queries",
          ],
          placeholder: "describe the fix",
          hint: "One query for the parents, one query for the children.",
          explanation:
            "Load the relation with `include`/`select`, or fetch all children with `where: { id: { in: ids } }`. The goal is a fixed number of queries, not one per row.",
        },
        {
          type: "fill-blank",
          prompt: "Add a composite index for author + creation time.",
          template: "model Post {\n  authorId Int\n  createdAt DateTime\n\n  ___\n}",
          blanks: [
            { options: ["@@index([authorId, createdAt])", "@index([authorId])", "@@unique([authorId])"], answer: "@@index([authorId, createdAt])" },
          ],
          explanation:
            "`@@index([authorId, createdAt])` creates a composite index. Field order matters: equality filters first, then sort/range columns.",
        },
      ],
    },
    {
      id: "prisma-testing-deploy",
      title: "Testing, Next.js & ship checklist",
      minutes: 10,
      md: md(String.raw`# Test against a real database

Mocking Prisma often tests the mock, not the query. Use a disposable PostgreSQL
database for integration tests.

## 1. Separate test database

@@bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/prisma7_test?schema=public"
@@

Apply the schema before the suite:

@@bash
npx prisma migrate deploy
@@

## 2. Clean between tests

@@ts
beforeEach(async () => {
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
});
@@

Delete children before parents, or rely on ~~onDelete: Cascade~~ and delete the
parent. Be explicit; test cleanup should not depend on a hidden cascade.

## 3. Test behavior, not implementation

@@ts
it("creates a user with a post", async () => {
  const user = await prisma.user.create({
    data: {
      email: "test@example.com",
      posts: { create: { title: "Hello" } },
    },
    include: { posts: true },
  });

  expect(user.posts).toHaveLength(1);
  expect(user.posts[0].title).toBe("Hello");
});
@@

## 4. Use a transaction rollback when possible

For fast suites, wrap each test in a transaction and roll it back. This is
tricky with the callback API because the transaction client must be passed
everywhere; use it only if your test helpers are disciplined.

## Next.js singleton

@@ts
// src/lib/prisma.ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
@@

Import this module from server components, route handlers, and server actions.
Never import it into a client component.

## Build and deploy checklist

- [ ] ~~npx prisma validate~~ passes.
- [ ] ~~npx prisma generate~~ runs in the build.
- [ ] ~~npx prisma migrate deploy~~ runs before the new app version.
- [ ] Migrations are committed and reviewed.
- [ ] ~~DATABASE_URL~~ is a secret, never a committed value.
- [ ] The production database has a backup/restore plan.
- [ ] Slow-query logging is on.
- [ ] Health check runs a trivial ~~SELECT 1~~.
- [ ] The app uses one Prisma client per process.
- [ ] Rollback plan is documented before the deploy, not after.

## Capstone

Build a small “notes” API with:

1. ~~User~~, ~~Note~~, and ~~Tag~~ models.
2. A migration for the initial schema.
3. CRUD endpoints with Zod validation.
4. A transaction that creates a note and its tags atomically.
5. A paginated list with a composite index.
6. A Vitest integration test against a disposable database.
7. A production checklist in the README.

If you can ship that without copying a tutorial, you know Prisma 7.`),
      exercises: [
        {
          type: "quiz",
          prompt: "Which command should run in CI before the app starts?",
          answers: ["migrate deploy", "prisma migrate deploy", "npx prisma migrate deploy"],
          placeholder: "command",
          hint: "Production replay, not development diffing.",
          explanation:
            "Run `prisma migrate deploy` as a release step so the database schema matches the code being deployed.",
        },
        {
          type: "fill-blank",
          prompt: "Generate the client during the build.",
          template: "npx prisma ___",
          blanks: [{ options: ["generate", "migrate dev", "studio"], answer: "generate" }],
          explanation:
            "`prisma generate` creates the typed client from the schema. It should run in the build pipeline after dependencies are installed.",
        },
      ],
    },
  ],
};
