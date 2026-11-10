import type { SqlProblem } from "./types";

/**
 * SQL track — real Postgres, seeded from sql-data.ts. Each problem ships a
 * reference query; a run passes when the learner's result set matches it (row
 * order matters unless `ordered: false`).
 *
 * Levels follow the roadmap: filtering → aggregation → joins → CTEs/windows →
 * analytics.
 */
export const SQL_PROBLEMS: SqlProblem[] = [
  {
    id: "sql-mumbai-customers",
    kind: "sql",
    title: "Mumbai customers, newest first",
    level: 1,
    blurb: "Filter one column and sort by a date.",
    topics: ["WHERE", "ORDER BY"],
    task: "select name and signup_at for Mumbai customers",
    statement: `Select \`name\` and \`signup_at\` for every customer whose \`city\` is \`'Mumbai'\`, newest signup first.

**Tables** — \`customers(id, name, email, city, state, age, plan, signup_at)\``,
    hints: ["WHERE filters rows before anything else.", "ORDER BY signup_at DESC puts the newest first."],
    solution: `SELECT name, signup_at
FROM customers
WHERE city = 'Mumbai'
ORDER BY signup_at DESC;`,
  },
  {
    id: "sql-price-range",
    kind: "sql",
    title: "Products in a price band",
    level: 1,
    blurb: "BETWEEN is inclusive on both ends.",
    topics: ["WHERE", "BETWEEN", "ORDER BY"],
    task: "select name and price between 1000 and 5000",
    statement: `Select \`name\` and \`price\` for products priced from 1000 to 5000 **inclusive**, cheapest first.

**Tables** — \`products(id, name, category, price, stock)\``,
    hints: ["price BETWEEN 1000 AND 5000 includes both endpoints.", "Sort ascending so the cheapest comes first."],
    solution: `SELECT name, price
FROM products
WHERE price BETWEEN 1000 AND 5000
ORDER BY price;`,
  },
  {
    id: "sql-null-cities",
    kind: "sql",
    title: "Customers with no city",
    level: 1,
    blurb: "NULL never equals anything — even itself.",
    topics: ["NULL", "WHERE"],
    task: "select the names where city is NULL",
    statement: `Select the \`name\` of every customer whose \`city\` is NULL, in \`id\` order.

**Trap** — \`city = NULL\` returns no rows. You need \`IS NULL\`.`,
    hints: ["NULL is a missing value, not an empty string.", "Use city IS NULL."],
    solution: `SELECT name
FROM customers
WHERE city IS NULL
ORDER BY id;`,
  },
  {
    id: "sql-top-expensive",
    kind: "sql",
    title: "Five most expensive products",
    level: 1,
    blurb: "ORDER BY DESC with a LIMIT.",
    topics: ["ORDER BY", "LIMIT"],
    task: "select the 5 priciest products",
    statement: `Select \`name\` and \`price\` of the five most expensive products, most expensive first.`,
    hints: ["ORDER BY price DESC then LIMIT 5.", "No ties in the price column, so the order is unambiguous."],
    solution: `SELECT name, price
FROM products
ORDER BY price DESC
LIMIT 5;`,
  },
  {
    id: "sql-order-status-count",
    kind: "sql",
    title: "Orders per status",
    level: 2,
    blurb: "Your first GROUP BY.",
    topics: ["GROUP BY", "COUNT"],
    task: "count orders per status",
    statement: `Return each \`status\` with the number of orders in it, as \`status, orders\`, sorted by status.

**Tables** — \`orders(id, customer_id, status, payment_method, created_at, total_amount)\``,
    hints: ["GROUP BY status collapses every status into one row.", "COUNT(*) counts rows in each group; alias it so the column has a name."],
    solution: `SELECT status, COUNT(*) AS orders
FROM orders
GROUP BY status
ORDER BY status;`,
  },
  {
    id: "sql-email-s",
    kind: "sql",
    title: "Emails starting with S",
    level: 2,
    blurb: "ILIKE for case-insensitive patterns.",
    topics: ["LIKE", "ILIKE"],
    task: "select emails starting with s, in id order",
    statement: `Select the \`email\` of customers whose email starts with \`s\`, case-insensitively, in \`id\` order.

**Trap** — \`LIKE\` is case-sensitive in Postgres; \`ILIKE\` is not.`,
    hints: ["The pattern is 's%'.", "Use ILIKE so Sunita and sara both match."],
    solution: `SELECT email
FROM customers
WHERE email ILIKE 's%'
ORDER BY id;`,
  },
  {
    id: "sql-delivered-revenue",
    kind: "sql",
    title: "Revenue from delivered orders",
    level: 3,
    blurb: "One filtered aggregate, one row.",
    topics: ["SUM", "WHERE", "aggregation"],
    task: "sum total_amount for delivered orders",
    statement: `Return the total revenue of \`delivered\` orders as a single column named \`revenue\`.

**Trap** — only delivered orders count; cancelled, returned, shipped and pending do not.`,
    hints: ["Filter first with WHERE status = 'delivered'.", "SUM(total_amount) on the filtered rows gives one value."],
    solution: `SELECT SUM(total_amount) AS revenue
FROM orders
WHERE status = 'delivered';`,
  },
  {
    id: "sql-avg-by-payment",
    kind: "sql",
    title: "Average order value per payment method",
    level: 3,
    blurb: "GROUP BY one column, aggregate another.",
    topics: ["GROUP BY", "AVG", "ROUND"],
    task: "average total_amount per payment_method",
    statement: `Return \`payment_method\` and the average \`total_amount\` for it, rounded to 2 decimals and aliased \`avg_order\`, sorted by payment method.

Include every order, whatever its status.`,
    hints: ["GROUP BY payment_method.", "AVG returns numeric; ROUND(AVG(total_amount), 2) keeps it tidy."],
    solution: `SELECT payment_method, ROUND(AVG(total_amount), 2) AS avg_order
FROM orders
GROUP BY payment_method
ORDER BY payment_method;`,
  },
  {
    id: "sql-orders-per-month",
    kind: "sql",
    title: "Orders per month in 2025",
    level: 3,
    blurb: "DATE_TRUNC turns dates into months.",
    topics: ["DATE_TRUNC", "GROUP BY"],
    task: "count orders per month",
    statement: `Return one row per month that has orders: the month as \`month\` (a date truncated to the first of the month) and the order count as \`orders\`, oldest first.

**Hint on shape** — \`DATE_TRUNC('month', created_at)::date\` gives a plain date.`,
    hints: [
      "Group by the truncated expression, not by the raw timestamp.",
      "Postgres lets you GROUP BY 1 to refer to the first selected column.",
    ],
    solution: `SELECT DATE_TRUNC('month', created_at)::date AS month, COUNT(*) AS orders
FROM orders
GROUP BY 1
ORDER BY 1;`,
  },
  {
    id: "sql-big-categories",
    kind: "sql",
    title: "Categories with more than two products",
    level: 3,
    blurb: "HAVING filters groups, not rows.",
    topics: ["HAVING", "GROUP BY"],
    task: "categories with 3 or more products",
    statement: `Return \`category\` and the product count as \`products\` for categories holding **more than two** products, alphabetically by category.

**Trap** — \`WHERE COUNT(*) > 2\` is illegal; filter after aggregation with HAVING.`,
    hints: ["GROUP BY category first.", "HAVING COUNT(*) > 2 removes small groups."],
    solution: `SELECT category, COUNT(*) AS products
FROM products
GROUP BY category
HAVING COUNT(*) > 2
ORDER BY category;`,
  },
  {
    id: "sql-avg-age-plan",
    kind: "sql",
    title: "Average age per plan",
    level: 3,
    blurb: "AVG skips NULLs — decide if that is what you want.",
    topics: ["AVG", "NULL", "GROUP BY"],
    task: "average age per plan, rounded",
    statement: `Return \`plan\` and the average customer age rounded to 1 decimal as \`avg_age\`, ordered by plan.

Two customers have a NULL age; they must not turn the average into NULL.`,
    hints: ["AVG(age) ignores NULL rows automatically.", "ROUND(AVG(age), 1) keeps one decimal."],
    solution: `SELECT plan, ROUND(AVG(age), 1) AS avg_age
FROM customers
GROUP BY plan
ORDER BY plan;`,
  },
  {
    id: "sql-orders-with-names",
    kind: "sql",
    title: "Orders with customer names",
    level: 4,
    blurb: "Your first INNER JOIN.",
    topics: ["JOIN"],
    task: "join orders to customers",
    statement: `Return \`order_id\`, \`customer\` (the customer's name) and \`total_amount\` for every order, ordered by order id.

**Tables** — \`orders.customer_id\` references \`customers.id\`.`,
    hints: ["Alias the tables so column names stay readable.", "Join ON customers.id = orders.customer_id."],
    solution: `SELECT o.id AS order_id, c.name AS customer, o.total_amount
FROM orders o
JOIN customers c ON c.id = o.customer_id
ORDER BY o.id;`,
  },
  {
    id: "sql-top-spenders",
    kind: "sql",
    title: "Total spend per customer",
    level: 4,
    blurb: "Join, filter, group, sort — the analytics quartet.",
    topics: ["JOIN", "GROUP BY", "SUM"],
    task: "delivered spend per customer, highest first",
    statement: `Return each customer's \`name\` and their total **delivered** spend as \`spend\`, highest first. Break ties by name.

Customers with no delivered orders should not appear.`,
    hints: ["Join customers to orders, then filter status = 'delivered'.", "Group by the customer's id **and** name."],
    solution: `SELECT c.name, SUM(o.total_amount) AS spend
FROM customers c
JOIN orders o ON o.customer_id = c.id
WHERE o.status = 'delivered'
GROUP BY c.id, c.name
ORDER BY spend DESC, c.name;`,
  },
  {
    id: "sql-never-ordered",
    kind: "sql",
    title: "Customers who never ordered",
    level: 4,
    blurb: "The anti-join: LEFT JOIN + IS NULL.",
    topics: ["LEFT JOIN", "anti-join"],
    task: "names of customers without orders",
    statement: `Return the \`name\` of every customer with no orders at all, in \`id\` order.

**Trap** — filtering the right side in WHERE turns your LEFT JOIN back into an INNER JOIN.`,
    hints: ["LEFT JOIN keeps unmatched customers with NULL order columns.", "WHERE o.id IS NULL isolates exactly those rows."],
    solution: `SELECT c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL
ORDER BY c.id;`,
  },
  {
    id: "sql-never-sold",
    kind: "sql",
    title: "Products never sold",
    level: 4,
    blurb: "The same anti-join, one table further.",
    topics: ["LEFT JOIN", "anti-join"],
    task: "names of products with no order items",
    statement: `Return the \`name\` of every product that never appears in \`order_items\`, in \`id\` order.

Two products were never sold.`,
    hints: ["Join products to order_items on product_id.", "Keep product rows with no match by checking i.id IS NULL."],
    solution: `SELECT p.name
FROM products p
LEFT JOIN order_items i ON i.product_id = p.id
WHERE i.id IS NULL
ORDER BY p.id;`,
  },
  {
    id: "sql-employee-managers",
    kind: "sql",
    title: "Who reports to whom",
    level: 5,
    blurb: "A self join: the table is its own neighbour.",
    topics: ["self join"],
    task: "employee and manager names",
    statement: `Return \`employee\` and \`manager\` for every employee, ordered by employee id. The top of the chain has no manager — keep that row with a NULL manager.

**Tables** — \`employees(id, name, department, salary, manager_id)\``,
    hints: [
      "Join employees to itself with two aliases: e for the employee, m for the manager.",
      "Use LEFT JOIN so the CEO is not dropped.",
    ],
    solution: `SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON m.id = e.manager_id
ORDER BY e.id;`,
  },
  {
    id: "sql-revenue-category",
    kind: "sql",
    title: "Revenue per category",
    level: 5,
    blurb: "Three tables, a discount, and a fan-out trap.",
    topics: ["JOIN", "arithmetic", "GROUP BY"],
    task: "delivered revenue per product category",
    statement: `Return \`category\` and delivered revenue as \`revenue\`, highest first.

Line revenue is \`quantity * unit_price * (1 - discount_pct / 100.0)\`. Only items from **delivered** orders count.

**Trap** — join \`order_items\` to \`orders\` and \`products\`; joining the orders table twice would multiply rows.`,
    hints: [
      "Start from order_items, join orders (for status) and products (for category).",
      "Use 100.0, not 100, or integer division will round the discount away.",
    ],
    solution: `SELECT p.category,
       SUM(i.quantity * i.unit_price * (1 - i.discount_pct / 100.0)) AS revenue
FROM order_items i
JOIN orders o ON o.id = i.order_id
JOIN products p ON p.id = i.product_id
WHERE o.status = 'delivered'
GROUP BY p.category
ORDER BY revenue DESC;`,
  },
  {
    id: "sql-first-last-order",
    kind: "sql",
    title: "First and last order per customer",
    level: 5,
    blurb: "MIN and MAX on dates answer a lot of questions.",
    topics: ["MIN", "MAX", "GROUP BY"],
    task: "first and last order date per customer",
    statement: `Return \`name\`, \`first_order\` and \`last_order\` (dates) for every customer who has ordered, ordered by customer id.

Include every order status in this one.`,
    hints: ["Join, then group by the customer.", "MIN(created_at) and MAX(created_at) are your two date columns."],
    solution: `SELECT c.name, MIN(o.created_at) AS first_order, MAX(o.created_at) AS last_order
FROM customers c
JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name
ORDER BY c.id;`,
  },
  {
    id: "sql-above-customer-avg",
    kind: "sql",
    title: "Orders above the customer's average",
    level: 5,
    blurb: "A correlated subquery per row.",
    topics: ["subquery", "correlated"],
    task: "orders bigger than that customer's average",
    statement: `Return \`id\` and \`total_amount\` of every order that is larger than the average order of **the same customer**, ordered by id.

The comparison is per customer, not against the global average.`,
    hints: ["A subquery can reference the outer row's customer_id.", "AVG over o2 filtered by o2.customer_id = o.customer_id."],
    solution: `SELECT o.id, o.total_amount
FROM orders o
WHERE o.total_amount > (
  SELECT AVG(o2.total_amount)
  FROM orders o2
  WHERE o2.customer_id = o.customer_id
)
ORDER BY o.id;`,
  },
  {
    id: "sql-running-revenue",
    kind: "sql",
    title: "Running monthly revenue",
    level: 6,
    blurb: "A window function over an aggregate.",
    topics: ["window functions", "SUM OVER"],
    task: "monthly delivered revenue with a running total",
    statement: `Return \`month\`, \`revenue\` and \`running\` for each month with delivered orders, oldest first.

\`running\` is the cumulative revenue up to and including that month.`,
    hints: [
      "Group by month to get each revenue, then add SUM(...) OVER (ORDER BY month).",
      "The inner aggregate becomes SUM(SUM(total_amount)) OVER (ORDER BY ...).",
    ],
    solution: `SELECT DATE_TRUNC('month', created_at)::date AS month,
       SUM(total_amount) AS revenue,
       SUM(SUM(total_amount)) OVER (ORDER BY DATE_TRUNC('month', created_at)) AS running
FROM orders
WHERE status = 'delivered'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY 1;`,
  },
  {
    id: "sql-mom-growth",
    kind: "sql",
    title: "Month-over-month growth",
    level: 7,
    blurb: "LAG looks at the previous row of the result.",
    topics: ["LAG", "CTE", "window functions"],
    task: "monthly revenue with growth percent",
    statement: `Return \`month\`, \`revenue\` and \`growth_pct\` — the percentage change against the previous month — for every month with delivered orders, oldest first.

The first month has no previous month: leave its growth NULL.

Round growth to 1 decimal.`,
    hints: [
      "Build monthly revenue in a CTE first; reading it is easier than nesting.",
      "LAG(revenue) OVER (ORDER BY month) gives the previous row's value.",
    ],
    solution: `WITH monthly AS (
  SELECT DATE_TRUNC('month', created_at)::date AS month,
         SUM(total_amount) AS revenue
  FROM orders
  WHERE status = 'delivered'
  GROUP BY 1
)
SELECT month,
       revenue,
       ROUND(100.0 * (revenue - LAG(revenue) OVER (ORDER BY month))
             / LAG(revenue) OVER (ORDER BY month), 1) AS growth_pct
FROM monthly
ORDER BY month;`,
  },
  {
    id: "sql-top3-per-state",
    kind: "sql",
    title: "Top 3 spenders in each state",
    level: 7,
    blurb: "ROW_NUMBER partitioned by a group.",
    topics: ["ROW_NUMBER", "PARTITION BY", "subquery"],
    task: "top three customers by state",
    statement: `Return \`state\`, \`name\`, \`spend\` and \`position\` for the top three **delivered** spenders in each state, ordered by state then position.

Row numbering must reset per state.`,
    hints: [
      "Compute spend per customer first, then ROW_NUMBER() OVER (PARTITION BY state ORDER BY spend DESC).",
      "Filter the numbered rows in an outer query — you cannot filter on a window function in WHERE.",
    ],
    solution: `SELECT state, name, spend, position
FROM (
  SELECT c.state,
         c.name,
         SUM(o.total_amount) AS spend,
         ROW_NUMBER() OVER (PARTITION BY c.state ORDER BY SUM(o.total_amount) DESC, c.name) AS position
  FROM customers c
  JOIN orders o ON o.customer_id = c.id
  WHERE o.status = 'delivered'
  GROUP BY c.id, c.state, c.name
) ranked
WHERE position <= 3
ORDER BY state, position;`,
  },
  {
    id: "sql-above-dept-avg",
    kind: "sql",
    title: "Above the department average",
    level: 7,
    blurb: "Compare a row with its own group's aggregate.",
    topics: ["subquery", "aggregation"],
    task: "employees earning above their department average",
    statement: `Return \`name\`, \`department\`, \`salary\` for employees paid more than the average salary of their own department, highest salary first.`,
    hints: [
      "A correlated subquery filtered to the same department works.",
      "Alternatively use a window: AVG(salary) OVER (PARTITION BY department).",
    ],
    solution: `SELECT e.name, e.department, e.salary
FROM employees e
WHERE e.salary > (
  SELECT AVG(d.salary)
  FROM employees d
  WHERE d.department = e.department
)
ORDER BY e.salary DESC;`,
  },
  {
    id: "sql-rank-products",
    kind: "sql",
    title: "Rank products inside each category",
    level: 8,
    blurb: "RANK vs ROW_NUMBER vs DENSE_RANK.",
    topics: ["RANK", "CTE", "window functions"],
    task: "rank products by delivered revenue in category",
    statement: `Return \`category\`, \`name\`, \`revenue\` and \`rank\` for products with delivered revenue, ordered by category then rank.

\`rank\` must be a RANK() within the category, highest revenue first. Products with equal revenue share a rank.`,
    hints: [
      "Aggregate per product in a CTE, then apply RANK() OVER (PARTITION BY category ORDER BY revenue DESC).",
      "RANK leaves gaps after ties; ROW_NUMBER never does. The problem asks for RANK.",
    ],
    solution: `WITH product_revenue AS (
  SELECT p.category,
         p.name,
         SUM(i.quantity * i.unit_price * (1 - i.discount_pct / 100.0)) AS revenue
  FROM order_items i
  JOIN orders o ON o.id = i.order_id
  JOIN products p ON p.id = i.product_id
  WHERE o.status = 'delivered'
  GROUP BY p.id, p.category, p.name
)
SELECT category, name, revenue,
       RANK() OVER (PARTITION BY category ORDER BY revenue DESC) AS rank
FROM product_revenue
ORDER BY category, rank;`,
  },
  {
    id: "sql-revenue-share",
    kind: "sql",
    title: "Product revenue share",
    level: 8,
    blurb: "Divide a row by the total of all rows.",
    topics: ["window functions", "percentage"],
    task: "each product's revenue and share of the total",
    statement: `Return \`name\`, \`revenue\` and \`pct\` — each product's share of all delivered revenue, as a percentage rounded to 1 decimal — highest revenue first.

Products never sold should not appear.`,
    hints: [
      "SUM(revenue) OVER () with an empty window gives the grand total on every row.",
      "Multiply by 100.0 before dividing so you get a decimal percentage.",
    ],
    solution: `WITH product_revenue AS (
  SELECT p.name,
         SUM(i.quantity * i.unit_price * (1 - i.discount_pct / 100.0)) AS revenue
  FROM order_items i
  JOIN orders o ON o.id = i.order_id
  JOIN products p ON p.id = i.product_id
  WHERE o.status = 'delivered'
  GROUP BY p.id, p.name
)
SELECT name,
       revenue,
       ROUND(100.0 * revenue / SUM(revenue) OVER (), 1) AS pct
FROM product_revenue
ORDER BY revenue DESC;`,
  },
  {
    id: "sql-reporting-chain",
    kind: "sql",
    title: "Full reporting chain",
    level: 8,
    blurb: "A recursive CTE walks the management tree.",
    topics: ["recursive CTE", "hierarchy"],
    task: "chain of command from employee 8 upward",
    statement: `Starting from employee \`8\`, walk up the management chain and return each \`name\` in order — the employee first, then their manager, then their manager's manager, ending with the top.

**Tables** — \`employees.manager_id\` references \`employees.id\`.`,
    hints: [
      "WITH RECURSIVE chain AS (base row UNION ALL recursive step joining manager).",
      "The recursive step matches the previous row's manager_id to employees.id.",
    ],
    solution: `WITH RECURSIVE chain AS (
  SELECT id, name, manager_id, 0 AS depth
  FROM employees
  WHERE id = 8
  UNION ALL
  SELECT m.id, m.name, m.manager_id, chain.depth + 1
  FROM employees m
  JOIN chain ON m.id = chain.manager_id
)
SELECT name
FROM chain
ORDER BY depth;`,
  },
  {
    id: "sql-multi-month-customers",
    kind: "sql",
    title: "Ordered in three or more months",
    level: 9,
    blurb: "COUNT(DISTINCT month) as a filter.",
    topics: ["COUNT DISTINCT", "HAVING", "DATE_TRUNC"],
    task: "customers active in 3+ months",
    statement: `Return \`name\` and \`months\` (the number of distinct calendar months they ordered in, any status) for customers who ordered in **three or more** different months, alphabetically by name.`,
    hints: [
      "COUNT(DISTINCT DATE_TRUNC('month', created_at)) counts distinct months.",
      "Then HAVING that count >= 3 — no subquery needed.",
    ],
    solution: `SELECT c.name, COUNT(DISTINCT DATE_TRUNC('month', o.created_at)) AS months
FROM customers c
JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name
HAVING COUNT(DISTINCT DATE_TRUNC('month', o.created_at)) >= 3
ORDER BY c.name;`,
  },
  {
    id: "sql-repeat-rate",
    kind: "sql",
    title: "Repeat purchase rate",
    level: 9,
    blurb: "A share, computed from a subquery.",
    topics: ["subquery", "FILTER", "percentage"],
    task: "percent of customers with 2+ delivered orders",
    statement: `Return one row with one column, \`repeat_rate\`: the percentage of **all customers** who have two or more delivered orders, rounded to 1 decimal.

Customers with zero or one delivered order count as non-repeat buyers, which keeps the denominator at the full customer count.`,
    hints: [
      "Build per-customer delivered order counts with LEFT JOIN, then aggregate over that.",
      "COUNT(*) FILTER (WHERE delivered_orders >= 2) / COUNT(*) * 100.",
    ],
    solution: `WITH per_customer AS (
  SELECT c.id, COUNT(o.id) AS delivered_orders
  FROM customers c
  LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'delivered'
  GROUP BY c.id
)
SELECT ROUND(
         100.0 * COUNT(*) FILTER (WHERE delivered_orders >= 2) / COUNT(*),
         1
       ) AS repeat_rate
FROM per_customer;`,
  },
];
