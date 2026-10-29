import type { LessonSeed, SectionSeed } from "./course-types";

// ───────────────────────────── SQL course ──────────────────────────────
export const SQL_BASICS: SectionSeed = {
  id: "sql-basics",
  title: "SQL Fundamentals",
  lessons: [
    {
      id: "sql-select",
      title: "SELECT — reading data",
      minutes: 7,
      md: `# SELECT

SQL is a declarative language: you describe **what** you want, the database figures out **how**.

\`\`\`sql
-- all columns
SELECT * FROM users;

-- just some
SELECT first_name, email FROM users;

-- filter, sort, limit
SELECT id, first_name
FROM users
WHERE age >= 18
ORDER BY created_at DESC
LIMIT 10;
\`\`\`

## WHERE — comparison operators

\`\`\`sql
WHERE age = 18
WHERE name LIKE 'A%'
WHERE email IS NULL
WHERE age BETWEEN 18 AND 65
WHERE status IN ('active', 'trial')
WHERE age > 18 AND status = 'active' OR trial = TRUE
\`\`\`

**AND binds tighter than OR** — a classic interview trap. Parenthesize when unsure.

## Distinct

\`\`\`sql
SELECT DISTINCT status FROM orders;
\`\`\`
`,
    },
    {
      id: "sql-aggregate",
      title: "Aggregates & grouping",
      minutes: 8,
      md: `# Aggregates

\`\`\`sql
SELECT COUNT(*), AVG(amount), MAX(amount)
FROM orders
WHERE created_at >= '2025-01-01';
\`\`\`

## GROUP BY — per-group aggregates

\`\`\`sql
SELECT status, COUNT(*) AS order_count, SUM(amount) AS revenue
FROM orders
GROUP BY status;
\`\`\`

## HAVING filters groups; WHERE filters rows

\`\`\`sql
SELECT user_id, SUM(amount) AS total
FROM orders
GROUP BY user_id
HAVING SUM(amount) > 1000;     -- groups, after aggregation
-- WHERE amount > 1000         -- rows, before aggregation
\`\`\`

## Execution order

\`FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT\`
Remember why you can \`ORDER BY\` an alias but not \`WHERE\` it.`,
    },
    {
      id: "sql-joins",
      title: "JOINs — joining tables",
      minutes: 9,
      md: `# JOIN

Data is split across tables; JOIN stitches rows back together on a key.

\`\`\`sql
SELECT o.id, u.email, o.amount
FROM orders o
JOIN users u ON o.user_id = u.id;
\`\`\`

## The four joins

| type | keeps |
|---|---|
| **INNER JOIN** | only rows matched in **both** |
| **LEFT JOIN** | all left rows; NULLs for missing right |
| **RIGHT JOIN** | all right rows |
| **FULL JOIN** | everything from both sides |

## The classic "users without orders"

\`\`\`sql
SELECT u.id, u.email
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE o.id IS NULL;      -- anti-join
\`\`\`

A follow-up \`WHERE\` in the join's right table on a LEFT JOIN silently converts it to an INNER JOIN again — filter inside the \`ON\` instead.`,
    },
    {
      id: "sql-schema",
      title: "Creating & modifying data",
      minutes: 8,
      md: `# DDL & DML

## Tables

\`\`\`sql
CREATE TABLE users (
  id         SERIAL PRIMARY KEY,
  email      VARCHAR(255) UNIQUE NOT NULL,
  name       VARCHAR(120),
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
DROP TABLE users;              -- careful, no undo
\`\`\`

## Insert / update / delete

\`\`\`sql
INSERT INTO users (email, name) VALUES ('a@b.c', 'Ada');

UPDATE users SET name = 'Grace' WHERE id = 1;   -- WHERE or you rename everyone

DELETE FROM users WHERE id = 1;                 -- same warning
\`\`\`

## Up & upsert

\`\`\`sql
-- PostgreSQL insert-or-replace
INSERT INTO counters (id, n) VALUES (1, 1)
ON CONFLICT (id) DO UPDATE SET n = counters.n + 1;

-- MySQL variant
REPLACE INTO counters (id, n) VALUES (1, 1);
\`\`\``,
    },
    {
      id: "sql-indexes",
      title: "Indexes — why queries get fast",
      minutes: 8,
      md: `# Indexes

Without an index, a \`WHERE\` is a **full table scan**. An index keeps a sorted
lookup (usually a B-tree) so the engine can binary-search instead of reading rows.

\`\`\`sql
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE UNIQUE INDEX idx_users_email ON users(email);
\`\`\`

## When the index helps

\`\`\`sql
WHERE user_id = 42          -- uses idx_orders_user
WHERE user_id = 42 ORDER BY created_at  -- helps both, if compound
\`\`\`

## When it doesn't

- Function on the indexed column: \`\`\`sql WHERE UPPER(email) = 'A@B.C'\`\`\`
- Leading wildcards: \`LIKE '%gmail'\`
- Low-selectivity columns (only \`true\`/\`false\`)

## Trade-off

Every index slows **writes** (each one must be updated). Index what you actually
query; drop what you don't. \`EXPLAIN ANALYZE\` is how you verify, not guess.`,
    },
  ],
};

export const SQL_ADVANCED: SectionSeed = {
  id: "sql-advanced",
  title: "Advanced SQL",
  lessons: [
    {
      id: "sql-advanced-subquery",
      title: "Subqueries & CTEs",
      minutes: 9,
      md: `# Subqueries & CTEs

## Scalar subquery

\`\`\`sql
SELECT name, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);
\`\`\`

## EXISTS — faster than IN for big lists

\`\`\`sql
SELECT u.name
FROM users u
WHERE EXISTS (
  SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.amount > 100
);
\`\`\`

## CTE — named subqueries, readable

\`\`\`sql
WITH monthly AS (
  SELECT DATE_TRUNC('month', created_at) AS m, SUM(amount) AS rev
  FROM orders GROUP BY 1
)
SELECT m, rev / SUM(rev) OVER () AS share FROM monthly ORDER BY m;
\`\`\`

\`WITH RECURSIVE\` also walks trees:

\`\`\`sql
WITH RECURSIVE tree AS (
  SELECT id, parent_id FROM folders WHERE id = 1
  UNION ALL
  SELECT f.id, f.parent_id FROM folders f JOIN tree t ON f.parent_id = t.id
)
SELECT * FROM tree;
\`\`\``,
    },
    {
      id: "sql-advanced-window",
      title: "Window functions",
      minutes: 9,
      md: `# Window functions

Aggregate **without collapsing rows**:

\`\`\`sql
SELECT name, department, salary,
       RANK()       OVER (PARTITION BY department ORDER BY salary DESC) AS rank,
       AVG(salary)  OVER (PARTITION BY department)                      AS dept_avg
FROM employees;
\`\`\`

## Top-N per group — the interview favorite

\`\`\`sql
SELECT * FROM (
  SELECT name, department, salary,
         ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS rn
  FROM employees
) ranked
WHERE rn <= 2;
\`\`\`

## Running totals & moving averages

\`\`\`sql
SELECT order_date, amount,
       SUM(amount) OVER (ORDER BY order_date)                       AS running_total,
       AVG(amount) OVER (ORDER BY order_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS week_avg
FROM orders;
\`\`\`

\`LAG\`/\`LEAD\` give the previous/next row — month-over-month growth is:

\`\`\`sql
SELECT m, rev / LAG(rev) OVER (ORDER BY m) - 1 AS growth FROM monthly;
\`\`\``,
    },
    {
      id: "sql-advanced-transaction",
      title: "Transactions & ACID",
      minutes: 8,
      md: `# Transactions

A transaction groups statements into **all-or-nothing**:

\`\`\`sql
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;   -- or ROLLBACK if anything failed
\`\`\`

## ACID

- **Atomicity** — a crash halfway rolls back.
- **Consistency** — constraints hold at every commit.
- **Isolation** — concurrent transactions don't see each other's partial writes.
- **Durability** — committed data survives a power cut.

## Isolation levels

| level | anomaly it allows |
|---|---|
| READ UNCOMMITTED | dirty reads |
| READ COMMITTED | non-repeatable reads |
| REPEATABLE READ | phantom rows (mostly) fixed |
| SERIALIZABLE | none, slowest |

PostgreSQL defaults to READ COMMITTED. Bump it when \"read twice, saw different data\" breaks business rules.`,
    },
    {
      id: "sql-advanced-design",
      title: "Design: normalization & keys",
      minutes: 9,
      md: `# Schema design

## Keys

- **Primary key** — unique row identity (\`id\`). Prefer a non-meaningful id.
- **Foreign key** — points at another table's key; enforces integrity:

\`\`\`sql
CREATE TABLE orders (
  id      SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);
\`\`\`

## Normalize = split to stop duplication

| normal form | in plain words |
|---|---|
| 1NF | no multi-value cells |
| 2NF | every column depends on the **whole** key |
| 3NF | no column depends on a non-key column |

Store a customer's email once in \`users\`; reference it elsewhere by \`id\`.

## When to denormalize (on purpose)

Analytics dashboards and hot-path reads copy data to keep queries simple —
recalculate on write (trigger) or on schedule (materialized view) and accept
slightly stale reads for 10×-simpler queries.`,
    },
  ],
};

// ─────────────────────────── MongoDB course ───────────────────────────
export const MONGO_BASICS: SectionSeed = {
  id: "mongo-basics",
  title: "MongoDB Basics",
  lessons: [
    {
      id: "mongo-what",
      title: "Documents & collections",
      minutes: 6,
      md: `# Documents

MongoDB stores **BSON documents** (JSON with more types):

\`\`\`json
{
  "_id": "64a1f…",
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "skills": ["math", "writing"],
  "address": { "city": "London" }
}
\`\`\`

A **collection** holds documents. No fixed schema: documents in one collection can
differ — though in real apps you keep them consistent yourself.

## Document vs relational

| | SQL | MongoDB |
|---|---|---|
| unit | row | document |
| container | table | collection |
| related data | JOIN | embedded document or \$lookup |
| schema | enforced | application-enforced |

Documents travel together: reading a user + their orders is **one** query against
one (embedded) document instead of one JOIN — that's the whole pitch.`,
    },
    {
      id: "mongo-crud",
      title: "CRUD operations",
      minutes: 8,
      md: `# CRUD

\`\`\`js
// Create
db.users.insertOne({ name: "Grace", age: 36 })
db.users.insertMany([{ name: "Ada" }, { name: "Linus" }])

// Read
db.users.find({ age: { $gte: 30 } })                 // filter
db.users.find({}, { projection: { name: 1, _id: 0 } }) // only name

// Update
db.users.updateOne({ name: "Ada" }, { $set: { age: 37 } })
db.users.updateMany({}, { $inc: { logins: 1 } })

// Delete
db.users.deleteOne({ name: "Linus" })
\`\`\`

## Operators you'll use every day

| operator | does |
|---|---|
| \$eq /\$ne | equals / not equals |
| \$gt, \$gte, \$lt, \$lte | range |
| \$in /\$nin | list of values |
| \$and, \$or, \$not | boolean |
| \$exists | field present |
| \$set /\$unset | set or remove a field |
| \$inc | increment |
| \$push /\$pull | add/remove from array |`,
    },
    {
      id: "mongo-query-arrays",
      title: "Arrays, embedding & querying",
      minutes: 8,
      md: `# Arrays & embedding

\`\`\`js
db.posts.insertOne({
  title: "Hello",
  tags: ["react", "sql"],
  comments: [
    { user: "ada", text: "nice", likes: 2 },
    { user: "bob", text: "meh",  likes: 0 },
  ]
})

// any comment liked ≥ 1?
db.posts.find({ "comments.likes": { $gte: 1 } })

// specific array element — positional projection
db.posts.find(
  { "comments.user": "ada" },
  { "comments.$": 1 }
)

// size, elemMatch
db.posts.find({ tags: { $size: 2 } })
db.posts.find({ comments: { $elemMatch: { user: "ada", likes: { $gte: 1 } } } })
\`\`\`

## Embed vs reference

**Embed** when the child has no life of its own (order lines, a post's comments on a small blog).
**Reference** when the child is shared, huge, or read independently — store \`userId\`,
then \`\$lookup\` (or a second query).`,
    },
  ],
};

export const MONGO_ADVANCED: SectionSeed = {
  id: "mongo-advanced",
  title: "MongoDB Ahead",
  lessons: [
    {
      id: "mongo-aggregation",
      title: "Aggregation pipeline",
      minutes: 9,
      md: `# Aggregation

A pipeline of stages, each transforming documents flowing through:

\`\`\`js
db.orders.aggregate([
  { $match: { status: "paid" } },                  // filter (like WHERE)
  { $group: {                                      // like GROUP BY
      _id: "$userId",
      revenue: { $sum: "$amount" },
      count:  { $sum: 1 }
  }},
  { $sort: { revenue: -1 } },
  { $limit: 10 }
])
\`\`\`

## Common stages

| stage | job |
|---|---|
| \$match | filter early (use an index!) |
| \$group | bucket & aggregate |
| \$project / \$unset | shape fields |
| \$lookup | join (like LEFT JOIN) |
| \$unwind | explode an array → one doc per element |
| \$sort /\$limit /\$skip | order & paginate |

## The interview pattern

"Average order per city" =
\`$group { _id: "$city", avg: { $avg: "$amount" } }\` then sort.
Build it stage by stage in Compass — real pipelines are debugged, not written.`,
    },
    {
      id: "mongo-indexes",
      title: "Indexes & performance",
      minutes: 8,
      md: `# Indexes

\`\`\`js
db.users.createIndex({ email: 1 }, { unique: true })
db.orders.createIndex({ userId: 1, createdAt: -1 })   // compound
db.posts.createIndex({ body: "text" })                // text search
\`\`\`

## Understanding explain()

\`\`\`js
db.users.find({ email: "a@b.c" }).explain("executionStats")
\`\`\`

- \`IXSCAN\` — index used ✅
- \`COLLSCAN\` — full scan ❌
- \`totalDocsExamined\` vs \`nReturned\` — how much waste

## ESR rule (compound index order)

**Equality → Sort → Range.** Put the equality-filtered fields first,
then the sort field, then range filters — that order determines whether the
index can both filter *and* avoid an in-memory sort.`,
    },
    {
      id: "mongo-mongoose",
      title: "MongoDB with Mongoose & Node",
      minutes: 8,
      md: `# Mongoose

\`\`\`js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name:  { type: String, required: true },
  email: { type: String, required: true, unique: true },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
await mongoose.connect(process.env.MONGO_URL);

// Query
const users = await User.find({ name: /a/i }).limit(10).sort("name");

// Create
const user = await User.create({ name: "Ada", email: "a@b.c" });

// Populate — the "JOIN"
const userWithPosts = await User.findById(user._id).populate("posts");
\`\`\`

## Two fails to avoid

1. **Duplicate key on unique** — pre-check with a \`$setOnInsert\` upsert, or catch code 11000.
2. **N+1 queries in a loop** — batch with \`$in\` or \`populate\`.

**Transactions** for multi-document writes:

\`\`\`js
const session = await mongoose.startSession();
await session.withTransaction(async () => {
  await Account.updateOne(..., { session });
  await Order.create(..., { session });
});
session.endSession();
\`\`\``,
    },
  ],
};
