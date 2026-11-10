import type { SqlRef, SqlTable } from "@/lib/sql-lab";

/**
 * A small, deliberately messy shop database used by the SQL track. It is
 * seeded into a fresh in-browser Postgres (PGlite) for every run, so every
 * attempt starts from exactly these rows.
 *
 * Deliberate traps, because real data is messy:
 *  - NULL city / state / age on a couple of customers
 *  - two customers who never ordered at all
 *  - two products that were never sold
 *  - cancelled / returned / pending orders mixed in with delivered ones
 *  - a self-referencing employees table
 */
export const SQL_TABLES: SqlTable[] = [
  {
    name: "customers",
    primaryKey: ["id"],
    columns: [
      { name: "id", type: "integer" },
      { name: "name", type: "text" },
      { name: "email", type: "text" },
      { name: "city", type: "text" },
      { name: "state", type: "text" },
      { name: "age", type: "integer" },
      { name: "plan", type: "text" },
      { name: "signup_at", type: "date" },
    ],
    rows: [
      [1, "Aarav Mehta", "aarav@example.com", "Mumbai", "MH", 28, "pro", "2025-01-05"],
      [2, "Sunita Rao", "sunita@example.com", "Mumbai", "MH", 34, "free", "2025-01-18"],
      [3, "Imran Khan", "imran@example.com", "Delhi", "DL", 41, "pro", "2025-02-02"],
      [4, "Sara Ali", "sara@example.com", null, null, 22, "free", "2025-02-14"],
      [5, "Wei Chen", "wei@example.com", "Pune", "MH", null, "pro", "2025-03-03"],
      [6, "Priya Nair", "priya@example.com", "Kochi", "KL", 37, "free", "2025-03-21"],
      [7, "John Smith", "john@example.com", "Bengaluru", "KA", 45, "pro", "2025-04-01"],
      [8, "Meera Iyer", "meera@example.com", "Chennai", "TN", 30, "free", "2025-04-19"],
      [9, "Rahul Verma", "rahul@example.com", "Delhi", "DL", 26, "free", "2025-05-06"],
      [10, "Fatima Sheikh", "fatima@example.com", "Hyderabad", "TS", 33, "pro", "2025-05-27"],
      [11, "Chen Wu", "chen.wu@example.com", null, "KA", null, "free", "2025-06-10"],
      [12, "Rohit Das", "rohit@example.com", "Kolkata", "WB", 39, "free", "2025-06-22"],
    ],
  },
  {
    name: "products",
    primaryKey: ["id"],
    columns: [
      { name: "id", type: "integer" },
      { name: "name", type: "text" },
      { name: "category", type: "text" },
      { name: "price", type: "numeric(10,2)" },
      { name: "stock", type: "integer" },
    ],
    rows: [
      [1, "Notebook", "books", 250, 120],
      [2, "Desk Lamp", "home", 1800, 40],
      [3, "Python Book", "books", 1200, 60],
      [4, "Wireless Mouse", "electronics", 2200, 35],
      [5, "Coffee Mug", "home", 450, 90],
      [6, "Mechanical Keyboard", "electronics", 4500, 20],
      [7, "Standing Desk", "furniture", 18000, 8],
      [8, "Office Chair", "furniture", 9500, 12],
      [9, "Sketchbook", "books", 600, 55],
      [10, "USB-C Hub", "electronics", 3200, 25],
      [11, "Monitor Arm", "furniture", 5400, 18],
      [12, "Webcam", "electronics", 3800, 0],
    ],
  },
  {
    name: "orders",
    primaryKey: ["id"],
    columns: [
      { name: "id", type: "integer" },
      { name: "customer_id", type: "integer" },
      { name: "status", type: "text" },
      { name: "payment_method", type: "text" },
      { name: "created_at", type: "date" },
      { name: "total_amount", type: "numeric(10,2)" },
    ],
    rows: [
      [1, 1, "delivered", "upi", "2025-01-12", 2700],
      [2, 3, "delivered", "card", "2025-01-20", 1800],
      [3, 2, "cancelled", "upi", "2025-01-25", 250],
      [4, 1, "delivered", "card", "2025-02-03", 4500],
      [5, 7, "delivered", "netbanking", "2025-02-14", 18000],
      [6, 6, "returned", "upi", "2025-02-27", 450],
      [7, 3, "delivered", "upi", "2025-03-08", 3450],
      [8, 4, "pending", "card", "2025-03-15", 1200],
      [9, 5, "delivered", "card", "2025-03-29", 9500],
      [10, 1, "delivered", "upi", "2025-04-04", 600],
      [11, 8, "delivered", "netbanking", "2025-04-18", 1800],
      [12, 9, "cancelled", "cash", "2025-04-23", 3200],
      [13, 7, "delivered", "card", "2025-05-02", 2200],
      [14, 10, "delivered", "upi", "2025-05-16", 1650],
      [15, 3, "delivered", "card", "2025-05-30", 1200],
      [16, 2, "delivered", "upi", "2025-06-09", 4050],
      [17, 6, "delivered", "card", "2025-06-21", 900],
      [18, 5, "delivered", "upi", "2025-07-07", 3200],
      [19, 8, "shipped", "card", "2025-07-19", 1200],
      [20, 4, "returned", "card", "2025-07-30", 1800],
      [21, 1, "delivered", "upi", "2025-08-02", 1200],
      [22, 6, "cancelled", "upi", "2025-08-08", 250],
      [23, 10, "delivered", "card", "2025-08-23", 9025],
      [24, 7, "delivered", "netbanking", "2025-09-11", 4500],
      [25, 8, "delivered", "upi", "2025-09-29", 2450],
      [26, 3, "delivered", "upi", "2025-10-05", 2200],
      [27, 9, "shipped", "cash", "2025-11-15", 600],
      [28, 2, "delivered", "card", "2025-12-01", 1200],
      [29, 1, "delivered", "upi", "2025-12-20", 450],
      [30, 5, "delivered", "card", "2025-12-28", 1200],
    ],
  },
  {
    name: "order_items",
    primaryKey: ["id"],
    columns: [
      { name: "id", type: "integer" },
      { name: "order_id", type: "integer" },
      { name: "product_id", type: "integer" },
      { name: "quantity", type: "integer" },
      { name: "unit_price", type: "numeric(10,2)" },
      { name: "discount_pct", type: "integer" },
    ],
    rows: [
      [1, 1, 1, 2, 250, 0],
      [2, 1, 4, 1, 2200, 0],
      [3, 2, 2, 1, 1800, 0],
      [4, 3, 1, 1, 250, 0],
      [5, 4, 6, 1, 4500, 0],
      [6, 5, 7, 1, 18000, 0],
      [7, 6, 5, 1, 450, 0],
      [8, 7, 10, 1, 3200, 0],
      [9, 7, 1, 1, 250, 0],
      [10, 8, 3, 1, 1200, 0],
      [11, 9, 8, 1, 9500, 0],
      [12, 10, 9, 1, 600, 0],
      [13, 11, 2, 1, 1800, 0],
      [14, 12, 10, 1, 3200, 0],
      [15, 13, 4, 1, 2200, 0],
      [16, 14, 1, 3, 250, 0],
      [17, 14, 5, 2, 450, 0],
      [18, 15, 3, 1, 1200, 0],
      [19, 16, 6, 1, 4500, 10],
      [20, 17, 5, 2, 450, 0],
      [21, 18, 10, 1, 3200, 0],
      [22, 19, 9, 2, 600, 0],
      [23, 20, 2, 1, 1800, 0],
      [24, 21, 3, 1, 1200, 0],
      [25, 22, 1, 1, 250, 0],
      [26, 23, 8, 1, 9500, 5],
      [27, 24, 6, 1, 4500, 0],
      [28, 25, 4, 1, 2200, 0],
      [29, 25, 1, 1, 250, 0],
      [30, 26, 4, 1, 2200, 0],
      [31, 27, 9, 1, 600, 0],
      [32, 28, 3, 1, 1200, 0],
      [33, 29, 5, 1, 450, 0],
      [34, 30, 3, 1, 1200, 0],
    ],
  },
  {
    name: "employees",
    primaryKey: ["id"],
    columns: [
      { name: "id", type: "integer" },
      { name: "name", type: "text" },
      { name: "department", type: "text" },
      { name: "salary", type: "integer" },
      { name: "manager_id", type: "integer" },
    ],
    rows: [
      [1, "Nisha Kapoor", "exec", 180000, null],
      [2, "Vikram Shah", "engineering", 140000, 1],
      [3, "Anil Kumar", "engineering", 110000, 2],
      [4, "Pooja Sharma", "engineering", 95000, 2],
      [5, "Farah Khan", "sales", 120000, 1],
      [6, "Devesh Patel", "sales", 85000, 5],
      [7, "Leena George", "sales", 78000, 5],
      [8, "Manoj Yadav", "engineering", 102000, 3],
      [9, "Tanya Bose", "marketing", 99000, 1],
      [10, "Karan Singh", "marketing", 72000, 9],
    ],
  },
];

export const SQL_REFS: SqlRef[] = [
  { fromTable: "orders", fromColumns: ["customer_id"], toTable: "customers", toColumns: ["id"] },
  { fromTable: "order_items", fromColumns: ["order_id"], toTable: "orders", toColumns: ["id"] },
  { fromTable: "order_items", fromColumns: ["product_id"], toTable: "products", toColumns: ["id"] },
  { fromTable: "employees", fromColumns: ["manager_id"], toTable: "employees", toColumns: ["id"] },
];

/** Compact schema reference shown next to SQL problems. */
export function sqlSchemaSummary(): { name: string; columns: string }[] {
  return SQL_TABLES.map((table) => ({
    name: table.name,
    columns: table.columns.map((c) => `${c.name} ${c.type}`).join(", "),
  }));
}
